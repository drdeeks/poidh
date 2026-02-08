# POIDH Autonomous Bounty Bot

**A fully autonomous, multi-chain bounty system for real-world proof-of-autonomy tasks with integrated Python GUI and command-line tools.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 📖 Documentation

### 👉 **[COMPLETE DOCUMENTATION](./README_ENTERPRISE.md)** ← START HERE

The enterprise-grade README contains everything you need:
- **Quick Start** (5 minutes)
- **Installation** (5 methods)
- **Usage Guide** (GUI, CLI, TypeScript)
- **Configuration** (all variables)
- **Architecture** (system design)
- **Multi-Chain Support** (8 chains)
- **Bounty Templates** (6 production-ready)
- **API Reference** (complete)
- **Security** (best practices)
- **Troubleshooting** (solutions)
- **Support** (contacts & resources)

**Total:** 2,100+ lines of comprehensive documentation

---

## 🚀 Quick Start (Choose One)

### GUI (Easiest, 5 minutes)
```bash
python3 gui/setup.py && python3 gui/poidh_gui.py
```
Then click "Generate Wallet" → Select chain → "Launch Bounty"

### CLI (No window)
```bash
python3 gui/setup.py
python3 gui/cli.py bounty launch proveOutside
```

### Standalone Executable (No Python needed)
```bash
cd gui && ./build.sh && ./dist/POIDH-Bot-GUI
```

### TypeScript Agent (Advanced)
```bash
npm install && npm run agent proveOutside
```

---

## ✨ What It Does

- **Creates bounties** on-chain with real-world proof requirements
- **Monitors submissions** with real-time validation
- **Evaluates** using AI (GPT-4 Vision) or deterministic rules
- **Pays winners** automatically with transparent audit trail
- **Operates fully autonomously** with zero human intervention

---

## 🎯 Key Features

| Feature | GUI | CLI | TypeScript |
|---------|-----|-----|-----------|
| Wallet management | ✅ | ✅ | ✅ |
| Multi-chain (8 chains) | ✅ | ✅ | ✅ |
| 6 bounty templates | ✅ | ✅ | ✅ |
| Custom bounties | ✅ | ✅ | ✅ |
| Real-time monitoring | ✅ | ✅ | ✅ |
| AI evaluation (GPT-4) | ✅ | ✅ | ✅ |
| Automatic payouts | ✅ | ✅ | ✅ |
| Audit trail (hash chain) | ✅ | ✅ | ✅ |

---

## 📦 System Requirements

