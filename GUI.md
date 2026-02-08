# POIDH Autonomous Bounty Bot - GUI Package Guide

## 📦 What's Included

A complete, lightweight Python GUI and CLI toolkit for managing the POIDH autonomous bounty bot across all supported blockchains.

```
📂 gui/
├── 📄 poidh_gui.py          Main PyQt5 GUI application (23 KB)
├── 📄 cli.py                Command-line interface (11 KB)  
├── 📄 setup.py              Automated setup & verification
├── 🔨 build.sh              Linux/macOS build script
├── 🔨 build.bat             Windows build script
├── ✅ verify.sh             Linux/macOS verification
├── ✅ verify.bat            Windows verification
├── 📋 requirements.txt       Python dependencies
├── .gitignore               Git ignore rules
├── 📖 README.md             Full documentation (10 KB)
├── 🚀 QUICKSTART.md         5-minute quick start (3 KB)
├── 📚 INSTALL.md            Detailed installation (9 KB)
├── 🚢 DEPLOYMENT.md         Production guide (9 KB)
└── ✨ FEATURES.md           Complete feature list
```

**Total Size**: ~80 KB source code + dependencies

## 🎯 Quick Start (Pick One)

### GUI (Easiest)
```bash
python3 gui/setup.py
python3 gui/poidh_gui.py
```

### CLI (No Window)
```bash
python3 gui/setup.py
python3 gui/cli.py --help
```

### Standalone Executable (No Python)
```bash
cd gui
./build.sh              # Linux/macOS
# or
build.bat              # Windows

# Run: gui/dist/POIDH-Bot-GUI
```

### Verify Installation
```bash
bash gui/verify.sh      # Linux/macOS
# or
gui\verify.bat         # Windows
```

## 🔑 Key Features

✅ **Wallet Management**
- Generate new wallets
- Import from private keys
- Check balance
- Display on correct chains

✅ **Configuration**
- Switch between 8 EVM chains
- Set RPC URLs
- Add API keys (OpenAI, Alchemy, Infura)
- Configure agent parameters

✅ **Bounty Creation**
- 6 production templates ready to deploy
- Custom bounty builder
- Override rewards
- Real-time launch logs

✅ **Monitoring**
- Live audit trail
- Agent status indicator
- Color-coded actions
- Auto-refresh

✅ **Multi-Chain**
- Base Mainnet & Sepolia
- Arbitrum One & Sepolia
- Degen Chain
- Ethereum, Optimism, Polygon
- Correct native currencies

✅ **Installation**
- 5 different installation methods
- Automated setup verification
- Handles managed Python environments
- Virtual environment support

## 📖 Documentation

| Document | Purpose | Length |
|----------|---------|--------|
| **QUICKSTART.md** | Get running in 5 minutes | 3 KB |
| **INSTALL.md** | Complete setup guide | 9 KB |
| **README.md** | Full feature reference | 10 KB |
| **DEPLOYMENT.md** | Production deployment | 9 KB |
| **FEATURES.md** | Complete feature matrix | - |

**Total Documentation**: ~35 KB (very thorough)

## 🚀 Usage Examples

### Create & Launch Bounty (GUI)
```
1. Launch: python3 gui/poidh_gui.py
2. Wallet tab → Generate New Wallet
3. Config tab → Select chain → Save
4. Create Bounty tab → Select template → Launch
5. Monitor tab → Watch in real-time
```

### Create & Launch Bounty (CLI)
```bash
# Setup
python3 gui/cli.py wallet create
python3 gui/cli.py config set CHAIN_ID 8453

# Launch
python3 gui/cli.py bounty launch proveOutside --reward 0.01

# Monitor
python3 gui/cli.py audit show --limit 50
```

### System Health Check
```bash
python3 gui/cli.py health

# Output:
# ✅ Wallet
# ✅ Node.js
# ✅ npm
# ✅ RPC Connection
```

## 📋 Supported Bounty Types

**First-Valid (First correct wins):**
1. 🌳 Prove You're Outside - EXIF + outdoor verification
2. 📝 Handwritten Date - Handwriting recognition
3. 🍽️ Show Your Meal - Real food detection

**AI-Judged (Best submission wins):**
1. 🗼 Creative Object Tower - Building creativity
2. 🌗 Creative Shadow Photography - Artistic shadows
3. 🐾 Best Animal Photo - Pet/wildlife quality

