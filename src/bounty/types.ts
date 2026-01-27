/**
 * Bounty Types and Interfaces
 *
 * Defines the structure for different bounty types and their configurations.
 */

/**
 * Selection mode for determining bounty winners
 */
export enum SelectionMode {
  /** First valid submission wins automatically */
  FIRST_VALID = 'first_valid',
  /** AI (GPT-4 Vision) analyzes and picks the best submission */
  AI_JUDGED = 'ai_judged',
  /** Community voting determines winner (open bounties) */
  COMMUNITY_VOTE = 'community_vote',
}

/**
 * Bounty status
 */
export enum BountyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EVALUATING = 'evaluating',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Proof type required for the bounty
 */
export enum ProofType {
  /** Photo with optional location/timestamp requirements */
  PHOTO = 'photo',
  /** Video proof */
  VIDEO = 'video',
  /** Text-based proof */
  TEXT = 'text',
  /** Any supported proof type */
  ANY = 'any',
}

/**
 * Validation criteria for submissions
 */
export interface ValidationCriteria {
  /** Require specific GPS coordinates (latitude, longitude, radius in meters) */
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    description: string; // e.g., "Near the Eiffel Tower"
  };

  /** Require photo taken within time window */
  timeWindow?: {
    startTimestamp: number;
    endTimestamp: number;
  };

  /** Required keywords or elements in text/description */
  requiredKeywords?: string[];

  /** Custom validation prompt for AI judging */
  aiValidationPrompt?: string;

  /** Minimum image dimensions */
  minImageSize?: {
    width: number;
    height: number;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ENHANCED REAL-WORLD PROOF REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Require valid EXIF data in submitted photos */
  requireExif?: boolean;

  /** Maximum age of photo in minutes (based on EXIF timestamp) */
  maxAgeMinutes?: number;

  /** Require photo to NOT be a screenshot */
  rejectScreenshots?: boolean;

  /** Require photo to pass AI-generated image detection */
  rejectAIGenerated?: boolean;

  /** Minimum confidence score for AI validation (0-100) */
  minAIConfidence?: number;
}

/**
 * Bounty configuration
 */
export interface BountyConfig {
  /** Unique identifier for this bounty config */
  id: string;

  /** Human-readable bounty name */
  name: string;

  /** Detailed description shown to participants */
  description: string;

  /** Detailed requirements for valid submissions */
  requirements: string;

  /** Type of proof required */
  proofType: ProofType;

  /** How winners are selected */
  selectionMode: SelectionMode;

  /** Reward amount in ETH */
  rewardEth: string;

  /** Deadline as Unix timestamp */
  deadline: number;

  /** Validation criteria */
  validation: ValidationCriteria;

  /** Tags/categories */
  tags: string[];
}

/**
 * Submission record
 */
export interface Submission {
  /** Unique submission ID */
  id: string;

  /** Associated bounty ID */
  bountyId: string;

  /** On-chain claim ID */
  claimId: string;

  /** Submitter's wallet address */
  submitter: string;

  /** IPFS or HTTP URI to proof content */
  proofUri: string;

  /** Submission timestamp */
  timestamp: number;

  /** Parsed proof content */
  proofContent?: ProofContent;

  /** Validation result */
  validationResult?: ValidationResult;

  /** AI evaluation (if applicable) */
  aiEvaluation?: AIEvaluation;
}

/**
 * Parsed proof content
 */
export interface ProofContent {
  /** Type of content */
  type: ProofType;

  /** Direct URL to image/video */
  mediaUrl?: string;

  /** Description/caption */
  description?: string;

  /** EXIF metadata if available */
  exif?: {
    timestamp?: Date;
    latitude?: number;
    longitude?: number;
    device?: string;
  };

  /** Raw metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether submission passes basic validation */
  isValid: boolean;

  /** Validation score (0-100) */
  score: number;

  /** Individual check results */
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];

  /** Overall validation summary */
  summary: string;
}

/**
 * AI evaluation result (for AI_JUDGED bounties)
 */
export interface AIEvaluation {
  /** Score assigned by AI (0-100) */
  score: number;

  /** Whether AI considers this a valid submission */
  isValid: boolean;

  /** AI's reasoning for the evaluation */
  reasoning: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Model used for evaluation */
  model: string;

  /** Timestamp of evaluation */
  evaluatedAt: number;
}

/**
 * Winner selection result
 */
export interface WinnerSelection {
  /** Selected winning submission */
  winner: Submission;

  /** Runner-ups (if any) */
  runnerUps: Submission[];

  /** Selection method used */
  method: SelectionMode;

  /** Detailed rationale for selection */
  rationale: string;

  /** Timestamp of selection */
  selectedAt: number;

  /** Was this selection autonomous? */
  autonomous: boolean;
}

/**
 * Active bounty state (runtime)
 */
export interface ActiveBounty {
  /** Configuration */
  config: BountyConfig;

  /** On-chain bounty ID */
  onChainId?: string;

  /** Creation transaction hash */
  createTxHash?: string;

  /** Current status */
  status: BountyStatus;

  /** All submissions received */
  submissions: Submission[];

  /** Winner selection (if completed) */
  winnerSelection?: WinnerSelection;

  /** Payout transaction hash (if paid) */
  payoutTxHash?: string;

  /** Timeline */
  createdAt: number;
  updatedAt: number;
}

