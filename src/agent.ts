#!/usr/bin/env ts-node
/**
 * AUTONOMOUS BOUNTY BOT AGENT
 *
 * This is the main orchestration agent that runs the entire bounty lifecycle:
 * 1. Creates bounties on-chain (POIDH V3 on Base Mainnet)
 * 2. Monitors for submissions
 * 3. Evaluates submissions (first-valid or AI-judged)
 * 4. Pays out winners automatically
 *
 * The agent operates fully autonomously with no human intervention required.
 *
 * SUPPORTED SELECTION MODES:
 * - FIRST_VALID: First submission that passes validation wins immediately
 * - AI_JUDGED: GPT-4 Vision evaluates all submissions after deadline
 *
 * REAL-WORLD PROOF REQUIREMENTS:
 * All bounties require genuine physical actions (photos, videos, physical tasks)
 * that cannot be faked. Validation includes EXIF checks, freshness verification,
 * and AI-powered authenticity detection.
 */
 
import { walletManager } from './wallet';
import { poidhContract } from './contracts/poidh';
import { bountyManager } from './bounty/manager';
import { submissionMonitor } from './bounty/monitor';
import { evaluationEngine } from './evaluation';
import {
  BountyConfig,
  BountyStatus,
  SelectionMode,
  ActiveBounty,
  Submission,
} from './bounty/types';
import {
  PRODUCTION_BOUNTIES,
  createFreshBounty,
} from './bounty/configs/production-bounties';
import { log } from './utils/logger';
import { config } from './config';
 
/**
 * AutonomousBountyAgent - Main agent controller
 *
 * This agent is 100% autonomous after initialization:
 * - Creates and funds bounties on POIDH V3
 * - Monitors blockchain for incoming submissions
 * - Evaluates submissions using deterministic rules or GPT-4 Vision
 * - Pays out winners automatically with transparent reasoning
 */
export class AutonomousBountyAgent {
  private isRunning = false;
  private evaluationInterval: ReturnType<typeof setInterval> | null = null;
 
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    log.info('🤖 Initializing Autonomous Bounty Agent...');
 
    // Initialize wallet
    await walletManager.initialize();
 
    // Initialize contracts
    await poidhContract.initialize();
 
    // Log ready status
    const address = await walletManager.getAddress();
    const balance = await walletManager.getBalance();
 