- **Python 3.8+** ([download](https://www.python.org/))
- **Node.js 18+** ([download](https://nodejs.org/))
- **npm 9+** (included with Node.js)
- **Git 2.x+** ([download](https://git-scm.com/))

Verify:
```bash
node --version    # v18+
npm --version     # 9+
python3 --version # 3.8+
```

---

## 📁 Project Structure

```
📂 poidh-autonomous/
├── 📄 README_ENTERPRISE.md    ← Full documentation (START HERE)
├── 📄 GUI.md                  ← GUI package overview
├── 📄 DEVELOPMENT.md          ← Development summary
├── 🎯 gui/                    ← Python GUI & CLI tools
│   ├── poidh_gui.py           ← PyQt5 GUI application
│   ├── cli.py                 ← Command-line interface
│   ├── setup.py               ← Automated setup
│   ├── build.sh/build.bat     ← Standalone builds
│   ├── requirements.txt       ← Python dependencies
│   └── [documentation & guides]
├── 📦 src/                    ← TypeScript agent
│   ├── agent.ts               ← Main orchestration
│   ├── wallet/                ← Wallet management
│   ├── bounty/                ← Bounty system
│   ├── evaluation/            ← Validation & AI
│   └── [other modules]
├── 📋 package.json            ← npm scripts & dependencies
├── 📄 tsconfig.json           ← TypeScript config
├── 📄 jest.config.js          ← Test configuration
└── 📄 docker-compose.yml      ← Container setup
```

---

## 🚀 Installation

### Method 1: Automated Setup (Recommended)
```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
python3 gui/setup.py
python3 gui/poidh_gui.py
```

### Method 2: Manual Installation
```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
npm install
pip install -r gui/requirements.txt
python3 gui/poidh_gui.py
```

### Method 3: Virtual Environment (Best Practice)
```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or venv\Scripts\activate # Windows
npm install
pip install -r gui/requirements.txt
python3 gui/poidh_gui.py
```

### Method 4: Standalone Executable
```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous/gui
./build.sh              # Linux/macOS
# or build.bat         # Windows
./dist/POIDH-Bot-GUI
```

### Method 5: Docker
```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
docker build -t poidh-bot -f Dockerfile.gui .
docker run -it poidh-bot python gui/cli.py bounty list
```

---

## 💻 Usage

### GUI Application
```bash
python3 gui/poidh_gui.py
```
4-tab interface: Wallet | Config | Bounty | Monitor

### Command-Line Interface
```bash
python3 gui/cli.py --help
python3 gui/cli.py wallet create
python3 gui/cli.py config show
python3 gui/cli.py bounty launch proveOutside
python3 gui/cli.py health
```

### TypeScript Agent
```bash
npm run agent proveOutside
npm run agent:tower
npm run agent monitor
```

### Verify Installation
```bash
bash gui/verify.sh           # Linux/macOS
# or gui\verify.bat         # Windows

python3 gui/cli.py health   # System check
```

---

## 🎯 Bounty Templates

6 production-ready bounties:

1. **🌳 Prove You're Outside** - EXIF + outdoor verification
2. **📝 Handwritten Date** - Handwriting recognition  
3. **🍽️ Show Your Meal** - Real food detection
4. **🗼 Object Tower** - Creative building (AI-judged)
5. **🌗 Shadow Photography** - Artistic shadows (AI-judged)
6. **🐾 Best Animal Photo** - Pet/wildlife quality (AI-judged)

Or create custom bounties with your own rules.

---

## 🔗 Supported Chains

| Chain | Native Currency | Status | Explorer |
|-------|-----------------|--------|----------|
| Base Mainnet (8453) | ETH | ✅ Active | [Basescan](https://basescan.org) |
| Arbitrum One (42161) | ETH | ✅ Active | [Arbiscan](https://arbiscan.io) |
| Degen (666666666) | DEGEN | ✅ Active | [Explorer](https://explorer.degen.tips) |
| + 5 others (disabled) | - | ⚠️ | - |

Switch chains in Config tab or via CLI:
```bash
python3 gui/cli.py config set CHAIN_ID 42161
```

---

## ⚙️ Configuration

All settings in `.env` file. Create from `.env.example` or via CLI:

```bash
# View config
python3 gui/cli.py config show

# Update setting
python3 gui/cli.py config set OPENAI_API_KEY sk-...
python3 gui/cli.py config set CHAIN_ID 8453
```

**Key Variables:**
- `CHAIN_ID` - Active blockchain (8453, 42161, 666666666, etc.)
- `BOT_PRIVATE_KEY` - Wallet private key (created by wallet create)
- `OPENAI_API_KEY` - For AI-judged bounties
- `POLLING_INTERVAL` - Check frequency (seconds)
- `MAX_GAS_PRICE_GWEI` - Gas price limit

---

## 🔐 Security

✅ **Best Practices:**
- Private keys stored locally in `.env` only
- Never committed to Git (use `.gitignore`)
- API keys masked in output
- Secure file permissions: `chmod 600 .env`
- Regular key rotation recommended

---

## 🧪 Testing

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run typecheck        # Type checking
npm run lint             # Linting
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **README_ENTERPRISE.md** | ⭐ **Complete guide** (START HERE) |
| gui/QUICKSTART.md | 5-minute quick start |
| gui/INSTALL.md | Detailed installation |
| gui/README.md | GUI/CLI feature reference |
| gui/DEPLOYMENT.md | Production deployment |
| gui/FEATURES.md | Feature matrix |
| GUI.md | Package overview |
| DEVELOPMENT.md | Development summary |

---

## 🐛 Troubleshooting

**GUI won't start?**
```bash
python3 gui/cli.py health
```

**Setup fails?**
```bash
python3 gui/setup.py  # Run again
```

**No balance?**
1. Check RPC URL in Config tab
2. Verify correct chain selected
3. Click "Refresh Balance"

**Bounty won't launch?**
```bash
npm run build
npm test
```

See `README_ENTERPRISE.md#troubleshooting` for complete solutions.

---

## 📊 Statistics

- **Source Code:** 50 KB (Python) + 100+ KB (TypeScript)
- **Documentation:** 2,100+ lines across 8 guides
- **Supported Chains:** 8 EVM chains
- **Bounty Templates:** 6 production-ready
- **CLI Commands:** 15+ operations
- **Test Coverage:** 143+ passing tests
- **Setup Time:** 2-5 minutes
- **Build Time:** 2-3 minutes

---

## 🎯 Next Steps

1. **Read** → [README_ENTERPRISE.md](./README_ENTERPRISE.md) (comprehensive)
2. **Setup** → `python3 gui/setup.py` (2 minutes)
3. **Launch** → `python3 gui/poidh_gui.py` (immediate)
4. **Create** → Generate wallet → Deploy bounty!

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and open Pull Request

---

## 📞 Support

- **Quick Help:** `python3 gui/cli.py --help`
- **Health Check:** `python3 gui/cli.py health`
- **Issues:** https://github.com/drdeek/poidh-autonomous/issues
- **Email:** [@drdeek](https://github.com/drdeek)

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

---

## Version

- **Current:** 2.0.0
- **Status:** ✅ Production Ready
- **Release:** February 2024

---

**Get started:** `python3 gui/setup.py && python3 gui/poidh_gui.py` 🚀

**Full docs:** [README_ENTERPRISE.md](./README_ENTERPRISE.md)
