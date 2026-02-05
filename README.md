# Autonomous Bounty Bot

> **Enterprise-grade autonomous bounty system that creates, monitors, validates, and pays out real-world proof bounties on blockchain networks with zero human intervention.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Commands Reference](#commands-reference)
6. [Multi-Chain Support](#multi-chain-support)
7. [Validation System](#validation-system)
8. [Deployment Options](#deployment-options)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)

---

## Overview

The Autonomous Bounty Bot is a fully automated system that:

- **Creates bounties** on blockchain networks with customizable rewards
- **Monitors submissions** in real-time using blockchain polling
- **Validates entries** through 8 deterministic checks + optional AI evaluation
- **Pays winners** automatically with cryptographic proof of every decision
- **Maintains audit trails** with tamper-proof hash chains for complete transparency

### Key Features

- ✅ **100% Autonomous** - Zero human intervention after initialization
- ✅ **Multi-Chain Support** - Base, Arbitrum, Degen networks
- ✅ **Cryptographic Proof** - Every decision logged with blockchain verification
- ✅ **AI-Powered Judging** - GPT-4 Vision for complex evaluations
- ✅ **Enterprise Security** - Private key management, gas optimization
- ✅ **Real-Time Monitoring** - Web dashboard with live updates

---

## Quick Start

### Prerequisites

- Node.js ≥18.0.0
- npm or yarn
- 0.01+ ETH (or equivalent native token) for bounty funding

### 5-Minute Setup

```bash
# 1. Clone and install
git clone https://github.com/drdeek/poidh-autonomous.git
cd poidh-autonomous
npm install

# 2. Generate wallet
npm run wallet:create
# Save the private key and address shown

# 3. Configure environment
cp .env.example .env
# Edit .env with your BOT_PRIVATE_KEY and OPENAI_API_KEY

# 4. Fund wallet
npm run wallet:balance
# Send funds to the displayed address (amount depends on chain)

# 5. Create a bounty (with chain selection)
npm run agent:handwritten -- --chain degen --reward 1

# 6. Or monitor existing bounties
npm run agent:monitor -- --chain degen
```

### Verify Operation

```bash
# In another terminal - start dashboard
npm run server:stream
# Open http://localhost:3001

# View audit trail
cat logs/audit-trail.txt
```

---

## Architecture

### System Flow

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

### Project Structure

```
poidh-autonomous/
├── src/
│   ├── agent.ts                    # Main orchestration loop
│   ├── bounty/
│   │   ├── manager.ts              # Bounty lifecycle management
│   │   ├── monitor.ts              # Blockchain polling
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── configs/
│   │       └── production-bounties.ts  # Pre-built templates
│   ├── evaluation/
│   │   ├── index.ts                # Evaluation coordinator
│   │   ├── validator.ts            # 8 deterministic checks
│   │   └── ai-judge.ts             # GPT-4 Vision integration
│   ├── contracts/
│   │   ├── poidh.ts                # POIDH V3 smart contract
│   │   ├── multi-chain.ts          # Multi-chain contract manager
│   │   └── abis.ts                 # Contract ABIs
│   ├── wallet/
│   │   ├── index.ts                # Wallet operations
│   │   └── multi-chain.ts          # Multi-chain wallet manager
│   ├── config/
│   │   ├── index.ts                # Environment configuration
│   │   └── chains.ts               # Chain configurations
│   ├── utils/
│   │   ├── audit-trail.ts          # Cryptographic logging
│   │   ├── logger.ts               # Structured logging
│   │   ├── uri-fetcher.ts          # IPFS/HTTP content fetching
│   │   └── health.ts               # System health monitoring
│   ├── scripts/                    # Utility scripts
│   ├── server/                     # Web dashboard
│   └── demos/                      # Example implementations
├── logs/                           # Audit trails and logs
├── data/                           # Persistent data storage
├── tests/                          # Test suites
├── docs/                           # Additional documentation
└── PROOF_OF_AUTONOMY.md           # Autonomy verification guide
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| **Agent** | `src/agent.ts` | Main orchestration loop |
| **Bounty Manager** | `src/bounty/manager.ts` | Create, cancel, complete bounties |
| **Monitor** | `src/bounty/monitor.ts` | Poll blockchain for submissions |
| **Validator** | `src/evaluation/validator.ts` | 8 deterministic validation checks |
| **AI Judge** | `src/evaluation/ai-judge.ts` | GPT-4 Vision evaluation |
| **Contract Interface** | `src/contracts/poidh.ts` | Smart contract interactions |
| **Audit Trail** | `src/utils/audit-trail.ts` | Tamper-proof logging system |

---

## Configuration

### Required Environment Variables

```bash
# Bot wallet private key (generate with: npm run wallet:create)
BOT_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Blockchain RPC endpoint
RPC_URL=https://mainnet.base.org

# OpenAI API key for AI-judged bounties
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optional Configuration

```bash
# Network Configuration
CHAIN_ID=8453                      # 8453=Base, 42161=Arbitrum, 666666666=Degen
SUPPORTED_CHAINS=8453,42161        # Comma-separated chain IDs
POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719

# Operation Settings
POLLING_INTERVAL=30                # Seconds between blockchain checks
MAX_GAS_PRICE_GWEI=50              # Maximum gas price threshold
AUTO_APPROVE_GAS=true              # Auto-execute transactions
DEMO_MODE=false                    # Simulate without real transactions

# Logging
LOG_LEVEL=info                     # debug | info | warn | error
LOG_FILE=./logs/bot.log

# AI Configuration
OPENAI_VISION_MODEL=gpt-4o         # gpt-4o | gpt-4-turbo

# Dashboard
STREAMING_PORT=3001                # Web dashboard port
POLL_INTERVAL=5                    # Dashboard update frequency
```

### Complete Configuration Guide

See `.env.example` for detailed configuration options with explanations and security guidelines.

---

## Commands Reference

### Agent Operations

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run agent:outside` | Create outdoor proof bounty | First-valid selection |
| `npm run agent:handwritten` | Create handwritten date proof | First-valid selection |
| `npm run agent:meal` | Create meal photo bounty | First-valid selection |
| `npm run agent:tower` | Create object stacking contest | AI-judged selection |
| `npm run agent:shadow` | Create shadow art contest | AI-judged selection |
| `npm run agent:animal` | Create pet/wildlife photo contest | AI-judged selection |
| `npm run agent:list` | List available bounty templates | Information only |
| `npm run agent:monitor` | Auto-discover and monitor all bot's bounties | No ID needed |
| `npm run agent` | Interactive chain selection | Guided setup |

### Chain Selection

All agent commands support chain selection via flags:

```bash
# Interactive chain selection (no flag)
npm run agent:outside

# Specify chain by name
npm run agent:outside -- --chain base
npm run agent:outside -- --chain arbitrum
npm run agent:outside -- --chain degen

# Specify chain by ID
npm run agent:outside -- --chain 8453
npm run agent:outside -- --chain 42161
npm run agent:outside -- --chain 666666666

# Short flag
npm run agent:outside -- -c base
```

### Custom Reward Amounts

Override default reward amounts with the `--reward` flag:

```bash
# Set custom reward (in ETH)
npm run agent:outside -- --reward 0.01
npm run agent:tower -- --reward 0.05 --chain arbitrum

# Combine with chain selection
npm run agent:meal -- --chain degen --reward 0.001
```

#### Supported Chain Names

| Name | Chain ID | Network |
|------|----------|---------|
| `base`, `base-mainnet` | 8453 | Base Mainnet |
| `base-sepolia` | 84532 | Base Sepolia Testnet |
| `arbitrum`, `arbitrum-one` | 42161 | Arbitrum One |
| `arbitrum-sepolia` | 421614 | Arbitrum Sepolia |
| `degen` | 666666666 | Degen Chain |
| `ethereum`, `eth` | 1 | Ethereum Mainnet |
| `sepolia` | 11155111 | Sepolia Testnet |
| `polygon`, `matic` | 137 | Polygon |
| `optimism`, `op` | 10 | Optimism |

### Bounty Management

| Command | Description | Flags |
|---------|-------------|-------|
| `npm run bounty:list` | Show all active bounties | None |
| `npm run bounty:claims` | Check claims on bounties | None |
| `npm run bounty:cancel` | Cancel bounty (refund) | Interactive selection |
| `npm run bounty:continuous` | Auto-create bounties 24/7 | `--interval=<seconds>` |

**Note:** For monitoring existing bounties, use `npm run agent:monitor` which auto-discovers all bounties created by your wallet address.

### Wallet Operations

| Command | Description | Output |
|---------|-------------|--------|
| `npm run wallet:create` | Generate new wallet | Private key + address |
| `npm run wallet:balance` | Check wallet balance | ETH balance + address |

### Development & Testing

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm run build` | Compile TypeScript | Production |
| `npm run dev` | Run with ts-node | Development |
| `npm run test` | Run test suite | All |
| `npm run test:watch` | Tests in watch mode | Development |
| `npm run lint` | Check code style | All |
| `npm run lint:fix` | Auto-fix style issues | All |
| `npm run typecheck` | TypeScript validation | All |
| `npm run format` | Format with Prettier | All |

### Demo & Simulation

| Command | Description | Purpose |
|---------|-------------|---------|
| `npm run demo:simulate` | Full simulation (no real TX) | Testing |
| `npm run demo:first-valid` | Demo first-valid mode | Learning |
| `npm run demo:ai-judged` | Demo AI-judged mode | Learning |

### Monitoring

| Command | Description | Access |
|---------|-------------|--------|
| `npm run server:stream` | Start web dashboard | http://localhost:3001 |

### Command Flags & Options

Most commands support additional flags:

```bash
# Chain selection
npm run agent:outside -- --chain base          # Run on Base
npm run agent:outside -- --chain arbitrum      # Run on Arbitrum
npm run agent:outside -- --chain degen         # Run on Degen
npm run agent:outside -- -c 8453               # Run on Base (by ID)

# Custom reward amounts
npm run agent:outside -- --reward 0.01         # Set custom reward
npm run agent:tower -- --reward 0.05 --chain arbitrum  # Combine flags

# Monitor existing bounties (auto-discovers all your bounties)
npm run agent:monitor -- --chain degen         # No bounty ID needed!

# Environment variables (alternative to flags)
CHAIN_ID=42161 npm run agent:outside           # Run on Arbitrum

# Custom gas settings
MAX_GAS_PRICE_GWEI=100 npm run bounty:continuous

# Debug mode
LOG_LEVEL=debug npm run agent:outside

# Demo mode (no real transactions)
DEMO_MODE=true npm run agent:outside
```

---

## Multi-Chain Support

### Supported Networks

| Chain | Chain ID | Native Token | Contract Address | Status |
|-------|----------|--------------|------------------|--------|
| **Base Mainnet** | 8453 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` | ✅ Active |
| **Base Sepolia** | 84532 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` | ✅ Testnet |
| **Arbitrum One** | 42161 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` | ✅ Active |
| **Arbitrum Sepolia** | 421614 | ETH | `0x5555Fa783936C260f77385b4E153B9725feF1719` | ✅ Testnet |
| **Degen** | 666666666 | DEGEN | `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f` | ✅ Active |

### Chain Configuration

Each chain includes:

```typescript
interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  poidhContractAddress: string;
  enabled: boolean;
}
```

### RPC Endpoints

| Chain | Primary RPC | Alternative RPCs |
|-------|-------------|------------------|
| Base | `https://mainnet.base.org` | Alchemy, Infura, QuickNode |
| Arbitrum | `https://arb1.arbitrum.io/rpc` | Alchemy, Infura, Ankr |
| Degen | `https://rpc.degen.tips` | Official only |

### Switch Networks

```bash
# Base (default)
CHAIN_ID=8453 RPC_URL=https://mainnet.base.org npm run agent:outside

# Arbitrum
CHAIN_ID=42161 RPC_URL=https://arb1.arbitrum.io/rpc npm run agent:outside

# Degen
CHAIN_ID=666666666 RPC_URL=https://rpc.degen.tips npm run agent:outside

# Multi-chain (parallel operation)
SUPPORTED_CHAINS=8453,42161,666666666 npm run bounty:continuous
```

### Block Explorers

| Chain | Explorer URL Template |
|-------|----------------------|
| Base | `https://basescan.org/tx/{txHash}` |
| Arbitrum | `https://arbiscan.io/tx/{txHash}` |
| Degen | `https://explorer.degen.tips/tx/{txHash}` |

---

## Validation System

### The 8 Validation Checks

Each submission is evaluated using these deterministic checks:

| # | Check Name | Purpose |
|---|------------|---------|
| 1 | **Proof Content** | Verifies content exists |
| 2 | **Valid Media** | Confirms media is accessible |
| 3 | **EXIF Data** | Detects real camera metadata |
| 4 | **Photo Freshness** | Ensures recent capture |
| 5 | **Screenshot Check** | Prevents screenshot submissions |
| 6 | **Location Match** | GPS coordinate verification (optional) |
| 7 | **Time Window** | Submission timing validation (optional) |
| 8 | **Keywords** | Required text presence (optional) |

### Scoring Logic

```typescript
// Score calculation
const totalScore = checks.reduce((sum, check) => sum + (check.passed ? 1 : 0), 0);
const normalizedScore = Math.round((totalScore / checks.length) * 100);

// Validity determination
const isValid = normalizedScore >= 50;
```

### Comprehensive Audit Logging

Every validation is logged with:
- All check results with pass/fail status
- Detailed reasoning for each check
- Overall score and decision logic
- Submitter address and proof URI
- Timestamp and chain information

View detailed logs in `logs/audit-trail.txt` or the web dashboard.

### Selection Modes

#### FIRST_VALID Mode
- **Behavior**: First submission scoring ≥50 points wins immediately
- **Use Case**: Time-sensitive bounties, simple proofs
- **Payment**: Instant upon validation
- **Example**: "First person to prove they're outside"

#### AI_JUDGED Mode
- **Behavior**: Collects all submissions until deadline, then GPT-4 Vision selects best
- **Use Case**: Creative contests, subjective evaluation
- **Payment**: After deadline evaluation
- **Example**: "Best sunset photo contest"

### AI Evaluation Process

```typescript
// GPT-4 Vision prompt structure
{
  model: "gpt-4o",
  messages: [{
    role: "user",
    content: [
      { 
        type: "text", 
        text: `Evaluate this submission for: ${bountyName}
               Criteria: ${evaluationCriteria}
               Score 1-100 and provide reasoning.`
      },
      { 
        type: "image_url", 
        url: submissionImageUrl 
      }
    ]
  }]
}
```

---

## Deployment Options

### Local Development

```bash
# Direct execution
npm run bounty:continuous

# With custom environment
NODE_ENV=development LOG_LEVEL=debug npm run agent:outside
```

### Docker Deployment

```dockerfile
# Dockerfile included
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t bounty-bot .
docker run --env-file .env -p 3001:3001 bounty-bot
```

### Docker Compose

The easiest way to deploy in production:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f bounty-bot

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

The `docker-compose.yml` includes:
- Automatic restart on failure
- Volume mounts for logs and data persistence
- Environment variable loading from `.env`
- Port mapping for web dashboard (3001:3001)

```yaml
# docker-compose.yml
version: '3.8'
services:
  bounty-bot:
    build: .
    env_file: .env
    ports:
      - "3001:3001"
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
```

### Process Manager (PM2)

```javascript
// ecosystem.config.js included
module.exports = {
  apps: [{
    name: 'bounty-bot',
    script: 'dist/agent.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs bounty-bot
pm2 monit
```

### Cloud Platforms

#### Railway
```bash
railway login
railway init
railway up
```

#### Heroku
```bash
heroku create bounty-bot
heroku config:set BOT_PRIVATE_KEY=0x...
heroku config:set OPENAI_API_KEY=sk-...
git push heroku main
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`

#### AWS/GCP/Azure
- Use container services (ECS, Cloud Run, Container Instances)
- Store secrets in managed secret services
- Configure auto-scaling and monitoring

---

## Security

### Critical Security Rules

| ✅ DO | ❌ DON'T |
|-------|----------|
| Keep `.env` out of version control | Commit private keys to git |
| Use environment variables for secrets | Hardcode sensitive data |
| Fund wallet with budget only | Put life savings in bot wallet |
| Use separate keys per environment | Same key for test & production |
| Monitor wallet transactions | Ignore unusual activity |
| Rotate API keys regularly | Use same keys indefinitely |
| Use HTTPS in production | Transmit secrets over HTTP |
| Validate all inputs | Trust external data |

### Private Key Management

```bash
# Generate secure wallet
npm run wallet:create

# Store securely (choose one method)
# Method 1: Environment variable
export BOT_PRIVATE_KEY=0x...

# Method 2: .env file (ensure .gitignore includes .env)
echo "BOT_PRIVATE_KEY=0x..." >> .env

# Method 3: Cloud secrets (recommended for production)
# AWS Secrets Manager, GCP Secret Manager, Azure Key Vault
```

### Gas Management

```bash
# Set reasonable gas limits
MAX_GAS_PRICE_GWEI=50              # Prevents expensive transactions
AUTO_APPROVE_GAS=true              # Enables autonomous operation

# Monitor gas usage
npm run wallet:balance             # Check remaining funds
```

### Audit Trail Verification

The system maintains cryptographic proof of all operations:

```bash
# Verify audit trail integrity
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

### Network Security

```bash
# Use secure RPC endpoints
RPC_URL=https://mainnet.base.org    # Official endpoint
# Or use paid services for better reliability:
# RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## Troubleshooting

### Common Issues & Solutions

#### Wallet Issues

**"Insufficient balance"**
```bash
npm run wallet:balance              # Check current balance
# Send more ETH to the displayed address
```

**"Invalid BOT_PRIVATE_KEY"**
- Must start with `0x`
- Must be exactly 64 hex characters after `0x`
- Generate fresh: `npm run wallet:create`

#### Configuration Issues

**"Invalid OPENAI_API_KEY"**
- Get from: https://platform.openai.com/api-keys
- Must start with `sk-`
- Check for expiration and usage limits

**"Cannot connect to RPC"**
```bash
curl $RPC_URL                       # Test connectivity
# Try alternative RPC endpoints
```

#### Transaction Issues

**"Transaction reverted"**
```bash
MAX_GAS_PRICE_GWEI=100 npm run agent:outside  # Increase gas limit
```

**"Nonce too low"**
- Previous transaction still pending
- Wait for confirmation or cancel pending transaction

#### Runtime Issues

**"No submissions detected"**
- Check `POLLING_INTERVAL` (default 30s)
- Verify bounty is still active on-chain
- Confirm RPC connectivity

**"EXIF validation failing"**
- Submitted photo may be screenshot or AI-generated
- Ensure original photo (not compressed) was submitted

### Diagnostic Commands

```bash
# View recent logs
tail -100 logs/audit-trail.txt

# Watch live logs
tail -f logs/audit-trail.txt

# Filter errors
grep "ERROR" logs/audit-trail.txt

# Check system health
npm run test

# Verify configuration
npm run typecheck
```

### Debug Mode

```bash
# Enable detailed logging
LOG_LEVEL=debug npm run agent:outside

# Simulation mode (no real transactions)
DEMO_MODE=true npm run agent:outside
```

### Support Resources

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/drdeek/poidh-autonomous/issues)
- **Audit Trail**: `logs/audit-trail.txt` for operation history
- **Configuration**: `.env.example` for setup guidance

---

## API Reference

### Core Interfaces

#### BountyConfig
```typescript
interface BountyConfig {
  id: string;                          // Unique identifier
  name: string;                        // Display name
  description: string;                 // Full description
  requirements: string;                // Submission requirements
  proofType: 'photo' | 'video' | 'text';
  selectionMode: 'FIRST_VALID' | 'AI_JUDGED';
  rewardEth: string;                   // Reward amount (e.g., "0.05")
  deadline: number;                    // Unix timestamp
  validation: ValidationCriteria;
  tags?: string[];
}
```

#### ValidationCriteria
```typescript
interface ValidationCriteria {
  requireExif?: boolean;               // Require EXIF metadata
  maxAgeMinutes?: number;              // Maximum photo age
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

#### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;
  score: number;                       // 0-100
  checks: ValidationCheck[];
  summary: string;
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  points: number;
  details: string;
  critical: boolean;
}
```

### Custom Bounty Examples

#### Location-Based Bounty
```typescript
const locationBounty: BountyConfig = {
  id: "eiffel-tower-proof",
  name: "Photo at Eiffel Tower",
  description: "Take a photo at the Eiffel Tower in Paris",
  requirements: "Submit a photo taken within 500m of the Eiffel Tower",
  proofType: "photo",
  selectionMode: "FIRST_VALID",
  rewardEth: "0.1",
  deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours
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
  },
  tags: ["travel", "landmark", "paris"]
};
```

#### AI-Judged Contest
```typescript
const creativeContest: BountyConfig = {
  id: "sunset-photography",
  name: "Best Sunset Photo Contest",
  description: "Submit your most beautiful sunset photograph",
  requirements: "Original sunset photo taken within the last 24 hours",
  proofType: "photo",
  selectionMode: "AI_JUDGED",
  rewardEth: "0.2",
  deadline: Math.floor(Date.now() / 1000) + 172800, // 48 hours
  validation: {
    requireExif: true,
    maxAgeMinutes: 1440, // 24 hours
    rejectScreenshots: true,
    aiValidationPrompt: "Judge based on: color vibrancy, composition, uniqueness, and artistic merit"
  },
  tags: ["photography", "creative", "contest"]
};
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## Changelog

### v2.1.0 (Current)
- **Auto-discovery monitoring** - Monitor command now auto-discovers all bot's bounties
- **Universal chain support** - All logic works identically on any EVM chain
- **Enhanced audit logging** - Comprehensive validation details with reasoning
- **Improved error handling** - Skips invalid submissions, continues monitoring
- **Refined dashboard** - Compact UI with proper activity tracking
- **Smart currency detection** - Automatically uses correct currency (ETH/DEGEN/MATIC)

### v2.0.0
- Multi-chain support (Base, Arbitrum, Degen)
- Enhanced validation system with 8 checks
- AI-powered judging with GPT-4 Vision
- Cryptographic audit trails
- Web dashboard with real-time monitoring
- Enterprise-grade security features

---

**🤖 100% autonomous operation after initialization. Zero human intervention required.**

**For proof of autonomous operation, see [PROOF_OF_AUTONOMY.md](PROOF_OF_AUTONOMY.md)**