    log.info('✅ Agent initialized successfully', {
      walletAddress: address,
      balance: `${balance} ETH`,
      network: config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia',
      contractAddress: config.poidhContractAddress,
      autoApproveGas: config.autoApproveGas,
    });
  }
 
  /**
   * Create and launch a bounty
   */
  async createBounty(bountyConfig: BountyConfig): Promise<ActiveBounty> {
    log.autonomous('Creating new bounty', {
      name: bountyConfig.name,
      reward: `${bountyConfig.rewardEth} ETH`,
      selectionMode: bountyConfig.selectionMode,
      proofType: bountyConfig.proofType,
      deadline: new Date(bountyConfig.deadline * 1000).toISOString(),
    });
 
    // Verify sufficient balance
    const hasBalance = await walletManager.hasSufficientBalance(bountyConfig.rewardEth);
    if (!hasBalance) {
      throw new Error(
        `Insufficient balance to create bounty. Need at least ${bountyConfig.rewardEth} ETH + gas`
      );
    }
 
    // Create the bounty
    const bounty = await bountyManager.createBounty(bountyConfig);
 
    log.bounty('Successfully created and funded', bountyConfig.id, {
      onChainId: bounty.onChainId,
      txHash: bounty.createTxHash,
    });
 
    return bounty;
  }
 
  /**
   * Launch a production bounty from pre-configured templates
   *
   * Available bounty types:
   * - 'proveOutside': Quick outdoor photo verification
   * - 'handwrittenDate': Handwritten note with date
   * - 'mealPhoto': Current meal photo
   * - 'objectTower': Creative object stacking (AI-judged)
   * - 'shadowArt': Creative shadow photography (AI-judged)
   * - 'animalPhoto': Best animal photo (AI-judged)
   */
  async launchProductionBounty(
    bountyType: keyof typeof PRODUCTION_BOUNTIES,
    overrides?: Partial<BountyConfig>
  ): Promise<ActiveBounty> {
    // Validate bounty type exists
    if (!(bountyType in PRODUCTION_BOUNTIES)) {
      throw new Error(`Unknown bounty type: ${String(bountyType)}. Available: ${Object.keys(PRODUCTION_BOUNTIES).join(', ')}`);
    }
 
    // Create fresh config with new ID and deadline (calculated at runtime)
    const freshConfig = createFreshBounty(bountyType, overrides);
 
    log.info(`🎯 Launching production bounty: ${String(bountyType)}`, {
      name: freshConfig.name,
      selectionMode: freshConfig.selectionMode,
      reward: `${freshConfig.rewardEth} ETH`,
    });
 
    return this.createBounty(freshConfig);
  }
 
  /**
   * Start the autonomous agent loop
   */
  start(): void {
    if (this.isRunning) {
      log.warn('Agent already running');
      return;
    }
 
    this.isRunning = true;
    log.info('🚀 Autonomous agent started');
 
    // Start submission monitor
    submissionMonitor.start();
 
    // Start evaluation loop (runs every 10 seconds)
    this.evaluationInterval = setInterval(
      () => this.evaluationLoop(),
      10000
    );
  }
 
  /**
   * Stop the agent
   */
  stop(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    submissionMonitor.stop();
    this.isRunning = false;
    log.info('🛑 Autonomous agent stopped');
  }
 
  /**
   * Main evaluation loop - checks for submissions to evaluate
   */
  private async evaluationLoop(): Promise<void> {
    const activeBounties = bountyManager.getBountiesByStatus(BountyStatus.ACTIVE);
 
    for (const bounty of activeBounties) {
      try {
        await this.processBounty(bounty);
      } catch (error) {
        log.error('Error processing bounty', {
          bountyId: bounty.config.id,
          error: (error as Error).message,
        });
      }
    }
 
    // Also check expired bounties that need evaluation
    const evaluatingBounties = bountyManager.getBountiesByStatus(
      BountyStatus.EVALUATING
    );
 
    for (const bounty of evaluatingBounties) {
      try {
        await this.finalizeBounty(bounty);
      } catch (error) {
        log.error('Error finalizing bounty', {
          bountyId: bounty.config.id,
          error: (error as Error).message,
        });
      }
    }
  }
 
  /**
   * Process an active bounty
   */
  private async processBounty(bounty: ActiveBounty): Promise<void> {
    // For first-valid bounties, evaluate submissions immediately
    if (bounty.config.selectionMode === SelectionMode.FIRST_VALID) {
      await this.processFirstValidBounty(bounty);
    }
 
    // Check if bounty has expired
    if (bountyManager.isExpired(bounty.config.id)) {
      log.bounty('Deadline reached', bounty.config.id, {
        submissions: bounty.submissions.length,
      });
 
      if (bounty.config.selectionMode === SelectionMode.AI_JUDGED) {
        bountyManager.updateStatus(bounty.config.id, BountyStatus.EVALUATING);
      } else if (bounty.submissions.length === 0) {
        log.bounty('Expired with no submissions', bounty.config.id);
        bountyManager.updateStatus(bounty.config.id, BountyStatus.EXPIRED);
      }
    }
  }
 
  /**
   * Process first-valid bounty - evaluate new submissions immediately
   */
  private async processFirstValidBounty(bounty: ActiveBounty): Promise<void> {
    // Find unvalidated submissions
    const unvalidated = bounty.submissions.filter(
      (s) => s.validationResult === undefined
    );
 
    for (const submission of unvalidated) {
      log.info('⚡ Evaluating submission for first-valid bounty', {
        bountyId: bounty.config.id,
        submissionId: submission.id,
        submitter: submission.submitter,
      });
 
      const result = await evaluationEngine.evaluateForFirstValid(
        submission,
        bounty.config
      );
 
      if (result.isValid) {
        // WINNER FOUND! Pay out immediately
        log.autonomous('First valid submission found - paying out', {
          bountyId: bounty.config.id,
          winner: submission.submitter,
        });
 
        await this.payoutWinner(bounty, submission, result.rationale);
        return; // Stop processing this bounty
      } else {
        log.info('❌ Submission did not pass validation', {
          bountyId: bounty.config.id,
          submitter: submission.submitter,
          reason: result.rationale,
        });
      }
    }
  }
 
  /**
   * Finalize an expired AI-judged bounty
   */
  private async finalizeBounty(bounty: ActiveBounty): Promise<void> {
    if (bounty.submissions.length === 0) {
      log.bounty('No submissions - marking expired', bounty.config.id);
      bountyManager.updateStatus(bounty.config.id, BountyStatus.EXPIRED);
      return;
    }
 
    if (bounty.config.selectionMode === SelectionMode.AI_JUDGED) {
      log.autonomous('Finalizing AI-judged bounty', {
        bountyId: bounty.config.id,
        submissions: bounty.submissions.length,
      });
 
      const selection = await evaluationEngine.selectWinnerAIJudged(bounty);
 
      if (selection) {
        await this.payoutWinner(
          bounty,
          selection.winner,
          selection.rationale
        );
      } else {
        log.bounty('No valid winner found', bounty.config.id);
        bountyManager.updateStatus(bounty.config.id, BountyStatus.EXPIRED);
      }
    }
  }
 
  /**
   * Pay out the winner
   */
  private async payoutWinner(
    bounty: ActiveBounty,
    winner: Submission,
    rationale: string
  ): Promise<void> {
    log.autonomous('PAYING OUT WINNER', {
      bountyId: bounty.config.id,
      winner: winner.submitter,
      reward: `${bounty.config.rewardEth} ETH`,
    });
 
    // Complete the bounty on-chain (triggers payout)
    const txHash = await bountyManager.completeBounty(
      bounty.config.id,
      winner,
      rationale
    );
 
    // Log the payout
    log.tx('WINNER PAYOUT', txHash, {
      bountyId: bounty.config.id,
      winner: winner.submitter,
      reward: bounty.config.rewardEth,
    });
 
    // Print winner announcement
    this.announceWinner(bounty, winner, rationale, txHash);
  }
 
  /**
   * Announce the winner (logs detailed output)
   */
  private announceWinner(
    bounty: ActiveBounty,
    winner: Submission,
    rationale: string,
    txHash: string
  ): void {
    const selectionMethod = bounty.config.selectionMode === SelectionMode.FIRST_VALID
      ? 'First Valid Submission'
      : 'GPT-4 Vision AI Judgment';
 
    const announcement = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           🏆 WINNER ANNOUNCED 🏆                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Bounty: ${bounty.config.name.substring(0, 60).padEnd(60)}║
║  Winner: ${winner.submitter.padEnd(60)}║
║  Reward: ${(bounty.config.rewardEth + ' ETH').padEnd(60)}║
║  Selection: ${selectionMethod.padEnd(57)}║
║  Payout TX: ${txHash.substring(0, 52)}...    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  RATIONALE:                                                                  ║
${rationale.split('\n').slice(0, 5).map(line => '║  ' + line.substring(0, 74).padEnd(74) + '║').join('\n')}
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ Payment executed autonomously - no human intervention                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
 
    console.log(announcement);
  }
 
  /**
   * Get agent status
   */
  getStatus(): {
    isRunning: boolean;
    activeBounties: number;
    completedBounties: number;
    totalPayouts: number;
    network: string;
    walletBalance?: string;
    walletAddress?: string;
  } {
    const all = bountyManager.getAllBounties();
 
    return {
      isRunning: this.isRunning,
      activeBounties: all.filter(
        (b) => b.status === BountyStatus.ACTIVE || b.status === BountyStatus.EVALUATING
      ).length,
      completedBounties: all.filter((b) => b.status === BountyStatus.COMPLETED).length,
      totalPayouts: all
        .filter((b) => b.status === BountyStatus.COMPLETED)
        .reduce((sum, b) => sum + parseFloat(b.config.rewardEth), 0),
      network: config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia',
    };
  }
 
  /**
   * Get wallet info (async version)
   */
  async getWalletInfo(): Promise<{ address: string; balance: string }> {
    const address = await walletManager.getAddress();
    const balance = await walletManager.getBalance();
    return { address, balance };
  }
 
  /**
   * List available production bounty templates
   */
  listAvailableBounties(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    📋 AVAILABLE PRODUCTION BOUNTIES                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FIRST-VALID BOUNTIES (first valid submission wins):                         ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  • proveOutside     - Prove you're outdoors right now (0.0001 ETH)          ║
║  • handwrittenDate  - Handwritten note with date + POIDH (0.0001 ETH)       ║
║  • mealPhoto        - Photo of your current meal (0.0001 ETH)               ║
║                                                                              ║
║  AI-JUDGED BOUNTIES (GPT-4 Vision picks best after deadline):               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  • objectTower      - Creative object stacking contest (0.0001 ETH)         ║
║  • shadowArt        - Creative shadow photography (0.0001 ETH)              ║
║  • animalPhoto      - Best pet/wildlife photo (0.0001 ETH)                  ║
║                                                                              ║
║  All bounties require REAL-WORLD PROOF:                                      ║
║  ✓ Valid EXIF data required                                                  ║
║  ✓ Photo freshness verified                                                  ║
║  ✓ Screenshot detection enabled                                              ║
║  ✓ AI-generated image detection                                              ║
║                                                                              ║
║  💡 All bounties use minimum ETH (~$0.25). Override with:                   ║
║     npm run agent proveOutside -- --reward 0.01                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  }
}
 
