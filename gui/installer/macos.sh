#!/bin/bash
# POIDH Autonomous Bounty Bot - macOS DMG Installer Creator

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUI_DIR="$PROJECT_ROOT/gui"
INSTALLER_DIR="$GUI_DIR/installer"
BUILD_DIR="$GUI_DIR/dist"
RELEASE_DIR="$PROJECT_ROOT/releases"
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*"version": "\([^"]*\).*/\1/')

echo "🍎 Building macOS DMG installer..."
echo "Project root: $PROJECT_ROOT"
echo "Version: $VERSION"

# Check if PyInstaller app exists
if [ ! -d "$BUILD_DIR/POIDH-Bot-GUI.app" ]; then
  echo "❌ macOS app not found. Run build.sh first"
  exit 1
fi

# Create DMG structure
echo "📦 Creating DMG structure..."
DMG_DIR="/tmp/POIDH-Bot-DMG"
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"

# Copy app
cp -r "$BUILD_DIR/POIDH-Bot-GUI.app" "$DMG_DIR/"

# Create Applications symlink
ln -s /Applications "$DMG_DIR/Applications"

# Create DMG background image
mkdir -p "$DMG_DIR/.dmg"
cat > "$DMG_DIR/.dmg/background.svg" << 'EOF'
<svg width="504" height="360" xmlns="http://www.w3.org/2000/svg">
  <rect width="504" height="360" fill="#f8f8f8"/>
  <text x="252" y="80" font-size="32" font-weight="bold" text-anchor="middle" fill="#333">POIDH Autonomous Bot</text>
  <text x="252" y="115" font-size="14" text-anchor="middle" fill="#666">Autonomous Bounty Platform</text>
  <text x="30" y="280" font-size="12" fill="#999">Drag POIDH-Bot-GUI.app to Applications folder</text>
</svg>
EOF

# Create DMG
echo "🔨 Creating DMG file..."
mkdir -p "$RELEASE_DIR"
hdiutil create -volname "POIDH Bot" \
  -srcfolder "$DMG_DIR" \
  -ov \
  -format UDZO \
  "$RELEASE_DIR/POIDH-Bot-$VERSION-macos.dmg"

# Cleanup
rm -rf "$DMG_DIR"

echo "✅ macOS DMG created: $RELEASE_DIR/POIDH-Bot-$VERSION-macos.dmg"
echo ""
echo "Installation instructions:"
echo "1. Open the DMG file"
echo "2. Drag POIDH-Bot-GUI.app to Applications"
echo "3. Double-click to launch"
