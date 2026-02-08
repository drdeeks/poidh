# POIDH GUI - Deployment Guide

Complete instructions for packaging and deploying the POIDH bounty bot GUI as a standalone application.

## Quick Start

### Windows Users
```cmd
cd gui
build.bat
# Run: dist\POIDH-Bot-GUI.exe
```

### macOS/Linux Users
```bash
cd gui
chmod +x build.sh
./build.sh
# Run: ./dist/POIDH-Bot-GUI
```

## Pre-Deployment Checklist

- [ ] Node.js 18+ installed and in PATH
- [ ] npm 9+ installed and in PATH  
- [ ] Python 3.8+ installed and in PATH
- [ ] Git repository cloned to local disk
- [ ] `.env.example` copied to `.env`
- [ ] All Node.js dependencies installed: `npm install`

## Build Process

### 1. Prepare Environment

```bash
# Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# Install Node.js dependencies
npm install

# Install Python GUI dependencies
pip install -r gui/requirements.txt
```

### 2. Verify Node.js Setup

```bash
# Test that npm commands work
npm run build
npm run test

# If everything passes, ready to build GUI
```

### 3. Build GUI Executable

**Linux/macOS:**
```bash
cd gui
./build.sh
```

**Windows:**
```cmd
cd gui
build.bat
```

### 4. Verify Build

```bash
# The executable should be in gui/dist/

# Linux/macOS
ls -lh gui/dist/POIDH-Bot-GUI

# Windows
dir gui\dist\POIDH-Bot-GUI.exe
```

## Deployment Scenarios

### Scenario 1: Single-User Desktop

**Setup Steps:**
1. Run build script (see above)
2. Create shortcut to `gui/dist/POIDH-Bot-GUI`
3. User opens shortcut to launch GUI
4. GUI manages all configuration via `.env`

**Advantages:**
- No Python installation needed
- All dependencies bundled
- User-friendly interface

**File Size:** ~150-200 MB (PyInstaller bundles entire Python runtime)

### Scenario 2: Team Server Deployment

**Setup Steps:**

1. **Install on server:**
```bash
# As root or with sudo
cd /opt/poidh-bot
git clone https://github.com/drdeek/poidh-autonomous.git .
npm install
pip install -r gui/requirements.txt
```

2. **Create wrapper script** (`/opt/poidh-bot/run-gui.sh`):
```bash
#!/bin/bash
cd /opt/poidh-bot
export NODE_ENV=production
python gui/poidh_gui.py
```

3. **Set up X11 forwarding** (for remote SSH):
```bash
# SSH with X11 forwarding
ssh -X user@server.com
cd /opt/poidh-bot
python gui/poidh_gui.py
```

4. **Or use CLI for headless operation**:
```bash
# Terminal-based, no display needed
python gui/cli.py bounty launch proveOutside
```

**Advantages:**
- Centralized management
- Can use CLI for automation
- Shared wallet and configuration

### Scenario 3: Docker Container

**Create `Dockerfile.gui`:**
```dockerfile
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    nodejs npm xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Install dependencies
RUN npm install
RUN pip install -r gui/requirements.txt

# Enable X11
ENV DISPLAY=:99

# Start GUI with virtual display
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 & python gui/poidh_gui.py"]
```

**Build and run:**
```bash
docker build -f Dockerfile.gui -t poidh-gui .
docker run -it -e DISPLAY=:99 poidh-gui
```

### Scenario 4: Cloud VM Deployment

**AWS/GCP/Azure Setup:**

1. **Launch VM** with Ubuntu 22.04, 2GB RAM
2. **Install dependencies:**
```bash
sudo apt-get update
sudo apt-get install -y \
  nodejs npm python3 python3-pip \
  git curl xvfb

# Clone and setup
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
npm install
pip install -r gui/requirements.txt
```

3. **Use CLI for headless operation:**
```bash
# No GUI needed on cloud VM
python gui/cli.py bounty launch proveOutside

# Or use cron for scheduled bounties
# */1 * * * * cd /home/ubuntu/poidh-autonomous && python gui/cli.py bounty launch proveOutside
```

4. **Or expose GUI via web:**
- Use `guacamole` or `vnc` to access GUI remotely
- Set up reverse proxy for web access

