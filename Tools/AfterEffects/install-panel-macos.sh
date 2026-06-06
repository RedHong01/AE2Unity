#!/usr/bin/env bash
set -euo pipefail

AE_APP_PATH="${1:-/Applications/Adobe After Effects 2026}"
AE_USER_VERSIONS="${AE_USER_VERSIONS:-26.2 26.0}"
APP_TARGET_DIR="$AE_APP_PATH/Scripts/ScriptUI Panels"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/AE2UnityShaderExport.jsx"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Missing source file: $SOURCE_FILE" >&2
  exit 1
fi

INSTALLED=0

if mkdir -p "$APP_TARGET_DIR" 2>/dev/null && cp "$SOURCE_FILE" "$APP_TARGET_DIR/AE2UnityShaderExport.jsx" 2>/dev/null; then
  echo "Installed AE2Unity Shader panel:"
  echo "$APP_TARGET_DIR/AE2UnityShaderExport.jsx"
  INSTALLED=1
fi

for AE_USER_VERSION in $AE_USER_VERSIONS; do
  for ROOT in "$HOME/Library/Preferences/Adobe/After Effects" "$HOME/Library/Application Support/Adobe/After Effects"; do
    TARGET_DIR="$ROOT/$AE_USER_VERSION/Scripts/ScriptUI Panels"
    mkdir -p "$TARGET_DIR"
    cp "$SOURCE_FILE" "$TARGET_DIR/AE2UnityShaderExport.jsx"
    echo "Installed AE2Unity Shader panel:"
    echo "$TARGET_DIR/AE2UnityShaderExport.jsx"
    INSTALLED=1
  done
done

if [[ "$INSTALLED" -eq 0 ]]; then
  echo "Could not install AE2Unity Shader panel." >&2
  exit 1
fi

echo "Restart After Effects, then open Window > AE2UnityShaderExport.jsx"
