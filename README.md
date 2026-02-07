# POIDH Autonomous Bounty Bot

> **A fully autonomous bounty system that creates, monitors, validates, and pays out real-world proof bounties on EVM-compatible blockchains with zero human intervention.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

---

## Overview

The POIDH Autonomous Bounty Bot manages the entire lifecycle of bounties on EVM-compatible blockchains without human intervention. Once initialized, it creates bounties on-chain via the POIDH V3 contract, monitors for submissions, validates them using deterministic checks and GPT-4 Vision, selects winners, and pays out rewards automatically.

Every action is recorded in a cryptographic audit trail (SHA-256 hash chain) for tamper-evident proof of autonomous operation.

### Key Features

- **100% Autonomous** - Creates bounties, validates submissions, selects winners, and pays out rewards with no human interaction after setup.
- **Multi-Chain** - Operates on Base, Arbitrum, and Degen with chain-aware native currency support (ETH, DEGEN). Additional EVM chains can be added via configuration.
- **Cryptographic Audit Trail** - Every action is logged with SHA-256 hash chaining, producing both machine-readable JSON and human-readable text proof.
- **AI-Powered Judging** - GPT-4 Vision evaluates submissions for subjective creative bounties.
- **Real-Time Dashboard** - Live web UI streams bot activity via WebSocket/SSE with per-action-type rendering, explorer links, and multi-chain awareness.
- **Real-World Proof Validation** - 8 deterministic checks including EXIF verification, freshness detection, screenshot rejection, and AI-generated image detection.

---

## Quick Start

### Prerequisites

- Node.js v18.0.0+
- A small amount of cryptocurrency to fund bounties (e.g., 50 DEGEN, 0.001 ETH)
- An OpenAI API key (optional, only for AI-judged bounties)

### Setup

```bash
git clone https://github.com/drdeeks/poidh.git
cd poidh-autonomous
npm install
```

Generate a wallet:

```bash
npm run wallet:create
```

Configure environment:

```bash
cp .env.example .env
# Edit .env: set BOT_PRIVATE_KEY, RPC_URL, CHAIN_ID, and optionally OPENAI_API_KEY
```

Fund the wallet, then create a bounty:

```bash
npm run wallet:balance
npm run agent:meal -- --chain degen --reward 50
```

Monitor existing bounties:

```bash
npm run agent:monitor -- --chain degen
```

Start the live dashboard (separate terminal):

```bash
npm run server:stream
# Open http://localhost:3001
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATE    │ ──▶ │   MONITOR   │ ──▶ │  VALIDATE   │ ──▶ │   PAYOUT    │
│  (on-chain) │     │ (30s poll)  │     │ (8 checks)  │     │   (auto)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  BOUNTY_CREATED      SUBMISSION_         SUBMISSION_         PAYOUT_
  logged to           RECEIVED            VALIDATED /         CONFIRMED
  audit trail         logged              REJECTED logged     logged + TX hash
```

Every step emits a structured audit trail entry with action type, details, and cryptographic hash.

### Project Structure

```
poidh-autonomous/
├── src/
│   ├── agent.ts                       # Main orchestration agent
│   ├── index.ts                       # Entry point
│   ├── bounty/
│   │   ├── manager.ts                 # Bounty lifecycle management
│   │   ├── monitor.ts                 # Blockchain submission polling
│   │   ├── types.ts                   # TypeScript interfaces (SelectionMode, BountyStatus, etc.)
│   │   ├── templates.ts               # Bounty template helpers
│   │   └── configs/
│   │       └── production-bounties.ts  # Pre-built bounty templates
│   ├── evaluation/
│   │   ├── index.ts                   # Evaluation coordinator
│   │   ├── validator.ts               # 8 deterministic validation checks
│   │   └── ai-judge.ts               # GPT-4 Vision integration
│   ├── contracts/
│   │   ├── poidh.ts                   # POIDH V3 contract interface
│   │   ├── multi-chain.ts            # Multi-chain contract manager
│   │   ├── mock-poidh.ts             # Mock contract for testing
│   │   └── abis.ts                   # Contract ABIs
│   ├── wallet/
│   │   ├── index.ts                   # Wallet operations
│   │   └── multi-chain.ts            # Multi-chain wallet manager
│   ├── config/
│   │   ├── index.ts                   # Environment config loader
│   │   └── chains.ts                  # Chain registry (IDs, RPCs, explorers, contracts)
│   ├── utils/
│   │   ├── audit-trail.ts            # Cryptographic audit trail (SHA-256 hash chain)
│   │   ├── logger.ts                 # Structured logging (winston)
│   │   ├── uri-fetcher.ts            # IPFS/HTTP content fetching + Blockscout
│   │   ├── health.ts                 # System health monitoring
│   │   ├── chain-selector.ts         # Interactive chain selection CLI
│   │   ├── errors.ts                 # Custom error types (AIError, etc.)
│   │   └── fallback.ts              # Graceful shutdown handler
│   ├── server/
│   │   └── streaming-server.ts       # Express + WebSocket + SSE streaming server
│   ├── scripts/                       # CLI utilities (wallet, bounty management)
│   ├── demos/                         # Demo/simulation scripts
│   └── examples/                      # Example configurations
├── web/
│   └── index.html                     # Live dashboard (single-page, no build step)
├── logs/                              # Audit trail JSON/TXT + bot logs
├── data/                              # Persistent data storage
├── tests/                             # Jest test suites
├── docker-compose.yml                 # Docker deployment
├── Dockerfile                         # Container build
├── ecosystem.config.js                # PM2 deployment config
└── PROOF_OF_AUTONOMY.md              # Autonomy verification guide
```

