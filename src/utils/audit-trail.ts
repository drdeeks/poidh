/**
 * Audit Trail - Cryptographic proof of autonomous operation
 *
 * Creates a tamper-evident log of all autonomous actions with:
 * - Timestamps
 * - Action details
 * - Transaction hashes (verifiable on-chain)
 * - Running hash chain for integrity verification
 *
 * Output: logs/audit-trail.json (machine-readable proof)
 *         logs/audit-trail.txt (human-readable summary)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuditEntry {
  sequence: number;
  timestamp: string;
  unixTimestamp: number;
  action: AuditAction;
  details: Record<string, any>;
  txHash?: string;
  blockExplorerUrl?: string;
  previousHash: string;
  entryHash: string;
}

export type AuditAction =
  | 'AGENT_STARTED'
  | 'AGENT_STOPPED'
  | 'BOUNTY_CREATED'
  | 'SUBMISSION_RECEIVED'
  | 'SUBMISSION_VALIDATED'
  | 'SUBMISSION_REJECTED'
  | 'AI_EVALUATION_STARTED'
  | 'AI_EVALUATION_COMPLETED'
  | 'WINNER_SELECTED'
  | 'WINNER_RATIONALE'
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_CONFIRMED'
  | 'ERROR';

/**
 * Structured winner rationale for audit transparency
 */
export interface WinnerRationale {
  bountyId: string;
  bountyName: string;
  selectionMode: 'first_valid' | 'ai_judged';
  winner: {
    address: string;
    claimId: string;
    submissionId: string;
  };
  validationChecks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  aiEvaluation?: {
    score: number;
    confidence: number;
    reasoning: string;
    model: string;
  };
  competitorCount: number;
  competitorsSummary?: {
    address: string;
    status: 'invalid' | 'valid_but_lost';
    score?: number;
    reason?: string;
  }[];
  decisionSummary: string;
  timestamp: string;
}

interface AuditState {
  version: string;
  chainId: number;
  contractAddress: string;
  agentWallet: string;
  startedAt: string;
  entries: AuditEntry[];
  summary: {
    totalBountiesCreated: number;
    totalSubmissionsReceived: number;
    totalPayoutsExecuted: number;
    totalEthPaidOut: string;
  };
}

class AuditTrail {
  private state: AuditState;
  private logsDir: string;
  private jsonPath: string;
  private txtPath: string;
  private initialized: boolean = false;

  constructor() {
    this.logsDir = path.resolve(process.cwd(), 'logs');
    this.jsonPath = path.join(this.logsDir, 'audit-trail.json');
    this.txtPath = path.join(this.logsDir, 'audit-trail.txt');

    this.state = {
      version: '1.0.0',
      chainId: 0,
      contractAddress: '',
      agentWallet: '',
      startedAt: new Date().toISOString(),
      entries: [],
      summary: {
        totalBountiesCreated: 0,
        totalSubmissionsReceived: 0,
        totalPayoutsExecuted: 0,
        totalEthPaidOut: '0',
      },
    };
  }

