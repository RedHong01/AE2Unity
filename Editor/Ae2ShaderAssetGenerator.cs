using System;
using System.IO;
using AE2UnityShader;
using UnityEditor;
using UnityEngine;

namespace AE2UnityShader.Editor
{
    internal readonly struct Ae2ShaderGenerationResult
    {
        public readonly bool Success;
        public readonly string ShaderAssetPath;
        public readonly string MaterialAssetPath;
        public readonly string Message;

        public Ae2ShaderGenerationResult(bool success, string shaderAssetPath, string materialAssetPath, string message)
        {
            Success = success;
            ShaderAssetPath = shaderAssetPath;
            MaterialAssetPath = materialAssetPath;
            Message = message;
        }
    }

    internal static class Ae2ShaderAssetGenerator
    {
        public static Ae2ShaderGenerationResult Generate(Ae2ShaderClip clip, string sourcePath, bool overwriteExisting)
        {
            if (clip == null)
            {
                return new Ae2ShaderGenerationResult(false, string.Empty, string.Empty, "Clip is null.");
            }

            var directory = Path.GetDirectoryName(sourcePath);
            if (string.IsNullOrEmpty(directory))
            {
                directory = "Assets";
            }

            var baseName = Path.GetFileNameWithoutExtension(sourcePath);
            var shaderAssetPath = Path.Combine(directory, $"{baseName}.generated.shader");
            var materialAssetPath = Path.Combine(directory, $"{baseName}.generated.mat");

            if (!overwriteExisting)
            {
                shaderAssetPath = AssetDatabase.GenerateUniqueAssetPath(shaderAssetPath);
                materialAssetPath = AssetDatabase.GenerateUniqueAssetPath(materialAssetPath);
            }

            var shaderName = $"ae2unityshader/Generated/{SanitizeShaderName(baseName)}";
            var shaderCode = Ae2ShaderCodeGenerator.GeneratePreviewShader(clip, shaderName);
            WriteTextIfChanged(shaderAssetPath, shaderCode);
            AssetDatabase.ImportAsset(shaderAssetPath, ImportAssetOptions.ForceSynchronousImport);

            var shader = AssetDatabase.LoadAssetAtPath<Shader>(shaderAssetPath);
            if (shader == null)
            {
                return new Ae2ShaderGenerationResult(false, shaderAssetPath, materialAssetPath, $"Generated shader file, but Unity did not load it: {shaderAssetPath}");
            }

            var material = AssetDatabase.LoadAssetAtPath<Material>(materialAssetPath);
            if (material == null)
            {
                material = new Material(shader)
                {
                    name = $"{baseName}.generated"
                };
                AssetDatabase.CreateAsset(material, materialAssetPath);
            }
            else
            {
                material.shader = shader;
            }

            ApplyMaterialDefaults(material, clip);
            EditorUtility.SetDirty(material);
            AssetDatabase.SaveAssets();
            return new Ae2ShaderGenerationResult(true, shaderAssetPath, materialAssetPath, "Generated shader and material.");
        }

        private static void ApplyMaterialDefaults(Material material, Ae2ShaderClip clip)
        {
            if (clip?.Document?.comp == null)
            {
                return;
            }

            var comp = clip.Document.comp;
            material.SetVector("_CompSize", new Vector4(
                comp.width,
                comp.height,
                1f / Mathf.Max(1, comp.width),
                1f / Mathf.Max(1, comp.height)));
        }

        private static void WriteTextIfChanged(string path, string text)
        {
            if (File.Exists(path) && string.Equals(File.ReadAllText(path), text, StringComparison.Ordinal))
            {
                return;
            }

            File.WriteAllText(path, text);
        }

        private static string SanitizeShaderName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "Untitled";
            }

            foreach (var invalidChar in Path.GetInvalidFileNameChars())
            {
                value = value.Replace(invalidChar, '_');
            }

            return value.Replace("\\", "_").Replace("/", "_").Replace("\"", string.Empty);
        }
    }
}
