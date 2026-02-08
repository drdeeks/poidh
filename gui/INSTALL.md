# Installation Guide - POIDH Bounty Bot GUI

Complete setup instructions for all platforms.

---

## Prerequisites

### All Platforms
- **Python 3.9+** (get from python.org)
- **Node.js 18+** (get from nodejs.org)
- **Internet connection**
- **200 MB free disk space** (minimum)

### Windows
- Windows 10 or later
- Administrator access (for first-time npm setup)

### macOS
- macOS 10.14 or later
- Xcode Command Line Tools: `xcode-select --install`

### Linux
- Ubuntu 18.04+ (or equivalent)
- Build essentials: `sudo apt install build-essential python3-dev`

---

## Installation Methods

### Method 1: Download Standalone Executable (Easiest)

**For Windows:**
1. Download `poidh-bot-gui.exe` from releases
2. Double-click to run
3. Skip to "First-Time Setup" section

**For macOS:**
1. Download `poidh-bot-gui.dmg` from releases
2. Double-click to mount
3. Drag to Applications folder
4. Launch from Applications
5. Skip to "First-Time Setup" section

**For Linux:**
1. Download `poidh-bot-gui` from releases
2. Make executable: `chmod +x poidh-bot-gui`
3. Run: `./poidh-bot-gui`
4. Skip to "First-Time Setup" section

---

### Method 2: Python pip Installation

**Step 1: Install Node.js**

```bash
# Windows (using Chocolatey)
choco install nodejs

# macOS (using Homebrew)
brew install node

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm
```

**Step 2: Clone Repository**

```bash
git clone https://github.com/drdeeks/poidh.git
cd poidh
```

**Step 3: Install Python Dependencies**

```bash
cd gui
pip install -r requirements.txt
```

**Step 4: Run GUI**

```bash
python main.py
```

---

### Method 3: Development Installation

For developers who want to modify the code:

```bash
# Clone repository
git clone https://github.com/drdeeks/poidh.git
cd poidh/gui

# Install in development mode
pip install -e .

# Run
poidh-bot-gui

# Or run directly
python main.py
```

---

### Method 4: Build Your Own Executable

**Step 1: Prerequisites**

```bash
# Clone repository
git clone https://github.com/drdeeks/poidh.git
cd poidh/gui

# Install build dependencies
pip install -r requirements.txt
pip install PyInstaller
```

**Step 2: Build**

```bash
python build.py
```

**Step 3: Use**

The executable is in `dist/poidh-bot-gui/`

```bash
# Windows
dist\poidh-bot-gui\poidh-bot-gui.exe

# macOS/Linux
dist/poidh-bot-gui/poidh-bot-gui
```

---

## First-Time Setup

### 1. Launch Application

```bash
# If using standalone executable
./poidh-bot-gui

# If using Python
python main.py

# If using pip
poidh-bot-gui
```

### 2. Wallet Setup (💰 Wallet Tab)

**Option A: Generate New Wallet**
1. Click **"Generate New Wallet"**
2. Wait for output
3. Copy the private key somewhere safe
4. ✅ Wallet generated

**Option B: Import Existing Wallet**
1. Enter your private key (0x...)
2. Click **"Import & Save"**
3. ✅ Wallet imported

### 3. Fund Your Wallet

1. Click **"Check Wallet Balance"**
2. Copy the address shown
3. Send funds from your exchange:
   - **Degen chain**: 50+ DEGEN
   - **Base chain**: 0.01+ ETH
   - **Arbitrum**: 0.01+ ETH

### 4. Configure (⚙️ Configuration Tab)

1. **Blockchain**
   - Select primary chain (usually Degen or Base)
   - Keep supported chains as is (or customize)

2. **RPC Endpoints** (leave defaults if they work)
   - Base: `https://mainnet.base.org`
   - Arbitrum: `https://arb1.arbitrum.io/rpc`
   - Degen: `https://rpc.degen.tips`

3. **AI (Optional)**
   - Get OpenAI key from platform.openai.com
   - Only needed for AI-judged bounties
   - Leave blank if not using

4. **Performance**
   - Polling Interval: 30 (default is fine)
   - Max Gas: 50 (default is fine)
   - Dashboard Port: 3001 (if port in use, change it)

5. **Click "Save Configuration"**

### 5. Create First Bounty (🤖 Agent Tab)

1. Click any pre-built bounty button
   - 🌳 **Prove Outside** - Quick (15 min)
   - 🍽️ **Meal Photo** - Quick (30 min)
   - 📝 **Handwritten Date** - Moderate (1 hour)
   - 🗼 **Object Tower** - AI-judged (48h)
   - 🌗 **Shadow Art** - AI-judged (72h)
   - 🐾 **Animal Photo** - AI-judged (48h)

2. Watch output for success message

3. Check **📊 Dashboard** tab to see real-time activity

---

## Verification

### Check Installation

**Python**
```bash
python --version
# Should show Python 3.9 or higher
```

**Node.js**
```bash
node --version
npm --version
# Should show current versions
```

**GUI Launch**
```bash
cd poidh/gui
python main.py
# Should open window without errors
```

### Test Wallet

1. Open GUI
2. Go to 💰 Wallet tab
3. Click "Check Wallet Balance"
4. Should show address and balance
5. ✅ Setup is working

### Test Configuration

1. Go to ⚙️ Configuration tab
2. Fill in any values
3. Click "Save Configuration"
4. Check that `.env` file has values
5. ✅ Configuration works

---

## Troubleshooting

### Issue: "No module named PyQt6"

**Solution:**
```bash
pip install PyQt6 PyQt6-WebEngine
```

### Issue: "Node.js not found"

**Solution:**
1. Install Node.js from nodejs.org
2. Restart the application
3. Restart your terminal/command prompt

### Issue: "Permission denied" (Linux/Mac)

**Solution:**
```bash
chmod +x poidh-bot-gui
./poidh-bot-gui
```

### Issue: "Cannot find npm"

**Solution:**
```bash
# Verify npm is in PATH
npm --version

# If not found, reinstall Node.js
# Then restart terminal
```

### Issue: GUI window appears blank

**Solution:**
1. Check internet connection
2. Close and restart the GUI
3. Check system RAM (need 200+ MB free)
4. Try resizing the window

### Issue: "RPC connection error"

**Solution:**
1. Check internet connection
2. Try different RPC endpoint
3. Check your firewall
4. Test with: `curl https://rpc.degen.tips`

### Issue: Port 3001 already in use

**Solution:**
1. Go to ⚙️ Configuration
2. Change "Dashboard Port" to different number (e.g., 3002)
3. Save configuration
4. Restart application

---

## Uninstallation

### Standalone Executable
Simply delete the executable file. That's it!

### Python Installation

```bash
# Via pip
pip uninstall poidh-bot-gui

# Or remove directory
rm -rf poidh/
```

---

## Getting Help

- **Documentation**: See [README.md](README.md)
- **Issues**: https://github.com/drdeeks/poidh/issues
- **Setup Issues**: Check prerequisites and troubleshooting above

---

## Next Steps

✅ Application installed  
✅ Wallet configured  
✅ Funds deposited  

Now:
1. Go to **🤖 Agent** tab
2. Create your first bounty
3. Monitor on **📊 Dashboard**
4. Check **audit trail** for proof of autonomous operation

Enjoy! 🚀
