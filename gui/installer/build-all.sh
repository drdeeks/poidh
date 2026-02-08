#!/bin/bash
# POIDH Autonomous Bounty Bot - Cross-Platform Installer Builder
# Orchestrates building and packaging for Windows, macOS, and Linux

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUI_DIR="$PROJECT_ROOT/gui"
INSTALLER_DIR="$GUI_DIR/installer"
RELEASE_DIR="$PROJECT_ROOT/releases"
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*"version": "\([^"]*\).*/\1/')

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         POIDH Autonomous Bot - Cross-Platform Installer            ║"
echo "║                       Version: $VERSION                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  PLATFORM="macOS"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  PLATFORM="Windows"
else
  PLATFORM="Linux"
fi

echo "📦 Detected platform: $PLATFORM"
echo ""

# Create releases directory
mkdir -p "$RELEASE_DIR"

# Build step 1: Build PyInstaller executables
echo "═══════════════════════════════════════════════════════════════════"
echo "Step 1: Building PyInstaller Executables"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if command -v bash &> /dev/null; then
  case "$PLATFORM" in
    macOS|Linux)
      echo "🔨 Building for $PLATFORM..."
      bash "$GUI_DIR/build.sh"
      ;;
    Windows)
      echo "⚠️  For Windows builds, run: .\gui\build.bat"
      ;;
  esac
else
  echo "⚠️  Bash not found. Skipping PyInstaller build."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Step 2: Creating Platform-Specific Installers"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Build installers based on platform
case "$PLATFORM" in
  macOS)
    echo "🍎 Creating macOS DMG..."
    bash "$INSTALLER_DIR/macos.sh"
    ;;
  Linux)
    echo "🐧 Creating Linux installers..."
    bash "$INSTALLER_DIR/linux.sh"
    ;;
  Windows)
    echo "🪟 Windows packaging requires NSIS"
    echo ""
    echo "To build Windows installer:"
    echo "  1. Install NSIS from: https://nsis.sourceforge.io/"
    echo "  2. Run: makensis '$INSTALLER_DIR\windows.nsi'"
    echo ""
    echo "Or run: .\gui\build.bat first, then:"
    echo "  makensis /D PROJECT_ROOT=\"$PROJECT_ROOT\" /D VERSION=\"$VERSION\" \"$INSTALLER_DIR\windows.nsi\""
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Build Summary"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -d "$RELEASE_DIR" ]; then
  echo "📦 Release artifacts:"
  ls -lh "$RELEASE_DIR" | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
  echo ""
  echo "📍 Location: $RELEASE_DIR"
else
  echo "⚠️  No releases directory found"
fi

echo ""
echo "✅ Build process complete!"
echo ""
echo "Next steps:"
echo "  1. Test installers on target platforms"
echo "  2. Upload releases to GitHub"
echo "  3. Create release notes with installation instructions"
echo ""
