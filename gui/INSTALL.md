# POIDH Autonomous Bounty Bot - Installation Guide

Complete setup instructions for the GUI and CLI applications.

## Quick Install

### Linux/macOS

```bash
# 1. Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Run setup
python3 gui/setup.py

# 3. Start GUI
python3 gui/poidh_gui.py

# Or use CLI
python3 gui/cli.py --help
```

### Windows

```cmd
REM 1. Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

REM 2. Run setup (requires Python 3.8+)
python gui/setup.py

REM 3. Start GUI
python gui/poidh_gui.py

REM Or use CLI
python gui/cli.py --help
```

## System Requirements

### Minimum
- **OS**: Windows 10+, macOS 10.13+, Ubuntu 18.04+
- **RAM**: 512 MB
- **Disk**: 1 GB (includes Node.js deps)
- **Internet**: Required for RPC calls and OpenAI API

### Recommended
- **OS**: Windows 11, macOS 12+, Ubuntu 22.04+
- **RAM**: 2 GB
- **Disk**: 2 GB
- **Network**: Stable internet (1+ Mbps)

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Python 3.8+**
   - Download: https://www.python.org/downloads/
   - Verify: `python --version` or `python3 --version`

3. **Git** (for cloning)
   - Download: https://git-scm.com/
   - Verify: `git --version`

### Check Prerequisites

```bash
# Linux/macOS
node --version      # Should be 18.x.x or higher
npm --version       # Should be 9.x.x or higher
python3 --version   # Should be 3.8+ or higher
git --version       # Should be 2.x.x or higher

# Windows (use similar commands in Command Prompt)
node --version
npm --version
python --version
git --version
```

## Installation Methods

### Method 1: Automated Setup (Recommended)

**Fastest way to get started.**

```bash
# Clone repo
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# Run automated setup
python3 gui/setup.py

# If setup succeeded:
python3 gui/poidh_gui.py
```

### Method 2: Manual Setup

**More control, understand each step.**

```bash
# 1. Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Install Node.js dependencies
npm install

# 3. Install Python GUI dependencies
pip install -r gui/requirements.txt

# Or with --user flag (for managed Python environments)
pip install -r gui/requirements.txt --user

# Or with --break-system-packages (Ubuntu 23.10+)
pip install -r gui/requirements.txt --break-system-packages

# 4. Run GUI
python3 gui/poidh_gui.py

# Or run CLI
python3 gui/cli.py wallet create
```

### Method 3: Virtual Environment

**Isolated Python environment (best practice).**

```bash
# 1. Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# 4. Install dependencies
npm install
pip install -r gui/requirements.txt

# 5. Run GUI
python3 gui/poidh_gui.py

# Deactivate when done:
deactivate
```

### Method 4: Docker

**Containerized setup (no local installation needed).**

```bash
# 1. Build Docker image
docker build -t poidh-bot -f Dockerfile.gui .

# 2. Run container (for CLI)
docker run -it poidh-bot python gui/cli.py health

# 3. Run GUI (requires X11/display forwarding)
docker run -it -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix poidh-bot
```

### Method 5: Build Standalone Executable

**Package as single-file executable (no Python installation needed).**

```bash
# Linux/macOS
cd gui
./build.sh

# Windows
cd gui
build.bat

# Output location
# Linux/macOS: gui/dist/POIDH-Bot-GUI
# Windows: gui\dist\POIDH-Bot-GUI.exe

# Run directly
./gui/dist/POIDH-Bot-GUI
```

## Post-Installation

### 1. Verify Installation

```bash
# Check system health
python3 gui/cli.py health

# Expected output:
# ✅ Wallet        (may show ❌ if no wallet yet)
# ✅ Node.js
# ✅ npm
# ✅ RPC Connection
```

### 2. Create or Import Wallet

**Option A: Generate New Wallet**
```bash
python3 gui/cli.py wallet create
```

**Option B: Import Existing Wallet**
```bash
# Via GUI: Wallet Tab → "Import from Private Key"
# Or set in .env manually:
echo "BOT_PRIVATE_KEY=0x..." >> .env
```

### 3. Configure Chain and Keys

```bash
# Via CLI
python3 gui/cli.py config set CHAIN_ID 8453
python3 gui/cli.py config set OPENAI_API_KEY sk-...

# Or via GUI: Configuration Tab
# Or edit .env directly
```

### 4. Start Using

```bash
# Via GUI
python3 gui/poidh_gui.py

# Via CLI - List bounties
python3 gui/cli.py bounty list

# Via CLI - Launch bounty
python3 gui/cli.py bounty launch proveOutside
```

