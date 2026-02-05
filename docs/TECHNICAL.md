# Technical Reference

Complete technical documentation for the Autonomous Bounty Bot.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Commands](#commands)
4. [Validation System](#validation-system)
5. [Audit Trail](#audit-trail)
6. [Multi-Chain Support](#multi-chain-support)
7. [Deployment](#deployment)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

### Core Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATE    │ ──▶ │   MONITOR   │ ──▶ │  VALIDATE   │ ──▶ │   PAYOUT    │
│  (on-chain) │     │ (30s poll)  │     │ (8 checks)  │     │   (auto)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  TX Hash logged     Submissions         Score logged        TX Hash logged
  to audit trail     fetched             with rationale      to audit trail
```

### File Structure

```
src/
├── agent.ts                    # Main orchestration loop
├── bounty/
│   ├── manager.ts              # Bounty lifecycle (create, cancel, complete)
│   ├── monitor.ts              # Blockchain polling for submissions
│   ├── types.ts                # TypeScript interfaces
│   └── configs/
│       └── production-bounties.ts  # Pre-built bounty templates
├── evaluation/
│   ├── index.ts                # Evaluation engine coordinator
│   ├── validator.ts            # 8 deterministic validation checks
│   └── ai-judge.ts             # GPT-4 Vision integration
├── contracts/
│   └── poidh.ts                # POIDH V3 smart contract interface
├── wallet/
│   └── index.ts                # Wallet creation, signing, balance
├── config/
│   ├── index.ts                # Environment config loader
│   └── chains.ts               # Multi-chain configuration
└── utils/
    ├── audit-trail.ts          # Cryptographic proof logging
    └── logger.ts               # Structured logging
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Agent | `src/agent.ts` | Main loop: create → monitor → evaluate → pay |
| Validator | `src/evaluation/validator.ts` | 8 deterministic validation checks |
| AI Judge | `src/evaluation/ai-judge.ts` | GPT-4 Vision evaluation |
| Contract | `src/contracts/poidh.ts` | On-chain interactions |
| Audit Trail | `src/utils/audit-trail.ts` | Tamper-proof logging |

---

## Configuration

### Required Environment Variables

```bash
BOT_PRIVATE_KEY=0x...              # Bot wallet private key (64 hex chars)
OPENAI_API_KEY=sk-...              # OpenAI API key for AI judging
RPC_URL=https://mainnet.base.org   # Blockchain RPC endpoint
```

### Optional Environment Variables

```bash
# Network
CHAIN_ID=8453                      # 8453=Base, 42161=Arbitrum, 666666666=Degen

# Polling
POLLING_INTERVAL=30                # Seconds between blockchain checks

# Gas
MAX_GAS_PRICE_GWEI=50              # Max gas price (rejects if higher)
AUTO_APPROVE_GAS=true              # Auto-execute transactions

# Logging
LOG_LEVEL=info                     # debug | info | warn | error

# Testing
DEMO_MODE=false                    # true = simulate without real transactions
```

### .env.example

```bash
# Required
BOT_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
OPENAI_API_KEY=sk-your-openai-api-key-here
RPC_URL=https://mainnet.base.org

# Optional
CHAIN_ID=8453
POLLING_INTERVAL=30
MAX_GAS_PRICE_GWEI=50
AUTO_APPROVE_GAS=true
LOG_LEVEL=info
DEMO_MODE=false
```

---

## Commands

### Agent Commands

```bash
npm run agent:outside      # Outdoor proof bounty (first-valid)
npm run agent:handwritten  # Handwritten date proof (first-valid)
npm run agent:meal         # Meal photo bounty (first-valid)
npm run agent:tower        # Object stacking (AI-judged)
npm run agent:shadow       # Shadow art (AI-judged)
npm run agent:animal       # Pet/wildlife photo (AI-judged)
npm run agent:list         # List available bounty templates
npm run agent monitor <id> # Monitor existing bounty by ID
```

### Bounty Management

```bash
npm run bounty:list        # Show all active bounties
npm run bounty:claims      # Check claims on active bounties
npm run bounty:cancel      # Cancel a bounty (refund ETH)
npm run bounty:continuous  # Auto-create bounties in loop (24/7 mode)
```

### Wallet

```bash
npm run wallet:create      # Generate new wallet (save the output!)
npm run wallet:balance     # Check wallet balance
```

### Development

```bash
npm run build              # Compile TypeScript
npm run dev                # Run with ts-node
npm run test               # Run test suite
npm run test:watch         # Tests in watch mode
npm run lint               # Check code style
npm run lint:fix           # Auto-fix style issues
npm run typecheck          # TypeScript type checking
npm run format             # Format with Prettier
```

### Testing & Demo

```bash
npm run demo:simulate      # Full simulation (no real transactions)
npm run demo:first-valid   # Demo first-valid selection mode
npm run demo:ai-judged     # Demo AI-judged selection mode
```

### Monitoring

```bash
npm run server:stream      # Start dashboard on http://localhost:3001
```

---

## Validation System

### The 8 Checks

Each submission is scored using these deterministic checks:

| # | Check | Points | Code Location |
|---|-------|--------|---------------|
| 1 | Proof Content Exists | 20 | `validator.ts:33-47` |
| 2 | Valid Media URL | 20 | `validator.ts:50-67` |
| 3 | EXIF Data Present | 15 | `validator.ts:98-103` |
| 4 | Photo Freshness | 20 | `validator.ts:106-111` |
| 5 | Not Screenshot | 15 | `validator.ts:114-119` |
| 6 | Location Match | 30 | `validator.ts:70-75` |
| 7 | Time Window | 20 | `validator.ts:78-83` |
| 8 | Required Keywords | 10 | `validator.ts:86-91` |

### Scoring Logic

```typescript
// Normalized score calculation
const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

// Validity determination
const criticalFailed = checks.some(c => !c.passed && isCriticalCheck(c.name));
const isValid = !criticalFailed && score >= 50;
```

**Critical checks** (automatic rejection if failed):
- Proof Content
- Media URL
- EXIF Data
- Photo Freshness
- Screenshot Check

### Selection Modes

**FIRST_VALID**
- First submission with score ≥50 wins immediately
- No deadline waiting
- Payment executed instantly

**AI_JUDGED**
- All submissions collected until deadline
- GPT-4 Vision evaluates each submission
- Highest combined score wins
- Full reasoning logged to audit trail

### AI Evaluation Prompt

```typescript
{
  model: "gpt-4-vision-preview",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Evaluate this submission for: {bountyName}..." },
      { type: "image_url", url: submissionImageUrl }
    ]
  }]
}
```

---

## Audit Trail

### Purpose

The audit trail provides **cryptographic proof** that all decisions were made autonomously with no human intervention.

### Log Files

```bash
logs/audit-trail.txt   # Human-readable
logs/audit-trail.json  # Machine-readable
```

### Hash Chain Integrity

Each entry contains:
- `sequence`: Entry number
- `timestamp`: ISO 8601 timestamp
- `action`: What happened
- `details`: Full details
- `txHash`: On-chain transaction (if applicable)
- `previousHash`: Hash of prior entry
- `entryHash`: SHA-256 hash of this entry

```
Entry 0: previousHash = "GENESIS"
Entry 1: previousHash = hash(Entry 0)
Entry 2: previousHash = hash(Entry 1)
...
```

If any entry is modified, the chain breaks.

### Logged Events

| Action | When |
|--------|------|
| `AGENT_STARTED` | Bot initializes |
| `BOUNTY_CREATED` | Bounty published on-chain |
| `SUBMISSION_RECEIVED` | New claim detected |
| `SUBMISSION_VALIDATED` | Validation completed (with full scoring breakdown) |
| `SUBMISSION_REJECTED` | Submission failed validation |
| `WINNER_SELECTED` | Winner chosen |
| `WINNER_RATIONALE` | Full reasoning for selection |
| `PAYOUT_CONFIRMED` | ETH sent to winner |

### Verification

```bash
# Verify chain integrity
node -e "
const fs = require('fs');
const crypto = require('crypto');
const data = JSON.parse(fs.readFileSync('logs/audit-trail.json'));
let valid = true;
for (let i = 1; i < data.entries.length; i++) {
  if (data.entries[i].previousHash !== data.entries[i-1].entryHash) {
    console.log('Chain broken at entry', i);
    valid = false;
  }
}
console.log(valid ? '✓ Chain valid' : '✗ Chain invalid');
"
```

---

## Multi-Chain Support

### Supported Chains

| Chain | ID | Native Token | Contract Address |
|-------|-----|--------------|------------------|
| Base Mainnet | 8453 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` |
| Base Sepolia | 84532 | ETH | (testnet) |
| Arbitrum One | 42161 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` |
| Degen | 666666666 | DEGEN | `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f` |

### Switch Chains

```bash
# Base (default)
CHAIN_ID=8453 RPC_URL=https://mainnet.base.org npm run agent:outside

# Arbitrum
CHAIN_ID=42161 RPC_URL=https://arb1.arbitrum.io/rpc npm run agent:outside

# Degen
CHAIN_ID=666666666 RPC_URL=https://rpc.degen.tips npm run agent:outside
```

### Chain Configuration

Located in `src/config/chains.ts`:

```typescript
export const CHAINS: Record<number, ChainConfig> = {
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    nativeCurrency: 'ETH',
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    poidhContractAddress: '0x5555Fa783936C260f77385b4E153B9725feF1719',
    enabled: true,
  },
  // ...
};
```

---

## Deployment

### Local

```bash
npm run bounty:continuous
```

### Docker

```bash
docker build -t bounty-bot .
docker run --env-file .env bounty-bot
```

### Docker Compose

```bash
docker-compose up -d
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs bounty-bot
pm2 monit
```

### Cloud Platforms

**Railway**
```bash
railway init
railway up
```

**Heroku**
```bash
heroku create bounty-bot
heroku config:set BOT_PRIVATE_KEY=0x...
git push heroku main
```

**DigitalOcean App Platform**
- Connect GitHub repo
- Set environment variables
- Deploy

---

## Security

### Critical Rules

| DO | DON'T |
|----|-------|
| ✅ Keep `.env` out of git | ❌ Commit `.env` |
| ✅ Use env vars for secrets | ❌ Hardcode private keys |
| ✅ Fund wallet with budget only | ❌ Put life savings in bot wallet |
| ✅ Use separate keys per environment | ❌ Same key for test & prod |
| ✅ Monitor wallet transactions | ❌ Ignore unusual activity |
| ✅ Rotate API keys regularly | ❌ Use same keys forever |

### Private Key Safety

```bash
# Generate fresh wallet
npm run wallet:create

# Store securely
# Option 1: Environment variable
export BOT_PRIVATE_KEY=0x...

# Option 2: .env file (gitignored)
echo "BOT_PRIVATE_KEY=0x..." >> .env

# Option 3: Cloud secrets manager
# AWS Secrets Manager, GCP Secret Manager, etc.
```

### Audit Trail Verification

The audit trail proves the bot acted autonomously:
- All transactions have on-chain hashes (verifiable on block explorer)
- Hash chain prevents tampering
- Full reasoning logged for every decision

---

## Troubleshooting

### Wallet Issues

**"Insufficient balance"**
```bash
npm run wallet:balance  # Check current balance
# Send more ETH to the displayed address
```

**"Invalid BOT_PRIVATE_KEY"**
- Must start with `0x`
- Must be exactly 64 hex characters after `0x`
- Generate fresh: `npm run wallet:create`

### Configuration Issues

**"Invalid OPENAI_API_KEY"**
- Get from: https://platform.openai.com/api-keys
- Must start with `sk-`
- Check for expiration

**"Cannot connect to RPC"**
```bash
curl $RPC_URL  # Test connectivity
# Try alternative RPC:
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY npm run agent:outside
```

### Transaction Issues

**"Transaction reverted"**
```bash
MAX_GAS_PRICE_GWEI=100 npm run agent:outside  # Increase gas limit
```

**"Nonce too low"**
- Previous transaction still pending
- Wait or cancel pending transaction

### Runtime Issues

**"No submissions detected"**
- Check `POLLING_INTERVAL` (default 30s)
- Verify bounty is still active on-chain
- Check RPC connectivity

**"EXIF validation failing"**
- Submitted photo may be screenshot or AI-generated
- Check that original photo (not compressed) was submitted

### Logs

```bash
# View recent logs
tail -100 logs/audit-trail.txt

# Watch live
tail -f logs/audit-trail.txt

# Filter errors
grep "ERROR" logs/audit-trail.txt
```

---

## API Reference

### BountyConfig

```typescript
interface BountyConfig {
  id: string;                          // Unique identifier
  name: string;                        // Display name
  description: string;                 // Full description
  requirements: string;                // What submitters must do
  proofType: 'photo' | 'video' | 'text';
  selectionMode: 'FIRST_VALID' | 'AI_JUDGED';
  rewardEth: string;                   // e.g., "0.05"
  deadline: number;                    // Unix timestamp
  validation: ValidationCriteria;
  tags?: string[];
}
```

### ValidationCriteria

```typescript
interface ValidationCriteria {
  requireExif?: boolean;               // Require EXIF metadata
  maxAgeMinutes?: number;              // Max photo age
  rejectScreenshots?: boolean;         // Detect screenshots
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    description: string;
  };
  timeWindow?: {
    startTimestamp: number;
    endTimestamp: number;
  };
  requiredKeywords?: string[];
  aiValidationPrompt?: string;         // Custom AI evaluation prompt
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  score: number;                       // 0-100
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  summary: string;
}
```

---

## Custom Bounties

### Example: Location-Based

```typescript
{
  name: "Photo at Eiffel Tower",
  description: "Take a photo at the Eiffel Tower",
  proofType: "photo",
  selectionMode: "FIRST_VALID",
  rewardEth: "0.1",
  deadline: Math.floor(Date.now() / 1000) + 86400,
  validation: {
    requireExif: true,
    maxAgeMinutes: 30,
    rejectScreenshots: true,
    location: {
      latitude: 48.858,
      longitude: 2.295,
      radiusMeters: 500,
      description: "Eiffel Tower, Paris"
    }
  }
}
```

### Example: AI-Judged Contest

```typescript
{
  name: "Best Sunset Photo",
  description: "Submit your most beautiful sunset",
  proofType: "photo",
  selectionMode: "AI_JUDGED",
  rewardEth: "0.2",
  deadline: Math.floor(Date.now() / 1000) + 172800,  // 48 hours
  validation: {
    requireExif: true,
    maxAgeMinutes: 60,
    aiValidationPrompt: "Judge based on: color vibrancy, composition, uniqueness"
  }
}
```

---

**Questions?** Open an issue on [GitHub](https://github.com/drdeeks/poidh/issues)
