# 🏆 Bounty Submission: Autonomous POIDH Bot

## Summary

I built a fully autonomous AI bot that creates, monitors, evaluates, and pays out POIDH bounties end-to-end with zero human intervention.

---

## ✅ Requirements Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 100% Open Source | ✅ | [GitHub Repository](https://github.com/drdeeks/poidh) |
| Controls its own wallet | ✅ | `0x81Bf3722303ed8Edb9F81e2C4c8ac0b32641129E` |
| Creates POIDH bounties | ✅ | Bounty #17 created on-chain |
| Monitors submissions | ✅ | Enterprise URI fetcher with multi-strategy fallback |
| Selects winner autonomously | ✅ | First-valid + AI-judged modes |
| Explains reasoning | ✅ | Cryptographic audit trail with rationale |
| Real-world proof bounties | ✅ | Photo verification with EXIF checks |
| Working demo | ✅ | Bounty #17 completed end-to-end |

---

## 📦 Open Source Repository

**Repository:** https://github.com/drdeeks/poidh

The entire codebase is MIT licensed and publicly available.

### Key Files

| File | Purpose |
|------|---------|
| `src/agent.ts` | Main autonomous agent orchestrator |
| `src/bounty/manager.ts` | Bounty lifecycle management |
| `src/bounty/monitor.ts` | Submission detection & processing |
| `src/evaluation/ai-judge.ts` | GPT-4 Vision evaluation engine |
| `src/evaluation/validator.ts` | Deterministic validation rules |
| `src/contracts/poidh.ts` | POIDH V3 contract interface |
| `src/utils/uri-fetcher.ts` | Enterprise-grade claim URI fetcher |
| `src/utils/audit-trail.ts` | Cryptographic proof of autonomous operation |

---

## 🤖 Bot Wallet

**Address:** `0x81Bf3722303ed8Edb9F81e2C4c8ac0b32641129E`

The bot controls this wallet autonomously. Private key is stored in environment variables and never exposed.

---

## 🎯 Live Demos: Two Completed Bounties

The bot has successfully run **two bounties** end-to-end with strangers from the POIDH community.

---

### Bounty #16: 📝 Handwritten Date Challenge

| Field | Value |
|-------|-------|
| **Bounty ID** | 16 |
| **Name** | 📝 Handwritten Date Challenge |
| **Status** | ✅ Completed |
| **Winner** | `0x15C6a4bF9023Ad20C51CbEa9992A5bcCf83F3e7B` |
| **Claim ID** | 68 |
| **POIDH Link** | https://poidh.xyz/base/bounty/16 |

**Proof Image:** A handwritten note with the date, submitted by a stranger.

---

### Bounty #17: 🌳 Prove You're Outside Right Now

- **Name:** 🌳 Prove You're Outside Right Now
- **Reward:** 0.001 ETH
- **Type:** FIRST_VALID (first valid submission wins)
- **Proof Required:** Photo proving you're outdoors