## 🔗 Supported Chains

| Chain | ID | Currency | Status |
|-------|-----|----------|--------|
| Base Mainnet | 8453 | ETH | ✅ Active |
| Base Sepolia | 84532 | ETH | ✅ Active |
| Arbitrum One | 42161 | ETH | ✅ Active |
| Arbitrum Sepolia | 421614 | ETH | ✅ Active |
| Degen | 666666666 | DEGEN | ✅ Active |
| Ethereum | 1 | ETH | ⚠️ Disabled |
| Sepolia | 11155111 | ETH | ⚠️ Disabled |
| Polygon | 137 | MATIC | ⚠️ Disabled |
| Optimism | 10 | ETH | ⚠️ Disabled |

Enable chains in `src/config/chains.ts`

## 🛠️ Installation Methods

**1. Automated (Easiest)**
```bash
python3 gui/setup.py && python3 gui/poidh_gui.py
```

**2. Manual**
```bash
npm install
pip install -r gui/requirements.txt
python3 gui/poidh_gui.py
```

**3. Virtual Environment (Best Practice)**
```bash
python3 -m venv venv && source venv/bin/activate
npm install && pip install -r gui/requirements.txt
python3 gui/poidh_gui.py
```

**4. Standalone Executable**
```bash
cd gui && ./build.sh && ./dist/POIDH-Bot-GUI
```

**5. Docker**
```bash
docker build -f Dockerfile.gui -t poidh-gui .
docker run -it poidh-gui python gui/cli.py --help
```

## 🔧 Configuration

All settings in `.env` file:

```bash
# Blockchain
CHAIN_ID=8453
SUPPORTED_CHAINS=8453,42161,666666666

# Wallet (auto-generated)
BOT_PRIVATE_KEY=0x...

# RPC (optional, uses defaults)
BASE_RPC_URL=https://mainnet.base.org

# API Keys
OPENAI_API_KEY=sk-...
ALCHEMY_KEY=...

# Agent
POLLING_INTERVAL=30
MAX_GAS_PRICE_GWEI=50
AUTO_APPROVE_GAS=true
```

## ⚠️ Security

- **Private keys**: Stored locally in `.env` only
- **File permissions**: Use `chmod 600 .env` (Linux/macOS)
- **Never commit**: Add `.env` to `.gitignore`
- **Backups**: Store `.env` securely offline
- **API keys**: Rotate regularly

## 🐛 Troubleshooting

**GUI won't start?**
```bash
python3 gui/cli.py health  # Diagnose issues
```

**Setup fails?**
```bash
python3 gui/setup.py       # Run again, handles edge cases
```

**No balance showing?**
1. Check RPC URL in Config tab
2. Verify correct chain selected
3. Click "Refresh Balance"

**Bounty won't launch?**
```bash
npm run build              # Rebuild TypeScript
npm test                   # Verify setup
```

**See full troubleshooting**: `gui/INSTALL.md#troubleshooting`

## 📊 System Requirements

**Minimum:**
- Python 3.8+
- Node.js 18+
- 512 MB RAM
- 1 GB disk space
- Internet connection

**Recommended:**
- Python 3.10+
- Node.js 20+
- 2 GB RAM
- 2 GB disk space
- Fast internet (1+ Mbps)

## 📦 Package Sizes

- **Source code**: 50 KB
- **Standalone executable**: 150 MB
- **With dependencies**: 200 MB
- **Documentation**: 35 KB

## 🎯 Next Steps

1. **Read**: `gui/QUICKSTART.md` (5 minutes)
2. **Install**: `python3 gui/setup.py` (2 minutes)
3. **Launch**: `python3 gui/poidh_gui.py` (immediate)
4. **Create wallet**: Use "Generate New Wallet" button
5. **Deploy bounty**: Select template and launch!

## 📞 Support

- **Quick help**: `python3 gui/cli.py --help`
- **Health check**: `python3 gui/cli.py health`
- **Documentation**: See `gui/` directory
- **Issues**: https://github.com/drdeek/poidh-autonomous/issues

## 📜 Version Info

- **Version**: 2.0.0
- **Status**: ✅ Production Ready
- **Release Date**: February 2024
- **License**: MIT

---

**Get started now:** `python3 gui/setup.py` then `python3 gui/poidh_gui.py` 🚀