// Create singleton instance
export const agent = new AutonomousBountyAgent();
 
// CLI entry point
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const bountyArg = args[0];
 
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🤖 AUTONOMOUS BOUNTY BOT - POIDH V3 AGENT 🤖                       ║
║                                                                              ║
║     Fully autonomous bounty creation, monitoring, and payout                 ║
║     No human intervention required after initialization                      ║
║                                                                              ║
║     Contract: POIDH V3 on Base Mainnet                                       ║
║     Address:  0x5555Fa783936C260f77385b4E153B9725feF1719                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
 
    try {
      // Handle 'list' command without initializing
      if (bountyArg === 'list') {
        agent.listAvailableBounties();
        process.exit(0);
      }
 
      await agent.initialize();
 
      // If bounty type specified, launch that bounty
      if (bountyArg && bountyArg in PRODUCTION_BOUNTIES) {
        const bountyType = bountyArg as keyof typeof PRODUCTION_BOUNTIES;
        console.log(`\n🎯 Launching production bounty: ${bountyType}\n`);
        await agent.launchProductionBounty(bountyType);
      } else if (bountyArg) {
        console.log(`\n❌ Unknown bounty type: ${bountyArg}`);
        agent.listAvailableBounties();
        process.exit(1);
      } else {
        agent.listAvailableBounties();
        console.log('\n💡 Usage: npm run agent <bounty-type>');
        console.log('   Example: npm run agent proveOutside\n');
      }
 
      agent.start();
 
      // Keep running
      process.on('SIGINT', () => {
        log.info('Received SIGINT, shutting down...');
        agent.stop();
        process.exit(0);
      });
 
      process.on('SIGTERM', () => {
        log.info('Received SIGTERM, shutting down...');
        agent.stop();
        process.exit(0);
      });
 
      log.info('Agent is running. Press Ctrl+C to stop.');
    } catch (error) {
      log.error('Failed to start agent', { error: (error as Error).message });
      process.exit(1);
    }
  }
 
  main();
}
 
