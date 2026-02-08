# POIDH Autonomous Bounty Bot - GUI & CLI

Lightweight Python-based graphical interface and command-line tools for managing the POIDH autonomous bounty bot across all supported chains (Base, Arbitrum, Degen).

## Features

### 🖥️ GUI Application (PyQt5)
- **Wallet Management**: Create, import, and monitor wallet balance
- **Configuration Panel**: Set chain, RPC URL, API keys, and agent settings
- **Bounty Creator**: Launch any of 6 production bounty templates or create custom bounties
- **Real-time Monitoring**: Live audit trail with per-action color coding
- **Multi-chain Support**: Switch between Base, Arbitrum, Degen with proper currency handling

### 💻 CLI Tools
- Headless operation for servers and automation
- Wallet management (`create`, `balance`)
- Configuration (`show`, `set`)
- Bounty operations (`list`, `launch`, `monitor`)
- Audit trail inspection
- System health checks

### 📦 Standalone Packaging
- PyInstaller builds create single-file executables
- No Python installation required for end users
- Cross-platform: Windows (`.exe`), macOS (`.app`), Linux
- Includes all dependencies

## Installation

### From Source

```bash
# Install Python dependencies
pip install -r gui/requirements.txt

# Run GUI
python gui/poidh_gui.py

# Or run CLI
python gui/cli.py --help
```

### Build Standalone Executable

#### Linux/macOS
```bash
cd gui
chmod +x build.sh
./build.sh
```

Output: `gui/dist/POIDH-Bot-GUI`

#### Windows
```cmd
cd gui
build.bat
```

Output: `gui\dist\POIDH-Bot-GUI.exe`

## GUI Usage

### 1. Wallet Tab (🔐)

**Generate New Wallet:**
1. Click "Generate New Wallet"
2. Private key and address saved to `.env` automatically
3. Balance shown in ETH/DEGEN

**Import Existing Wallet:**
1. Click "Import from Private Key"
2. Paste your private key (0x + 64 hex chars)
3. Click "Import"

**Check Balance:**
- Displayed automatically on load
- Click "Refresh Balance" to update

### 2. Configuration Tab (⚙️)

**Chain Selection:**
- Select your target chain from dropdown
- Automatically updates `CHAIN_ID` in `.env`

**RPC Configuration:**
- Enter custom RPC URL (optional, uses defaults if blank)
- Supports Alchemy, Infura, public nodes, local RPCs

**API Keys:**
- OpenAI API key for AI-judged bounties (GPT-4 Vision)
- Alchemy key for premium RPC endpoints

**Agent Settings:**
- Polling interval (5-300 seconds)
- Max gas price threshold (Gwei)
- Auto-approve transactions toggle

**Save Configuration:**
- Click "Save Configuration" to write to `.env`

### 3. Create Bounty Tab (🎯)

**Template Selection:**
- Choose from 6 production bounties:
  - `proveOutside` - 🌳 Prove you're outdoors
  - `handwrittenDate` - 📝 Handwritten note with date
  - `mealPhoto` - 🍽️ Photo of current meal
  - `objectTower` - 🗼 Creative object stacking
  - `shadowArt` - 🌗 Creative shadow photography
  - `animalPhoto` - 🐾 Best animal photo

**Custom Bounty (Optional):**
- Name, description, reward amount, duration
- Overrides template if provided

**Reward Override:**
- Check "Use custom reward" to override template amount
- Set custom ETH/DEGEN amount

**Launch:**
- Click "Launch Bounty"
- Real-time output in log window
- Tracks submissions and evaluations

### 4. Monitor Tab (📊)

**Agent Status:**
- 🟢 Online: Connected to audit trail
- 🔴 Offline: No recent activity

**Audit Trail:**
- Real-time updates every 2 seconds
- Shows last 20 actions
- Color-coded: Red=ERROR, Green=SUCCESS
- Clear button to reset view

## CLI Usage

### Wallet Commands

```bash
# Create new wallet
python gui/cli.py wallet create

# Check balance
python gui/cli.py wallet balance
```

### Configuration Commands

```bash
# Show current configuration
python gui/cli.py config show

# Set configuration value
python gui/cli.py config set CHAIN_ID 8453
python gui/cli.py config set MAX_GAS_PRICE_GWEI 75
```

### Bounty Commands

```bash
# List available bounties
python gui/cli.py bounty list

# Launch a bounty
python gui/cli.py bounty launch proveOutside

# Launch with custom reward
python gui/cli.py bounty launch proveOutside --reward 0.01

# Monitor active bounties
python gui/cli.py bounty monitor
```

### Audit Commands

```bash
# Show last 20 audit entries
python gui/cli.py audit show

# Show last 50 entries
python gui/cli.py audit show --limit 50
```

### System Commands

```bash
# Check system health
python gui/cli.py health
```

## Architecture

### Components

