# Deployment Guide - POIDH Bounty Bot GUI

Complete guide for building, packaging, and distributing the GUI application.

---

## Build Overview

The deployment process creates:
1. **Standalone executable** (Windows, macOS, Linux)
2. **Python package** (for pip installation)
3. **Installer package** (for distribution)

---

## Prerequisites for Building

### All Platforms
```bash
# Python 3.9+
python3 --version  # Should be 3.9 or higher

# Install build dependencies
pip install -r requirements.txt PyInstaller
```

### Windows
- Visual C++ Build Tools (for some packages)
- NSIS (optional, for installer)

### macOS
- Xcode Command Line Tools: `xcode-select --install`

### Linux
```bash
sudo apt update
sudo apt install python3-dev build-essential
```

---

## Build Standalone Executable

### Automated Build

```bash
cd gui
python build.py
```

This creates `dist/poidh-bot-gui/` with:
- Executable (poidh-bot-gui.exe, poidh-bot-gui)
- bundled Node.js files
- Configuration files
- README and documentation

### Manual Build (Advanced)

```bash
# 1. Build TypeScript
npm run build

# 2. Build GUI with PyInstaller
pyinstaller \
  --name=poidh-bot-gui \
  --onefile \
  --windowed \
  --distpath=dist \
  --buildpath=gui_build \
  main.py
```

---

## Distribution Methods

### Method 1: Direct Download (Simplest)

1. Build executable
2. Upload to GitHub Releases
3. Users download and run

**Advantages:**
- Simple for users
- No installation required
- Single download

**Files to upload:**
```
releases/
├── poidh-bot-gui-windows.exe
├── poidh-bot-gui-macos.dmg
└── poidh-bot-gui-linux
```

### Method 2: Windows Installer (Advanced)

Create NSIS installer:

```bash
# Install NSIS (Windows)
# Or use Homebrew on macOS: brew install nsis

# Create installer script (gui/installer.nsi)
# Then build:
makensis installer.nsi
```

### Method 3: PyPI Package (Python Developers)

```bash
# Build package
python setup.py sdist bdist_wheel

# Upload to PyPI
pip install twine
twine upload dist/*
```

Then users can:
```bash
pip install poidh-bot-gui
poidh-bot-gui
```

### Method 4: Docker (Cloud Deployment)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY gui/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "gui/main.py"]
```

Build and run:
```bash
docker build -t poidh-bot-gui .
docker run -d -p 3001:3001 poidh-bot-gui
```

---

## Platform-Specific Packaging

### Windows

**Standalone EXE:**
```bash
# Single executable
pyinstaller \
  --onefile \
  --console \
  --icon=icon.ico \
  main.py
```

**Installer (NSIS):**
```nsis
; installer.nsi
Name "POIDH Bot GUI"
OutFile "poidh-bot-gui-installer.exe"
InstallDir "$PROGRAMFILES\POIDH"
  
Section "Install"
  SetOutPath "$INSTDIR"
  File "dist\poidh-bot-gui.exe"
  
  CreateDirectory "$SMPROGRAMS\POIDH"
  CreateShortCut "$SMPROGRAMS\POIDH\POIDH Bot GUI.lnk" "$INSTDIR\poidh-bot-gui.exe"
SectionEnd
```

### macOS

**App Bundle:**
```bash
pyinstaller \
  --onefile \
  --windowed \
  --icon=icon.icns \
  --osx-bundle-identifier=com.poidh.bot-gui \
  main.py
```

**DMG Installer:**
```bash
# Create DMG
hdiutil create -volname "POIDH Bot GUI" \
  -srcfolder dist/poidh-bot-gui \
  -ov -format UDZO poidh-bot-gui.dmg
```

### Linux

**Executable:**
```bash
pyinstaller --onefile main.py
chmod +x dist/poidh-bot-gui/poidh-bot-gui
```

**Snap Package:**
```yaml
# snapcraft.yaml
name: poidh-bot-gui
version: '1.0.0'
summary: POIDH Autonomous Bounty Bot GUI
description: Lightweight desktop application for managing bounty agents

apps:
  poidh-bot-gui:
    command: poidh-bot-gui
    plugs: [home, network]

parts:
  poidh-bot-gui:
    plugin: python
    python-packages:
      - PyQt6
      - python-dotenv
      - requests
