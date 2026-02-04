# Autonomous Bounty Bot for POIDH

A fully autonomous agent that creates, monitors, evaluates, and pays out real-world proof bounties on [POIDH](https://poidh.xyz) with **zero human intervention**.

## Features

| Feature | Description |
|---------|-------------|
| **Autonomous Wallet** | Bot controls its own wallet and funds |
| **On-Chain Bounties** | Creates bounties on POIDH V3 (Base Mainnet) |
| **Real-World Proof** | Validates photos with EXIF, freshness, screenshot detection |
| **Two Selection Modes** | First-valid (instant) or AI-judged (GPT-4 Vision) |
| **Transparent Decisions** | Hash-chained audit trail with full rationale |
| **Automatic Payout** | Winners receive ETH immediately |

## How It Works

```
CREATE → MONITOR → EVALUATE → PAYOUT
Bot creates   Bot polls   Bot validates   Bot accepts winning
bounty with   blockchain   submissions     claim, ETH sent
ETH reward    for claims   autonomously    to winner
```

**→ See [docs/BOT_LOGIC.md](docs/BOT_LOGIC.md) for scoring system and selection logic**

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/drdeeks/poidh.git
cd Poidh-autonomous && npm install

# 2. Create bot wallet
npm run wallet:create

# 3. Configure .env
cp .env.example .env
# Add: BOT_PRIVATE_KEY, RPC_URL, OPENAI_API_KEY

# 4. Fund wallet with Base ETH, then run
npm run agent proveOutside
```

## Production Bounties

### First-Valid (instant winner)
| Command | Description |
|---------|-------------|
| `npm run agent:outside` | Prove you're outdoors |
| `npm run agent:handwritten` | Handwritten note with date |
| `npm run agent:meal` | Photo of current meal |

### AI-Judged (GPT-4 picks best)
| Command | Description |
|---------|-------------|
| `npm run agent:tower` | Object stacking contest |
| `npm run agent:shadow` | Creative shadow art |
| `npm run agent:animal` | Best pet/wildlife photo |

## Winner Selection

**FIRST_VALID** - First submission passing all checks wins:
1. Proof content exists → Media URL valid → EXIF data present
2. Photo freshness verified → Not a screenshot → Location (if required)
3. **Score ≥ 50/100** → Winner, payout triggered

**AI_JUDGED** - GPT-4 Vision picks best after deadline:
1. All valid submissions sent to GPT-4 Vision
2. Scored on creativity, quality, adherence to prompt
3. Highest score wins with detailed rationale

**→ Full scoring breakdown: [docs/BOT_LOGIC.md](docs/BOT_LOGIC.md)**

## Project Structure

```
src/
├── agent.ts              # Main orchestration
├── evaluation/
│   ├── validator.ts      # Scoring & validation
│   └── ai-judge.ts       # GPT-4 Vision
├── bounty/
│   ├── manager.ts        # Bounty lifecycle
│   └── monitor.ts        # Blockchain polling
├── contracts/poidh.ts    # POIDH V3 contract
└── utils/audit-trail.ts  # Cryptographic logging

docs/                     # Documentation
├── BOT_LOGIC.md          # Scoring & selection logic
├── CLOUD_QUICK_START.md  # Quick deployment
├── CLOUD_DEPLOYMENT.md   # Full deployment guides
└── SECURITY.md           # Security best practices

logs/                     # Runtime output (gitignored)
├── audit-trail.json      # Machine-readable audit
└── audit-trail.txt       # Human-readable audit

evidence/                 # Proof of completed bounties
```

## Configuration

```bash
# Required
BOT_PRIVATE_KEY=0x...     # Bot wallet private key
RPC_URL=https://mainnet.base.org
OPENAI_API_KEY=sk-...

# POIDH V3 Contract (defaults)
POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
CHAIN_ID=8453
```

## Commands

```bash
# Agent
npm run agent:list        # List bounty templates
npm run agent:outside     # Launch outdoor proof bounty
npm run agent monitor 17  # Monitor existing bounty #17

# Wallet
npm run wallet:create     # Generate new wallet
npm run wallet:balance    # Check balance

# Demo
npm run demo:simulate     # Simulation mode (no real tx)

# Build
npm run build             # Compile TypeScript
npm run test              # Run tests
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/BOT_LOGIC.md](docs/BOT_LOGIC.md) | Scoring system, winner selection, audit trail |
| [docs/CLOUD_QUICK_START.md](docs/CLOUD_QUICK_START.md) | Deploy to cloud in 5 minutes |
| [docs/CLOUD_DEPLOYMENT.md](docs/CLOUD_DEPLOYMENT.md) | AWS, DigitalOcean, Heroku, Railway guides |
| [docs/SECURITY.md](docs/SECURITY.md) | Key management, security best practices |
| [BOUNTY_SUBMISSION.md](BOUNTY_SUBMISSION.md) | Bounty challenge submission proof |

## Audit Trail

Every decision is logged with cryptographic proof:

```
[0042] 2026-01-28T10:30:15Z
       Action: WINNER_SELECTED
       Bounty: proveOutside-2026-01-28
       Winner: 0x49A2B6...
       Score: 85/100
       Checks: ✓ Proof ✓ EXIF ✓ Freshness ✓ Not Screenshot
       Entry Hash: 7a3f9c2d1e8b4a6f...
```

**Verification:**
- Each entry contains SHA-256 hash of itself + previous entry
- Transaction hashes verifiable on [BaseScan](https://basescan.org)
- Full audit in `logs/audit-trail.json` and `logs/audit-trail.txt`

## License

MIT License - See [LICENSE](LICENSE)

---

🤖 **100% autonomous after initialization - no human intervention required**