```
gui/
├── poidh_gui.py          # Main PyQt5 GUI application
├── cli.py                # Command-line interface
├── requirements.txt      # Python dependencies
├── build.sh              # Linux/macOS build script
├── build.bat             # Windows build script
├── build.spec            # PyInstaller configuration
└── README.md             # This file
```

### Process Flow

```
┌─────────────────────────────────────────┐
│   POIDH GUI / CLI                       │
├─────────────────────────────────────────┤
│ • Wallet management (read .env)         │
│ • Configuration (write .env)            │
│ • Bounty launching (npm run agent)      │
│ • Log monitoring (read audit trail)     │
└────────────┬────────────────────────────┘
             │
             ├─→ Node.js Agent
             │   (npm run agent)
             │   • Creates bounties
             │   • Monitors submissions
             │   • Evaluates with AI
             │   • Pays winners
             │
             └─→ .env Configuration
                 • CHAIN_ID
                 • BOT_PRIVATE_KEY
                 • API Keys
                 • RPC URLs
                 • Agent settings
```

### Data Flow

1. **Wallet Creation**: Generate or import → Save to `.env`
2. **Configuration**: Set parameters → Write to `.env`
3. **Bounty Launch**: Select template → Run `npm run agent {type}`
4. **Monitoring**: Read `logs/audit-trail.json` → Display in real-time

## Requirements

### Minimum System Requirements

- **OS**: Windows 10+, macOS 10.13+, Linux (Ubuntu 18.04+)
- **Memory**: 256 MB RAM
- **Disk**: 200 MB (standalone executable)
- **Network**: Internet connection for RPC, OpenAI API

### Software (for source installation)

- Python 3.8+
- Node.js 18+
- npm 9+

## Configuration Reference

All configuration stored in `.env` file. Key variables:

```bash
# Chain Configuration
CHAIN_ID=8453                          # 8453=Base, 42161=Arbitrum, 666666666=Degen
SUPPORTED_CHAINS=8453,42161,666666666

# Wallet
BOT_PRIVATE_KEY=0x...                  # Private key (created by wallet create)

# RPC URLs (optional, uses defaults if not set)
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
DEGEN_RPC_URL=https://rpc.degen.tips

# API Keys
OPENAI_API_KEY=sk-...                  # For GPT-4 Vision evaluation
ALCHEMY_KEY=...                        # Premium RPC endpoint (optional)
INFURA_KEY=...                         # Alternative RPC (optional)

# Agent Settings
POLLING_INTERVAL=30                    # Seconds between checks
MAX_GAS_PRICE_GWEI=50                  # Maximum gas price threshold
AUTO_APPROVE_GAS=true                  # Auto-approve gas fees

# Advanced
LOG_LEVEL=info                         # debug, info, warn, error
DATABASE_URL=...                       # Optional persistence
```

## Troubleshooting

### Wallet Not Showing
- Check `.env` file exists in project root
- Verify `BOT_PRIVATE_KEY` is set
- Run "Refresh Balance" to reload

### Cannot Launch Bounty
- Check Node.js is installed: `node --version`
- Verify npm packages: `npm install` in project root
- Check RPC URL is valid in Configuration tab
- Ensure sufficient balance for reward + gas

### GUI Crashes on Startup
- Check PyQt5 is installed: `pip install -r gui/requirements.txt`
- Try CLI instead: `python gui/cli.py health`
- Check Python version: `python --version` (need 3.8+)

### Build Fails
- Ensure PyInstaller: `pip install pyinstaller==6.3.0`
- Check file permissions on build scripts
- On Windows, run Command Prompt as Administrator

### Real-time Logs Not Updating
- Verify bounty is actually running
- Check `logs/audit-trail.json` exists
- Monitor tab checks every 2 seconds
- Click "Clear" and wait for next log entry

## Development

### Adding New Bounty Template

Edit `gui/poidh_gui.py`, `BountyTab.init_ui()`:

```python
self.template_combo.addItem("Custom Name", "commandName")
```

### Creating Custom GUI Tab

Subclass `QWidget` in `poidh_gui.py`:

```python
class CustomTab(QWidget):
    def __init__(self, project_root):
        super().__init__()
        self.project_root = project_root
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        # Add widgets
        self.setLayout(layout)
```

Add to `POIDHGui.init_ui()`:

```python
self.custom_tab = CustomTab(self.project_root)
tabs.addTab(self.custom_tab, "Custom Tab")
```

## Security Considerations

⚠️ **Important**: This GUI stores sensitive data (private keys, API keys) in `.env` file.

**Best Practices:**
1. Never commit `.env` to version control
2. Restrict file permissions: `chmod 600 .env` (Linux/macOS)
3. Use environment-specific keys for production
4. Consider using hardware wallet for mainnet
5. Regular backups of private keys (secure location)

## Support & Documentation

- GUI: PyQt5 documentation at https://www.riverbankcomputing.com/static/Docs/PyQt5/
- CLI: Run `python gui/cli.py --help`
- Main bot: See `/README.md` in project root
- Wallet security: See `/SECURITY.md` (if exists)

## License

MIT - See LICENSE file in project root
