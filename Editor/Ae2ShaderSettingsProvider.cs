using UnityEditor;

namespace AE2UnityShader.Editor
{
    internal static class Ae2ShaderSettingsProvider
    {
        [SettingsProvider]
        public static SettingsProvider CreateProvider()
        {
            return new SettingsProvider("Project/ae2unityshader", SettingsScope.Project)
            {
                label = "ae2unityshader",
                guiHandler = _ =>
                {
                    var settings = Ae2ShaderEditorSettings.instance;
                    settings.AutoGenerateOnImport = EditorGUILayout.Toggle("Auto Generate On Import", settings.AutoGenerateOnImport);
                    settings.OverwriteGeneratedAssets = EditorGUILayout.Toggle("Overwrite Generated Assets", settings.OverwriteGeneratedAssets);
                    settings.BridgeReceiverEnabled = EditorGUILayout.Toggle("AEBridge Receiver Enabled", settings.BridgeReceiverEnabled);
                    settings.DefaultBridgeOutputPath = EditorGUILayout.TextField("Bridge Output Path", settings.DefaultBridgeOutputPath);
                }
            };
        }
    }
}
