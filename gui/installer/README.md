# POIDH Bot Installer Creation

This directory contains tools for creating cross-platform installers for the POIDH Autonomous Bounty Bot.

## Supported Platforms

- **Windows**: Standalone .exe + NSIS installer (.exe setup)
- **macOS**: DMG installer (.dmg)
- **Linux**: AppImage (.AppImage), DEB package (.deb), Tarball (.tar.gz)

## Quick Start

### All Platforms (Automated)

```bash
# macOS / Linux
bash gui/installer/build-all.sh

# Windows (Command Prompt)
gui\installer\build-all.bat

# Windows (PowerShell)
.\gui\installer\build-all.bat
```

### Individual Platforms

#### Windows

1. **Build executable:**
   ```bash
   bash gui/build.bat  # or run in CMD: gui\build.bat
   ```

2. **Install NSIS** (for installer creation):
   - Download from https://nsis.sourceforge.io/
   - Install to default location

3. **Build installer:**
   ```bash
   makensis /D PROJECT_ROOT="C:\path\to\poidh" /D VERSION="1.0.0" gui\installer\windows.nsi
   ```

4. **Output:**
   - Executable: `releases/POIDH-Bot-Setup-{VERSION}-x64.exe`

#### macOS

1. **Build executable:**
   ```bash
   bash gui/build.sh
   ```

2. **Build DMG installer:**
   ```bash
   bash gui/installer/macos.sh
   ```

3. **Output:**
   - DMG: `releases/POIDH-Bot-{VERSION}-macos.dmg`

#### Linux

1. **Build executable:**
   ```bash
   bash gui/build.sh
   ```

2. **Build Linux installers:**
   ```bash
   bash gui/installer/linux.sh
   ```

3. **Output (choose one):**
   - Tarball: `releases/poidh-bot-{VERSION}-linux-x86_64.tar.gz`
   - AppImage: `releases/POIDH-Bot-{VERSION}-x86_64.AppImage` (requires appimagetool)
   - DEB: `releases/poidh-bot_{VERSION}_amd64.deb` (requires fakeroot, dpkg-deb)

## Installation Files

### Scripts

- **`build-all.sh`** - Main build orchestrator (macOS/Linux)
- **`build-all.bat`** - Main build orchestrator (Windows)
- **`macos.sh`** - Create DMG installer
- **`linux.sh`** - Create Linux installers (AppImage, DEB, tarball)
- **`windows.nsi`** - NSIS installer script

### Output Location

All release artifacts are placed in `releases/` directory at project root.

## Prerequisites

### Windows
- Python 3.8+
- pip
- Node.js 14+
- NSIS (for installer creation)

### macOS
- Python 3.8+
- Xcode Command Line Tools
- Node.js 14+

### Linux
- Python 3.8+
- build-essential (gcc, make, etc.)
- Node.js 14+
- Optional: appimagetool (for AppImage)
- Optional: fakeroot, dpkg-deb (for DEB)

## File Sizes

Typical release sizes:
- Windows .exe: ~150-200 MB
- macOS .dmg: ~150-200 MB
- Linux .AppImage: ~150-200 MB
- Linux .deb: ~80-120 MB
- Linux .tar.gz: ~50-80 MB

## Build Process

### Step 1: PyInstaller Build
Creates standalone executable:
- Bundles Python runtime
- Includes all dependencies
- Self-contained, no Python installation required

### Step 2: Installer Creation
Wraps executable in platform-appropriate installer:
- **Windows**: NSIS creates setup wizard with shortcuts, registry entries
- **macOS**: DMG disk image with drag-to-install
- **Linux**: Multiple options (DEB for package managers, AppImage for portability, tarball for manual install)

## Signing & Notarization

(Optional for MVP, recommended for production)

### macOS Code Signing
```bash
codesign -s - dist/POIDH-Bot-GUI.app
codesign --verify --verbose=4 dist/POIDH-Bot-GUI.app
```

### Windows Code Signing
Requires code signing certificate. See Windows signing documentation.

## Release Workflow

1. Build executable: `gui/build.sh` or `gui/build.bat`
2. Run installer builder: `gui/installer/build-all.sh` or `build-all.bat`
3. Test installers on each platform
4. Upload to GitHub releases
5. Create release notes with installation instructions

## Troubleshooting

### NSIS not found (Windows)
```
Install NSIS from: https://nsis.sourceforge.io/
Then try again
```

### AppImage build fails (Linux)
```bash
# Install appimagetool
sudo snap install appimagetool

# Or build without AppImage
bash gui/installer/linux.sh  # Creates tarball and DEB
```

### DEB build fails (Linux)
```bash
# Install requirements
sudo apt install fakeroot dpkg-dev

# Or build without DEB
bash gui/installer/linux.sh  # Creates tarball and AppImage
```

### PyInstaller build fails
```bash
# Reinstall dependencies
python3 -m venv gui/venv
source gui/venv/bin/activate
pip install -r gui/requirements.txt
```

## Next Steps

- [ ] Code signing certificates
- [ ] Automated CI/CD builds (GitHub Actions)
- [ ] Auto-update mechanism
- [ ] Localization (i18n)
- [ ] Custom installer backgrounds/icons
