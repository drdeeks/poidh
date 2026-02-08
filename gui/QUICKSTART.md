# POIDH GUI - 5-Minute Quick Start

Get the POIDH bounty bot GUI running in 5 minutes.

## 1. Install Prerequisites (2 minutes)

Check you have these installed:

```bash
node --version    # Need 18+
npm --version     # Need 9+
python3 --version # Need 3.8+
git --version     # Need 2.x+
```

If any are missing, download from:
- **Node.js**: https://nodejs.org/ (choose LTS)
- **Python**: https://www.python.org/downloads/ (choose 3.10+)
- **Git**: https://git-scm.com/

## 2. Clone & Setup (2 minutes)

```bash
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
python3 gui/setup.py
```

Done! You should see:
```
✅ Setup complete! You can now run:
   python gui/poidh_gui.py
   python gui/cli.py --help
```

## 3. Launch (1 minute)

### Option A: Graphical Interface (Easiest)
```bash
python3 gui/poidh_gui.py
```

**First time? Do this in the GUI:**
1. Click **Wallet tab** → "Generate New Wallet"
2. Click **Config tab** → Select chain → "Save Configuration"
3. Click **Create Bounty tab** → Select template → "Launch Bounty"
4. Watch the **Monitor tab** for real-time activity

### Option B: Command Line
```bash
# Create wallet
python3 gui/cli.py wallet create

# Launch a bounty
python3 gui/cli.py bounty launch proveOutside

# Monitor
python3 gui/cli.py audit show
```

## Common Tasks

### Check Balance
```bash
python3 gui/cli.py wallet balance
```

### Change Network
```bash
# GUI: Config tab → Select different chain
# CLI:
python3 gui/cli.py config set CHAIN_ID 42161  # Arbitrum
python3 gui/cli.py config set CHAIN_ID 8453   # Base
python3 gui/cli.py config set CHAIN_ID 666666666  # Degen
```

### Add API Key (for AI-judged bounties)
```bash
python3 gui/cli.py config set OPENAI_API_KEY sk-...
```

### List Available Bounties
```bash
python3 gui/cli.py bounty list
```

### Launch Different Bounty Types
```bash
python3 gui/cli.py bounty launch proveOutside      # Photo proof
python3 gui/cli.py bounty launch handwrittenDate   # Handwritten note
python3 gui/cli.py bounty launch mealPhoto         # Food photo
python3 gui/cli.py bounty launch objectTower       # Creative building
python3 gui/cli.py bounty launch shadowArt         # Shadow photography
python3 gui/cli.py bounty launch animalPhoto       # Pet/wildlife photo
```

### Custom Reward Amount
```bash
python3 gui/cli.py bounty launch proveOutside --reward 0.01
```

### See What's Running
```bash
python3 gui/cli.py health
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Setup fails | Run `python3 gui/setup.py` again |
| GUI won't start | Try CLI: `python3 gui/cli.py health` |
| No wallet | Run `python3 gui/cli.py wallet create` |
| Balance shows "--" | Click "Refresh" in Wallet tab, or check RPC URL in Config |
| Bounty won't launch | Check `npm run build` completes successfully |

## Next Steps

- **Full docs**: See `INSTALL.md` for detailed setup
- **Advanced usage**: See `README.md` in project root
- **Production deploy**: See `DEPLOYMENT.md`
- **CLI help**: `python3 gui/cli.py --help`

## Standalone Executable

Want to skip Python installation? Build a single executable:

```bash
cd gui
./build.sh          # Linux/macOS
# or
build.bat           # Windows

# Run from: gui/dist/POIDH-Bot-GUI
```

---

**That's it! You're ready to launch bounties.** 🚀

Questions? Check `README.md` or open a GitHub issue.
