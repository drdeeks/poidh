import { v4 as uuidv4 } from 'uuid';
import {
  BountyConfig,
  BountyStatus,
  ActiveBounty,
  Submission,
  SelectionMode,
} from './types';
import { poidhContract } from '../contracts/poidh';
import { log } from '../utils/logger';

/**
 * BountyManager - Manages the lifecycle of bounties
 *
 * Handles:
 * - Creating bounties on-chain
 * - Tracking active bounties
 * - Storing submissions
 * - Coordinating with evaluators
 */
export class BountyManager {
  private activeBounties: Map<string, ActiveBounty> = new Map();

  /**
   * Create a new bounty
   */
  async createBounty(config: BountyConfig): Promise<ActiveBounty> {
    log.bounty('Creating', config.id, {
      name: config.name,
      reward: `${config.rewardEth} ETH`,
      mode: config.selectionMode,
    });

    // Create the active bounty record
    const activeBounty: ActiveBounty = {
      config,
      status: BountyStatus.DRAFT,
      submissions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Post to blockchain
    try {
      const { bountyId, txHash } = await poidhContract.createSoloBounty(
        config.name,
        this.formatBountyDescription(config),
        config.deadline,
        config.rewardEth
      );

      activeBounty.onChainId = bountyId;
      activeBounty.createTxHash = txHash;
      activeBounty.status = BountyStatus.ACTIVE;
      activeBounty.updatedAt = Date.now();

      log.bounty('Created on-chain', config.id, {
        onChainId: bountyId,
        txHash,
      });
    } catch (error) {
      log.error('Failed to create bounty on-chain', {
        bountyId: config.id,
        error: (error as Error).message,
      });
      activeBounty.status = BountyStatus.CANCELLED;
      throw error;
    }

    // Store in memory
    this.activeBounties.set(config.id, activeBounty);

    return activeBounty;
  }

  /**
   * Format bounty description for on-chain storage
   */
  private formatBountyDescription(config: BountyConfig): string {
    const parts = [
      config.description,
      '',
      '📋 Requirements:',
      config.requirements,
      '',
      `🏆 Selection Mode: ${this.formatSelectionMode(config.selectionMode)}`,
      `⏰ Deadline: ${new Date(config.deadline * 1000).toISOString()}`,
      '',
      '🤖 This bounty is managed by an autonomous bot.',
    ];

    if (config.validation.location) {
      parts.push(
        '',
        `📍 Location: ${config.validation.location.description}`,
        `   (Within ${config.validation.location.radiusMeters}m)`
      );
    }

    return parts.join('\n');
  }

  /**
   * Format selection mode for display
   */
  private formatSelectionMode(mode: SelectionMode): string {
    switch (mode) {
      case SelectionMode.FIRST_VALID:
        return 'First Valid Submission Wins';
      case SelectionMode.AI_JUDGED:
        return 'AI Judges Best Submission';
      case SelectionMode.COMMUNITY_VOTE:
        return 'Community Voting';
      default:
        return mode;
    }
  }

  /**
   * Register an existing on-chain bounty for monitoring
   * (Does not create a new bounty, just tracks an existing one)
   */
  registerExistingBounty(config: BountyConfig, onChainId: string): ActiveBounty {
    log.bounty('Registering existing bounty', config.id, {
      onChainId,
      name: config.name,
    });

    const activeBounty: ActiveBounty = {
      config,
      status: BountyStatus.ACTIVE,
      submissions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      onChainId,
    };

    this.activeBounties.set(config.id, activeBounty);

    return activeBounty;
  }

  /**
   * Get an active bounty by config ID
   */
  getBounty(configId: string): ActiveBounty | undefined {
    return this.activeBounties.get(configId);
  }

  /**
   * Get bounty by on-chain ID
   */
  getBountyByChainId(chainId: string): ActiveBounty | undefined {
    for (const bounty of this.activeBounties.values()) {
      if (bounty.onChainId === chainId) {
        return bounty;
      }
    }
    return undefined;
  }

  /**
   * Get all active bounties
   */
  getAllBounties(): ActiveBounty[] {
    return Array.from(this.activeBounties.values());
  }

  /**
   * Get bounties by status
   */
  getBountiesByStatus(status: BountyStatus): ActiveBounty[] {
    return this.getAllBounties().filter((b) => b.status === status);
  }

  /**
   * Add a submission to a bounty
   */
  addSubmission(configId: string, submission: Submission): void {
    const bounty = this.activeBounties.get(configId);
    if (!bounty) {
      throw new Error(`Bounty not found: ${configId}`);
    }

    bounty.submissions.push(submission);
    bounty.updatedAt = Date.now();

    log.bounty('Submission received', configId, {
      submissionId: submission.id,
      submitter: submission.submitter,
      claimId: submission.claimId,
    });
  }

  /**
   * Update bounty status
   */
  updateStatus(configId: string, status: BountyStatus): void {
    const bounty = this.activeBounties.get(configId);
    if (!bounty) {
      throw new Error(`Bounty not found: ${configId}`);
    }

    bounty.status = status;
    bounty.updatedAt = Date.now();

    log.bounty('Status updated', configId, { newStatus: status });
  }

  /**
   * Complete a bounty (accept winning claim on-chain)
   */
  async completeBounty(
    configId: string,
    winner: Submission,
    rationale: string
  ): Promise<string> {
    const bounty = this.activeBounties.get(configId);
    if (!bounty) {
      throw new Error(`Bounty not found: ${configId}`);
    }

    if (!bounty.onChainId) {
      throw new Error(`Bounty has no on-chain ID: ${configId}`);
    }

    log.bounty('Completing bounty', configId, {
      winner: winner.submitter,
      claimId: winner.claimId,
    });

    // Vote for the winning claim (this triggers payout in POIDH V3)
    const txHash = await poidhContract.voteClaim(bounty.onChainId, true);

    // Update status
    bounty.status = BountyStatus.COMPLETED;
    bounty.winner = winner;
    bounty.completeTxHash = txHash;
    bounty.completedAt = Date.now();
    bounty.updatedAt = Date.now();

    log.bounty('Completed', configId, {
      winner: winner.submitter,
      txHash,
    });

    return txHash;
  }

  /**
   * Check if bounty has expired (past deadline)
   */
  isExpired(configId: string): boolean {
    const bounty = this.activeBounties.get(configId);
    if (!bounty) return false;

    return Date.now() > bounty.config.deadline * 1000;
  }

  /**
   * Get submissions for a bounty
   */
  getSubmissions(configId: string): Submission[] {
    const bounty = this.activeBounties.get(configId);
    return bounty?.submissions || [];
  }

  /**
   * Clear all bounties (for testing)
   */
  clear(): void {
    this.activeBounties.clear();
  }
}

export const bountyManager = new BountyManager();
