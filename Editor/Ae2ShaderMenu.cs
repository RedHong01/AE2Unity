using DuoCurtain.AE2UnityShader;
using UnityEditor;

namespace DuoCurtain.AE2UnityShader.Editor
{
    internal static class Ae2ShaderMenu
    {
        [MenuItem(Ae2ShaderConstants.GeneratedShaderMenu, true)]
        private static bool ValidateGenerateShader()
        {
            return TryGetSelectedClip(out _, out _);
        }

        [MenuItem(Ae2ShaderConstants.GeneratedShaderMenu)]
        private static void GenerateShader()
        {
            if (!TryGetSelectedClip(out var clip, out var sourcePath))
            {
                EditorUtility.DisplayDialog("AE2Unity Shader", "Select an .ae2shader asset first.", "OK");
                return;
            }

            GenerateShaderAssets(clip, sourcePath);
        }

        [MenuItem("Tools/Duo Curtain AE2Unity/Process AEBridge Inbox Now")]
        private static void ProcessBridgeInboxNow()
        {
            AeBridgeReceiver.ProcessInbox();
        }

        [MenuItem("Tools/Duo Curtain AE2Unity/Open AEBridge Folder")]
        private static void OpenBridgeFolder()
        {
            AeBridgePaths.EnsureFolders();
            EditorUtility.RevealInFinder(AeBridgePaths.BridgeRoot);
        }

        public static void GenerateShaderAssets(Ae2ShaderClip clip, string sourcePath)
        {
            var result = Ae2ShaderAssetGenerator.Generate(clip, sourcePath, Ae2ShaderEditorSettings.instance.OverwriteGeneratedAssets);
            if (!result.Success)
            {
                EditorUtility.DisplayDialog("AE2Unity Shader", result.Message, "OK");
                return;
            }

            Selection.activeObject = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(result.MaterialAssetPath);
            EditorUtility.DisplayDialog("AE2Unity Shader", $"Generated:\n{result.ShaderAssetPath}\n{result.MaterialAssetPath}", "OK");
        }

        private static bool TryGetSelectedClip(out Ae2ShaderClip clip, out string assetPath)
        {
            clip = null;
            assetPath = string.Empty;

            var activeObject = Selection.activeObject;
            if (activeObject == null)
            {
                return false;
            }

            assetPath = AssetDatabase.GetAssetPath(activeObject);
            clip = activeObject as Ae2ShaderClip;
            if (clip == null && !string.IsNullOrEmpty(assetPath))
            {
                clip = AssetDatabase.LoadAssetAtPath<Ae2ShaderClip>(assetPath);
            }

            return clip != null && !string.IsNullOrEmpty(assetPath);
        }
    }
}
