using System;
using System.IO;
using DuoCurtain.AE2UnityShader;
using UnityEditor;
using UnityEngine;

namespace DuoCurtain.AE2UnityShader.Editor
{
    [InitializeOnLoad]
    internal static class AeBridgeReceiver
    {
        private const double PollIntervalSeconds = 1.0;
        private static double nextPollTime;

        public static bool IsProcessingBridgeJob { get; private set; }

        static AeBridgeReceiver()
        {
            EditorApplication.update += Update;
        }

        private static void Update()
        {
            if (!Ae2ShaderEditorSettings.instance.BridgeReceiverEnabled)
            {
                return;
            }

            if (EditorApplication.timeSinceStartup < nextPollTime)
            {
                return;
            }

            nextPollTime = EditorApplication.timeSinceStartup + PollIntervalSeconds;
            ProcessInbox();
        }

        public static void ProcessInbox()
        {
            AeBridgePaths.EnsureFolders();

            var jobs = Directory.GetFiles(AeBridgePaths.Inbox, "*.job", SearchOption.TopDirectoryOnly);
            Array.Sort(jobs, StringComparer.OrdinalIgnoreCase);

            for (var i = 0; i < jobs.Length; i++)
            {
                ProcessJobFile(jobs[i]);
            }
        }

        private static void ProcessJobFile(string inboxPath)
        {
            var fileName = Path.GetFileName(inboxPath);
            var processingPath = Path.Combine(AeBridgePaths.Processing, fileName);

            try
            {
                MoveReplace(inboxPath, processingPath);
                var jobJson = File.ReadAllText(processingPath);
                var job = JsonUtility.FromJson<AeBridgeJob>(jobJson);
                var result = ExecuteJob(job);
                WriteResult(result);
                MoveReplace(processingPath, Path.Combine(AeBridgePaths.Done, fileName));
            }
            catch (Exception exception)
            {
                var jobId = Path.GetFileNameWithoutExtension(fileName);
                WriteResult(new AeBridgeResult
                {
                    jobId = jobId,
                    status = "Failed",
                    completedAt = DateTime.UtcNow.ToString("o"),
                    message = exception.Message
                });

                if (File.Exists(processingPath))
                {
                    MoveReplace(processingPath, Path.Combine(AeBridgePaths.Failed, fileName));
                }
                else if (File.Exists(inboxPath))
                {
                    MoveReplace(inboxPath, Path.Combine(AeBridgePaths.Failed, fileName));
                }
            }
        }

        private static AeBridgeResult ExecuteJob(AeBridgeJob job)
        {
            if (job == null)
            {
                throw new InvalidOperationException("Bridge job JSON could not be parsed.");
            }

            if (!string.Equals(job.command, AeBridgeProtocol.CommandImportAe2Shader, StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"Unsupported bridge command: {job.command}");
            }

            if (string.IsNullOrWhiteSpace(job.payloadFile))
            {
                throw new InvalidOperationException("Bridge job is missing payloadFile.");
            }

            var payloadPath = AeBridgePaths.ResolveBridgeRelativePath(job.payloadFile);
            if (!File.Exists(payloadPath))
            {
                throw new FileNotFoundException("Bridge payload was not found.", payloadPath);
            }

            var outputAssetFolder = NormalizeAssetFolder(string.IsNullOrWhiteSpace(job.unityOutputPath)
                ? Ae2ShaderEditorSettings.instance.DefaultBridgeOutputPath
                : job.unityOutputPath);

            Directory.CreateDirectory(outputAssetFolder);
            var targetAssetPath = Path.Combine(outputAssetFolder, Path.GetFileName(payloadPath));
            if (!job.overwriteGeneratedAssets && File.Exists(targetAssetPath))
            {
                targetAssetPath = AeBridgePaths.MakeUniqueFilePath(outputAssetFolder, Path.GetFileName(payloadPath));
            }

            File.Copy(payloadPath, targetAssetPath, true);

            var unityAssetPath = AeBridgePaths.ToAssetPath(targetAssetPath);
            IsProcessingBridgeJob = true;
            try
            {
                AssetDatabase.ImportAsset(unityAssetPath, ImportAssetOptions.ForceSynchronousImport);

                var result = new AeBridgeResult
                {
                    jobId = job.jobId,
                    command = job.command,
                    status = "Imported",
                    completedAt = DateTime.UtcNow.ToString("o"),
                    message = "Imported .ae2shader payload.",
                    importedAssetPath = unityAssetPath
                };

                if (!job.generateShaderAndMaterial)
                {
                    return result;
                }

                var clip = AssetDatabase.LoadAssetAtPath<Ae2ShaderClip>(unityAssetPath);
                if (clip == null)
                {
                    throw new InvalidOperationException($"Imported payload did not produce an Ae2ShaderClip: {unityAssetPath}");
                }

                var generationResult = Ae2ShaderAssetGenerator.Generate(
                    clip,
                    unityAssetPath,
                    job.overwriteGeneratedAssets && Ae2ShaderEditorSettings.instance.OverwriteGeneratedAssets);

                if (!generationResult.Success)
                {
                    throw new InvalidOperationException(generationResult.Message);
                }

                result.status = "Completed";
                result.message = "Imported .ae2shader payload and generated shader/material.";
                result.generatedShaderPath = generationResult.ShaderAssetPath;
                result.generatedMaterialPath = generationResult.MaterialAssetPath;
                return result;
            }
            finally
            {
                IsProcessingBridgeJob = false;
            }
        }

        private static string NormalizeAssetFolder(string folder)
        {
            var normalized = (folder ?? string.Empty).Replace('\\', '/').Trim('/');
            if (string.IsNullOrWhiteSpace(normalized))
            {
                normalized = "Assets/AE2Unity/Exports";
            }

            if (!(normalized == "Assets" || normalized.StartsWith("Assets/", StringComparison.Ordinal)))
            {
                normalized = $"Assets/{normalized}";
            }

            return normalized;
        }

        private static void WriteResult(AeBridgeResult result)
        {
            AeBridgePaths.EnsureFolders();
            if (string.IsNullOrWhiteSpace(result.jobId))
            {
                result.jobId = Guid.NewGuid().ToString("N");
            }

            result.completedAt = string.IsNullOrWhiteSpace(result.completedAt)
                ? DateTime.UtcNow.ToString("o")
                : result.completedAt;

            var resultPath = Path.Combine(AeBridgePaths.Outbox, $"{result.jobId}.result.json");
            File.WriteAllText(resultPath, JsonUtility.ToJson(result, true));
        }

        private static void MoveReplace(string sourcePath, string targetPath)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath) ?? AeBridgePaths.BridgeRoot);
            if (File.Exists(targetPath))
            {
                File.Delete(targetPath);
            }

            File.Move(sourcePath, targetPath);
        }
    }
}