---

## Multi-Chain Support

The bot operates on any chain where POIDH V3 is deployed. Chain configuration is defined in `src/config/chains.ts`.

### Active Chains (POIDH Deployed)

| Chain | Chain ID | Native Currency | POIDH Contract | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Base Mainnet** | 8453 | ETH | `0x5555...1719` | Active |
| **Arbitrum One** | 42161 | ETH | `0x5555...1719` | Active |
| **Degen** | 666666666 | DEGEN | `0x18E5...243f` | Active |

### Testnet / Future Chains

| Chain | Chain ID | Native Currency | Status |
| :--- | :--- | :--- | :--- |
| Base Sepolia | 84532 | ETH | Enabled, contract TBD |
| Arbitrum Sepolia | 421614 | ETH | Disabled |
| Ethereum Mainnet | 1 | ETH | Disabled |
| Sepolia | 11155111 | ETH | Disabled |
| Polygon | 137 | MATIC | Disabled |
| Optimism | 10 | ETH | Disabled |

### Adding a New Chain

Add an entry to the `CHAINS` record in `src/config/chains.ts`:

```typescript
12345: {
  chainId: 12345,
  name: 'My Chain',
  nativeCurrency: 'MYC',
  rpcUrls: ['https://rpc.mychain.io'],
  blockExplorerUrls: ['https://explorer.mychain.io'],
  poidhContractAddress: '0x...',
  enabled: true,
},
```

---

## Validation System

### 8 Deterministic Checks

Each submission is scored against these checks (total score out of 100, threshold of 50 to pass):

1. **Proof Content** - Verifies content exists and is accessible
2. **Valid Media** - Confirms media URL resolves to a valid image/video
3. **EXIF Data** - Detects real camera metadata (device, timestamp)
4. **Photo Freshness** - Ensures the photo was taken recently (configurable `maxAgeMinutes`)
5. **Screenshot Detection** - Rejects screenshots based on EXIF patterns
6. **AI-Generated Detection** - Flags AI-generated images
7. **Location Match** - Verifies GPS coordinates against required location (optional)
8. **Time Window** - Validates submission timing against bounty deadline (optional)

### Selection Modes

- **FIRST_VALID** - First submission scoring >= 50/100 wins immediately. The agent pays out as soon as a valid submission is found.
- **AI_JUDGED** - All submissions are collected until deadline. GPT-4 Vision evaluates and selects the best entry with detailed reasoning.
- **COMMUNITY_VOTE** - Community voting determines winner (open bounties on POIDH).

---

## Audit Trail

Every autonomous action produces a cryptographic audit entry with:

- Sequence number and timestamp
- Action type and structured details
- SHA-256 hash linking to previous entry (tamper-evident chain)
- Transaction hash and block explorer URL (for on-chain actions)

### Action Types

| Action | Description |
| :--- | :--- |
| `AGENT_STARTED` | Agent initialized with chain, contract, and wallet info |
| `AGENT_STOPPED` | Agent shut down |
| `BOUNTY_CREATED` | Bounty created on-chain with reward, selection mode, proof type |
| `BOUNTIES_AUTO_INDEXED` | Auto-discovery of bot's existing bounties with chain/currency details |
| `SUBMISSION_RECEIVED` | New submission detected on-chain |
| `SUBMISSION_VALIDATED` | Submission evaluated with per-check breakdown and score |
| `SUBMISSION_REJECTED` | Submission failed validation with reason and failed/passed checks |
| `AI_EVALUATION_STARTED` | GPT-4 Vision evaluation initiated |
| `AI_EVALUATION_COMPLETED` | AI evaluation finished with score, confidence, reasoning |
| `SCORING_BREAKDOWN` | Detailed component scores and formula |
| `WINNER_SELECTED` | Winner chosen with selection method and rationale |
| `WINNER_RATIONALE` | Full decision rationale: checks, AI evaluation, competitor summary |
| `PAYOUT_CONFIRMED` | Payment executed on-chain with TX hash, reward amount, chain info |
| `ERROR` | Error encountered during operation |

Output files:
- `logs/audit-trail.json` - Machine-readable, verifiable
- `logs/audit-trail.txt` - Human-readable summary

---

## Live Dashboard

The streaming server (`npm run server:stream`) serves a web dashboard at `http://localhost:3001` with:

