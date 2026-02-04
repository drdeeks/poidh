# Autonomous Bounty Bot - Logic & Operations Guide

This document provides a comprehensive explanation of how the POIDH Autonomous Bounty Bot operates, including its decision-making logic, scoring system, winner selection process, and audit trail.

---

## Table of Contents

1. [Overview](#overview)
2. [Autonomous Operation Flow](#autonomous-operation-flow)
3. [Scoring System](#scoring-system)
4. [Winner Selection Logic](#winner-selection-logic)
5. [Audit Trail & Verification](#audit-trail--verification)
6. [File Reference Guide](#file-reference-guide)

---

## Overview

The Autonomous Bounty Bot is a fully autonomous agent that:

- **Creates bounties** on the POIDH V3 smart contract (Base Mainnet)
- **Monitors** for incoming submissions via blockchain events
- **Validates** submissions using deterministic checks and AI evaluation
- **Selects winners** using transparent, auditable criteria
- **Executes payouts** automatically with no human intervention

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Autonomy** | Zero human intervention after initialization |
| **Transparency** | All decisions logged with full reasoning |
| **Verifiability** | Hash-chained audit trail proves integrity |
| **Fairness** | Deterministic scoring with clear criteria |

---

## Autonomous Operation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS BOUNTY LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. INITIALIZATION                                                     │
│   └─> Agent wallet loaded                                               │
│   └─> Contract connection established                                   │
│   └─> Audit trail initialized                                           │
│                                                                         │
│   2. BOUNTY CREATION                                                    │
│   └─> Bounty config loaded (reward, deadline, criteria)                 │
│   └─> On-chain transaction submitted                                    │
│   └─> Audit entry: BOUNTY_CREATED                                       │
│                                                                         │
│   3. SUBMISSION MONITORING                                              │
│   └─> Blockchain events polled every 10 seconds                         │
│   └─> New claims detected and queued                                    │
│   └─> Audit entry: SUBMISSION_RECEIVED                                  │
│                                                                         │
│   4. VALIDATION & SCORING                                               │
│   └─> Deterministic validation checks run                               │
│   └─> Score calculated (0-100)                                          │
│   └─> AI evaluation (if configured)                                     │
│   └─> Audit entry: SUBMISSION_VALIDATED / SUBMISSION_REJECTED           │
│                                                                         │
│   5. WINNER SELECTION                                                   │
│   └─> Selection mode determines winner                                  │
│   └─> Full rationale documented                                         │
│   └─> Audit entry: WINNER_RATIONALE, WINNER_SELECTED                    │
│                                                                         │
│   6. PAYOUT EXECUTION                                                   │
│   └─> On-chain claim accepted                                           │
│   └─> Funds transferred to winner                                       │
│   └─> Audit entry: PAYOUT_CONFIRMED                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scoring System

### Validation Score Calculation

Each submission receives a **validation score from 0-100** based on passing deterministic checks. The score is calculated as:

```
Final Score = (Total Points Earned / Maximum Possible Points) × 100
```

### Scoring Components

| Check | Max Points | Description |
|-------|------------|-------------|
| **Proof Content** | 20 pts | Submission contains retrievable proof data |
| **Media URL** | 20 pts | Valid image/video URL present (for photo/video bounties) |
| **Location** | 30 pts | GPS coordinates within required radius |
| **Time Window** | 20 pts | Photo/submission within allowed time window |
| **Required Keywords** | 10 pts | All required keywords found in description |
| **EXIF Data** | 15 pts | Valid EXIF metadata with timestamp |
| **Photo Freshness** | 20 pts | Photo taken within configured time limit |
| **Screenshot Check** | 15 pts | Photo is not a screenshot |

### Score Thresholds

| Score Range | Result |
|-------------|--------|
| **≥ 50** | Valid (eligible to win) |
| **< 50** | Invalid (rejected) |

### Critical Checks

Certain checks are **critical** - failing them results in automatic rejection regardless of score:

- Proof Content (must have retrievable proof)
- Media URL (must have media for photo/video bounties)
- EXIF Data (if `requireExif` is enabled)
- Photo Freshness (if `maxAgeMinutes` is configured)
- Screenshot Check (if `rejectScreenshots` is enabled)

### AI Evaluation Score

For AI-judged bounties, GPT-4 Vision provides an additional score:

| Component | Range | Description |
|-----------|-------|-------------|
| **AI Score** | 0-100 | Quality/compliance score from GPT-4 Vision |
| **Confidence** | 0-100% | How confident the AI is in its judgment |
| **Authenticity** | Pass/Fail | Whether the image appears to be real (not AI-generated) |

---

## Winner Selection Logic

### Selection Mode: FIRST_VALID

The first submission that passes all validation checks wins immediately.

```
FOR each unvalidated submission (in order received):
  1. Run all validation checks
  2. Calculate validation score
  3. IF score ≥ 50 AND no critical failures:
     → WINNER FOUND
     → Execute payout immediately
     → Stop processing
  4. ELSE:
     → Log rejection with full details
     → Continue to next submission
```

**Decision Criteria:**
- First submission with score ≥ 50
- No critical check failures
- Order determined by blockchain timestamp

### Selection Mode: AI_JUDGED

After the deadline, GPT-4 Vision evaluates all valid submissions and picks the best.

```
1. Wait for deadline to pass
2. Collect all submissions
3. Filter to valid submissions (score ≥ 50)
4. FOR each valid submission:
   → Send to GPT-4 Vision for evaluation
   → Receive score, confidence, and reasoning
5. Rank submissions by AI score (highest first)
6. Select highest-scoring valid submission as winner
7. Execute payout
```

**Decision Criteria:**
- Highest AI score among valid submissions
- Must pass basic validation (score ≥ 50)
- AI confidence considered in reasoning

### Winner Rationale Documentation

Every winner selection is documented with:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ WINNER SELECTION RATIONALE                                               │
├──────────────────────────────────────────────────────────────────────────┤
│ Bounty: [Bounty Name] ([Bounty ID])                                      │
│ Selection Mode: First Valid / AI Judged                                  │
│ Winner: [Wallet Address]                                                 │
│ Claim ID: [On-chain Claim ID]                                            │
│ Competitors: [Number of other submissions]                               │
│                                                                          │
│ VALIDATION CHECKS:                                                       │
│   ✓ Proof Content: Content type: photo                                   │
│   ✓ Media URL: Media found: https://...                                  │
│   ✓ EXIF Data: EXIF verified: 2026-01-28T10:30:00Z (iPhone 15)          │
│   ✓ Photo Freshness: Photo taken 5 minutes ago                           │
│   ✓ Screenshot Check: Photo does not appear to be a screenshot           │
│                                                                          │
│ AI EVALUATION (gpt-4o):                                                  │
│   Score: 85/100                                                          │
│   Confidence: 92%                                                        │
│   Reasoning: The image clearly shows...                                  │
│                                                                          │
│ OTHER SUBMISSIONS:                                                       │
│   0x1234abcd... - invalid (score: 35) - Failed EXIF check               │
│   0x5678efgh... - valid_but_lost (score: 72) - Submitted after winner   │
│                                                                          │
│ DECISION: FIRST VALID SUBMISSION - Passed 5/5 validation checks         │
│           with score 85/100. First submission to meet all requirements.  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Audit Trail & Verification

### Location of Audit Files

| File | Path | Purpose |
|------|------|---------|
| **JSON Log** | `logs/audit-trail.json` | Machine-readable, complete data |
| **Text Report** | `logs/audit-trail.txt` | Human-readable summary |

### Audit Entry Types

| Action | Description |
|--------|-------------|
| `AGENT_STARTED` | Bot initialization with wallet/contract info |
| `BOUNTY_CREATED` | New bounty created on-chain |
| `SUBMISSION_RECEIVED` | New claim detected |
| `SUBMISSION_VALIDATED` | Full validation with scoring breakdown |
| `SUBMISSION_REJECTED` | Submission failed validation |
| `SCORING_BREAKDOWN` | Detailed component scores |
| `WINNER_RATIONALE` | Comprehensive winner decision documentation |
| `WINNER_SELECTED` | Winner chosen with method info |
| `PAYOUT_CONFIRMED` | On-chain payout executed |

### Cryptographic Integrity

Each audit entry contains:

```json
{
  "sequence": 42,
  "timestamp": "2026-01-28T10:30:00.000Z",
  "action": "WINNER_SELECTED",
  "details": { ... },
  "previousHash": "abc123...",
  "entryHash": "def456..."
}
```

**Hash Chain Verification:**
1. Each entry's `entryHash` = SHA-256(sequence + timestamp + action + details + previousHash)
2. Each entry's `previousHash` must match the prior entry's `entryHash`
3. First entry uses `previousHash = "GENESIS"`

### Verifying the Audit Trail

```typescript
// Verification algorithm
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  
  // Check sequence
  if (entry.sequence !== i) throw "Sequence mismatch";
  
  // Check hash chain
  const expectedPrevHash = i === 0 ? "GENESIS" : entries[i-1].entryHash;
  if (entry.previousHash !== expectedPrevHash) throw "Chain broken";
  
  // Verify entry hash
  const calculatedHash = SHA256(entry without entryHash);
  if (calculatedHash !== entry.entryHash) throw "Entry tampered";
}
```

---

## File Reference Guide

### Core Logic Files

| File | Purpose |
|------|---------|
| [`src/agent.ts`](src/agent.ts) | Main orchestration agent - bounty lifecycle management |
| [`src/evaluation/validator.ts`](src/evaluation/validator.ts) | Deterministic validation and scoring |
| [`src/evaluation/ai-judge.ts`](src/evaluation/ai-judge.ts) | GPT-4 Vision evaluation |
| [`src/evaluation/index.ts`](src/evaluation/index.ts) | Evaluation engine combining validation + AI |

### Supporting Files

| File | Purpose |
|------|---------|
| [`src/utils/audit-trail.ts`](src/utils/audit-trail.ts) | Cryptographic audit logging |
| [`src/bounty/types.ts`](src/bounty/types.ts) | Type definitions for bounties, submissions, scores |
| [`src/bounty/manager.ts`](src/bounty/manager.ts) | Bounty state management |
| [`src/bounty/monitor.ts`](src/bounty/monitor.ts) | Blockchain event monitoring |
| [`src/contracts/poidh.ts`](src/contracts/poidh.ts) | Smart contract interaction |

### Output Files

| File | Purpose |
|------|---------|
| `logs/audit-trail.json` | Machine-readable audit log |
| `logs/audit-trail.txt` | Human-readable audit report |
| `logs/app-*.log` | Application logs with timestamps |

### Configuration

| File | Purpose |
|------|---------|
| [`src/config/index.ts`](src/config/index.ts) | Environment configuration |
| [`src/bounty/configs/production-bounties.ts`](src/bounty/configs/production-bounties.ts) | Pre-configured bounty templates |
| [`.env.example`](.env.example) | Environment variable template |

---

## Quick Reference: Scoring Formula

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCORING FORMULA                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   VALIDATION SCORE = (Earned Points / Max Points) × 100                 │
│                                                                         │
│   Points by Check:                                                      │
│   ┌────────────────────┬────────┬─────────────────────────────────────┐ │
│   │ Check              │ Points │ Condition                           │ │
│   ├────────────────────┼────────┼─────────────────────────────────────┤ │
│   │ Proof Content      │ 20     │ Always checked                      │ │
│   │ Media URL          │ 20     │ Photo/Video bounties only           │ │
│   │ Location           │ 30     │ If location criteria set            │ │
│   │ Time Window        │ 20     │ If time window criteria set         │ │
│   │ Keywords           │ 10     │ If required keywords set            │ │
│   │ EXIF Data          │ 15     │ If requireExif enabled              │ │
│   │ Photo Freshness    │ 20     │ If maxAgeMinutes set                │ │
│   │ Screenshot Check   │ 15     │ If rejectScreenshots enabled        │ │
│   └────────────────────┴────────┴─────────────────────────────────────┘ │
│                                                                         │
│   WINNER THRESHOLD: Score ≥ 50 AND no critical failures                 │
│                                                                         │
│   AI SCORE (0-100): Added for AI_JUDGED bounties                        │
│   - Used to rank valid submissions                                      │
│   - Highest AI score wins                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Example Audit Trail Entry

```
[0042] 2026-01-28T10:30:15.123Z
       ┌──────────────────────────────────────────────────────────────────────
       │ SUBMISSION VALIDATION RESULT
       ├──────────────────────────────────────────────────────────────────────
       │ Bounty: proveOutside-2026-01-28
       │ Submitter: 0x49A2B63216cb9A57C2425A6702166A90A18bA293
       │ Claim ID: 42
       │ Status: ✓ VALID
       │ Validation Score: 85/100
       │ AI Score: 92/100
       │ AI Confidence: 95%
       │
       │ SCORING BREAKDOWN:
       │   ✓ Proof Content (20 pts): Content type: photo
       │   ✓ Media URL (20 pts): Media found: https://ipfs.io/ipfs/Qm...
       │   ✓ EXIF Data (15 pts): EXIF verified: 2026-01-28T10:25:00Z
       │   ✓ Photo Freshness (20 pts): Photo taken 5 minutes ago
       │   ✓ Screenshot Check (15 pts): Photo does not appear to be a screenshot
       │
       │ AI REASONING: The image clearly shows an outdoor environment with
       │   natural lighting, trees, and sky visible. The EXIF data confirms...
       └──────────────────────────────────────────────────────────────────────
       Entry Hash: 7a3f9c2d1e8b4a6f...
```

---

## Summary

The Autonomous Bounty Bot provides:

1. **Deterministic Scoring**: Clear point-based validation system
2. **AI Enhancement**: GPT-4 Vision for quality judgment
3. **Transparent Selection**: Full reasoning documented for every decision
4. **Cryptographic Proof**: Hash-chained audit trail for verification
5. **Zero Human Intervention**: Fully autonomous operation

All scoring, reasoning, and decisions are recorded in the audit trail files located in the `logs/` directory.
