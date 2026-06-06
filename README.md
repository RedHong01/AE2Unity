# ae2unityshader

This package is an early automation scaffold for converting constrained After Effects 2026 compositions into Unity 6 shader/material assets.

## Install From Git

In Unity 6, install this package from the Package Manager:

1. Open `Window > Package Manager`.
2. Click `+`.
3. Choose `Install package from git URL...`.
4. Enter:

```text
https://github.com/RedHong01/ae2unityshader.git
```

You can also add it directly to `Packages/manifest.json`:

```json
"com.redhong01.ae2unityshader": "https://github.com/RedHong01/ae2unityshader.git"
```

To update later, pull the repo and use Package Manager's update/re-resolve flow, or point the dependency at a tag/branch/commit.

The AEBridge pipeline is:

1. Run `Tools/AfterEffects/ae2unityshader.jsx` in After Effects.
2. Select a Unity project from the Unity Hub project dropdown in the AE panel.
3. Choose the active composition or a specific composition.
4. Choose an export mode, such as `AEBridge: .ae2shader -> Unity shader/material`.
5. Click `Run Export`.
6. The AE panel writes a bridge job into `.ae2unitybridge/inbox`.
7. Unity's AEBridge receiver imports the payload into `Assets/ae2unityshader/Exports/<CompName>.ae2shader`.
8. Unity generates `<CompName>.generated.shader` plus `<CompName>.generated.mat`.
9. Unity writes the result to `.ae2unitybridge/outbox`, which the AE panel can read with `Check Last Bridge Result`.

Direct export and manual generation are still available through `Direct .ae2shader into Unity Assets`, `Manual folder .ae2shader export`, and `Assets > ae2unityshader > Generate Shader From AE2Shader`.

The AE panel reads Unity Hub's local `projects-v1.json` and `projectSortPreferences.json` so the project dropdown follows the same project names and sorting preference used by Unity Hub. `Choose` remains available as a fallback for projects that are not listed in Unity Hub.

The panel can export either the current active composition or a specific composition from the project. Export modes include AEBridge metadata conversion, AEBridge plus Adobe Media Encoder video output, Media Encoder-only output, direct `.ae2shader` export into Unity Assets, and manual folder export.

## After Effects Panel Docking

Install `Tools/AfterEffects/ae2unityshader.jsx` into the After Effects `Scripts/ScriptUI Panels` folder, restart After Effects, then open it from `Window > ae2unityshader.jsx`.

Panels opened from the `Window` menu can be dragged by their panel tab and docked into AE sidebars or saved workspaces. If you run the JSX through `File > Scripts > Run Script File...`, After Effects opens it as a standalone palette, which is useful for testing but cannot be docked into the workspace.

The panel switches to a compact core layout when docked into a narrow sidebar. Compact mode keeps the Unity project, composition, export mode, run button, bridge result button, and status visible. If the compact panel is shorter than its content, use the mouse wheel or the right-side scrollbar to browse it. Wider floating or docked layouts show the full set of path, media, refresh, reference frame, and generation options.

## Supported MVP Surface

- Composition metadata: width, height, frame rate, duration, color/bit-depth hints.
- Layers: name, index, type, enabled flag, in/out points, blend mode, track matte hint.
- Transform keyframes: anchor, position, scale, rotation, opacity.
- Source footage path references.
- Basic effect/mask metadata for capability analysis.
- Unity material preview through `ae2unityshader/Composite Unlit`.

## Known Fallbacks

The importer marks complex features as warnings rather than silently pretending they are shader-identical. Third-party effects, 3D layers, cameras, lights, complex text animation, particles, and unsupported expressions should be baked or handled by later compiler passes.

## Cross-Platform Notes

The package uses only C# editor/runtime code and ShaderLab/HLSL, with no native DLLs. The AE exporter is ExtendScript (`.jsx`) and is intended to run on both Windows and macOS in After Effects 2026.

## Unity Settings

Open `Project Settings > ae2unityshader`.

- `Auto Generate On Import`: when enabled, Unity generates shader/material assets whenever an `.ae2shader` file is imported.
- `Overwrite Generated Assets`: when enabled, repeat exports update the same `.generated.shader` and `.generated.mat` files.
- `AEBridge Receiver Enabled`: when enabled, Unity polls `.ae2unitybridge/inbox` for AE jobs.
- `Bridge Output Path`: default Unity asset folder for bridge imports.

Bridge utilities are also available in `Tools > ae2unityshader`.
