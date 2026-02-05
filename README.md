# 🤖 Autonomous Bounty Bot

> A bot that runs bounty contests on the blockchain **with zero human help**.

---

## What It Does (ELI5)

The bot is like an **automatic game show host**:

1. **Creates a contest** → "Hey! First person to prove they're outside wins $5!"
2. **Waits for entries** → Checks every 30 seconds if anyone submitted
3. **Picks the winner** → Runs 8 tests to make sure the photo is real
4. **Pays the prize** → Sends money to the winner automatically

**All of this happens 100% on its own. No human clicks anything.**

---

## 🔍 Proof at Every Stage

The bot creates a **tamper-proof audit trail** that proves every decision was made autonomously.

### Stage 1: Bounty Created

```
📋 AUDIT LOG:
[0001] 2024-01-15T10:00:00.000Z
       Action: BOUNTY_CREATED
       Bounty: Prove You're Outdoors Right Now
       Reward: 0.05 ETH
       On-Chain ID: 42
       TX Hash: 0xabc123...
       Explorer: https://basescan.org/tx/0xabc123...
```

✅ **You can verify:** Click the explorer link → See the transaction on the blockchain

---

### Stage 2: Submission Received

```
📋 AUDIT LOG:
[0002] 2024-01-15T10:15:00.000Z
       Action: SUBMISSION_RECEIVED
       Bounty: bounty-42
       Submitter: 0x7890...
       Claim ID: 17
```

✅ **You can verify:** The claim is recorded on-chain with the submitter's address

---

### Stage 3: Submission Validated

```
📋 AUDIT LOG:
[0003] 2024-01-15T10:15:05.000Z
       Action: SUBMISSION_VALIDATED
       ┌──────────────────────────────────────────────────────────────────────
       │ SUBMISSION VALIDATION RESULT
       ├──────────────────────────────────────────────────────────────────────
       │ Status: ✓ VALID
       │ Validation Score: 85/100
       │
       │ SCORING BREAKDOWN:
       │   ✓ Proof Content (20 pts): Content type: photo
       │   ✓ Media URL (20 pts): Media found: ipfs://Qm...
       │   ✓ EXIF Data (15 pts): Photo taken 2024-01-15T10:14:00 (iPhone 15)
       │   ✓ Photo Freshness (20 pts): Photo taken 1 minute ago - within 10 min limit ✓
       │   ✓ Screenshot Check (15 pts): Photo does not appear to be a screenshot
       └──────────────────────────────────────────────────────────────────────
```

✅ **You can verify:** Every check is documented with its score

---

### Stage 4: Winner Selected + Paid

```
📋 AUDIT LOG:
[0004] 2024-01-15T10:15:10.000Z
       Action: WINNER_RATIONALE
       ┌──────────────────────────────────────────────────────────────────────
       │ WINNER SELECTION RATIONALE
       ├──────────────────────────────────────────────────────────────────────
       │ Bounty: Prove You're Outdoors Right Now
       │ Selection Mode: First Valid Submission
       │ Winner: 0x7890...
       │
       │ DECISION: First submission to pass all validation checks (score 85/100)
       │           No other valid submissions at time of selection.
       └──────────────────────────────────────────────────────────────────────

[0005] 2024-01-15T10:15:15.000Z
       Action: PAYOUT_CONFIRMED
       Winner: 0x7890...
       Reward: 0.05 ETH
       TX Hash: 0xdef456...
       Explorer: https://basescan.org/tx/0xdef456...
```

✅ **You can verify:** Click the explorer link → See 0.05 ETH sent to the winner

---

## View the Proof

```bash
# Human-readable log
cat logs/audit-trail.txt

# Machine-readable (JSON)
cat logs/audit-trail.json
```

The audit trail uses **SHA-256 hash chains** - if anyone tries to modify an entry, the chain breaks and the tampering is detectable.

---

## ⚡ Quick Start (5 min)

```bash
git clone https://github.com/drdeeks/poidh.git && cd Poidh-autonomous && npm install
npm run wallet:create
cp .env.example .env
# Edit .env: add BOT_PRIVATE_KEY, OPENAI_API_KEY
npm run wallet:balance     # Send 0.01+ ETH to shown address
npm run bounty:continuous  # Start the bot
```

**Full setup:** [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)

---

## 📊 The 8 Validation Checks

| Check | Points | What It Proves |
|-------|--------|----------------|
| Proof exists | 20 | Photo was submitted |
| Valid media | 20 | Photo can be viewed |
| EXIF data | 15 | Real camera took it (not AI-generated) |
| Photo fresh | 20 | Taken recently (not an old photo) |
| Not screenshot | 15 | Original photo (not screenshot of photo) |
| Location match | 30 | At the right GPS coordinates (if required) |
| Time window | 20 | During allowed hours (if required) |
| Keywords | 10 | Required words present (if required) |

**Need 50+ points to win.**

---

## 🎯 Two Selection Modes

### FIRST_VALID
First submission that scores 50+ wins **immediately**.

### AI_JUDGED
All submissions collected until deadline, then **GPT-4 Vision picks the best one**.

---

## 💻 Commands

```bash
# Create bounties
npm run agent:outside              # Outdoor photo proof
npm run bounty:continuous          # Auto-create bounties 24/7

# Wallet
npm run wallet:create              # Generate wallet
npm run wallet:balance             # Check balance

# View proof
cat logs/audit-trail.txt           # Human-readable audit log
```

**All commands:** [docs/TECHNICAL.md](docs/TECHNICAL.md#commands)

---

## 🌐 Supported Chains

| Chain | Status | Contract |
|-------|--------|----------|
| Base | ✅ Live | `0x5555Fa783936C260f77385b4E153B9725feF1719` |
| Arbitrum | ✅ Live | `0x5555Fa783936C260f77385b4E153B9725feF1719` |
| Degen | ✅ Live | `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f` |

---

## 📁 Project Structure

```
src/
├── agent.ts              # Main bot orchestration
├── bounty/               # Bounty creation & monitoring
├── evaluation/           # Validation & scoring (8 checks)
├── contracts/            # Smart contract interaction
├── wallet/               # Wallet management
└── utils/audit-trail.ts  # Proof generation

logs/
├── audit-trail.txt       # Human-readable proof
└── audit-trail.json      # Machine-readable proof
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** | 5-minute setup |
| **[TECHNICAL.md](docs/TECHNICAL.md)** | Complete technical reference |

---

## 🔐 Security

- ✅ Never commit `.env` 
- ✅ Never share `BOT_PRIVATE_KEY`
- ✅ Fund wallet with only what you're willing to spend

---

## License

MIT - See [LICENSE](LICENSE)

---

**🤖 100% autonomous after initialization. Zero human intervention.**

**→ [Start Here](docs/GETTING_STARTED.md)**
