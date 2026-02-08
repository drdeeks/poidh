# POIDH Autonomous Bot - Packaging & Distribution Guide

Complete guide for building, packaging, and distributing the POIDH Autonomous Bounty Bot across Windows, macOS, and Linux platforms.

## Quick Start

### One-Command Builds

```bash
# macOS / Linux
npm run gui:package

# Windows
npm run gui:package:win
```

Artifacts are created in `releases/` directory.

## Detailed Instructions

### Windows

#### Prerequisites
- Python 3.8+
- Node.js 14+
- NSIS installer (download: https://nsis.sourceforge.io/)

#### Build Steps
1. **Build executable:**
   ```bash
   npm run gui:build:win
   # Or: cd gui && build.bat
   ```

2. **Create installer:**
   ```bash
   # If NSIS is installed in PATH:
   npm run gui:package:win
   
   # Or manually:
   makensis /D PROJECT_ROOT="%CD%" /D VERSION="2.0.0" gui\installer\windows.nsi
   ```

3. **Output:**
   - Location: `releases/POIDH-Bot-Setup-{VERSION}-x64.exe`
   - Size: ~150-200 MB
   - Installation: Double-click to run setup wizard

4. **Test:**
   ```bash
   # Run the installer
   releases\POIDH-Bot-Setup-2.0.0-x64.exe
   
   # Launch from Start Menu → POIDH Bot
   ```

#### Troubleshooting
- **NSIS not found**: Install from https://nsis.sourceforge.io/
- **Build errors**: Run `pip install -r gui/requirements.txt` first
- **Permission denied**: Run Command Prompt as Administrator

### macOS

#### Prerequisites
- Python 3.8+
- Node.js 14+
- Xcode Command Line Tools (for native dependencies)

#### Build Steps
1. **Install dependencies:**
   ```bash
   xcode-select --install
   ```

2. **Build executable:**
   ```bash
   npm run gui:build
   # Or: bash gui/build.sh
   ```

3. **Create DMG installer:**
   ```bash
   npm run gui:installer:macos
   # Or: bash gui/installer/macos.sh
   ```

4. **Output:**
   - Location: `releases/POIDH-Bot-{VERSION}-macos.dmg`
   - Size: ~150-200 MB
   - Installation: Mount DMG → Drag app to Applications

5. **Test:**
   ```bash
   # Open the DMG
   open releases/POIDH-Bot-2.0.0-macos.dmg
   
   # Or launch from Applications
   /Applications/POIDH-Bot-GUI.app/Contents/MacOS/POIDH-Bot-GUI
   ```

#### Code Signing (Optional)
```bash
# Sign the app
codesign -s - dist/POIDH-Bot-GUI.app

# Verify signature
codesign --verify --verbose=4 dist/POIDH-Bot-GUI.app

# Sign the DMG
codesign -s - releases/POIDH-Bot-2.0.0-macos.dmg
```

### Linux

#### Prerequisites
- Python 3.8+
- Node.js 14+
- build-essential (gcc, make, etc.)
- Optional: appimagetool (for AppImage)
- Optional: fakeroot, dpkg-deb (for DEB)

#### Install Build Tools
```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  python3-dev \
  fakeroot \
  dpkg-dev \
  curl

# Install appimagetool
sudo snap install appimagetool
```

#### Build Steps
1. **Build executable:**
   ```bash
   npm run gui:build
   # Or: bash gui/build.sh
   ```

2. **Create Linux installers:**
   ```bash
   npm run gui:installer:linux
   # Or: bash gui/installer/linux.sh
   ```

3. **Output (choose one):**
   - **Tarball**: `releases/poidh-bot-{VERSION}-linux-x86_64.tar.gz`
   - **AppImage**: `releases/POIDH-Bot-{VERSION}-x86_64.AppImage`
   - **DEB**: `releases/poidh-bot_{VERSION}_amd64.deb`

4. **Installation:**

   **Tarball:**
   ```bash
   tar xzf releases/poidh-bot-2.0.0-linux-x86_64.tar.gz
   cd poidh-bot-2.0.0
   bash install.sh
   ~/.local/bin/POIDH-Bot-GUI
   ```

   **AppImage:**
   ```bash
   chmod +x releases/POIDH-Bot-2.0.0-x86_64.AppImage
   ./releases/POIDH-Bot-2.0.0-x86_64.AppImage
   ```

   **DEB:**
   ```bash
   sudo apt install ./releases/poidh-bot_2.0.0_amd64.deb
   poidh-bot
   ```

5. **Test:**
   ```bash
   # Test the executable directly
   gui/dist/POIDH-Bot-GUI
   ```

#### Troubleshooting
- **appimagetool not found**: `sudo snap install appimagetool`
- **fakeroot not found**: `sudo apt install fakeroot dpkg-dev`
- **Permission denied**: `chmod +x gui/build.sh gui/installer/linux.sh`

## Cross-Platform Build

### Automated Multi-Platform
```bash
# Builds for all platforms on current OS
npm run gui:package          # macOS/Linux
npm run gui:package:win      # Windows
```

### GitHub Actions CI/CD
The project includes automated builds in `.github/workflows/release-builds.yml`:

```yaml
# Builds on every push to standalone-packaging branch
# Or create a tag to trigger release builds

# Platforms:
# - macOS (latest)
# - Linux (ubuntu-latest)
# - Windows (windows-latest)

# Generates:
# - DMG (macOS)
# - AppImage, DEB, Tarball (Linux)
# - EXE (Windows)

# Uploads to GitHub Releases
```

### Manual Multi-Platform Build

If building on multiple machines:

1. **macOS builder:**
   ```bash
   git clone https://github.com/drdeeks/poidh.git
   cd poidh
   git checkout standalone-packaging
   npm run gui:package
   # Share: releases/POIDH-Bot-*-macos.dmg
   ```

2. **Linux builder:**
   ```bash
   git clone https://github.com/drdeeks/poidh.git
   cd poidh
   git checkout standalone-packaging
   npm run gui:package
   # Share: releases/POIDH-Bot-*-x86_64.AppImage, poidh-bot_*_amd64.deb
   ```

3. **Windows builder:**
   ```bash
   git clone https://github.com/drdeeks/poidh.git
   cd poidh
   git checkout standalone-packaging
   npm run gui:package:win
   # Share: releases/POIDH-Bot-Setup-*-x64.exe
   ```

## Release Process

### 1. Prepare Release
```bash
# Update version in package.json
# Update CHANGELOG.md
# Commit changes

git add package.json CHANGELOG.md
git commit -m "chore: release v2.1.0"
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin standalone-packaging
git push origin v2.1.0
```

### 2. GitHub Actions builds automatically
```
Workflow triggers: .github/workflows/release-builds.yml
├── macOS build
├── Linux build
├── Windows build
└── Create GitHub Release
```

### 3. Verify Releases
Visit: https://github.com/drdeeks/poidh/releases

Should contain:
- POIDH-Bot-Setup-v2.1.0-x64.exe (Windows)
- POIDH-Bot-v2.1.0-macos.dmg (macOS)
- POIDH-Bot-v2.1.0-x86_64.AppImage (Linux)
- poidh-bot_v2.1.0_amd64.deb (Linux)

### 4. Post-Release
```bash
# Create release notes
# Update documentation
# Announce on social media
```

## File Structures

### Windows Setup
```
POIDH-Bot-Setup-2.0.0-x64.exe
├── [NSIS Installer Package]
└── On Installation:
    ├── Program Files/POIDH Bot/
    │   └── POIDH-Bot-GUI.exe
    ├── Start Menu/POIDH Bot/
    │   ├── POIDH Bot GUI.lnk
    │   └── Uninstall.lnk
    └── Desktop/
        └── POIDH Bot.lnk
```

### macOS DMG
```
POIDH-Bot-2.0.0-macos.dmg
├── POIDH-Bot-GUI.app/
│   ├── Contents/
│   │   ├── MacOS/POIDH-Bot-GUI
│   │   ├── Info.plist
│   │   ├── Resources/
│   │   └── Frameworks/
│   └── _CodeSignature/
└── Applications/ (symlink)
```

### Linux AppImage
```
POIDH-Bot-2.0.0-x86_64.AppImage
├── [Self-contained executable]
├── Python runtime
├── All dependencies
└── No installation required
```

### Linux DEB
```
poidh-bot_2.0.0_amd64.deb
└── Installs to:
    ├── /usr/bin/poidh-bot
    ├── /usr/share/applications/poidh-bot.desktop
    └── /usr/share/doc/poidh-bot/
```

## Sizes & Performance

### Typical Build Sizes
| Platform | Format | Size | Install Size |
|----------|--------|------|--------------|
| Windows | .exe | 150-200 MB | 150-200 MB |
| macOS | .dmg | 150-200 MB | 150-200 MB |
| Linux | AppImage | 150-200 MB | Not installed |
| Linux | .deb | 80-120 MB | 150-200 MB |
| Linux | .tar.gz | 50-80 MB | Manual |

### Build Times
- Windows: ~5-10 minutes
- macOS: ~5-10 minutes
- Linux: ~5-10 minutes
- GitHub Actions: ~10-15 minutes per platform

## Distribution

### GitHub Releases
```bash
# Releases are automatically created in:
# https://github.com/drdeeks/poidh/releases
```

### Package Managers (Future)
```bash
# Windows: Winget, Chocolatey
# macOS: Homebrew
# Linux: Snap, Flathub
```

## Security Considerations

### Code Signing
- **Windows**: Sign with Authenticode certificate (optional)
- **macOS**: Sign with Apple Developer certificate (recommended)
- **Linux**: GPG signatures (optional)

### Notarization
- **macOS**: Notarize with Apple for Gatekeeper compatibility

### Checksums
Create SHA256 checksums for each release:
```bash
sha256sum releases/* > releases/CHECKSUMS.txt
```

## Troubleshooting

### Build Fails
```bash
# Clean rebuild
npm run clean
npm install
npm run gui:build

# Verify dependencies
python3 --version  # 3.8+
node --version     # 14+
pip list           # Check requirements
```

### Installer Creation Fails
```bash
# Windows: Install NSIS from https://nsis.sourceforge.io/
# macOS: Has built-in tools
# Linux: Install appimagetool, fakeroot, dpkg

# Then retry:
npm run gui:package
```

### Installation Fails
- **Windows**: Run as Administrator
- **macOS**: Allow in System Preferences → Security & Privacy
- **Linux**: Check file permissions, install dependencies

## Next Steps

- [ ] Code signing certificates
- [ ] Auto-update mechanism (Electron Updater, Sparkle)
- [ ] Localization (i18n)
- [ ] Custom branding (icons, splashscreen)
- [ ] Crash reporting (Sentry)
- [ ] Analytics (opt-in)
- [ ] Package manager distribution (Winget, Homebrew, Snap)

## Resources

- [PyInstaller Documentation](https://pyinstaller.readthedocs.io/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [macOS DMG Creation](https://asktom.oracle.com/ords/f?p=SECURITY:3::APP_ID:210:P3_QUESTION_ID:2260110256621123)
- [Linux AppImage](https://appimage.org/)
- [Debian Packaging](https://www.debian.org/doc/manuals/maint-guide/)
