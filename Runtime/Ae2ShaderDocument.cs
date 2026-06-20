using System;

namespace AE2Unity
{
    [Serializable]
    public sealed class Ae2ShaderDocument
    {
        public string schemaVersion = "0.1.0";
        public string exporter = "unknown";
        public string exportedAt = string.Empty;
        public Ae2ShaderComp comp = new Ae2ShaderComp();
        public Ae2ShaderLayer[] layers = Array.Empty<Ae2ShaderLayer>();
        public Ae2ShaderAsset[] assets = Array.Empty<Ae2ShaderAsset>();
        public Ae2ShaderWarning[] warnings = Array.Empty<Ae2ShaderWarning>();
    }

    [Serializable]
    public sealed class Ae2ShaderComp
    {
        public string name = "Untitled";
        public int width = 1920;
        public int height = 1080;
        public float frameRate = 24f;
        public float duration = 1f;
        public float workAreaStart;
        public float workAreaDuration = 1f;
        public string colorSpace = "unknown";
        public int bitDepth = 8;
    }

    [Serializable]
    public sealed class Ae2ShaderLayer
    {
        public string id = string.Empty;
        public int index;
        public string name = "Layer";
        public string type = "unknown";
        public bool enabled = true;
        public bool threeDLayer;
        public float startTime;
        public float inPoint;
        public float outPoint;
        public string parentId = string.Empty;
        public string blendMode = "NORMAL";
        public string matteMode = "NO_TRACK_MATTE";
        public string sourceAssetId = string.Empty;
        public Ae2ShaderTransform transform = new Ae2ShaderTransform();
        public Ae2ShaderEffect[] effects = Array.Empty<Ae2ShaderEffect>();
        public Ae2ShaderMask[] masks = Array.Empty<Ae2ShaderMask>();
        public string[] expressions = Array.Empty<string>();
    }

    [Serializable]
    public sealed class Ae2ShaderTransform
    {
        public Ae2ShaderAnimatedVector3 anchorPoint = Ae2ShaderAnimatedVector3.Zero();
        public Ae2ShaderAnimatedVector3 position = Ae2ShaderAnimatedVector3.Zero();
        public Ae2ShaderAnimatedVector3 scale = Ae2ShaderAnimatedVector3.OneHundred();
        public Ae2ShaderAnimatedFloat rotation = Ae2ShaderAnimatedFloat.Zero();
        public Ae2ShaderAnimatedFloat opacity = Ae2ShaderAnimatedFloat.OneHundred();
    }

    [Serializable]
    public sealed class Ae2ShaderAnimatedFloat
    {
        public float value;
        public string expression = string.Empty;
        public Ae2ShaderFloatKeyframe[] keys = Array.Empty<Ae2ShaderFloatKeyframe>();

        public static Ae2ShaderAnimatedFloat Zero()
        {
            return new Ae2ShaderAnimatedFloat { value = 0f };
        }

        public static Ae2ShaderAnimatedFloat OneHundred()
        {
            return new Ae2ShaderAnimatedFloat { value = 100f };
        }
    }

    [Serializable]
    public sealed class Ae2ShaderAnimatedVector3
    {
        public float x;
        public float y;
        public float z;
        public string expression = string.Empty;
        public Ae2ShaderVector3Keyframe[] keys = Array.Empty<Ae2ShaderVector3Keyframe>();

        public static Ae2ShaderAnimatedVector3 Zero()
        {
            return new Ae2ShaderAnimatedVector3();
        }

        public static Ae2ShaderAnimatedVector3 OneHundred()
        {
            return new Ae2ShaderAnimatedVector3 { x = 100f, y = 100f, z = 100f };
        }
    }

    [Serializable]
    public sealed class Ae2ShaderFloatKeyframe
    {
        public float time;
        public float value;
    }

    [Serializable]
    public sealed class Ae2ShaderVector3Keyframe
    {
        public float time;
        public float x;
        public float y;
        public float z;
    }

    [Serializable]
    public sealed class Ae2ShaderEffect
    {
        public string matchName = string.Empty;
        public string displayName = string.Empty;
        public bool enabled = true;
        public Ae2ShaderEffectParam[] parameters = Array.Empty<Ae2ShaderEffectParam>();
    }

    [Serializable]
    public sealed class Ae2ShaderEffectParam
    {
        public string name = string.Empty;
        public string matchName = string.Empty;
        public string valueType = string.Empty;
        public string value = string.Empty;
    }

    [Serializable]
    public sealed class Ae2ShaderMask
    {
        public string name = string.Empty;
        public string mode = string.Empty;
        public bool inverted;
        public float opacity = 100f;
        public float expansion;
        public float featherX;
        public float featherY;
    }

    [Serializable]
    public sealed class Ae2ShaderAsset
    {
        public string id = string.Empty;
        public string name = string.Empty;
        public string type = string.Empty;
        public string path = string.Empty;
        public int width;
        public int height;
        public float frameRate;
        public float duration;
    }

    [Serializable]
    public sealed class Ae2ShaderWarning
    {
        public string code = string.Empty;
        public string message = string.Empty;
        public string layerId = string.Empty;
    }
}
