# 📋 Evidence: Autonomous Operation Proof

This directory contains proof that the bot executed **two bounties** completely autonomously.

## Files

| File | Description |
|------|-------------|
| `audit-trail.json` | Machine-readable log with hash chain (Bounty #17) |
| `audit-trail.txt` | Human-readable summary (Bounty #17) |
| `bounty-16-evidence.md` | On-chain evidence for Bounty #16 |

---

## Bounty #16: 📝 Handwritten Date Challenge

| Field | Value |
|-------|-------|
| **Bounty ID** | 16 |
| **Winner** | `0x15C6a4bF9023Ad20C51CbEa9992A5bcCf83F3e7B` |
| **Claim ID** | 68 |
| **Status** | ✅ Completed |
| **POIDH Link** | https://poidh.xyz/base/bounty/16 |

*See [`bounty-16-evidence.md`](./bounty-16-evidence.md) for full details.*

---

## Bounty #17: 🌳 Prove You're Outside Right Now

### Bounty Created
- **Bounty ID:** 17
- **Name:** 🌳 Prove You're Outside Right Now
- **TX:** [`0x1ae55491100aef71394603b641ac0100fbd75c1d67079430bc6764dee0b26dd5`](https://basescan.org/tx/0x1ae55491100aef71394603b641ac0100fbd75c1d67079430bc6764dee0b26dd5)

### Winner Selected & Paid
- **Winner:** `0x49A2B63216cb9A57C2425A6702166A90A18bA293`
- **Claim ID:** 79
- **Method:** First Valid Submission
- **Payout TX:** [`0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5`](https://basescan.org/tx/0x8cd917439441c2a159016334110b0d1b0ccc812e4b879d265bf2e8e436de4da5)

## Verification

Each audit entry contains:
- **Sequence number** - monotonically increasing
- **Timestamp** - ISO 8601 format
- **Previous hash** - SHA-256 of prior entry (blockchain-style chain)
- **Entry hash** - SHA-256 of current entry data

To verify integrity:
```bash
npm run verify:audit  # (if implemented)
# Or manually check that each previousHash matches prior entryHash
```

All transaction hashes can be independently verified on [BaseScan](https://basescan.org).

## Snapshot Date

**Captured:** 2026-01-28T04:39:09Z (immediately after payout confirmation)
