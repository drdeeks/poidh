# POIDH Autonomous Bounty Bot

**A fully autonomous, multi-chain bounty system for real-world proof-of-autonomy tasks with integrated Python GUI and command-line tools.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Multi-Chain Support](#multi-chain-support)
- [Bounty Templates](#bounty-templates)
- [API Reference](#api-reference)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Overview

POIDH (Proof of Identity, Proof of Humanity) is a fully autonomous bounty bot that:

- **Creates bounties** on-chain (POIDH V3 smart contracts)
- **Monitors submissions** with real-time validation
- **Evaluates** using deterministic rules or GPT-4 Vision AI
- **Pays winners** automatically with transparent audit trails
- **Operates autonomously** with zero human intervention required

### Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Autonomous Operation** | Full lifecycle management without human intervention |
| **Multi-Chain** | Base, Arbitrum, Degen, and 5+ additional EVM chains |
| **Real-World Proofs** | Photo/video bounties requiring genuine physical actions |
| **AI Evaluation** | GPT-4 Vision assessment for creative bounties |
| **Instant Payouts** | Automatic ETH/DEGEN distribution to winners |
| **Audit Trail** | SHA-256 hash chain with 14+ event types |
| **Flexible Rewards** | Configurable amounts from 0.0001 ETH to unlimited |

---

## Quick Start

### Option 1: GUI (5 minutes, easiest)

```bash
# Setup (2 min)
python3 gui/setup.py

# Launch GUI (immediate)
python3 gui/poidh_gui.py
```

Then:
1. Click **Wallet** → "Generate New Wallet"
2. Click **Config** → Select chain → "Save Configuration"
3. Click **Create Bounty** → Select template → "Launch Bounty"
4. Watch **Monitor** tab for real-time updates

### Option 2: CLI (5 minutes, no window)

```bash
# Setup
python3 gui/setup.py

# Create wallet
python3 gui/cli.py wallet create

# Launch bounty
python3 gui/cli.py bounty launch proveOutside

# Check status
python3 gui/cli.py health
```

### Option 3: TypeScript Agent (advanced)

```bash
# Build
npm run build

# Create bounty
npm run agent proveOutside

# Monitor
npm run agent monitor
```

### Option 4: Docker (one command)

```bash
docker build -t poidh-bot -f Dockerfile.gui .
docker run -it poidh-bot python gui/cli.py bounty list
```

---

## Features

### 🏆 Bounty System

**6 Production-Ready Templates:**

| Template | Type | Duration | Reward | Validation |
|----------|------|----------|--------|-----------|
| 🌳 Prove You're Outside | First-Valid | 6 hours | 0.001 ETH | EXIF + outdoor check |
| 📝 Handwritten Date | First-Valid | 24 hours | 0.001 ETH | Handwriting recognition |
| 🍽️ Show Your Meal | First-Valid | 4 hours | 0.001 ETH | Real food detection |
| 🗼 Object Tower | AI-Judged | 48 hours | 0.001 ETH | Creativity scoring |
| 🌗 Shadow Photography | AI-Judged | 72 hours | 0.001 ETH | Artistic evaluation |
| 🐾 Animal Photo | AI-Judged | 48 hours | 0.001 ETH | Quality scoring |

**Selection Modes:**
- **FIRST_VALID**: First correct submission wins immediately
- **AI_JUDGED**: All submissions evaluated after deadline, best wins
- **COMMUNITY_VOTE**: Community-driven selection (extensible)

### 🔧 Wallet Management

- Generate new wallets with private key + address + mnemonic
- Import from existing private key
- Check balance across all supported chains
- Multi-chain support with correct currency display
- Secure storage in local .env file

### ⚙️ Configuration

| Setting | Default | Range | Purpose |
|---------|---------|-------|---------|
| CHAIN_ID | 8453 | Various | Active blockchain |
| POLLING_INTERVAL | 30 | 5-300 | Check frequency (seconds) |
| MAX_GAS_PRICE_GWEI | 50 | 1-500 | Maximum gas threshold |
| AUTO_APPROVE_GAS | true | true/false | Auto-approve transactions |
| LOG_LEVEL | info | debug/info/warn/error | Logging verbosity |

### 📊 Real-Time Monitoring

- Live submission tracking
- Instant validation feedback
- AI evaluation progress (for judged bounties)
- Color-coded audit trail
- Winner announcement with rationale
- Transaction confirmation tracking

### 🔐 Validation System

**8 Deterministic Checks (50/100 pass threshold):**

1. **Proof Content** (20 points) - Valid media present
2. **Media URL** (20 points) - Accessible file URL
3. **Location** (30 points) - GPS coordinates within radius
4. **Time Window** (20 points) - Action occurred during allowed period
5. **Keywords** (10 points) - Required text present
6. **EXIF Data** (15 points) - Timestamp + device metadata
7. **Photo Freshness** (20 points) - Maximum age validation
8. **Screenshot Detection** (15 points) - Real photo vs screenshot

**AI Validation (GPT-4 Vision):**
- Handwriting recognition
- Real food detection
- AI-generated image detection
- Creativity scoring (0-100)
- Authenticity assessment
- Custom evaluation prompts

### 💰 Payout System

- Automatic ETH/DEGEN distribution
- Multi-chain transaction support
- Gas fee estimation
- Winner address validation
- Transaction hash logging
- Receipt confirmation

---

## Installation

### Prerequisites

**Required Software:**
- Node.js 18+ ([download](https://nodejs.org/))
- Python 3.8+ ([download](https://www.python.org/))
- npm 9+ (included with Node.js)
- Git 2.x+ ([download](https://git-scm.com/))

**Verify Installation:**
```bash
node --version    # v18.x.x or higher
npm --version     # 9.x.x or higher
python3 --version # 3.8+ or higher
```

### Method 1: Automated Setup (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Run automated setup
python3 gui/setup.py

# 3. Verify (should see all ✅)
bash gui/verify.sh

# 4. Start
python3 gui/poidh_gui.py
```

**Duration:** 5 minutes | **Difficulty:** Beginner

### Method 2: Manual Installation

```bash
# 1. Clone and install Node dependencies
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
npm install

# 2. Install Python dependencies
pip install -r gui/requirements.txt

# 3. Run
python3 gui/poidh_gui.py
```

**Duration:** 5 minutes | **Difficulty:** Beginner

### Method 3: Virtual Environment (Best Practice)

```bash
# 1. Clone
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Create isolated Python environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# 3. Install dependencies
npm install
pip install -r gui/requirements.txt

# 4. Run
python3 gui/poidh_gui.py

# 5. Deactivate when done
deactivate
```

**Duration:** 5 minutes | **Difficulty:** Intermediate | **Benefit:** Isolated environment

### Method 4: Standalone Executable (No Python Installation)

```bash
# 1. Clone
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous

# 2. Build standalone
cd gui
./build.sh              # Linux/macOS
# or
build.bat              # Windows

# 3. Run (no Python needed)
./dist/POIDH-Bot-GUI   # Linux/macOS
# or
dist\POIDH-Bot-GUI.exe # Windows
```

**Duration:** 5 minutes | **Difficulty:** Beginner | **Benefit:** No Python needed

### Method 5: Docker Container

```bash
# 1. Build image
docker build -t poidh-bot -f Dockerfile.gui .

# 2. Run CLI (no GUI in Docker)
docker run -it poidh-bot python gui/cli.py health

# 3. Or run with X11 forwarding for GUI
docker run -it -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix poidh-bot
```

**Duration:** 10 minutes | **Difficulty:** Advanced | **Benefit:** Container isolation

---

## Usage

### GUI Application

**Start:**
```bash
python3 gui/poidh_gui.py
```

**Wallet Tab (🔐)**
- **Generate New Wallet** → Creates private key + address + mnemonic
- **Import from Private Key** → Paste 0x... format key
- **Refresh Balance** → Updates current balance
- Shows: Address, Balance, Network

**Configuration Tab (⚙️)**
- **Chain Selection** → Base, Arbitrum, Degen, etc.
- **RPC URL** → Custom endpoint or use defaults
- **API Keys** → OpenAI (for AI bounties), Alchemy, Infura
- **Agent Settings** → Polling interval, gas price, auto-approve
- **Save Configuration** → Write to .env

**Create Bounty Tab (🎯)**
- **Select Template** → Choose from 6 templates
- **Custom Bounty** → Build your own with custom name/desc
- **Reward Override** → Set custom ETH amount
- **Launch Bounty** → Deploy on-chain
- Real-time logs of creation process

**Monitor Tab (📊)**
- **Agent Status** → 🟢 Online / 🔴 Offline
- **Audit Trail** → Last 20 events
- **Color Coding** → Red=ERROR, Green=SUCCESS
- **Auto-Refresh** → Every 2 seconds
- **Clear** → Reset view

### CLI Application

**Quick Help:**
```bash
python3 gui/cli.py --help
```

**Wallet Commands:**
```bash
# Create new wallet
python3 gui/cli.py wallet create

# Check balance
python3 gui/cli.py wallet balance
```

**Configuration Commands:**
```bash
# Show current config
python3 gui/cli.py config show

# Update setting
python3 gui/cli.py config set CHAIN_ID 8453
python3 gui/cli.py config set OPENAI_API_KEY sk-...
python3 gui/cli.py config set MAX_GAS_PRICE_GWEI 75
```

**Bounty Commands:**
```bash
# List available templates
python3 gui/cli.py bounty list

# Launch bounty
python3 gui/cli.py bounty launch proveOutside

# Launch with custom reward
python3 gui/cli.py bounty launch proveOutside --reward 0.01

# Monitor active bounties
python3 gui/cli.py bounty monitor
```

**Audit Commands:**
```bash
# Show last 20 entries
python3 gui/cli.py audit show

# Show last 50 entries
python3 gui/cli.py audit show --limit 50
```

**System Commands:**
```bash
# System health check
python3 gui/cli.py health
```

### TypeScript Agent

**Quick Start:**
```bash
# List bounties
npm run agent:list

# Launch bounty
npm run agent:outside

# Or with custom chain
npm run agent proveOutside -- --chain arbitrum

# Monitor
npm run agent monitor
```

**Available Commands:**
```bash
npm run agent:outside          # Prove you're outside
npm run agent:handwritten      # Handwritten date
npm run agent:meal             # Meal photo
npm run agent:tower            # Object tower
npm run agent:shadow           # Shadow art
npm run agent:animal           # Animal photo
npm run agent:list             # List all bounties
npm run agent:monitor          # Monitor active
```

---

## Configuration

### Environment Variables (.env)

All configuration stored in `.env` file in project root. Create from `.env.example` or generate via CLI.

**Blockchain Configuration**

```bash
# Active chain (required)
CHAIN_ID=8453

# Enabled chains
SUPPORTED_CHAINS=8453,42161,666666666

# RPC endpoints (optional, defaults used if empty)
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
DEGEN_RPC_URL=https://rpc.degen.tips
```

**Wallet Configuration**

```bash
# Private key (created by 'wallet create' command)
BOT_PRIVATE_KEY=0x1234567890abcdef...
```

**API Keys**

```bash
# OpenAI API key (required for AI-judged bounties)
OPENAI_API_KEY=sk-...

# Optional RPC enhancements
ALCHEMY_KEY=...
INFURA_KEY=...
```

**Agent Settings**

```bash
# Submission polling frequency (seconds)
POLLING_INTERVAL=30

# Maximum acceptable gas price (Gwei)
MAX_GAS_PRICE_GWEI=50

# Auto-approve gas fees without prompt
AUTO_APPROVE_GAS=true

# Logging level
LOG_LEVEL=info
```

**Smart Contracts**

```bash
# POIDH contract address (auto-set per chain)
POIDH_CONTRACT_ADDRESS=0x5555Fa...

# Contract deployed block (for indexing)
CONTRACT_DEPLOYMENT_BLOCK=0
```

### Multi-Environment Setup

**Production (.env.production)**
```bash
CHAIN_ID=8453
LOG_LEVEL=warn
MAX_GAS_PRICE_GWEI=100
```

**Staging (.env.staging)**
```bash
CHAIN_ID=84532
LOG_LEVEL=info
MAX_GAS_PRICE_GWEI=50
```

**Development (.env.development)**
```bash
CHAIN_ID=84532
LOG_LEVEL=debug
MAX_GAS_PRICE_GWEI=25
```

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│              POIDH Autonomous Bot                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PyQt5 GUI   │  │     CLI      │  │  TypeScript  │  │
│  │  (Desktop)   │  │  (Terminal)  │  │   Agent      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                ┌───────────▼──────────────┐             │
│                │  Configuration Manager   │             │
│                │  (.env management)       │             │
│                └───────────┬──────────────┘             │
│                            │                             │
│         ┌──────────────────┼──────────────────┐         │
│         │                  │                  │         │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐ │
│  │   Wallet    │  │    Contract     │  │ Submission │ │
│  │  Manager    │  │   Interface     │  │ Validator  │ │
│  └──────┬──────┘  └────────┬────────┘  └─────┬──────┘ │
│         │                  │                  │        │
│         └──────────────────┼──────────────────┘        │
│                            │                            │
│                ┌───────────▼──────────────┐            │
│                │  Evaluation Engine       │            │
│                │  (Deterministic + AI)    │            │
│                └───────────┬──────────────┘            │
│                            │                            │
│                ┌───────────▼──────────────┐            │
│                │    Audit Trail           │            │
│                │    (SHA-256 Chain)       │            │
│                └──────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐          ┌───▼────┐         ┌───▼────┐
    │  Base   │          │Arbitrum│         │ Degen  │
    │ (8453)  │          │(42161) │         │(666...)│
    └─────────┘          └────────┘         └────────┘
        │                   │                   │
    [POIDH Smart Contracts on EVM chains]
```

### Data Flow

```
1. User Input
   ↓
2. Configuration Management (.env)
   ↓
3. Wallet Operations (ethers.js)
   ↓
4. Contract Interaction (POIDH V3)
   ↓
5. Submission Monitoring (polling/events)
   ↓
6. Validation (deterministic checks)
   ↓
7. AI Evaluation (GPT-4 Vision) [optional]
   ↓
8. Winner Selection
   ↓
9. Payout Execution
   ↓
10. Audit Trail (SHA-256 chain)
    ↓
11. Display/Notification
```

### Component Responsibilities

| Component | Responsibility |
|-----------|-----------------|
| **GUI** | User-friendly interface for all operations |
| **CLI** | Terminal-based access, automation-friendly |
| **Wallet Manager** | Private key management, balance checking |
| **Contract Interface** | On-chain interaction via ethers.js |
| **Submission Validator** | 8-check deterministic validation |
| **Evaluation Engine** | GPT-4 Vision AI assessment |
| **Audit Trail** | Immutable event logging (SHA-256) |
| **Configuration** | Environment-based settings management |

---

## Multi-Chain Support

### Supported Chains

| Chain | ID | Native Currency | Status | Contract Address |
|-------|-----|-----------------|--------|------------------|
| **Base Mainnet** | 8453 | ETH | ✅ Active | 0x5555Fa78... |
| **Base Sepolia** | 84532 | ETH | ✅ Active | 0x (TBD) |
| **Arbitrum One** | 42161 | ETH | ✅ Active | 0x5555Fa78... |
| **Arbitrum Sepolia** | 421614 | ETH | ✅ Active | 0x (TBD) |
| **Degen** | 666666666 | DEGEN | ✅ Active | 0x18E5585c... |
| Ethereum | 1 | ETH | ⚠️ Disabled | 0x (TBD) |
| Sepolia | 11155111 | ETH | ⚠️ Disabled | 0x (TBD) |
| Polygon | 137 | MATIC | ⚠️ Disabled | 0x (TBD) |
| Optimism | 10 | ETH | ⚠️ Disabled | 0x (TBD) |

### Chain Configuration

**Select Chain:**
```bash
# Via CLI
python3 gui/cli.py config set CHAIN_ID 8453

# Via GUI
Config Tab → Chain Selection → Base Mainnet → Save

# Via environment
export CHAIN_ID=42161  # Arbitrum
```

**Configure RPC:**
```bash
# Use default (recommended)
# No action needed, auto-uses chain defaults

# Or set custom RPC
python3 gui/cli.py config set BASE_RPC_URL https://custom-rpc.example.com
```

**Verify Chain:**
```bash
# Check active chain
python3 gui/cli.py config show | grep CHAIN_ID

# Test RPC connection
python3 gui/cli.py health
```

### RPC Provider Hierarchy

1. Custom RPC URL (if set in .env)
2. Alchemy (if ALCHEMY_KEY set)
3. Infura (if INFURA_KEY set)
4. Public RPC endpoints (fallback)

---

## Bounty Templates

### Template Reference

#### 🌳 Prove You're Outside

**Type:** FIRST_VALID (first valid wins)  
**Duration:** 6 hours  
**Reward:** 0.001 ETH  

**Requirements:**
- Photo showing you outdoors
- Visible sky or horizon
- Ground/surface visible
- Valid EXIF timestamp (last 15 min)
- No screenshots, no AI-generated

**Validation:**
- EXIF timestamp check ✓
- Photo freshness (15 min) ✓
- Outdoor verification (AI) ✓
- Screenshot detection ✓
- AI-generated detection ✓

#### 📝 Handwritten Date Challenge

**Type:** FIRST_VALID  
**Duration:** 24 hours  
**Reward:** 0.001 ETH  

**Requirements:**
- Handwritten note with today's date
- Word "POIDH" clearly visible
- Simple star drawing (⭐)
- Clear, readable photo
- No digital editing

**Validation:**
- Handwriting authenticity ✓
- Date verification (OCR) ✓
- Required text detection ✓
- EXIF timestamp ✓
- Editing detection ✓

#### 🍽️ Show Your Current Meal

**Type:** FIRST_VALID  
**Duration:** 4 hours  
**Reward:** 0.001 ETH  

**Requirements:**
- Real food on plate/bowl
- Photo within 30 minutes
- Genuine meal setting
- Food clearly visible
- No stock images

**Validation:**
- Real food detection ✓
- Photo freshness (30 min) ✓
- Authenticity verification ✓
- Stock image detection ✓

#### 🗼 Creative Object Tower

**Type:** AI_JUDGED  
**Duration:** 48 hours  
**Reward:** 0.001 ETH  

**Scoring Rubric:**
- Creativity (35%) - Unique and unexpected tower design
- Engineering (25%) - Well-balanced, structurally interesting
- Presentation (25%) - Photo quality and composition
- Complexity (15%) - 5+ objects, variety

**Requirements:**
- Minimum 5 different objects
- Freestanding (not held up)
- Real physical objects
- Full tower visible in photo
- No CGI or digital editing

#### 🌗 Creative Shadow Photography

**Type:** AI_JUDGED  
**Duration:** 72 hours  
**Reward:** 0.001 ETH  

**Scoring Rubric:**
- Creativity (40%) - Originality and artistic vision
- Technical (30%) - Composition, lighting, quality
- Concept (30%) - Interesting idea or story

**Requirements:**
- Shadows as prominent element
- Real photo (not digitally added)
- Minimal editing beyond basic adjustments
- Original work for this bounty

#### 🐾 Best Animal Photo

**Type:** AI_JUDGED  
**Duration:** 48 hours  
**Reward:** 0.001 ETH  

**Scoring Rubric:**
- Photo Quality (30%) - Clear, in focus, well-composed
- Subject (30%) - Real, interesting animal
- Creativity (25%) - Unique angle or moment
- Appeal (15%) - Overall charm and interest

**Requirements:**
- REAL animal (pet, wildlife, farm)
- Original photo for this bounty
- Animal clearly visible
- No cruelty or distressing images

### Custom Bounty Creation

**Via CLI:**
```bash
npm run agent create-custom -- \
  --name "Your Bounty Title" \
  --description "Your description" \
  --reward 0.01 \
  --hours 24 \
  --chain 8453
```

**Via Code:**
```typescript
import { createRealWorldBounty } from './bounty/configs/production-bounties';

const bounty = createRealWorldBounty({
  name: 'Your Bounty Name',
  description: 'Your description',
  requirements: 'Your requirements',
  rewardEth: '0.01',
  hoursUntilDeadline: 24,
  selectionMode: SelectionMode.FIRST_VALID,
  aiJudgingPrompt: 'Your AI prompt',
});
```

---

## API Reference

### CLI API

```bash
# Wallet
python3 gui/cli.py wallet create
python3 gui/cli.py wallet balance

# Config
python3 gui/cli.py config show
python3 gui/cli.py config set KEY VALUE

# Bounty
python3 gui/cli.py bounty list
python3 gui/cli.py bounty launch TEMPLATE [--reward AMOUNT]
python3 gui/cli.py bounty monitor

# Audit
python3 gui/cli.py audit show [--limit N]

# System
python3 gui/cli.py health
```

### Environment Variables

```bash
# Core
CHAIN_ID                    # Active chain ID
BOT_PRIVATE_KEY            # Wallet private key

# RPC Configuration
BASE_RPC_URL               # Custom Base RPC
ARBITRUM_RPC_URL           # Custom Arbitrum RPC
DEGEN_RPC_URL              # Custom Degen RPC
ALCHEMY_KEY                # Alchemy API key
INFURA_KEY                 # Infura API key

# OpenAI
OPENAI_API_KEY             # For AI bounty evaluation
OPENAI_VISION_MODEL        # Model to use (default: gpt-4o)

# Agent Settings
POLLING_INTERVAL           # Seconds between checks (default: 30)
MAX_GAS_PRICE_GWEI         # Gas limit (default: 50)
AUTO_APPROVE_GAS           # Auto-approve (default: true)
LOG_LEVEL                  # info, debug, warn, error

# Contract
POIDH_CONTRACT_ADDRESS     # Contract address (auto-set)
```

### npm Scripts

```json
{
  "build": "tsc",
  "start": "node dist/agent.js",
  "dev": "npx ts-node src/index.ts",
  "agent": "npx ts-node src/agent.ts",
  "agent:outside": "npx ts-node src/agent.ts proveOutside",
  "agent:handwritten": "npx ts-node src/agent.ts handwrittenDate",
  "agent:meal": "npx ts-node src/agent.ts mealPhoto",
  "agent:tower": "npx ts-node src/agent.ts objectTower",
  "agent:shadow": "npx ts-node src/agent.ts shadowArt",
  "agent:animal": "npx ts-node src/agent.ts animalPhoto",
  "agent:list": "npx ts-node src/agent.ts list",
  "agent:monitor": "npx ts-node src/agent.ts monitor",
  "gui": "python gui/poidh_gui.py",
  "gui:build": "cd gui && bash build.sh",
  "cli": "python gui/cli.py",
  "test": "jest",
  "test:watch": "jest --watch",
  "typecheck": "tsc --noEmit"
}
```

---

## Security

### Private Key Management

✅ **Best Practices:**

```bash
# 1. Generate wallet
python3 gui/cli.py wallet create

# 2. Backup private key SECURELY
# - Store offline in secure location
# - Use password manager
# - Never commit to version control

# 3. Restrict .env permissions (Linux/macOS)
chmod 600 .env

# 4. For production, use environment variables
export BOT_PRIVATE_KEY="0x..."
export OPENAI_API_KEY="sk-..."
```

### File Security

```bash
# Add to .gitignore (always)
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "*.pem" >> .gitignore

# Verify not tracked
git status
```

### API Key Management

```bash
# Rotate keys regularly
python3 gui/cli.py config set OPENAI_API_KEY sk-new-key-here

# Use environment-specific keys
export OPENAI_API_KEY_PROD="sk-prod-..."
export OPENAI_API_KEY_DEV="sk-dev-..."
```

### Network Security

- ✅ Uses HTTPS for all API calls
- ✅ RPC endpoints over HTTPS
- ✅ No sensitive data in URLs
- ✅ Private keys never logged
- ✅ API keys masked in output

### Smart Contract Security

- ✅ Audited POIDH V3 contract
- ✅ Multi-sig governance
- ✅ Time-locked functions
- ✅ Emergency pause mechanism

---

## Troubleshooting

### Installation Issues

**Problem:** `externally-managed-environment` error

**Solution:**
```bash
# Option 1: Use --user flag
pip install -r gui/requirements.txt --user

# Option 2: Use --break-system-packages (Ubuntu 23.10+)
pip install -r gui/requirements.txt --break-system-packages

# Option 3: Use virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r gui/requirements.txt
```

**Problem:** Python 3 command not found

**Solution:**
```bash
# Check installation
which python3

# Install (macOS)
brew install python3

# Install (Windows)
# Download from https://www.python.org/downloads/

# Install (Linux Ubuntu)
sudo apt-get install python3 python3-pip
```

### Runtime Issues

**Problem:** GUI won't start

**Solution:**
```bash
# 1. Diagnose
python3 gui/cli.py health

# 2. Check PyQt5
python3 -c "from PyQt5.QtWidgets import QApplication; print('OK')"

# 3. Try CLI instead
python3 gui/cli.py --help
```

**Problem:** RPC connection failed

**Solution:**
```bash
# 1. Check RPC URL
python3 gui/cli.py config show | grep RPC_URL

# 2. Test connection
python3 gui/cli.py health

# 3. Update RPC
python3 gui/cli.py config set BASE_RPC_URL https://new-rpc.com

# 4. Verify
curl https://mainnet.base.org -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Problem:** Bounty won't launch

**Solution:**
```bash
# 1. Check wallet
python3 gui/cli.py wallet balance

# 2. Verify chain
python3 gui/cli.py config show | grep CHAIN_ID

# 3. Rebuild TypeScript
npm run build

# 4. Check logs
tail -f logs/app.log
```

**Problem:** No balance showing

**Solution:**
```bash
# 1. Check RPC connection
python3 gui/cli.py health

# 2. Verify chain correct
python3 gui/cli.py config show

# 3. Check wallet address
grep BOT_PRIVATE_KEY .env

# 4. Manually test RPC
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xaddress","latest"],"id":1}'
```

### Performance Issues

**Problem:** Slow submission processing

**Solution:**
```bash
# 1. Increase polling interval
python3 gui/cli.py config set POLLING_INTERVAL 60

# 2. Check system resources
top  # or Task Manager on Windows

# 3. Check logs
tail -f logs/audit-trail.txt
```

**Problem:** High gas fees

**Solution:**
```bash
# 1. Lower max gas threshold
python3 gui/cli.py config set MAX_GAS_PRICE_GWEI 30

# 2. Check current gas prices
# Via: https://gasprice.poa.network/

# 3. Consider alternative RPC provider
python3 gui/cli.py config set BASE_RPC_URL https://alchemy-rpc.com
```

### Debugging

**Enable Debug Logging:**
```bash
python3 gui/cli.py config set LOG_LEVEL debug

# Run with debug output
npm run dev

# Monitor logs
tail -f logs/app.log
```

**View Audit Trail:**
```bash
python3 gui/cli.py audit show --limit 100

# Or inspect file
cat logs/audit-trail.json | jq .
```

**Network Diagnostics:**
```bash
# Test RPC
python3 -c "
import requests
resp = requests.post(
    'https://mainnet.base.org',
    json={'jsonrpc':'2.0','method':'eth_chainId','params':[],'id':1}
)
print(resp.json())
"
```

---

## Support

### Getting Help

**Quick Answers:**
```bash
# Command help
python3 gui/cli.py --help

# System health
python3 gui/cli.py health

# View config
python3 gui/cli.py config show
```

**Documentation:**
- 📖 Quick Start: `gui/QUICKSTART.md`
- 📚 Installation: `gui/INSTALL.md`
- 🚢 Deployment: `gui/DEPLOYMENT.md`
- ✨ Features: `gui/FEATURES.md`

**Community:**
- 🐛 Report Issues: https://github.com/drdeek/poidh-autonomous/issues
- 💬 Discussions: https://github.com/drdeek/poidh-autonomous/discussions
- 🤝 Contribute: See CONTRIBUTING.md

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10, macOS 10.13, Ubuntu 18.04 | Windows 11, macOS 12+, Ubuntu 22.04 |
| **RAM** | 512 MB | 2 GB |
| **Disk** | 1 GB | 2 GB |
| **Python** | 3.8 | 3.10+ |
| **Node.js** | 18 | 20+ |
| **Network** | 1 Mbps | 10+ Mbps |

### Performance Metrics

| Metric | Value |
|--------|-------|
| Wallet Creation | <5 seconds |
| Bounty Launch | 10-30 seconds |
| Submission Processing | <2 seconds |
| Balance Check | <5 seconds |
| AI Evaluation | 30-60 seconds (GPT-4 Vision) |

### Version Information

- **Current Version:** 2.0.0
- **Release Date:** February 2024
- **Status:** ✅ Production Ready
- **License:** MIT

### Changelog

**v2.0.0 (Current)**
- ✨ PyQt5 GUI interface
- ✨ CLI tools with full feature access
- ✨ PyInstaller standalone packaging
- ✨ Comprehensive documentation
- ✨ Multi-chain support (8 chains)
- 🔧 Improved wallet management
- 🔧 Enhanced error handling

**v1.0.0**
- Initial autonomous agent release
- TypeScript-based implementation
- 6 production bounty templates
- Audit trail with hash chain

---

## License

MIT License - See [LICENSE](./LICENSE) file

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Acknowledgments

- **POIDH Smart Contract** - Powered by POIDH V3
- **OpenAI** - GPT-4 Vision for AI evaluation
- **ethers.js** - Web3 library
- **PyQt5** - GUI framework
- **Community** - Testing, feedback, and contributions

---

## Contact

**Maintainer:** [@drdeek](https://github.com/drdeek)

**Project:** https://github.com/drdeek/poidh-autonomous

**Report Issues:** https://github.com/drdeek/poidh-autonomous/issues

---

## Quick Reference

```bash
# Setup
python3 gui/setup.py

# GUI
python3 gui/poidh_gui.py

# CLI
python3 gui/cli.py bounty launch proveOutside

# TypeScript Agent
npm run agent proveOutside

# Health Check
python3 gui/cli.py health

# Build Standalone
cd gui && ./build.sh

# Verify Installation
bash gui/verify.sh

# View Config
python3 gui/cli.py config show

# Check Balance
python3 gui/cli.py wallet balance

# Monitor
python3 gui/cli.py audit show

# Help
python3 gui/cli.py --help
```

---

**Ready to launch bounties?** Start with: `python3 gui/setup.py && python3 gui/poidh_gui.py` 🚀
