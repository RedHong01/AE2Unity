# Changelog

## 0.2.10

- Rebuilt the compact Result page as a dedicated result group with fixed narrow-panel sizing.
- Changed the Result status area to a readonly multiline text box so progress and bridge messages remain visible in small AE sidebars.
- Added compact-only Result sizing rules so the second compact page no longer appears blank unless the panel is widened.

## 0.2.9

- Added compact status routing so `Run Export` automatically switches to the Result page before writing progress or final status text.
- Added a visible `Running export...` status before the export workflow starts.
- Reused the same status routing for bridge result checks and export failures.

## 0.2.8

- Fixed compact page controls disappearing after switching pages in narrow AE docked panels.
- Restored compact visible controls with a valid maximum height so ScriptUI can reflow page content correctly.
- Added compact page keyboard navigation with arrow keys and Page Up/Page Down.

## 0.2.7

- Added a compact-panel `Full` button that opens a full standalone ae2unityshader window from a narrow AE docked sidebar.
- Added standalone window `Compact` and `Full Size` controls.
- Added best-effort standalone shortcuts: `Ctrl/Cmd+Shift+C` for compact mode and `Ctrl/Cmd+Shift+F` for full mode.

## 0.2.6

- Added an MIT open-source license for community use, modification, and redistribution.
- Added package license metadata.
- Added bilingual README license notes.

## 0.2.5

- Added a compact pager for narrow AE docked panels so users can switch between Export, Result, Paths, and Media sections without relying on AE native panel scrolling.
- Wired compact mouse wheel events to page switching when After Effects delivers wheel events to ScriptUI.
- Added Up/Down buttons and a compact scrollbar as reliable fallback controls for browsing compact sections.

## 0.2.4

- Restored compact AE panel controls to the native ScriptUI panel layout so core fields are not clipped in docked sidebars.
- Collapsed hidden compact-only rows to zero height so hidden path/media controls no longer push core controls out of view.
- Removed the custom compact scrollbar implementation and let AE's native docked panel scroll area handle overflow.

## 0.2.3

- Reworked compact AE panel scrolling so scrollbar range uses a guarded viewport height and avoids blank overscroll.
- Added compact scroll activation when clicking inside the AE panel, including middle-mouse clicks before wheel scrolling.
- Tightened compact panel margins and layout spacing for narrow docked sidebars.

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
