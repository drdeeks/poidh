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
import { auditTrail, WinnerRationale } from './utils/audit-trail';
import { config } from './config';
import { parseChainFlag, selectChainInteractively, validateChainSelection } from './utils/chain-selector';

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
   * Get chain name from chain ID
   */
  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      8453: 'Base Mainnet',
      84532: 'Base Sepolia',
      42161: 'Arbitrum One',
      421614: 'Arbitrum Sepolia',
      666666666: 'Degen',
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia',
      137: 'Polygon',
      10: 'Optimism',
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  /**
   * Get native currency for chain
   */
  private getNativeCurrency(chainId: number): string {
    if (chainId === 666666666) return 'DEGEN';
    if (chainId === 137) return 'MATIC';
    return 'ETH';
  }

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

    // Initialize audit trail for proof of autonomous operation
    auditTrail.initialize(config.chainId, config.poidhContractAddress, address);

    log.info('✅ Agent initialized successfully', {
      walletAddress: address,
      balance: `${balance} ${this.getNativeCurrency(config.chainId)}`,
      network: this.getChainName(config.chainId),
      contractAddress: config.poidhContractAddress,
      autoApproveGas: config.autoApproveGas,
    });

    const auditPaths = auditTrail.getPaths();
    log.info('📋 Audit trail initialized', {
      jsonLog: auditPaths.json,
      humanReadable: auditPaths.txt,
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

    // Get chain name
    const chainNames: Record<number, string> = {
      8453: 'Base Mainnet',
      84532: 'Base Sepolia',
      42161: 'Arbitrum One',
      421614: 'Arbitrum Sepolia',
      666666666: 'Degen',
    };
    const chainName = chainNames[config.chainId] || `Chain ${config.chainId}`;

    // Log to audit trail with comprehensive details
    auditTrail.log('BOUNTY_CREATED', {
      name: bountyConfig.name,
      description: bountyConfig.description,
      configId: bountyConfig.id,
      onChainId: bounty.onChainId,
      rewardAmount: bountyConfig.rewardEth,
      rewardCurrency: chainName.includes('Degen') ? 'DEGEN' : 'ETH',
      chainId: config.chainId,
      chainName: chainName,
      contractAddress: config.poidhContractAddress,
      selectionMode: bountyConfig.selectionMode,
      proofType: bountyConfig.proofType,
      deadline: new Date(bountyConfig.deadline * 1000).toISOString(),
      validationCriteria: bountyConfig.validation,
      createdBy: config.botPrivateKey.substring(0, 42),
    }, bounty.createTxHash);

    log.bounty('Successfully created and funded', bountyConfig.id, {
      onChainId: bounty.onChainId,
      txHash: bounty.createTxHash,
    });

    return bounty;
  }

  /**
   * Auto-discover and monitor all bounties created by this bot
   */
  async monitorOwnBounties(): Promise<void> {
    log.info('🔍 Auto-discovering bounties created by this bot...');
    
    const botAddress = await walletManager.getAddress();
    const allBounties = await poidhContract.getBounties(0);
    
    let foundCount = 0;
    for (const bounty of allBounties) {
      // Only monitor bounties created by this bot that are still active
      if (bounty.issuer.toLowerCase() === botAddress.toLowerCase() && 
          poidhContract.isBountyActive(bounty)) {
        
        log.info(`✅ Found bot bounty #${bounty.id}: ${bounty.name}`);
        
        // Register for monitoring
        bountyManager.registerExistingBounty({
          id: `auto-${bounty.id}`,
          name: bounty.name,
          description: bounty.description,
          requirements: 'Auto-discovered bounty',
          proofType: 'photo' as any,
          selectionMode: SelectionMode.FIRST_VALID,
          rewardEth: require('ethers').formatEther(bounty.amount),
          deadline: Math.floor(Date.now() / 1000) + 86400, // 24h from now
          validation: {},
          tags: ['auto-discovered'],
        }, bounty.id.toString());
        
        foundCount++;
      }
    }
    
    log.info(`🎯 Monitoring ${foundCount} active bounties created by this bot`);
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
    customReward?: string | null
  ): Promise<ActiveBounty> {
    // Validate bounty type exists
    if (!(bountyType in PRODUCTION_BOUNTIES)) {
      throw new Error(`Unknown bounty type: ${String(bountyType)}. Available: ${Object.keys(PRODUCTION_BOUNTIES).join(', ')}`);
    }

    // Create overrides with custom reward if provided
    const overrides = customReward ? { rewardEth: customReward } : undefined;

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

      // Log full validation with comprehensive scoring breakdown
      const validationDetails = {
        bountyId: bounty.config.id,
        bountyName: bounty.config.name,
        submitter: submission.submitter,
        claimId: submission.claimId,
        submissionId: submission.id,
        proofUri: submission.proofUri,
        submittedAt: submission.timestamp,
        
        // Validation Results
        isValid: result.isValid,
        validationScore: submission.validationResult?.score || 0,
        maxPossibleScore: 100,
        passingThreshold: 50,
        
        // Detailed Check Results
        validationChecks: submission.validationResult?.checks?.map(c => ({
          checkName: c.name,
          passed: c.passed,
          details: c.details,
          reasoning: c.details,
        })) || [],
        
        // AI Evaluation (if applicable)
        aiScore: submission.aiEvaluation?.score,
        aiConfidence: submission.aiEvaluation?.confidence,
        aiReasoning: submission.aiEvaluation?.reasoning,
        aiModel: submission.aiEvaluation?.model,
        
        // Decision Logic
        decisionRationale: result.rationale,
        decisionReason: result.isValid 
          ? `ACCEPTED: Score ${submission.validationResult?.score}/100 meets threshold of 50.`
          : `REJECTED: ${result.rationale}`,
        
        // Summary
        summary: submission.validationResult?.summary || 'No summary available',
      };

      auditTrail.log('SUBMISSION_VALIDATED', validationDetails);

      if (result.isValid) {
        // WINNER FOUND! Pay out immediately
        log.autonomous('First valid submission found - paying out', {
          bountyId: bounty.config.id,
          winner: submission.submitter,
          validationScore: submission.validationResult?.score,
          aiScore: submission.aiEvaluation?.score,
        });

        await this.payoutWinner(bounty, submission, result.rationale);
        return; // Stop processing this bounty
      } else {
        // Log rejection with full details for audit transparency
        log.info('❌ Submission did not pass validation', {
          bountyId: bounty.config.id,
          submitter: submission.submitter,
          validationScore: submission.validationResult?.score,
          reason: result.rationale,
        });
        
        // Document rejection in audit trail with both failed and passed checks
        auditTrail.log('SUBMISSION_REJECTED', {
          bountyId: bounty.config.id,
          submitter: submission.submitter,
          claimId: submission.claimId,
          reason: result.rationale,
          validationScore: submission.validationResult?.score,
          failedChecks: submission.validationResult?.checks
            ?.filter(c => !c.passed)
            .map(c => ({ name: c.name, details: c.details })),
          passedChecks: submission.validationResult?.checks
            ?.filter(c => c.passed)
            .map(c => ({ name: c.name, details: c.details })),
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

    // Build comprehensive winner rationale for audit trail
    const winnerRationale = this.buildWinnerRationale(bounty, winner, rationale);
    
    // Log detailed winner rationale
    auditTrail.logWinnerRationale(winnerRationale);
    
    // Also log to standard logger with full details
    log.info('🏆 WINNER RATIONALE', {
      bountyId: bounty.config.id,
      bountyName: bounty.config.name,
      selectionMode: bounty.config.selectionMode,
      winner: winner.submitter,
      claimId: winner.claimId,
      validationScore: winner.validationResult?.score,
      aiScore: winner.aiEvaluation?.score,
      totalSubmissions: bounty.submissions.length,
      decisionSummary: winnerRationale.decisionSummary,
    });

    // Log winner selection to audit trail (simplified)
    auditTrail.log('WINNER_SELECTED', {
      bountyId: bounty.config.id,
      onChainId: bounty.onChainId,
      winner: winner.submitter,
      submissionId: winner.id,
      claimId: winner.claimId,
      selectionMethod: bounty.config.selectionMode,
      totalSubmissions: bounty.submissions.length,
      rationale: rationale.substring(0, 500),
    });

    // Complete the bounty on-chain (triggers payout)
    const txHash = await bountyManager.completeBounty(
      bounty.config.id,
      winner,
      rationale
    );

    // Log comprehensive payout confirmation to audit trail
    auditTrail.log('PAYOUT_CONFIRMED', {
      bountyId: bounty.config.id,
      bountyName: bounty.config.name,
      onChainBountyId: bounty.onChainId,
      winner: winner.submitter,
      claimId: winner.claimId,
      submissionId: winner.id,
      
      // Payment Details
      rewardAmount: bounty.config.rewardEth,
      rewardCurrency: this.getNativeCurrency(config.chainId),
      chainId: config.chainId,
      chainName: this.getChainName(config.chainId),
      contractAddress: config.poidhContractAddress,
      
      // Validation Summary
      validationScore: winner.validationResult?.score,
      validationPassed: winner.validationResult?.isValid,
      aiScore: winner.aiEvaluation?.score,
      
      // Transaction Details
      transactionHash: txHash,
      paidAt: new Date().toISOString(),
      
      // Decision Summary
      selectionMode: bounty.config.selectionMode,
      winnerRationale: rationale,
      
      status: 'completed',
      finalStep: 'Payment released to winner on-chain',
    }, txHash);

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
   * Build comprehensive winner rationale for audit documentation
   */
  private buildWinnerRationale(
    bounty: ActiveBounty,
    winner: Submission,
    rationaleText: string
  ): WinnerRationale {
    const isFirstValid = bounty.config.selectionMode === SelectionMode.FIRST_VALID;
    
    // Get validation checks from the winner
    const validationChecks = winner.validationResult?.checks?.map(check => ({
      name: check.name,
      passed: check.passed,
      details: check.details,
    })) || [];

    // Build AI evaluation info if present
    const aiEvaluation = winner.aiEvaluation ? {
      score: winner.aiEvaluation.score,
      confidence: winner.aiEvaluation.confidence,
      reasoning: winner.aiEvaluation.reasoning,
      model: winner.aiEvaluation.model,
    } : undefined;

    // Build competitors summary (other submissions)
    const competitors = bounty.submissions
      .filter(s => s.id !== winner.id)
      .map(s => {
        const isValid = s.validationResult?.isValid || false;
        const aiScore = s.aiEvaluation?.score;
        
        let status: 'invalid' | 'valid_but_lost' = 'invalid';
        let reason: string | undefined;
        
        if (isValid) {
          status = 'valid_but_lost';
          if (isFirstValid) {
            reason = 'Submitted after winning submission';
          } else if (aiScore !== undefined && winner.aiEvaluation?.score !== undefined) {
            reason = `AI score ${aiScore} vs winner's ${winner.aiEvaluation.score}`;
          }
        } else {
          reason = s.validationResult?.summary || 'Failed validation';
        }
        
        return {
          address: s.submitter,
          status,
          score: aiScore,
          reason,
        };
      });

    // Build decision summary
    let decisionSummary: string;
    if (isFirstValid) {
      const passedChecks = validationChecks.filter(c => c.passed).length;
      const totalChecks = validationChecks.length;
      decisionSummary = `FIRST VALID SUBMISSION: ${winner.submitter.slice(0, 10)}... passed ${passedChecks}/${totalChecks} validation checks with score ${winner.validationResult?.score || 'N/A'}/100. ` +
        `This was the first submission to meet all requirements. ` +
        `${competitors.length} other submission(s) were either invalid or submitted later.`;
    } else {
      decisionSummary = `AI JUDGED WINNER: ${winner.submitter.slice(0, 10)}... scored ${winner.aiEvaluation?.score || 'N/A'}/100 (confidence: ${((winner.aiEvaluation?.confidence || 0) * 100).toFixed(0)}%). ` +
        `Selected from ${bounty.submissions.length} submission(s) based on GPT-4 Vision analysis. ` +
        `AI reasoning: "${winner.aiEvaluation?.reasoning?.substring(0, 150) || rationaleText.substring(0, 150)}..."`;
    }

    return {
      bountyId: bounty.config.id,
      bountyName: bounty.config.name,
      selectionMode: isFirstValid ? 'first_valid' : 'ai_judged',
      winner: {
        address: winner.submitter,
        claimId: winner.claimId,
        submissionId: winner.id,
      },
      validationChecks,
      aiEvaluation,
      competitorCount: bounty.submissions.length - 1,
      competitorsSummary: competitors.length > 0 ? competitors : undefined,
      decisionSummary,
      timestamp: new Date().toISOString(),
    };
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
    let bountyArg = args[0];
    let chainId: number | null = null;

    // Parse chain flags
    const chainFlagIndex = args.findIndex(arg => arg === '--chain' || arg === '-c');
    if (chainFlagIndex !== -1 && args[chainFlagIndex + 1]) {
      const chainFlag = args[chainFlagIndex + 1];
      chainId = parseChainFlag(chainFlag);
      if (!chainId) {
        console.log(`❌ Invalid chain: ${chainFlag}`);
        console.log(`\n💡 Supported chains:`);
        console.log(`   base, base-mainnet (8453)`);
        console.log(`   base-sepolia (84532)`);
        console.log(`   arbitrum, arbitrum-one (42161)`);
        console.log(`   arbitrum-sepolia (421614)`);
        console.log(`   degen (666666666)`);
        console.log(`   ethereum, eth (1)`);
        console.log(`   sepolia (11155111)`);
        console.log(`   polygon, matic (137)`);
        console.log(`   optimism, op (10)`);
        console.log(`\n   Or use chain ID directly: --chain 8453`);
        process.exit(1);
      }
      // Remove chain flags from args
      args.splice(chainFlagIndex, 2);
      bountyArg = args[0];
    }

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🤖 AUTONOMOUS BOUNTY BOT - POIDH V3 AGENT 🤖                       ║
║                                                                              ║
║     Fully autonomous bounty creation, monitoring, and payout                 ║
║     No human intervention required after initialization                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

    try {
      // Handle 'list' command without initializing
      if (bountyArg === 'list') {
        agent.listAvailableBounties();
        process.exit(0);
      }

      // Handle chain selection
      if (!chainId) {
        if (process.env.CHAIN_ID) {
          chainId = parseInt(process.env.CHAIN_ID);
        } else {
          console.log('🔗 No chain specified. Please select a network:');
          const selection = await selectChainInteractively();
          chainId = selection.chainId;
        }
      }

      // Validate and set chain
      validateChainSelection(chainId);
      process.env.CHAIN_ID = chainId.toString();

      // Parse reward flag
      const rewardFlagIndex = args.findIndex(arg => arg === '--reward');
      let customReward: string | null = null;
      if (rewardFlagIndex !== -1 && args[rewardFlagIndex + 1]) {
        customReward = args[rewardFlagIndex + 1];
        console.log(`💰 Custom reward: ${customReward} ETH`);
      }

      await agent.initialize();

      // Handle 'monitor' command - auto-discover all bot's bounties
      if (bountyArg === 'monitor') {
        console.log(`\n🔍 Auto-discovering bounties created by this bot...\n`);
        await agent.monitorOwnBounties();
        console.log(`\n✅ Now monitoring all active bounties\n`);
      }
      // If bounty type specified, launch that bounty
      else if (bountyArg && bountyArg in PRODUCTION_BOUNTIES) {
        const bountyType = bountyArg as keyof typeof PRODUCTION_BOUNTIES;
        console.log(`\n🎯 Launching production bounty: ${bountyType}\n`);
        await agent.launchProductionBounty(bountyType, customReward);
      } else if (bountyArg) {
        console.log(`\n❌ Unknown bounty type: ${bountyArg}`);
        console.log(`\n💡 Available commands:`);
        console.log(`   npm run agent list              - List available bounty types`);
        console.log(`   npm run agent monitor <id>      - Monitor existing bounty`);
        console.log(`   npm run agent <bounty-type>     - Create new bounty\n`);
        agent.listAvailableBounties();
        process.exit(1);
      } else {
        agent.listAvailableBounties();
        console.log('\n💡 Usage: npm run agent <bounty-type>');
        console.log('   Example: npm run agent proveOutside');
        console.log('\n   Or monitor existing: npm run agent monitor <bountyId>\n');
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

