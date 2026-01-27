# Autonomous Bounty Bot for POIDH
A fully autonomous bounty agent that creates, monitors, evaluates, and pays out real-world proof bounties on the [poidh](https://poidh.xyz) platform with **zero human intervention**.
## Task Requirements Checklist
| Requirement | Status | Implementation |
|-------------|--------|----------------|
| ✅ 100% Open Source | **Complete** | MIT License, public repo |
| ✅ Bot Controls Own Wallet | **Complete** | `src/wallet/index.ts` - Bot generates and manages its own private key |
| ✅ Creates POIDH Bounties | **Complete** | `src/contracts/poidh.ts` - Creates solo bounties on POIDH V3 |
| ✅ Real-World Action Bounties | **Complete** | Photos, videos, physical tasks with EXIF validation |
| ✅ Monitors Submissions | **Complete** | `src/bounty/monitor.ts` - Polls blockchain for claims |
| ✅ Autonomous Winner Selection | **Complete** | First-valid (deterministic) or GPT-4 Vision (AI-judged) |
| ✅ Clear Selection Logic | **Complete** | Transparent rationale logged for every decision |
| ✅ Autonomous Payout | **Complete** | `bountyManager.completeBounty()` triggers on-chain payment |
| ✅ Working Demo | **Complete** | `npm run demo:simulate` and production bounty configs |
## How It Works
╔══════════════════════════════════════════════════════════════════════════════╗ ║ AUTONOMOUS BOUNTY BOT FLOW ║ ╠══════════════════════════════════════════════════════════════════════════════╣ ║ ║ ║ 1. CREATE 2. MONITOR 3. EVALUATE 4. PAYOUT ║ ║ ──────── ───────── ────────── ──────── ║ ║ Bot creates Bot polls Bot validates Bot accepts ║ ║ bounty on-chain for new claims each submission winning claim ║ ║ with ETH reward from blockchain autonomously → ETH sent! ║ ║ ║ ║ NO HUMAN INTERVENTION REQUIRED ║ ║ ║ ╚══════════════════════════════════════════════════════════════════════════════╝



### Winner Selection Modes
**FIRST_VALID** - First submission that passes all validation checks wins immediately:
- Deterministic rules (EXIF, freshness, location, keywords)
- No waiting for deadline
- Instant payout on valid submission
**AI_JUDGED** - GPT-4 Vision evaluates all submissions after deadline:
- Collects submissions until deadline
- AI scores each based on creativity/quality criteria
- Best submission wins with detailed rationale
## Quick Start
### 1. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/autonomous-bounty-bot.git
cd autonomous-bounty-bot
npm install
cp .env.example .env
2. Create Bot Wallet
bash


npm run wallet:create
This generates a new wallet. Add the private key to .env:

bash


BOT_PRIVATE_KEY=0x...your_generated_private_key...
3. Fund the Wallet
Send Base ETH to your bot's wallet address for gas fees and bounty rewards.

Check balance:

bash


npm run wallet:balance
4. Configure Environment
bash


# Required
BOT_PRIVATE_KEY=0x...
RPC_URL=https://mainnet.base.org
OPENAI_API_KEY=sk-...
# POIDH V3 Contract (Base Mainnet)
POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
CHAIN_ID=8453
5. Run the Bot
bash


# List available production bounties
npm run agent:list
# Launch a specific bounty type
npm run agent:outside      # Prove you're outdoors (first-valid)
npm run agent:tower        # Object stacking contest (AI-judged)
# Or run with custom bounty type
npm run agent proveOutside
Production Bounty Templates
The bot includes 6 ready-to-use bounty configurations requiring real-world proof:

First-Valid Bounties (instant winner)


Bounty	Command	Reward	Description
Prove Outside	npm run agent:outside	0.003 ETH	Photo proving you're outdoors right now
Handwritten Date	npm run agent:handwritten	0.002 ETH	Handwritten note with today's date + "POIDH"
Meal Photo	npm run agent:meal	0.002 ETH	Photo of your current meal
AI-Judged Bounties (GPT-4 Vision picks winner)


Bounty	Command	Reward	Description
Object Tower	npm run agent:tower	0.005 ETH	Most creative stack of household objects
Shadow Art	npm run agent:shadow	0.004 ETH	Most creative shadow photography
Animal Photo	npm run agent:animal	0.003 ETH	Best photo of a pet or wildlife
Real-World Proof Requirements
All bounties enforce authenticity:

✓ EXIF Data Required - Photo must have valid camera metadata
✓ Freshness Verified - Photo must be taken within time limit (e.g., 30 minutes)
✓ Screenshot Detection - Rejects screenshots of other photos
✓ AI-Generated Detection - Rejects AI-generated images
Winner Selection Logic
First-Valid Mode
typescript


// Validation checks run in order:
1. Proof Content     - Does submission have retrievable content?
2. Media URL         - Is there a valid image/video URL?
3. EXIF Data         - Does photo have camera metadata?
4. Photo Freshness   - Was photo taken within time limit?
5. Screenshot Check  - Is this NOT a screenshot?
6. Location (if req) - Is photo within required radius?
7. Keywords (if req) - Does description contain required words?
// FIRST submission passing ALL checks wins immediately
// Payout triggered automatically - no human review
AI-Judged Mode
typescript


// After deadline:
1. Filter valid submissions (pass basic checks)
2. Send all valid images to GPT-4 Vision
3. AI scores each 0-100 based on:
   - Creativity
   - Technical quality
   - Adherence to prompt
4. Highest score wins
5. Detailed rationale logged
6. Payout triggered automatically
Transparent Decision Making
Every winner selection includes detailed rationale:



╔══════════════════════════════════════════════════════════════════════════════╗
║                           🏆 WINNER ANNOUNCED 🏆                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Bounty: Prove You're Outside Right Now                                      ║
║  Winner: 0x1234...abcd                                                       ║
║  Reward: 0.003 ETH                                                           ║
║  Selection: First Valid Submission                                           ║
║  Payout TX: 0xabcd...1234                                                    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  RATIONALE:                                                                  ║
║  ✅ VALID: Passed 5/5 checks (score: 100/100)                               ║
║  - Proof Content: Content type: PHOTO                                        ║
║  - Media URL: Valid IPFS image found                                         ║
║  - EXIF Data: Verified timestamp 2024-01-15T10:30:00Z (iPhone 15)           ║
║  - Photo Freshness: Taken 12 minutes ago - within 30 minute limit           ║
║  - Screenshot Check: Photo does not appear to be a screenshot               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ Payment executed autonomously - no human intervention                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
POIDH V3 Contract Integration
This bot integrates with POIDH V3 on Base Mainnet:

Contract: 0x5555Fa783936C260f77385b4E153B9725feF1719
Chain: Base Mainnet (Chain ID: 8453)
Fee: 2.5% (250 BPS)
Max Participants: 150 per bounty
Voting Period: 2 days (for open bounties)
Payment Pattern: Pull-based (withdraw() function)
Key Contract Functions Used
typescript


// Create bounty
createSoloBounty(name, description) + { value: rewardWei }
// Accept winning claim (triggers payout)
acceptClaim(bountyId, claimId)
// Monitor claims
getBountyClaims(bountyId) → Claim[]
// Withdraw winnings (for winners)
withdraw()
Running a Demo
Simulation Mode (No Real Transactions)
bash


npm run demo:simulate
This runs through the entire flow with mock data - great for testing.

Live Demo (Real Transactions)
bash


# Make sure wallet is funded first
npm run wallet:balance
# Run a real bounty
npm run agent:outside
The bot will:

Create a bounty on POIDH V3
Start monitoring for submissions
Evaluate each submission as it arrives
Pay out the winner automatically
Architecture


autonomous-bounty-bot/
├── src/
│   ├── agent.ts                    # Main orchestration + CLI entry point
│   │
│   ├── wallet/
│   │   └── index.ts                # Bot wallet management (keys, signing)
│   │
│   ├── contracts/
│   │   ├── abis.ts                 # POIDH V3 ABI definitions
│   │   ├── poidh.ts                # Contract interaction layer
│   │   └── mock-poidh.ts           # Mock for testing
│   │
│   ├── bounty/
│   │   ├── types.ts                # Type definitions + ValidationCriteria
│   │   ├── templates.ts            # Bounty template functions
│   │   ├── manager.ts              # Bounty lifecycle management
│   │   ├── monitor.ts              # Blockchain polling for claims
│   │   └── configs/
│   │       └── production-bounties.ts  # 6 ready-to-use bounty configs
│   │
│   ├── evaluation/
│   │   ├── index.ts                # Evaluation engine coordinator
│   │   ├── validator.ts            # Deterministic validation (EXIF, freshness)
│   │   └── ai-judge.ts             # GPT-4 Vision integration
│   │
│   ├── config/
│   │   └── index.ts                # Environment configuration
│   │
│   └── utils/
│       ├── logger.ts               # Structured logging
│       └── errors.ts               # Custom error types
│
├── .env.example                    # Environment template
├── package.json                    # Scripts and dependencies
└── README.md                       # This file
API Usage
Programmatic Control
typescript


import { agent } from './agent';
import { PRODUCTION_BOUNTIES } from './bounty/configs/production-bounties';
// Initialize
await agent.initialize();
// Launch a production bounty
const bounty = await agent.launchProductionBounty('proveOutside');
// Or create custom bounty
const customBounty = await agent.createBounty({
  id: 'my-bounty',
  name: 'Custom Challenge',
  description: 'Do something cool',
  requirements: 'Photo proof required',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.FIRST_VALID,
  rewardEth: '0.01',
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  validation: {
    requireExif: true,
    maxAgeMinutes: 60,
    rejectScreenshots: true,
  },
  tags: ['custom'],
});
// Start autonomous operation
agent.start();
// Check status
const status = agent.getStatus();
console.log(status);
// { isRunning: true, activeBounties: 1, completedBounties: 0, totalPayouts: 0, network: 'Base Mainnet' }
List Available Bounties
typescript


agent.listAvailableBounties();
// Prints formatted table of all production bounty templates
Environment Variables
bash


# ═══════════════════════════════════════════════════════════════════════════
# REQUIRED
# ═══════════════════════════════════════════════════════════════════════════
# Bot's private key (generate with: npm run wallet:create)
BOT_PRIVATE_KEY=0x...
# RPC endpoint for Base Mainnet
RPC_URL=https://mainnet.base.org
# OpenAI API key for AI-judged bounties
OPENAI_API_KEY=sk-...
# ═══════════════════════════════════════════════════════════════════════════
# POIDH V3 CONTRACT (Base Mainnet defaults)
# ═══════════════════════════════════════════════════════════════════════════
POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
CHAIN_ID=8453
# ═══════════════════════════════════════════════════════════════════════════
# OPTIONAL
# ═══════════════════════════════════════════════════════════════════════════
# Polling interval for checking new submissions (seconds)
POLLING_INTERVAL=30
# Maximum gas price willing to pay (gwei)
MAX_GAS_PRICE_GWEI=50
# Auto-approve gas spending (set false for manual approval)
AUTO_APPROVE_GAS=true
# Demo mode (no real transactions)
DEMO_MODE=false
# Log level (debug, info, warn, error)
LOG_LEVEL=info
# OpenAI model for vision
OPENAI_VISION_MODEL=gpt-4o
NPM Scripts
bash


# Build
npm run build              # Compile TypeScript
# Agent Commands
npm run agent              # Start agent (shows available bounties)
npm run agent:list         # List production bounty templates
npm run agent:outside      # Launch "prove outside" bounty
npm run agent:handwritten  # Launch "handwritten date" bounty
npm run agent:meal         # Launch "meal photo" bounty
npm run agent:tower        # Launch "object tower" bounty (AI-judged)
npm run agent:shadow       # Launch "shadow art" bounty (AI-judged)
npm run agent:animal       # Launch "animal photo" bounty (AI-judged)
# Demos
npm run demo:simulate      # Simulation mode (no real transactions)
npm run demo:first-valid   # Demo first-valid selection
npm run demo:ai-judged     # Demo AI-judged selection
npm run demo:full          # Full demo with both modes
# Wallet
npm run wallet:create      # Generate new bot wallet
npm run wallet:balance     # Check wallet balance
# Development
npm run dev                # Run in development mode
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint
npm run test               # Run tests
Troubleshooting
"Insufficient balance" Error
Your bot wallet needs ETH for gas fees and bounty rewards.

bash


npm run wallet:balance
# If low, send Base ETH to the displayed address
"Cannot find module 'ethers'" Error
Dependencies not installed:

bash


npm install
"Contract call failed" Error
Check that you're on the correct network:

bash


# Verify chain ID in .env
CHAIN_ID=8453  # Base Mainnet
# Verify contract address
POIDH_CONTRACT_ADDRESS=0x5555Fa783936C260f77385b4E153B9725feF1719
OpenAI Rate Limit
For AI-judged bounties, you may hit rate limits:

bash


# Increase delay between AI calls
AI_REQUEST_DELAY=5000
Security Considerations
Private Key: Never commit your .env file. The bot's private key controls all funds.
Wallet Funding: Only fund the bot wallet with what you're willing to use for bounties.
RPC Security: Use authenticated RPC endpoints for production.
Contract Verification: Always verify contract addresses before funding.
License
MIT License - See LICENSE [blocked] for details.

Built for the poidh autonomous bounty challenge.

🤖 This bot operates fully autonomously after initialization - no human intervention required.