- **Real-time audit trail** - All entries rendered with action-specific formatting (box-drawing UI for validations, rejections, payouts, winner rationale)
- **Chain information** - Chain name, ID, native currency, contract address (linked to block explorer)
- **Activity summary** - Bounties created, submissions validated, winners paid
- **Multi-chain awareness** - Correct currency display (ETH/DEGEN/MATIC), per-chain explorer links
- **SSE + WebSocket streaming** - Live updates without page refresh
- **Color-coded entries** - Green for valid/payout, red for errors/rejections, gold for winners

### API Endpoints

| Endpoint | Description |
| :--- | :--- |
| `GET /health` | Health check with chain info |
| `GET /api/audit-state` | Full audit trail state + summary + chain context |
| `GET /api/recent-entries` | Recent entries (enriched with explorer URLs) |
| `GET /api/winners` | Winner rationale entries |
| `GET /api/rejections` | Rejected submissions with reasons |
| `GET /api/decisions` | All validation decisions (accepted + rejected) |
| `GET /api/indexed-bounties` | Auto-indexed bounty discovery events |
| `GET /api/bounties` | All bounties (created + auto-indexed, chain-aware) |
| `GET /api/stream` | Server-Sent Events live stream |

---

## Commands Reference

### Agent Operations

| Command | Description |
| :--- | :--- |
| `npm run agent` | Interactive mode with chain selection |
| `npm run agent:outside` | Create "prove you're outdoors" bounty |
| `npm run agent:handwritten` | Create handwritten date proof bounty |
| `npm run agent:meal` | Create meal photo bounty |
| `npm run agent:tower` | Create object stacking contest (AI-judged) |
| `npm run agent:shadow` | Create shadow art contest (AI-judged) |
| `npm run agent:animal` | Create pet/wildlife photo contest (AI-judged) |
| `npm run agent:list` | List available bounty templates |
| `npm run agent:monitor` | Auto-discover and monitor all bot bounties |

Flags: `--chain <name>` (base, arbitrum, degen) and `--reward <amount>` (in native currency).

### Bounty Management

| Command | Description |
| :--- | :--- |
| `npm run bounty:list` | List all active bounties |
| `npm run bounty:claims` | Check claims on active bounties |
| `npm run bounty:cancel` | Cancel a bounty and refund |
| `npm run bounty:continuous` | Continuous bounty creation loop |

### Wallet

| Command | Description |
| :--- | :--- |
| `npm run wallet:create` | Generate a new wallet |
| `npm run wallet:balance` | Check wallet balance |

### Development

| Command | Description |
| :--- | :--- |
| `npm run build` | Compile TypeScript |
| `npm run dev` | Run with ts-node |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier format |
| `npm run server:stream` | Start live dashboard |

---

## Deployment

### Docker

```bash
docker-compose up -d --build
```

The `docker-compose.yml` includes the streaming server on port 3001.

### PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Cloud

Compatible with Railway, Heroku, DigitalOcean, or any Node.js host. Set environment variables via the platform's secrets management.

---

## Configuration

All configuration is via environment variables. See `.env.example` for the full list with documentation.

### Required

| Variable | Description |
| :--- | :--- |
| `BOT_PRIVATE_KEY` | Bot wallet private key (hex, starts with `0x`) |
| `RPC_URL` | Blockchain RPC endpoint |

### Key Optional Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CHAIN_ID` | `8453` | Primary chain ID |
| `SUPPORTED_CHAINS` | Primary chain only | Comma-separated chain IDs (e.g., `8453,42161,666666666`) |
| `POIDH_CONTRACT_ADDRESS` | Per-chain default | Override contract address |
| `OPENAI_API_KEY` | - | Required for AI-judged bounties |
| `OPENAI_VISION_MODEL` | `gpt-4o` | GPT model for image evaluation |
| `POLLING_INTERVAL` | `30` | Blockchain poll interval (seconds) |
| `MAX_GAS_PRICE_GWEI` | `50` | Max gas price for transactions |
| `DEMO_MODE` | `false` | Simulate without real transactions |
| `STREAMING_PORT` | `3001` | Dashboard port |
| `LOG_LEVEL` | `info` | Logging verbosity (debug/info/warn/error) |

---

## Security

- **Never** commit `.env` to version control.
- Use a dedicated wallet with limited funds.
- Rotate API keys regularly.
- Use HTTPS-enabled RPC endpoints from trusted providers.
- Monitor wallet transactions via block explorer.

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| "Insufficient balance" | Send more funds to the bot wallet |
| "Invalid BOT_PRIVATE_KEY" | Must be 66 characters starting with `0x` |
| "Cannot connect to RPC" | Check `RPC_URL` and network connectivity |
| Port 3001 in use | `docker stop streaming-server` or `fuser -k 3001/tcp` |
| Blank audit entries | Test entries with `{"test": true}` display as "(test entry)" |

Debug mode: `LOG_LEVEL=debug npm run agent:monitor -- --chain degen`

---

## License

MIT License. See [LICENSE](LICENSE).
