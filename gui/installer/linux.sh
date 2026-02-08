#!/bin/bash
# POIDH Autonomous Bounty Bot - Linux AppImage & DEB Installer Creator

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUI_DIR="$PROJECT_ROOT/gui"
BUILD_DIR="$GUI_DIR/dist"
RELEASE_DIR="$PROJECT_ROOT/releases"
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*"version": "\([^"]*\).*/\1/')

echo "🐧 Building Linux installers..."
echo "Project root: $PROJECT_ROOT"
echo "Version: $VERSION"
mkdir -p "$RELEASE_DIR"

# Check if PyInstaller executable exists
if [ ! -f "$BUILD_DIR/POIDH-Bot-GUI" ]; then
  echo "❌ Linux executable not found at $BUILD_DIR/POIDH-Bot-GUI"
  echo "   Available files in $BUILD_DIR:"
  ls -la "$BUILD_DIR" 2>/dev/null || echo "   (directory doesn't exist)"
  exit 1
fi

# Build AppImage
build_appimage() {
  echo "📦 Creating AppImage..."
  
  # Check if appimagetool is installed
  if ! command -v appimagetool &> /dev/null; then
    echo "⚠️  appimagetool not found. Skipping AppImage build."
    echo "   Install with: sudo snap install appimagetool"
    return 1
  fi
  
  APPIMAGE_DIR="/tmp/POIDH-Bot.AppDir"
  rm -rf "$APPIMAGE_DIR"
  mkdir -p "$APPIMAGE_DIR/usr/bin"
  mkdir -p "$APPIMAGE_DIR/usr/share/applications"
  mkdir -p "$APPIMAGE_DIR/usr/share/icons/hicolor/256x256/apps"
  
  # Copy executable
  cp "$BUILD_DIR/POIDH-Bot-GUI" "$APPIMAGE_DIR/usr/bin/"
  chmod +x "$APPIMAGE_DIR/usr/bin/POIDH-Bot-GUI"
  
  # Create desktop entry
  cat > "$APPIMAGE_DIR/usr/share/applications/poidh-bot.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=POIDH Autonomous Bot
Exec=POIDH-Bot-GUI
Icon=poidh-bot
Categories=Utility;
EOF
  
  # Create AppRun script
  cat > "$APPIMAGE_DIR/AppRun" << 'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE="${SELF%/*}"
export PATH="${HERE}/usr/bin:${PATH}"
exec "${HERE}/usr/bin/POIDH-Bot-GUI" "$@"
EOF
  chmod +x "$APPIMAGE_DIR/AppRun"
  
  # Build AppImage
  appimagetool -n "$APPIMAGE_DIR" "$RELEASE_DIR/POIDH-Bot-$VERSION-x86_64.AppImage"
  chmod +x "$RELEASE_DIR/POIDH-Bot-$VERSION-x86_64.AppImage"
  
  rm -rf "$APPIMAGE_DIR"
  echo "✅ AppImage created: $RELEASE_DIR/POIDH-Bot-$VERSION-x86_64.AppImage"
}

# Build DEB package
build_deb() {
  echo "📦 Creating DEB package..."
  
  DEB_DIR="/tmp/poidh-bot-deb"
  rm -rf "$DEB_DIR"
  mkdir -p "$DEB_DIR/DEBIAN"
  mkdir -p "$DEB_DIR/usr/bin"
  mkdir -p "$DEB_DIR/usr/share/applications"
  mkdir -p "$DEB_DIR/usr/share/doc/poidh-bot"
  
  # Copy executable
  cp "$BUILD_DIR/POIDH-Bot-GUI" "$DEB_DIR/usr/bin/poidh-bot"
  chmod +x "$DEB_DIR/usr/bin/poidh-bot"
  
  # Create desktop entry
  cat > "$DEB_DIR/usr/share/applications/poidh-bot.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=POIDH Autonomous Bot
Exec=poidh-bot
Icon=poidh-bot
Categories=Utility;
Comment=Autonomous Bounty Bot Platform
EOF
  
  # Create control file
  cat > "$DEB_DIR/DEBIAN/control" << EOF
Package: poidh-bot
Version: $VERSION
Architecture: amd64
Maintainer: POIDH Team <support@poidh.io>
Description: POIDH Autonomous Bounty Bot
 Autonomous bounty creation, submission monitoring, and winner payout platform
 .
 Features:
  - Autonomous bounty lifecycle management
  - Real-time submission monitoring
  - AI-powered evaluation (GPT-4 Vision)
  - Multi-chain support (Base, Arbitrum, Degen, etc.)
  - Professional GUI and CLI interfaces
Depends: python3 (>= 3.8), libc6 (>= 2.17)
Homepage: https://github.com/drdeeks/poidh
EOF
  
  # Create postinst script
  cat > "$DEB_DIR/DEBIAN/postinst" << 'EOF'
#!/bin/bash
set -e
if [ -x "$(command -v update-desktop-database)" ]; then
  update-desktop-database -q /usr/share/applications || true
fi
exit 0
EOF
  chmod +x "$DEB_DIR/DEBIAN/postinst"
  
  # Create prerm script
  cat > "$DEB_DIR/DEBIAN/prerm" << 'EOF'
#!/bin/bash
set -e
if [ -x "$(command -v update-desktop-database)" ]; then
  update-desktop-database -q /usr/share/applications || true
fi
exit 0
EOF
  chmod +x "$DEB_DIR/DEBIAN/prerm"
  
  # Build DEB
  fakeroot dpkg-deb --build "$DEB_DIR" "$RELEASE_DIR/poidh-bot_${VERSION}_amd64.deb"
  
  rm -rf "$DEB_DIR"
  echo "✅ DEB package created: $RELEASE_DIR/poidh-bot_${VERSION}_amd64.deb"
}

# Create distribution tarball
build_tarball() {
  echo "📦 Creating distribution tarball..."
  
  TARBALL_DIR="/tmp/poidh-bot-$VERSION"
  rm -rf "$TARBALL_DIR"
  mkdir -p "$TARBALL_DIR"
  
  cp "$BUILD_DIR/POIDH-Bot-GUI" "$TARBALL_DIR/"
  chmod +x "$TARBALL_DIR/POIDH-Bot-GUI"
  
  # Create install script
  cat > "$TARBALL_DIR/install.sh" << 'EOF'
#!/bin/bash
set -e
echo "Installing POIDH Bot..."
mkdir -p ~/.local/bin
cp POIDH-Bot-GUI ~/.local/bin/
chmod +x ~/.local/bin/POIDH-Bot-GUI
echo "✅ Installation complete!"
echo "Run with: ~/.local/bin/POIDH-Bot-GUI"
EOF
  chmod +x "$TARBALL_DIR/install.sh"
  
  # Create README
  cp "$PROJECT_ROOT/README.md" "$TARBALL_DIR/" || true
  
  cd /tmp
  tar czf "$RELEASE_DIR/poidh-bot-$VERSION-linux-x86_64.tar.gz" "poidh-bot-$VERSION"
  rm -rf "$TARBALL_DIR"
  
  echo "✅ Tarball created: $RELEASE_DIR/poidh-bot-$VERSION-linux-x86_64.tar.gz"
}

# Build all
echo ""
build_tarball
echo ""
build_appimage || true
echo ""
build_deb || true
echo ""
echo "🎉 Linux builds complete!"
echo "Releases in: $RELEASE_DIR"
