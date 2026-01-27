/**
 * AUTONOMOUS BOUNTY BOT
 *
 * A fully autonomous system for managing real-world proof bounties on poidh.
 *
 * Features:
 * - Creates bounties on-chain
 * - Monitors for submissions
 * - Evaluates proofs (deterministic + AI)
 * - Pays winners automatically
 *
 * No human intervention required after initialization.
 */

// Core exports
export { agent, AutonomousBountyAgent } from './agent';
export { walletManager, WalletManager } from './wallet';
export { poidhContract, POIDHContract } from './contracts/poidh';
export { bountyManager, BountyManager } from './bounty/manager';
export { submissionMonitor, SubmissionMonitor } from './bounty/monitor';

// Evaluation exports
export { evaluationEngine, EvaluationEngine } from './evaluation';
export { submissionValidator, SubmissionValidator } from './evaluation/validator';
export { aiJudge, AIJudge } from './evaluation/ai-judge';

// Types
export * from './bounty/types';

// Templates (explicit exports to avoid conflicts with types)
export {
  deadlineFromNow,
  locationPhotoBounty,
  physicalActionBounty,
  scavengerHuntBounty,
  timedChallengeBounty,
  creativeChallengeBounty,
  DEMO_FIRST_VALID_BOUNTY,
  DEMO_AI_JUDGED_BOUNTY,
} from './bounty/templates';

// Config
export { config, loadConfig } from './config';

// Logger
export { log, logger } from './utils/logger';

