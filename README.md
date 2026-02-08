# POIDH Autonomous Bounty Bot

> **A fully autonomous bounty system that creates, monitors, validates, and pays out real-world proof bounties on EVM-compatible blockchains with zero human intervention.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Multi-Chain Support](#multi-chain-support)
- [Architecture](#architecture)
- [Commands Reference](#commands-reference)
- [Configuration Guide](#configuration-guide)
- [Creating Custom Bounties](#creating-custom-bounties)
- [Validation & Scoring System](#validation--scoring-system)
- [Audit Trail & Proof](#audit-trail--proof)
- [Live Dashboard](#live-dashboard)
- [Deployment Methods](#deployment-methods)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## Overview

The POIDH Autonomous Bounty Bot manages the entire lifecycle of bounties on EVM-compatible blockchains without human intervention. Once initialized, it:

1. **Creates** bounties on-chain via the POIDH V3 contract
2. **Monitors** for submissions via blockchain polling
3. **Validates** submissions using 8 deterministic checks and GPT-4 Vision AI
4. **Selects** winners based on selection mode (first-valid or AI-judged)
5. **Pays out** rewards automatically with on-chain proof

Every action is recorded in a cryptographic audit trail (SHA-256 hash chain) for tamper-evident proof of autonomous operation.

### Key Capabilities

- **100% Autonomous** - Creates bounties, validates submissions, selects winners, and pays rewards with zero human interaction after setup.
- **Multi-Chain** - Native support for Base, Arbitrum, and Degen. Any EVM chain can be added via configuration.
- **Real-Time Proof Validation** - 8 deterministic checks: EXIF verification, freshness detection, screenshot rejection, AI-generated image detection, location matching (optional), and more.
- **AI-Powered Judging** - GPT-4 Vision evaluates subjective creative bounties for authenticity and quality.
- **Enterprise Audit Trail** - Cryptographic SHA-256 hash chain with 14+ action types, all decisions logged with reasoning.
- **Live Dashboard** - WebSocket/SSE streaming web UI with per-action-type rendering, explorer links, and multi-chain awareness.
- **Flexible Scoring** - Configurable validation rules: GPS location, time windows, EXIF requirements, AI confidence thresholds, and custom rules.

---

## Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **Wallet** with some cryptocurrency (0.01+ ETH, 50+ DEGEN, etc.)
- **OpenAI API key** (optional, only for AI-judged bounties)

### Setup (5 minutes)

```bash
# 1. Clone & install
git clone https://github.com/drdeeks/poidh.git poidh-autonomous
cd poidh-autonomous
npm install

# 2. Create wallet
npm run wallet:create
# Save the private key shown

# 3. Set up environment
cp .env.example .env
# Edit .env and fill in: BOT_PRIVATE_KEY, RPC_URL, OPENAI_API_KEY (optional)

# 4. Check wallet balance
npm run wallet:balance
# Send a small amount to the address shown

# 5. Create your first bounty
npm run agent
# Follow the interactive prompts to select chain and bounty type

# 6. Monitor live activity (optional, in another terminal)
npm run server:stream
# Open http://localhost:3001 in your browser
```

### Verify It's Working

```bash
# Check wallet balance
npm run wallet:balance

# List all active bounties
npm run bounty:list

# View audit trail
tail -50 logs/audit-trail.txt

# Check live logs
tail -f logs/bot.log
```

---

## Multi-Chain Support

### Supported Chains

The bot operates on any EVM chain where POIDH V3 is deployed. Configuration is in [src/config/chains.ts](file:///home/drdeek/projects/Poidh-autonomous/src/config/chains.ts).

#### Active Chains (POIDH Deployed)

| Chain | Chain ID | Currency | Contract Address | RPC Endpoint |
|-------|----------|----------|------------------|--------------|
| **Base Mainnet** | 8453 | ETH | `0x5555Fa78...1719` | `https://mainnet.base.org` |
| **Arbitrum One** | 42161 | ETH | `0x5555Fa78...1719` | `https://arb1.arbitrum.io/rpc` |
| **Degen** | 666666666 | DEGEN | `0x18E5585c...243f` | `https://rpc.degen.tips` |

#### Future Chains (Framework Ready)

| Chain | Chain ID | Status |
|-------|----------|--------|
| Base Sepolia | 84532 | Contract TBD |
| Ethereum Mainnet | 1 | Awaiting deployment |
| Polygon | 137 | Awaiting deployment |
| Optimism | 10 | Awaiting deployment |

### Select Chain

```bash
# Interactive mode (shows menu)
npm run agent

# By name
npm run agent:outside --chain degen
npm run agent:meal --chain base
npm run agent:tower --chain arbitrum

# By chain ID
npm run agent:outside --chain 666666666
npm run agent:meal --chain 8453

# Supported aliases
--chain base / base-mainnet        → 8453
--chain arbitrum / arbitrum-one    → 42161
--chain degen                      → 666666666
--chain ethereum / eth             → 1
--chain polygon / matic            → 137
--chain optimism / op              → 10
```

### Configure Multiple Chains

```bash
# .env
CHAIN_ID=8453                              # Primary chain
SUPPORTED_CHAINS=8453,42161,666666666      # All active chains

# Optional: Override RPC endpoints per chain
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
DEGEN_RPC_URL=https://rpc.degen.tips
```

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CREATE     │ ──▶ │   MONITOR    │ ──▶ │  VALIDATE    │ ──▶ │   PAYOUT     │
│  (on-chain)  │     │  (30s poll)  │     │  (8 checks)  │     │   (auto)     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      │                   │                      │                    │
      ▼                   ▼                      ▼                    ▼
 BOUNTY_CREATED    SUBMISSION_           SUBMISSION_            PAYOUT_
 logged to         RECEIVED              VALIDATED /            CONFIRMED
 audit trail       logged                REJECTED               logged + TX hash
```

### Project Structure

```
src/
├── agent.ts                          # Main orchestration + CLI
├── index.ts                          # Entry point
├── bounty/
│   ├── manager.ts                    # Lifecycle management
│   ├── monitor.ts                    # Submission polling
│   ├── types.ts                      # Interfaces (SelectionMode, BountyStatus, etc.)
│   ├── templates.ts                  # Bounty template helpers
│   └── configs/
│       └── production-bounties.ts    # Pre-built bounty templates
├── evaluation/
│   ├── index.ts                      # Evaluation coordinator
│   ├── validator.ts                  # 8 deterministic validation checks
│   └── ai-judge.ts                   # GPT-4 Vision integration
├── contracts/
│   ├── poidh.ts                      # POIDH V3 contract interface
│   ├── multi-chain.ts                # Multi-chain contract manager
│   ├── mock-poidh.ts                 # Mock contract for testing
│   └── abis.ts                       # Contract ABIs
├── wallet/
│   ├── index.ts                      # Wallet operations
│   └── multi-chain.ts                # Multi-chain wallet manager
├── config/
│   ├── index.ts                      # Config loader
│   └── chains.ts                     # Chain registry (IDs, RPCs, explorers, contracts)
├── utils/
│   ├── audit-trail.ts               # Cryptographic audit trail (SHA-256 hash chain)
│   ├── logger.ts                    # Structured logging (winston)
│   ├── uri-fetcher.ts               # IPFS/HTTP content fetching + 4-strategy fallback
│   ├── health.ts                    # System health monitoring
│   ├── chain-selector.ts            # Interactive chain selection CLI
│   ├── errors.ts                    # Custom error types
│   └── fallback.ts                  # Graceful shutdown handler
├── server/
│   └── streaming-server.ts          # Express + WebSocket + SSE dashboard
├── scripts/                          # CLI utilities
├── demos/                            # Demo/simulation scripts
└── examples/                         # Example configurations

web/
├── index.html                        # Live dashboard (single-page, no build)
logs/
├── bot.log                           # Main application logs
├── error.log                         # Error tracking
├── audit-trail.json                 # Machine-readable audit entries
└── audit-trail.txt                  # Human-readable audit trail
```

---

## Commands Reference

### 🚀 Agent Commands (Create & Monitor Bounties)

| Command | Flags | Description | Example |
|---------|-------|-------------|---------|
| `npm run agent` | None | Interactive: select chain and bounty | `npm run agent` |
| `npm run agent:outside` | `--chain`, `--reward` | "Prove You're Outside" photo | `npm run agent:outside --chain degen --reward 50` |
| `npm run agent:handwritten` | `--chain`, `--reward` | Handwritten date proof | `npm run agent:handwritten --chain base` |
| `npm run agent:meal` | `--chain`, `--reward` | Meal photo bounty | `npm run agent:meal --chain arbitrum --reward 10` |
| `npm run agent:tower` | `--chain`, `--reward` | Object tower (AI-judged) | `npm run agent:tower --chain degen --reward 100` |
| `npm run agent:shadow` | `--chain`, `--reward` | Shadow art (AI-judged) | `npm run agent:shadow --reward 50` |
| `npm run agent:animal` | `--chain`, `--reward` | Animal photo (AI-judged) | `npm run agent:animal` |
| `npm run agent:list` | None | List available bounty templates | `npm run agent:list` |
| `npm run agent:monitor` | `--chain` | Monitor and validate existing bounties | `npm run agent:monitor --chain degen` |

**Flags:**
- `--chain <name/id>` - Select blockchain (base, arbitrum, degen, or 8453, 42161, 666666666)
- `--reward <amount>` - Custom reward in native currency (e.g., 25.5 for DEGEN or ETH)

### 📋 Bounty Management

| Command | Description | Output |
|---------|-------------|--------|
| `npm run bounty:list` | List all active bounties | Bounty ID, status, amount, issuer |
| `npm run bounty:claims` | Check claims on active bounties | Claim count, submitter addresses |
| `npm run bounty:cancel <id>` | Cancel specific bounty and refund | TX hash, refund amount |
| `npm run bounty:close-all` | Close all bounties owned by wallet | Success count, statistics |
| `npm run bounty:continuous` | Create bounties in a loop | Continuous creation with delays |
| `npm run bounty:deploy-test` | Deploy test bounty for validation | Bounty ID, TX hash, details |

### 💰 Wallet

| Command | Description |
|---------|-------------|
| `npm run wallet:create` | Generate new wallet + private key |
| `npm run wallet:balance` | Check balance on current chain |

### 🔍 Audit & Validation

| Command | Description |
|---------|-------------|
| `npm run audit:validate` | Validate audit trail integrity |

### 🛠️ Development

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to dist/ |
| `npm run dev` | Run with ts-node (development) |
| `npm run start` | Run compiled dist/agent.js |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Watch mode for tests |
| `npm run typecheck` | Type-check without compiling |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier format code |

### 📊 Server & Dashboard

| Command | Description |
|---------|-------------|
| `npm run server:stream` | Start live dashboard (http://localhost:3001) |

---

## Configuration Guide

All configuration is via environment variables in `.env`. Copy `.env.example` and fill in your values.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_PRIVATE_KEY` | Bot's private key (256-bit hex) | `0x1234567890abcdef...` |
| `RPC_URL` | Blockchain RPC endpoint | `https://rpc.degen.tips` |

Generate private key:
```bash
npm run wallet:create
```

### Blockchain Configuration

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `CHAIN_ID` | 8453 | Primary chain ID | `666666666` |
| `SUPPORTED_CHAINS` | Same as CHAIN_ID | Comma-separated chain IDs | `8453,42161,666666666` |
| `POIDH_CONTRACT_ADDRESS` | Per-chain | Override contract address | `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f` |
| `BASE_RPC_URL` | default | Base Mainnet RPC override | `https://mainnet.base.org` |
| `ARBITRUM_RPC_URL` | default | Arbitrum One RPC override | `https://arb1.arbitrum.io/rpc` |
| `DEGEN_RPC_URL` | default | Degen RPC override | `https://rpc.degen.tips` |

**Chain IDs:**
- `8453` - Base Mainnet
- `84532` - Base Sepolia (testnet)
- `42161` - Arbitrum One
- `421614` - Arbitrum Sepolia (testnet)
- `666666666` - Degen
- `1` - Ethereum (future)
- `137` - Polygon (future)

### AI & Judging

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | Required for AI-judged bounties |
| `OPENAI_VISION_MODEL` | `gpt-4o` | GPT model (gpt-4o or gpt-4-turbo) |

Get your API key: https://platform.openai.com/api-keys

### Polling & Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `POLLING_INTERVAL` | 30 | Blockchain poll interval (seconds, 5-300) |
| `MAX_GAS_PRICE_GWEI` | 50 | Max gas price (abort if exceeded) |
| `AUTO_APPROVE_GAS` | true | Automatically approve transactions |

**Trade-off:**
- Faster (5s) = More RPC calls, better responsiveness
- Slower (300s) = Fewer calls, more efficient

### Logging & Dashboard

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Log verbosity (debug/info/warn/error) |
| `LOG_FILE` | ./logs/bot.log | Log file path |
| `STREAMING_PORT` | 3001 | Dashboard port (http://localhost:3001) |
| `POLL_INTERVAL` | 5 | Streaming server poll interval (seconds) |

### Advanced

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment (development/production) |
| `DEMO_MODE` | false | Simulate without real transactions |

### Full .env Example

```bash
# Required
BOT_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
RPC_URL=https://rpc.degen.tips

# Blockchain
CHAIN_ID=666666666
SUPPORTED_CHAINS=8453,42161,666666666
POIDH_CONTRACT_ADDRESS=0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f

# RPC Overrides (optional)
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
DEGEN_RPC_URL=https://rpc.degen.tips

# AI (optional)
OPENAI_API_KEY=sk-your_openai_key
OPENAI_VISION_MODEL=gpt-4o

# Polling
POLLING_INTERVAL=30
MAX_GAS_PRICE_GWEI=50
AUTO_APPROVE_GAS=true

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Dashboard
STREAMING_PORT=3001
POLL_INTERVAL=5

# Advanced
NODE_ENV=development
DEMO_MODE=false
```

---

## Creating Custom Bounties

### Quick: Override Reward

```bash
# Any pre-built bounty with custom reward
npm run agent:outside --reward 25.5 --chain degen
npm run agent:tower --reward 100 --chain base
npm run agent:meal --reward 5 --chain arbitrum
```

### Advanced: Custom Bounty Config

Create a custom bounty with full control over requirements and validation:

```typescript
import { createRealWorldBounty, SelectionMode } from './src/bounty/configs/production-bounties';

const customBounty = createRealWorldBounty({
  name: '🎨 Paint A Masterpiece',
  description: 'Create and photograph a painting you made today',
  requirements: `
    - Paint something original
    - Photo must show you with your painting
    - Clear lighting, visible detail
    - Taken within last 24 hours
  `,
  rewardEth: '5.0',
  hoursUntilDeadline: 48,
  selectionMode: SelectionMode.AI_JUDGED,
  aiJudgingPrompt: `
    Evaluate this artwork submission:
    
    Scoring (0-100):
    - CREATIVITY (40%): How original and artistic?
    - EXECUTION (30%): Quality and technique
    - COMPOSITION (30%): Interesting arrangement
    
    MUST VERIFY: Real painting, not AI-generated
    
    Provide score and detailed reasoning.
  `
});
```

### Validation Rules

Fine-tune submission validation with custom rules:

```typescript
// Location-based bounty
const locationBounty = createRealWorldBounty({
  // ... base config
});

locationBounty.validation = {
  location: {
    latitude: 40.6892,          // Statue of Liberty
    longitude: -74.0445,
    radiusMeters: 500,          // Must be within 500m
    description: 'Statue of Liberty, NYC'
  },
  requireExif: true,
  maxAgeMinutes: 60,
  rejectScreenshots: true,
  rejectAIGenerated: true,
};

// Custom timing window
const timedBounty = createRealWorldBounty({
  // ... base config
});

timedBounty.validation = {
  timeWindow: {
    startTimestamp: Date.now(),
    endTimestamp: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
  },
  maxAgeMinutes: 60,
  requireExif: true,
};

// Keywords requirement
const keywordBounty = createRealWorldBounty({
  // ... base config
});

keywordBounty.validation = {
  requiredKeywords: ['sunset', 'ocean'],
  maxAgeMinutes: 30,
};
```

### Validation Criteria Reference

```typescript
export interface ValidationCriteria {
  // Location verification (GPS-based)
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    description: string;  // e.g., "Near Eiffel Tower"
  };

  // Time window (submission must be within this period)
  timeWindow?: {
    startTimestamp: number;
    endTimestamp: number;
  };

  // Required text in submission description
  requiredKeywords?: string[];

  // Custom AI evaluation prompt
  aiValidationPrompt?: string;

  // Image size requirements
  minImageSize?: {
    width: number;
    height: number;
  };

  // Real-world proof requirements
  requireExif?: boolean;              // Must have EXIF metadata
  maxAgeMinutes?: number;             // Photo must be recent (freshness)
  rejectScreenshots?: boolean;        // Reject screenshots (EXIF patterns)
  rejectAIGenerated?: boolean;        // Reject AI-generated images
  minAIConfidence?: number;           // AI confidence threshold (0-1)
}
```

### Example: Location + Time-Based Bounty

```typescript
const locationAndTimeBounty = createRealWorldBounty({
  name: '📍 New Year Selfie at Famous Landmark',
  description: 'Take a selfie at a famous landmark between midnight and 1am on New Year\'s Eve',
  requirements: 'Selfie at landmark, clear sky for time verification',
  rewardEth: '10.0',
  hoursUntilDeadline: 2,  // New Year's Eve only!
  selectionMode: SelectionMode.FIRST_VALID,
  aiJudgingPrompt: 'Verify this is a real selfie at a famous landmark'
});

// Set precise validation rules
locationAndTimeBounty.validation = {
  location: {
    latitude: 48.8584,     // Eiffel Tower
    longitude: 2.2945,
    radiusMeters: 200,
    description: 'Eiffel Tower, Paris'
  },
  timeWindow: {
    startTimestamp: Date.parse('2026-12-31T23:00:00Z'),
    endTimestamp: Date.parse('2027-01-01T01:00:00Z')
  },
  requireExif: true,
  maxAgeMinutes: 120,      // Within 2 hours
  rejectScreenshots: true,
  minImageSize: { width: 640, height: 480 }
};
```

---

## Validation & Scoring System

### 8 Deterministic Checks

Every submission is scored against these checks (total out of 100, **50 threshold to pass**):

| Check | Points | What It Verifies | Required |
|-------|--------|-----------------|----------|
| **Proof Content** | 20 | Content exists and is accessible | ✓ Always |
| **Valid Media** | 20 | URL resolves to valid image/video | ✓ Always |
| **EXIF Data** | 15 | Real camera metadata present | ✓ (if requireExif) |
| **Photo Freshness** | 20 | Photo taken recently (maxAgeMinutes) | ✓ (if set) |
| **Not Screenshot** | 15 | Rejects screenshots (EXIF patterns) | ✓ (if rejectScreenshots) |
| **Not AI-Generated** | TBD | Flags AI-created images | ✓ (if rejectAIGenerated) |
| **Location Match** | 30 | GPS coordinates match (if required) | Optional |
| **Time Window** | 20 | Taken during allowed period | Optional |

**Scoring Formula:**
- Mandatory checks must pass (50+ total)
- Optional checks add bonus points
- First failure on critical check = automatic rejection

### Selection Modes

#### FIRST_VALID (Fast-Track)
- First submission scoring ≥ 50/100 wins immediately
- Bot pays out as soon as valid submission found
- Good for time-sensitive, simple bounties
- Examples: "Prove you're outside", "Handwritten date"

#### AI_JUDGED (Quality-Based)
- All submissions collected until deadline
- GPT-4 Vision evaluates each for quality, authenticity, creativity
- Highest-scoring valid submission wins
- Returns: Score (0-100), confidence (0-1), detailed reasoning
- Good for creative bounties
- Examples: "Best tower", "Best shadow art", "Best animal photo"

#### COMMUNITY_VOTE (Open)
- Submissions published on POIDH
- Community votes determine winner
- Requires on-chain voting mechanism
- Good for popularity-based bounties

### Example Validation Flow

```
Submission received from 0x1234...
├─ Check 1: Proof Content ........... ✓ PASS (+20)
├─ Check 2: Valid Media ............ ✓ PASS (+20)
├─ Check 3: EXIF Data .............. ✓ PASS (+15)
├─ Check 4: Photo Freshness ........ ✓ PASS (taken 5 min ago, +20)
├─ Check 5: Not Screenshot ......... ✓ PASS (+15)
├─ Check 6: Location Match ......... ✗ FAIL (50m away, required ±100m)
│
Result: 90/100 (>=50) → VALID ✓
        Location bonus failed, but still passes threshold
        → SELECTED AS WINNER (if first-valid mode)
```

---

## Audit Trail & Proof

Every autonomous action is logged in a cryptographic audit trail with:

- **Sequence number** - Ensures completeness
- **Timestamp** - ISO 8601 + Unix timestamp
- **Action type** - What happened
- **Detailed context** - All relevant data
- **SHA-256 hash** - Links to previous entry (tamper-evident)
- **TX hash** - On-chain transactions include block explorer URL

### Action Types Logged

| Action | Example | Logged Data |
|--------|---------|------------|
| `AGENT_STARTED` | Bot initialized | Chain, wallet, contract, RPC |
| `BOUNTY_CREATED` | Bounty created on-chain | Bounty ID, reward, deadline, mode |
| `BOUNTIES_AUTO_INDEXED` | Bot discovered existing bounties | Bounty count, wallet filter, chain |
| `SUBMISSION_RECEIVED` | New submission detected | Bounty ID, submitter, proof URI |
| `SUBMISSION_VALIDATED` | Validation completed | Score, all 8 check results |
| `SUBMISSION_REJECTED` | Validation failed | Reason, failed checks |
| `AI_EVALUATION_STARTED` | GPT-4 Vision started | Model, prompt, image URL |
| `AI_EVALUATION_COMPLETED` | AI evaluation finished | Score, confidence, reasoning |
| `WINNER_SELECTED` | Winner chosen | Selection method, score, rationale |
| `PAYOUT_CONFIRMED` | Payment executed | TX hash, amount, recipient, chain |
| `BOUNTY_CANCELLED` | Bounty closed | Reason, refund amount |
| `ERROR` | Error occurred | Error type, message, context |

### Verify Audit Trail Integrity

All entries are linked with SHA-256 hashes. Verify integrity:

```bash
# View full audit trail
cat logs/audit-trail.txt

# View raw JSON with hashes
cat logs/audit-trail.json | jq '.'

# Check if modified (verify hash chain)
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('logs/audit-trail.json'));
let valid = true;
for (let i = 1; i < data.entries.length; i++) {
  if (data.entries[i].previousHash !== data.entries[i-1].entryHash) {
    console.log('✗ Chain broken at entry', i);
    valid = false;
  }
}
console.log(valid ? '✓ Audit trail intact' : '✗ Audit trail tampered');
"
```

### Audit Trail Output

```
📋 AUDIT ENTRY #0001
Timestamp: 2026-02-08T10:00:00.000Z
Action:    BOUNTY_CREATED
Details:   Bounty "Prove You're Outside" created with 50 DEGEN reward
Hash:      a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0

📋 AUDIT ENTRY #0002
Timestamp: 2026-02-08T10:15:00.000Z
Action:    SUBMISSION_RECEIVED
Details:   Claim #17 from 0x1234... with IPFS photo
Hash:      def456abc789...

📋 AUDIT ENTRY #0003
Timestamp: 2026-02-08T10:15:05.000Z
Action:    SUBMISSION_VALIDATED
Details:   Score 85/100 - VALID
           ✓ Proof Content ........... +20 pts
           ✓ Valid Media ............ +20 pts
           ✓ EXIF Data .............. +15 pts
           ✓ Photo Freshness ........ +20 pts
           ✓ Not Screenshot ......... +10 pts
Hash:      ghi789def012...

📋 AUDIT ENTRY #0004
Timestamp: 2026-02-08T10:15:10.000Z
Action:    PAYOUT_CONFIRMED
Details:   Winner 0x1234... paid 50 DEGEN
TX:        0xdef789ghi012345...
🔗 https://explorer.degen.tips/tx/0xdef789ghi012345...
Hash:      jkl012ghi345...
```

---

## Live Dashboard

Start the web dashboard to monitor bot activity in real-time:

```bash
npm run server:stream
# Open http://localhost:3001
```

### Features

- **Real-time audit trail** - All entries rendered with action-specific formatting
- **Chain information** - Chain name, ID, currency, contract address (linked to explorer)
- **Activity summary** - Bounties created, submissions validated, winners paid
- **Multi-chain aware** - Correct currency display (ETH/DEGEN/MATIC), per-chain explorer links
- **Live streaming** - SSE + WebSocket updates without page refresh
- **Color-coded** - Green (valid/payout), red (errors/rejections), gold (winners)

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check with chain info |
| `GET /api/audit-state` | Full audit trail + summary + context |
| `GET /api/recent-entries` | Latest entries (enriched with URLs) |
| `GET /api/winners` | Winner rationale entries |
| `GET /api/rejections` | Rejected submissions with reasons |
| `GET /api/decisions` | All validation decisions |
| `GET /api/indexed-bounties` | Auto-indexed bounty discovery |
| `GET /api/bounties` | All bounties (created + indexed) |
| `GET /api/stream` | Server-Sent Events live stream |

---

## Deployment Methods

### Docker Compose (Recommended for Production)

**Easiest approach**: Two services (bot + dashboard) with shared volumes for logs.

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your BOT_PRIVATE_KEY, RPC_URL, etc.

# 2. Start services
docker-compose up -d --build

# 3. Monitor
docker-compose logs -f bounty-bot
docker-compose logs -f streaming-server

# 4. Access dashboard
# Open http://localhost:3001

# 5. Stop
docker-compose down
```

**What it does:**
- `bounty-bot`: Runs continuous bounty creation/monitoring
- `streaming-server`: Runs live dashboard on port 3001
- Shared `logs/` and `data/` volumes for persistence
- Automatic restarts on failure

**Files:**
- `docker-compose.yml` - Service definitions
- `Dockerfile` - Build configuration

### PM2 (Recommended for VPS/Cloud)

**Process manager**: Runs bot and dashboard as services with auto-restart, clustering, and monitoring.

```bash
# 1. Install globally
npm install -g pm2

# 2. Build project
npm run build

# 3. Start services
pm2 start ecosystem.config.js

# 4. Monitor
pm2 logs        # View logs
pm2 monit       # Monitor CPU/memory
pm2 list        # List processes

# 5. View dashboard
pm2 web         # Opens http://localhost:9615

# 6. Stop/restart
pm2 stop all
pm2 restart all
pm2 delete all
```

**File:** `ecosystem.config.js` - Defines processes, environment, clustering

### Manual (Development Only)

```bash
# Terminal 1: Run bot
npm run build
npm run start

# Terminal 2: Run dashboard (optional)
npm run server:stream
```

### Cloud Deployment (Railway, Heroku, DigitalOcean, AWS)

All cloud providers support Node.js deployments. Steps:

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Create deployment on cloud platform**
   - Connect GitHub repository
   - Select main branch

3. **Set environment variables** (platform's secrets dashboard)
   ```
   BOT_PRIVATE_KEY=0x...
   RPC_URL=https://rpc.degen.tips
   OPENAI_API_KEY=sk-...
   CHAIN_ID=666666666
   STREAMING_PORT=3001
   ```

4. **Configure build/start commands**
   - Build: `npm run build`
   - Start: `npm run start`
   - Or: `npm run server:stream` for dashboard only

5. **Verify it's running**
   ```bash
   curl https://your-domain.com/health
   ```

**Provider-Specific Tips:**

**Railway:**
- Auto-deploys on git push
- Set environment variables in dashboard
- View logs in Railway console

**Heroku:**
- `Procfile`: Define processes
- `package.json`: Includes build scripts
- Dyno size: Standard-1X minimum

**DigitalOcean App Platform:**
- Dockerfile auto-detected
- Environment variables in configuration
- Persistent volumes for `/logs` and `/data`

**AWS (EC2/Lambda):**
- EC2: Deploy with Docker or PM2 (see above)
- Lambda: Use container image with handler for `/api` endpoints

---

## Troubleshooting

### Common Issues

#### ❌ "Insufficient balance"

**Problem:** Wallet doesn't have enough funds to create bounty

**Solution:**
```bash
npm run wallet:balance
# Send more to address shown, then retry
```

#### ❌ "Invalid BOT_PRIVATE_KEY"

**Problem:** Private key format is wrong

**Solution:**
- Must be 66 characters
- Must start with `0x`
- Must be hex (0-9, a-f)
- Generate new one: `npm run wallet:create`

#### ❌ "Cannot connect to RPC"

**Problem:** RPC endpoint unreachable or wrong chain

**Solution:**
```bash
# Check RPC_URL in .env
echo $RPC_URL

# Verify connectivity
curl $RPC_URL -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

#### ❌ "execution reverted (unknown custom error)"

**Problem:** Contract call failed on-chain

**Solution:**
- Verify contract address is correct for chain
- Check wallet has balance
- Verify RPC has access to contract

#### ❌ "Port 3001 in use"

**Problem:** Another service using dashboard port

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in .env
STREAMING_PORT=3002
```

#### ❌ "No logs appearing"

**Problem:** LOG_LEVEL too high or log file issue

**Solution:**
```bash
# Check log level
grep LOG_LEVEL .env

# Set to debug
LOG_LEVEL=debug npm run agent:outside

# Check log file
cat logs/bot.log
```

#### ❌ Blank audit entries

**Problem:** Test entries showing "(test entry)"

**Solution:** This is expected behavior for test submissions with `{"test": true}`

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run agent:monitor -- --chain degen
```

This shows:
- All RPC calls
- Blockchain polling details
- Submission processing steps
- Validation check breakdown
- Contract interactions

### Check System Health

```bash
# Verify setup
npm run wallet:balance         # Check wallet funded
npm run bounty:list            # Check contract accessible
npm run audit:validate         # Verify audit trail

# View logs
tail -50 logs/bot.log
tail -20 logs/error.log
tail -10 logs/audit-trail.txt
```

---

## Security

### Private Key Management

- **Never commit** `.env` to git
- **Use `.env.local`** for sensitive overrides
- **Rotate keys** monthly
- **Use environment variable** `BOT_PRIVATE_KEY` (not `PRIVATE_KEY`)

### Wallet Funding

- **Use dedicated wallet** with limited funds
- **Only fund** what you plan to distribute as bounties
- **Monitor** wallet via block explorer regularly
- **Set MAX_GAS_PRICE_GWEI** to limit spending

### API Keys

- **Rotate OpenAI key** every 30 days
- **Monitor usage** via OpenAI dashboard
- **Use separate keys** for testnet/mainnet
- **Never log** API keys (check logs/)

### RPC Endpoints

- **Use HTTPS-only** endpoints
- **Prefer paid tiers** (Alchemy, Infura) for reliability
- **Whitelist domains** if using public endpoints
- **Monitor rate limits** to avoid timeouts

### Audit Trail

- **Verify hash chain** regularly (see above)
- **Back up logs/** periodically
- **Store audit-trail.json** securely
- **Publish proof** on POIDH for transparency

### Deployment

- **Use cloud secrets** for environment variables
- **Enable HTTPS** on dashboard (reverse proxy)
- **Restrict API access** to internal IPs only
- **Set MAX_GAS_PRICE_GWEI** before production

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Support

- **Documentation** - See [PROOF_OF_AUTONOMY.md](PROOF_OF_AUTONOMY.md) for autonomy verification
- **Issues** - GitHub issues or discussions
- **Examples** - See `src/examples/` for sample configurations
- **Demos** - Run `npm run demo:simulate` for full simulation

---

**Status**: ✅ Production-Ready  
**Version**: 2.0.0  
**Last Updated**: February 8, 2026