### Scenario 5: CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy POIDH Bot

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          npm install
          pip install -r gui/requirements.txt
      
      - name: Build GUI
        run: |
          cd gui
          pip install pyinstaller
          pyinstaller --onefile poidh_gui.py
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: POIDH-Bot-GUI
          path: gui/dist/POIDH-Bot-GUI
```

## Distribution

### Option 1: GitHub Releases

```bash
# Create release with built executable
# 1. Build GUI locally
./gui/build.sh

# 2. Create GitHub release
# 3. Upload gui/dist/POIDH-Bot-GUI

# Users download directly from releases page
```

### Option 2: Package Managers

**Create installer for Windows (NSIS):**

```nsis
Name "POIDH Bot GUI"
OutFile "POIDH-Bot-GUI-Setup.exe"
InstallDir "$PROGRAMFILES\POIDH-Bot"

Section "Install"
  SetOutPath "$INSTDIR"
  File "gui\dist\POIDH-Bot-GUI.exe"
  CreateShortcut "$SMPROGRAMS\POIDH-Bot-GUI.lnk" "$INSTDIR\POIDH-Bot-GUI.exe"
SectionEnd
```

**Create DMG for macOS:**

```bash
# Using create-dmg (npm package)
npx create-dmg gui/dist/POIDH-Bot-GUI.app POIDH-Bot-GUI.dmg
```

### Option 3: Homebrew (macOS)

Create `Formula/poidh-bot-gui.rb`:
```ruby
class PoidhBotGui < Formula
  desc "POIDH Autonomous Bounty Bot GUI"
  homepage "https://github.com/drdeek/poidh-autonomous"
  url "https://github.com/drdeek/poidh-autonomous/releases/download/v2.0.0/POIDH-Bot-GUI.tar.gz"
  
  def install
    bin.install "POIDH-Bot-GUI"
  end
end
```

## Post-Deployment

### User First-Run

1. **Launch application**
2. **Wallet Tab:**
   - Click "Generate New Wallet" OR
   - Import existing wallet with private key
3. **Configuration Tab:**
   - Select chain (Base, Arbitrum, Degen)
   - Add OpenAI API key (for AI-judged bounties)
   - Save configuration
4. **Create Bounty Tab:**
   - Select template (e.g., "Prove You're Outside")
   - Click "Launch Bounty"
5. **Monitor Tab:**
   - Watch real-time audit trail
   - See submission status and payouts

### Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| GUI won't start | Run `python gui/cli.py health` to diagnose |
| No balance shown | Check RPC URL and API keys in Config tab |
| Bounty won't launch | Verify Node.js installed, run `npm test` |
| Logs not updating | Ensure bounty is actually running, check `logs/` folder |
| Private key not saved | Check file permissions on `.env` |

### Security Hardening

```bash
# Restrict .env file permissions (Linux/macOS)
chmod 600 .env

# Never commit .env to version control
echo ".env" >> .gitignore
git rm --cached .env 2>/dev/null

# Use environment variables instead for sensitive data
export BOT_PRIVATE_KEY="0x..."
export OPENAI_API_KEY="sk-..."
```

## Maintenance

### Updates

```bash
# Get latest version
git pull origin main
npm install
pip install -r gui/requirements.txt

# Rebuild GUI
cd gui && ./build.sh

# Test before deployment
npm test
npm run typecheck
```

### Monitoring

```bash
# Check agent health
python gui/cli.py health

# View recent activity
python gui/cli.py audit show --limit 50

# Monitor running bounties
python gui/cli.py bounty monitor
```

### Cleanup

```bash
# Remove old builds
rm -rf gui/dist gui/build

# Clear logs
rm -rf logs/*

# Rebuild
cd gui && ./build.sh
```

## Support

- **Issues**: https://github.com/drdeek/poidh-autonomous/issues
- **Documentation**: See `README.md` in project root
- **CLI Help**: `python gui/cli.py --help`

## Version History

- **2.0.0** - Initial GUI release with PyQt5, multi-chain support, Docker packaging
- **1.0.0** - CLI-only version

---

**Last Updated**: 2024-01
**Maintainer**: @drdeek