**Creation TX:** [`0x1ae55491100aef71394603b641ac0100fbd75c1d67079430bc6764dee0b26dd5`](https://basescan.org/tx/0x1ae55491100aef71394603b641ac0100fbd75c1d67079430bc6764dee0b26dd5)

#### Submissions Received

The bot detected multiple submissions from strangers on the POIDH platform:

| Claim ID | Submitter | Status |
|----------|-----------|--------|
| 79 | `0x49A2B63216cb9A57C2425A6702166A90A18bA293` | ✅ Winner |
| 77 | `0x15BC3d0732fe5345fFf85841165A906348E84139` | Evaluated |
| 71 | `0x9184a6a03486381e2087616dab51AcB94563aFA5` | Evaluated |
| 70 | `0x9184a6a03486381e2087616dab51AcB94563aFA5` | Evaluated |

**Note:** These submitters are strangers discovered through POIDH - not known to the bot operator.

#### Winner Selection

The bot autonomously selected claim #79 as the winner:

```
Winner: 0x49A2B63216cb9A57C2425A6702166A90A18bA293
Method: First Valid Submission
Rationale: Submission passed all validation checks (proof URI valid, image retrievable)
```

#### Payout Executed

**Payout TX:** [`0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5`](https://basescan.org/tx/0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5)

The bot accepted the claim on-chain, triggering automatic ETH transfer to the winner.

---

## 🧠 Winner Selection Logic

The bot supports two selection modes:

### 1. FIRST_VALID Mode (Used for Bounty #17)

Deterministic, transparent logic:

```
1. Poll for new claims every 30 seconds
2. For each new claim:
   a. Fetch proof URI from ClaimCreated event (via Blockscout or RPC)
   b. Validate URI is accessible
   c. Fetch proof content (image/video)
   d. Run validation checks:
      - Proof type matches requirements
      - Media is retrievable
      - (Optional) EXIF data present
      - (Optional) AI authenticity check
   e. If all checks pass → WINNER, trigger payout
   f. If checks fail → log rejection reason, continue to next claim
```

### 2. AI_JUDGED Mode

For creative/subjective bounties:

```
1. Wait for deadline to pass
2. Collect all submissions
3. For each submission:
   a. Send image to GPT-4 Vision
   b. Evaluate against bounty criteria
   c. Score 0-100 with detailed reasoning
   d. Check for AI-generated content
4. Rank submissions by score
5. Select highest-scoring valid submission as winner
6. Log full rationale to audit trail
```

---

## 📋 Audit Trail (Proof of Autonomous Operation)

The bot maintains a cryptographic audit trail proving no human intervention occurred.

**Evidence snapshot:** [`evidence/`](./evidence/) (committed to repo)  
**Runtime logs:** `logs/` (gitignored, regenerated each run)

### Sample Entries

```
[0002] 2026-01-27T18:22:26.642Z
       Action: BOUNTY_CREATED
       Bounty: 🌳 Prove You're Outside Right Now
       Reward: 0.001 ETH
       On-Chain ID: 17
       TX Hash: 0x1ae55491...
       Entry Hash: 768bb1a53d39ac7c...

[0006] 2026-01-28T04:39:08.773Z
       Action: WINNER_SELECTED
       Bounty: existing-17
       Winner: 0x49A2B63216cb9A57C2425A6702166A90A18bA293
       Method: first_valid
       Entry Hash: 6b489f1c2829b8af...

[0007] 2026-01-28T04:39:09.981Z
       Action: PAYOUT_CONFIRMED
       Bounty: existing-17
       Winner: 0x49A2B63216cb9A57C2425A6702166A90A18bA293
       Reward: 0.001 ETH
       TX Hash: 0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5
       Entry Hash: b48aafb988980779...
```

Each entry is hashed and linked to the previous entry (blockchain-style), making tampering detectable.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS BOUNTY AGENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Bounty     │    │  Submission  │    │  Evaluation  │       │
│  │   Manager    │───▶│   Monitor    │───▶│   Engine     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   POIDH V3   │    │     URI      │    │   AI Judge   │       │
│  │   Contract   │    │   Fetcher    │    │  (GPT-4V)    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                       │                │
│         └───────────────┬───────────────────────┘                │
│                         ▼                                        │
│                  ┌──────────────┐                                │
│                  │ Audit Trail  │                                │
│                  │  (Crypto)    │                                │
│                  └──────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Base Mainnet   │
                    │   POIDH V3       │
                    │   0x5555...1719  │
                    └──────────────────┘
```

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/drdeeks/poidh
cd poidh

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your wallet private key and OpenAI API key

# Build
npm run build

# Run agent with a bounty type
npm run agent proveOutside

# Or monitor an existing bounty
npm run agent monitor <bountyId>
```

---

## 📊 Transaction Proof

All transactions are verifiable on-chain:

| Bounty | Action | Link |
|--------|--------|------|
| #16 | Bounty Page | [poidh.xyz/base/bounty/16](https://poidh.xyz/base/bounty/16) |
| #17 | Bounty Creation | [0x1ae554...](https://basescan.org/tx/0x1ae55491100aef71394603b641ac0100fbd75c1d67079430bc6764dee0b26dd5) |
| #17 | Winner Payout | [0x8cd917...](https://basescan.org/tx/0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5) |

---

## 🔒 Security & Trust

- **No human intervention possible:** Once started, the bot operates autonomously
- **Transparent logic:** All decision-making code is open source
- **Cryptographic audit:** Hash-chained logs prove operation sequence
- **On-chain verification:** All actions have verifiable transaction hashes

---

## 📝 License

MIT License - fully open source

---

## 🎉 Conclusion

This bot demonstrates a complete, working implementation of an autonomous AI that:

1. ✅ Creates real-world proof bounties on POIDH
2. ✅ Monitors for submissions from strangers
3. ✅ Evaluates submissions with transparent logic
4. ✅ Pays out winners automatically
5. ✅ Documents everything with cryptographic proof

**The future of human-AI coordination is here.** 🤖💰🌍
