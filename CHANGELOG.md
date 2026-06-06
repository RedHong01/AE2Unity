# Changelog

## 0.2.2

- Added compact-mode scrolling for narrow AE docked panels.
- Added a native vertical scrollbar and best-effort mouse wheel event handling for compact panel browsing.

## 0.2.1

- Changed the AE panel compact layout to show only core controls in narrow docked sidebars.
- Full-width floating or wide docked layouts still show all export paths, media settings, refresh actions, and generation options.

## 0.2.0

- Renamed the public tool, AE panel, documentation, shader/menu paths, and GitHub repository to `ae2unityshader`.
- Renamed the Unity package identifier to `com.redhong01.ae2unityshader`.
- Renamed the After Effects ScriptUI panel file to `ae2unityshader.jsx` and installers now remove the legacy `AE2UnityShaderExport.jsx` panel.
- Added legacy AE settings fallback so existing saved paths and options migrate into the new panel name.

## 0.1.1

- Added dock-friendly responsive layout for the AE ScriptUI panel.
- Reduced panel minimum width so it can dock into narrow After Effects sidebars.
- Added documentation for opening the panel from `Window` so it can be docked into AE workspaces.

## 0.1.0

- Added embedded Unity package scaffold.
- Added `.ae2shader` ScriptedImporter.
- Added runtime `Ae2ShaderClip` and material binder.
- Added baseline transparent unlit shader for preview.
- Added After Effects ExtendScript exporter panel with direct export into a chosen Unity project.
- Added file-queue AEBridge protocol for AE-to-Unity job delivery and Unity result reporting.
- Added Unity AEBridge receiver with inbox polling and manual processing menu.
- Added Unity auto-generation of shader/material assets when `.ae2shader` files are imported.
- Added JSON schema and sample export.