```

Build snap:
```bash
snapcraft
snap install poidh-bot-gui_1.0_amd64.snap --dangerous
```

---

## File Size Optimization

### Before Optimization
- Standalone EXE: ~300-500 MB
- Python + PyQt6: ~200 MB
- Node.js: ~150-200 MB

### Optimization Techniques

1. **Exclude unnecessary modules:**
```python
# build.py
'--hidden-import=PyQt6',
'--exclude-module=matplotlib',
'--exclude-module=numpy',
```

2. **Use UPX compression (Linux/macOS):**
```bash
pip install upx
pyinstaller --upx-dir=/path/to/upx main.py
```

3. **Code cleanup:**
- Remove development dependencies
- Strip docstrings (optional)
- Minify Python files (advanced)

### After Optimization
- Standalone EXE: ~150-250 MB
- With compression: ~80-120 MB

---

## Release Checklist

- [ ] All tests passing (`npm test`)
- [ ] Type checking passing (`npm run typecheck`)
- [ ] Build successful (`npm run build`)
- [ ] GUI syntax valid (`python -m py_compile gui/*.py`)
- [ ] Clean build: `python build.py`
- [ ] Test executable on Windows/macOS/Linux
- [ ] Version number updated (setup.py, package.json)
- [ ] Changelog updated
- [ ] Documentation reviewed
- [ ] README.md links correct
- [ ] INSTALL.md step-by-step tested
- [ ] Executable file size reasonable
- [ ] Hash/checksum calculated
- [ ] Release notes written
- [ ] GitHub release created
- [ ] Distribution assets uploaded

---

## Version Management

### Update Version

**Python (setup.py):**
```python
setup(
    version='1.0.1',  # Bump this
    ...
)
```

**Node.js (package.json):**
```json
{
  "version": "2.0.0"  # Keep in sync
}
```

### Semantic Versioning
- **MAJOR.MINOR.PATCH**
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

---

## Testing Before Release

### Functionality Testing

```bash
# 1. Fresh install
pip install -r requirements.txt
python gui/main.py

# 2. Test wallet
- Generate wallet
- Import wallet
- Check balance

# 3. Test configuration
- Load defaults
- Save changes
- Verify .env updated

# 4. Test agent
- Create test bounty
- Check output
- Monitor logs

# 5. Test dashboard
- View logs
- View audit trail
- Open web dashboard
```

### Cross-Platform Testing

**Windows:**
- Test on Windows 10 and 11
- Test standalone EXE
- Test installer (if created)

**macOS:**
- Test on macOS 10.14+
- Test app bundle
- Test DMG installer

**Linux:**
- Test on Ubuntu 20.04+
- Test AppImage (if created)
- Test snap package (if created)

---

## Troubleshooting Builds

### Issue: PyInstaller error

```bash
# Clean build
rm -rf gui_build dist

# Try again with verbose
pyinstaller --debug=imports main.py
```

### Issue: Missing modules

```bash
# Add to hidden imports
--hidden-import=module_name

# Or install with pip
pip install module_name
```

### Issue: File size too large

```bash
# Use onedir instead of onefile (smaller)
--onedir

# Exclude unnecessary packages
--collect-submodules=scipy:false
```

### Issue: Executable won't run

Check:
1. Python version (3.9+)
2. PyQt6 installed
3. System architecture (32-bit vs 64-bit)
4. Dependencies installed

---

## Distribution Channels

### GitHub Releases
1. Create tag: `git tag v1.0.0`
2. Push: `git push origin v1.0.0`
3. Upload assets to GitHub release page

### Direct Website
- Host on project website
- Provide direct download links
- Include checksums for verification

### Package Managers
- **Windows**: Chocolatey
- **macOS**: Homebrew
- **Linux**: Snap, AppImage, apt repository
- **Python**: PyPI

---

## Post-Release

### Monitoring
- Track downloads
- Monitor crash reports
- Collect user feedback
- Watch for issues

### Support
- Respond to issues
- Provide troubleshooting
- Update documentation
- Release patches

### Next Release
- Plan features
- Fix reported bugs
- Update dependencies
- Test thoroughly

---

## Continuous Deployment (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/build.yml
name: Build Executable

on: [push, pull_request]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r gui/requirements.txt PyInstaller
      
      - name: Build
        run: python gui/build.py
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: poidh-bot-gui-${{ matrix.os }}
          path: dist/
```

---

## Summary

| Task | Command | Time |
|------|---------|------|
| Build | `python build.py` | ~5-10 min |
| Test | Manual testing | ~15 min |
| Package | PyInstaller | ~2-5 min |
| Upload | Manual/CI | ~5 min |
| Total | - | ~30 min |

---

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Docs**: See README.md and INSTALL.md
- **Help**: Detailed error messages in build output

---

**Status**: ✨ Ready for production distribution

Happy deploying! 🚀