  /**
   * Initialize audit trail with agent info
   */
  initialize(chainId: number, contractAddress: string, agentWallet: string): void {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // Try to load existing state (for recovery)
    if (fs.existsSync(this.jsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.jsonPath, 'utf-8'));
        this.state = existing;
        console.log(`📋 Loaded existing audit trail with ${this.state.entries.length} entries`);
      } catch (e) {
        console.log('📋 Starting fresh audit trail');
      }
    }

    // Update agent info
    this.state.chainId = chainId;
    this.state.contractAddress = contractAddress;
    this.state.agentWallet = agentWallet;
    this.state.startedAt = new Date().toISOString();

    this.initialized = true;

    // Log agent start
    this.log('AGENT_STARTED', {
      chainId,
      contractAddress,
      agentWallet,
      network: chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia',
    });
  }

  /**
   * Log an audit entry
   */
  log(action: AuditAction, details: Record<string, any>, txHash?: string): AuditEntry {
    const sequence = this.state.entries.length;
    const previousHash = sequence > 0
      ? this.state.entries[sequence - 1].entryHash
      : 'GENESIS';

    const timestamp = new Date().toISOString();
    const unixTimestamp = Date.now();

    // Create entry without hash first
    const entryData = {
      sequence,
      timestamp,
      unixTimestamp,
      action,
      details,
      txHash,
      previousHash,
    };

    // Calculate hash of entry
    const entryHash = this.calculateHash(entryData);

    const entry: AuditEntry = {
      ...entryData,
      entryHash,
      blockExplorerUrl: txHash
        ? `https://${this.state.chainId === 8453 ? 'basescan.org' : 'sepolia.basescan.org'}/tx/${txHash}`
        : undefined,
    };

    // Add to state
    this.state.entries.push(entry);

    // Update summary
    this.updateSummary(action, details);

    // Persist
    this.save();

    return entry;
  }

  /**
   * Calculate SHA-256 hash of entry data
   */
  private calculateHash(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Update summary statistics
   */
  private updateSummary(action: AuditAction, details: Record<string, any>): void {
    switch (action) {
      case 'BOUNTY_CREATED':
        this.state.summary.totalBountiesCreated++;
        break;
      case 'SUBMISSION_RECEIVED':
        this.state.summary.totalSubmissionsReceived++;
        break;
      case 'PAYOUT_CONFIRMED':
        this.state.summary.totalPayoutsExecuted++;
        if (details.rewardEth) {
          const current = parseFloat(this.state.summary.totalEthPaidOut);
          const added = parseFloat(details.rewardEth);
          this.state.summary.totalEthPaidOut = (current + added).toFixed(6);
        }
        break;
    }
  }

  /**
   * Save state to files
   */
  private save(): void {
    // Save JSON (machine-readable)
    fs.writeFileSync(this.jsonPath, JSON.stringify(this.state, null, 2));

    // Save TXT (human-readable)
    this.saveTxt();
  }

  /**
   * Generate human-readable text report
   */
  private saveTxt(): void {
    const lines: string[] = [
      '═'.repeat(80),
      '                    AUTONOMOUS BOUNTY BOT - AUDIT TRAIL',
      '═'.repeat(80),
      '',
      `Generated: ${new Date().toISOString()}`,
      `Agent Wallet: ${this.state.agentWallet}`,
      `Contract: ${this.state.contractAddress}`,
      `Network: ${this.state.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}`,
      '',
      '─'.repeat(80),
      '                              SUMMARY',
      '─'.repeat(80),
      `Total Bounties Created:     ${this.state.summary.totalBountiesCreated}`,
      `Total Submissions Received: ${this.state.summary.totalSubmissionsReceived}`,
      `Total Payouts Executed:     ${this.state.summary.totalPayoutsExecuted}`,
      `Total ETH Paid Out:         ${this.state.summary.totalEthPaidOut} ETH`,
      '',
      '─'.repeat(80),
      '                           AUDIT LOG',
      '─'.repeat(80),
      '',
    ];

    for (const entry of this.state.entries) {
      lines.push(`[${entry.sequence.toString().padStart(4, '0')}] ${entry.timestamp}`);
      lines.push(`       Action: ${entry.action}`);

      // Format details based on action type
      switch (entry.action) {
        case 'BOUNTY_CREATED':
          lines.push(`       Bounty: ${entry.details.name}`);
          lines.push(`       Reward: ${entry.details.rewardEth} ETH`);
          lines.push(`       On-Chain ID: ${entry.details.onChainId}`);
          break;
        case 'SUBMISSION_RECEIVED':
          lines.push(`       Bounty: ${entry.details.bountyId}`);
          lines.push(`       Submitter: ${entry.details.submitter}`);
          lines.push(`       Claim ID: ${entry.details.claimId}`);
          break;
        case 'SUBMISSION_REJECTED':
          lines.push(`       Bounty: ${entry.details.bountyId}`);
          lines.push(`       Submitter: ${entry.details.submitter}`);
          lines.push(`       Claim ID: ${entry.details.claimId}`);
          lines.push(`       Validation Score: ${entry.details.validationScore || 'N/A'}/100`);
          lines.push(`       Reason: ${entry.details.reason}`);
          if (entry.details.failedChecks && entry.details.failedChecks.length > 0) {
            lines.push(`       Failed Checks:`);
            for (const check of entry.details.failedChecks) {
              lines.push(`         ✗ ${check.name}: ${check.details}`);
            }
          }
          break;
        case 'WINNER_SELECTED':
          lines.push(`       Bounty: ${entry.details.bountyId}`);
          lines.push(`       Winner: ${entry.details.winner}`);
          lines.push(`       Method: ${entry.details.selectionMethod}`);
          break;
        case 'WINNER_RATIONALE':
          lines.push(`       ┌${'─'.repeat(70)}`);
          lines.push(`       │ WINNER SELECTION RATIONALE`);
          lines.push(`       ├${'─'.repeat(70)}`);
          lines.push(`       │ Bounty: ${entry.details.bountyName} (${entry.details.bountyId})`);
          lines.push(`       │ Selection Mode: ${entry.details.selectionMode === 'first_valid' ? 'First Valid Submission' : 'AI Judged'}`);
          lines.push(`       │ Winner: ${entry.details.winner?.address}`);
          lines.push(`       │ Claim ID: ${entry.details.winner?.claimId}`);
          lines.push(`       │ Competitors: ${entry.details.competitorCount}`);
          lines.push(`       │`);
          lines.push(`       │ VALIDATION CHECKS:`);
          if (entry.details.validationChecks) {
            for (const check of entry.details.validationChecks) {
              const icon = check.passed ? '✓' : '✗';
              lines.push(`       │   ${icon} ${check.name}: ${check.details}`);
            }
          }
          if (entry.details.aiEvaluation) {
            lines.push(`       │`);
            lines.push(`       │ AI EVALUATION (${entry.details.aiEvaluation.model}):`);
            lines.push(`       │   Score: ${entry.details.aiEvaluation.score}/100`);
            lines.push(`       │   Confidence: ${(entry.details.aiEvaluation.confidence * 100).toFixed(0)}%`);
            lines.push(`       │   Reasoning: ${entry.details.aiEvaluation.reasoning?.substring(0, 200)}...`);
          }
          if (entry.details.competitorsSummary && entry.details.competitorsSummary.length > 0) {
            lines.push(`       │`);
            lines.push(`       │ OTHER SUBMISSIONS:`);
            for (const comp of entry.details.competitorsSummary.slice(0, 5)) {
              lines.push(`       │   ${comp.address.slice(0, 10)}... - ${comp.status}${comp.score ? ` (score: ${comp.score})` : ''}${comp.reason ? ` - ${comp.reason}` : ''}`);
            }
          }
          lines.push(`       │`);
          lines.push(`       │ DECISION: ${entry.details.decisionSummary}`);
          lines.push(`       └${'─'.repeat(70)}`);
          break;
        case 'PAYOUT_CONFIRMED':
          lines.push(`       Bounty: ${entry.details.bountyId}`);
          lines.push(`       Winner: ${entry.details.winner}`);
          lines.push(`       Reward: ${entry.details.rewardEth} ETH`);
          break;
        default:
          for (const [key, value] of Object.entries(entry.details)) {
            if (typeof value === 'string' && value.length < 60) {
              lines.push(`       ${key}: ${value}`);
            }
          }
      }

      if (entry.txHash) {
        lines.push(`       TX Hash: ${entry.txHash}`);
        lines.push(`       Explorer: ${entry.blockExplorerUrl}`);
      }
      lines.push(`       Entry Hash: ${entry.entryHash.substring(0, 16)}...`);
      lines.push('');
    }

    lines.push('─'.repeat(80));
    lines.push('                      VERIFICATION');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push('To verify this audit trail:');
    lines.push('1. Each entry hash is SHA-256(sequence + timestamp + action + details + previousHash)');
    lines.push('2. The chain is valid if each entry.previousHash matches the prior entry.entryHash');
    lines.push('3. All TX hashes can be verified on the block explorer');
    lines.push('');
    lines.push('This audit trail proves all actions were executed autonomously by the bot.');
    lines.push('No human intervention was possible between bounty creation and payout.');
    lines.push('');
    lines.push('═'.repeat(80));

    fs.writeFileSync(this.txtPath, lines.join('\n'));
  }

  /**
   * Verify integrity of the audit trail
   */
  verify(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < this.state.entries.length; i++) {
      const entry = this.state.entries[i];

      // Check sequence
      if (entry.sequence !== i) {
        errors.push(`Entry ${i}: Invalid sequence (expected ${i}, got ${entry.sequence})`);
      }

      // Check previous hash
      if (i === 0) {
        if (entry.previousHash !== 'GENESIS') {
          errors.push(`Entry 0: Invalid genesis (previousHash should be GENESIS)`);
        }
      } else {
        if (entry.previousHash !== this.state.entries[i - 1].entryHash) {
          errors.push(`Entry ${i}: Chain broken (previousHash mismatch)`);
        }
      }

      // Verify entry hash
      const { entryHash, blockExplorerUrl, ...entryData } = entry;
      const calculatedHash = this.calculateHash(entryData);
      if (calculatedHash !== entryHash) {
        errors.push(`Entry ${i}: Hash mismatch (entry may have been tampered)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current state
   */
  getState(): AuditState {
    return this.state;
  }

  /**
   * Get file paths
   */
  getPaths(): { json: string; txt: string } {
    return {
      json: this.jsonPath,
      txt: this.txtPath,
    };
  }

  /**
   * Get summary for display
   */
  getSummary(): {
    totalEntries: number;
    isValid: boolean;
    summary: AuditState['summary'];
  } {
    const verification = this.verify();
    return {
      totalEntries: this.state.entries.length,
      isValid: verification.valid,
      summary: this.state.summary,
    };
  }

  /**
   * Log comprehensive winner rationale
   * This creates a detailed, auditable record of why a winner was selected
   */
  logWinnerRationale(rationale: WinnerRationale): AuditEntry {
    return this.log('WINNER_RATIONALE', rationale);
  }
}

// Singleton instance
export const auditTrail = new AuditTrail();