## Troubleshooting

### Python Version Issues

```
Error: Python 3.8+ required
Solution: Update Python
Windows: https://www.python.org/downloads/
macOS: brew install python3
Linux: apt-get install python3.10
```

### Node.js/npm Not Found

```
Error: Command 'node' not found
Solution: Install Node.js
Download: https://nodejs.org/
Add to PATH (Windows): Restart terminal after install
```

### pip Permission Denied

```
Error: externally-managed-environment
Solution options:
1. Use --user flag: pip install -r gui/requirements.txt --user
2. Use --break-system-packages: pip install -r gui/requirements.txt --break-system-packages
3. Use virtual environment: python3 -m venv venv && source venv/bin/activate
```

### PyQt5 Not Loading

```
Error: ModuleNotFoundError: No module named 'PyQt5'
Solution: pip install PyQt5==5.15.9
Check: python3 -c "from PyQt5.QtWidgets import QApplication; print('OK')"
```

### GUI Doesn't Start on macOS

```
Error: GUI window doesn't appear
Solution: Run from terminal with:
DYLD_FRAMEWORK_PATH=/usr/local/opt/qt/lib python3 gui/poidh_gui.py

Or install via Homebrew:
brew install pyqt5
```

### Linux Display Issues

```
Error: Could not connect to display
Solution: Use headless CLI instead:
python3 gui/cli.py bounty launch proveOutside

Or use X11 forwarding via SSH:
ssh -X user@server
python3 gui/poidh_gui.py
```

### Wallet Balance Not Showing

```
Error: Balance shows "--"
Solution:
1. Check RPC URL is valid: python3 gui/cli.py config show
2. Click "Refresh Balance" in Wallet tab
3. Check RPC connection: python3 gui/cli.py health
4. Verify CHAIN_ID matches RPC network
```

### .env File Permissions

```
Error: Could not write .env
Linux/macOS solution: chmod 644 .env
Windows: Right-click .env → Properties → Uncheck "Read-only"
```

## Environment Variables

Create or edit `.env` file in project root:

```bash
# Blockchain Configuration
CHAIN_ID=8453                                    # 8453, 42161, or 666666666
SUPPORTED_CHAINS=8453,42161,666666666

# Wallet (Created by "wallet create" command)
BOT_PRIVATE_KEY=0x1234567890abcdef...

# RPC URLs (optional, uses defaults if not set)
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
DEGEN_RPC_URL=https://rpc.degen.tips

# API Keys
OPENAI_API_KEY=sk-...                          # For AI-judged bounties
ALCHEMY_KEY=...                                 # Optional
INFURA_KEY=...                                  # Optional

# Agent Settings
POLLING_INTERVAL=30                             # Seconds
MAX_GAS_PRICE_GWEI=50                          # Gwei
AUTO_APPROVE_GAS=true                          # true or false

# Logging
LOG_LEVEL=info                                  # debug, info, warn, error
```

## Updating

```bash
# Pull latest changes
git pull origin main

# Reinstall if dependencies changed
npm install
pip install -r gui/requirements.txt --upgrade

# Run setup to verify
python3 gui/setup.py
```

## Uninstalling

### Remove Local Installation

```bash
# Keep .env (contains wallet!)
rm -rf node_modules
rm -rf venv
rm -rf gui/dist
rm -rf gui/build

# Or completely remove (backup .env first!)
rm -rf ~/poidh-autonomous
```

### Remove Docker Images

```bash
docker rmi poidh-bot
```

## Getting Help

- **GitHub Issues**: https://github.com/drdeek/poidh-autonomous/issues
- **Documentation**: Check `README.md` in project root
- **CLI Help**: `python3 gui/cli.py --help`
- **Health Check**: `python3 gui/cli.py health`

## Security Notes

⚠️ **Important**: The `.env` file contains sensitive information:
- Private keys
- API keys
- Secret tokens

**Protect your .env file:**
```bash
# Restrict file permissions
chmod 600 .env

# Never commit to Git
echo ".env" >> .gitignore
git rm --cached .env 2>/dev/null

# Back up securely
cp .env ~/.private/poidh.env
```

## Next Steps

1. **Start the GUI**: `python3 gui/poidh_gui.py`
2. **Or use CLI**: `python3 gui/cli.py --help`
3. **Read main README**: See `README.md` for full feature guide
4. **Check deployment**: See `DEPLOYMENT.md` for production setup

---

**Installation successful? Let's go!** 🚀

```bash
# Create your first bounty
python3 gui/cli.py bounty launch proveOutside
```
