/**
 * POIDH V3 Contract ABI
 *
 * This ABI matches the deployed PoidhV3 contract on Base Mainnet:
 * 0x5555Fa783936C260f77385b4E153B9725feF1719
 *
 * Contract Features:
 * - Solo bounties (issuer accepts claims directly)
 * - Open bounties (weighted voting by contributors)
 * - Pull-payment pattern for secure withdrawals
 * - 2.5% fee (250 BPS)
 * - Claim NFTs escrowed in contract
 */

// Complete POIDH V3 ABI (JSON format for ethers.js)
export const POIDH_V3_ABI = [
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Bounty lifecycle events
  'event BountyCreated(uint256 indexed bountyId, address indexed issuer, string name, string description, uint256 amount, uint256 deadline, bool isOpen)',
  'event BountyContribution(uint256 indexed bountyId, address indexed contributor, uint256 amount)',
  'event BountyCancelled(uint256 indexed bountyId)',
  'event BountyCompleted(uint256 indexed bountyId, uint256 indexed winningClaimId, address indexed winner)',

  // Claim events
  'event ClaimCreated(uint256 indexed bountyId, uint256 indexed claimId, address indexed claimer, string uri)',
  'event ClaimAccepted(uint256 indexed bountyId, uint256 indexed claimId)',
  'event ClaimSubmittedForVote(uint256 indexed bountyId, uint256 indexed claimId)',

  // Voting events
  'event VoteCast(uint256 indexed bountyId, uint256 indexed claimId, address indexed voter, uint256 weight)',
  'event VoteResolved(uint256 indexed bountyId, uint256 indexed winningClaimId)',

  // Payment events
  'event Withdrawal(address indexed payee, uint256 amount)',
  'event FeeCollected(uint256 indexed bountyId, uint256 amount)',

  // ═══════════════════════════════════════════════════════════════════════════
  // READ FUNCTIONS - Bounty Queries
  // ═══════════════════════════════════════════════════════════════════════════

  // Get bounty by ID
  'function bounties(uint256 bountyId) view returns (uint256 id, address issuer, string name, string description, uint256 amount, uint256 deadline, bool isOpen, bool isCompleted, bool isCancelled, uint256 winningClaimId)',

  // Get bounty details (same as above but named function)
  'function getBounty(uint256 bountyId) view returns (tuple(uint256 id, address issuer, string name, string description, uint256 amount, uint256 deadline, bool isOpen, bool isCompleted, bool isCancelled, uint256 winningClaimId))',

  // Get all claims for a bounty
  'function getClaims(uint256 bountyId) view returns (tuple(uint256 id, uint256 bountyId, address claimer, string uri, uint256 createdAt, bool accepted, bool inVoting, uint256 votesFor)[])',

  // Get single claim
  'function claims(uint256 claimId) view returns (uint256 id, uint256 bountyId, address claimer, string uri, uint256 createdAt, bool accepted, bool inVoting, uint256 votesFor)',

  // Get claim count for bounty
  'function getClaimCount(uint256 bountyId) view returns (uint256)',

  // Total bounty count
  'function bountyCount() view returns (uint256)',

  // Total claim count
  'function claimCount() view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // READ FUNCTIONS - Contributions & Voting
  // ═══════════════════════════════════════════════════════════════════════════

  // Get contributor's amount for a bounty
  'function contributions(uint256 bountyId, address contributor) view returns (uint256)',

  // Get all contributors for a bounty
  'function getContributors(uint256 bountyId) view returns (address[])',

  // Get participant count for open bounty
  'function participantCount(uint256 bountyId) view returns (uint256)',

  // Check if address has voted on a claim
  'function hasVoted(uint256 bountyId, address voter) view returns (bool)',

  // Get votes for a specific claim
  'function getVotes(uint256 claimId) view returns (uint256)',

  // Get voting end time for a claim
  'function votingEndTime(uint256 claimId) view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // READ FUNCTIONS - Payments & Constants
  // ═══════════════════════════════════════════════════════════════════════════

  // Check pending withdrawal balance
  'function pendingWithdrawals(address payee) view returns (uint256)',

  // Contract constants
  'function FEE_BPS() view returns (uint256)',        // 250 (2.5%)
  'function MAX_PARTICIPANTS() view returns (uint256)', // 150
  'function votingPeriod() view returns (uint256)',   // 2 days

  // Fee recipient
  'function feeRecipient() view returns (address)',

  // Owner
  'function owner() view returns (address)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Bounty Creation
  // ═══════════════════════════════════════════════════════════════════════════

  // Create a solo bounty (issuer accepts claims)
  'function createSoloBounty(string name, string description, uint256 deadline) payable returns (uint256 bountyId)',

  // Create an open bounty (weighted voting)
  'function createOpenBounty(string name, string description, uint256 deadline) payable returns (uint256 bountyId)',

  // Contribute to an open bounty
  'function contribute(uint256 bountyId) payable',

  // Cancel bounty (only issuer, before any claims)
  'function cancelBounty(uint256 bountyId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Claims
  // ═══════════════════════════════════════════════════════════════════════════

  // Submit a claim with proof URI
  'function createClaim(uint256 bountyId, string uri) returns (uint256 claimId)',

  // Accept a claim (solo bounties - issuer only)
  'function acceptClaim(uint256 bountyId, uint256 claimId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Voting (Open Bounties)
  // ═══════════════════════════════════════════════════════════════════════════

  // Submit claim for voting (open bounties)
  'function submitClaimForVote(uint256 bountyId, uint256 claimId)',

  // Vote for a claim (weighted by contribution)
  'function voteClaim(uint256 bountyId, uint256 claimId)',

  // Resolve voting after period ends
  'function resolveVote(uint256 bountyId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Withdrawals
  // ═══════════════════════════════════════════════════════════════════════════

  // Withdraw pending balance (pull-payment pattern)
  'function withdraw()',

  // Withdraw to specific address (owner only)
  'function withdrawTo(address payee)',

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Set fee recipient (owner only)
  'function setFeeRecipient(address newRecipient)',

  // Set voting period (owner only)
  'function setVotingPeriod(uint256 newPeriod)',

  // Transfer ownership
  'function transferOwnership(address newOwner)',
];

// Legacy aliases for backwards compatibility
export const SOLO_BOUNTY_ABI = POIDH_V3_ABI;
export const OPEN_BOUNTY_ABI = POIDH_V3_ABI;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bounty data structure from contract
 */
export interface Bounty {
  id: bigint;
  issuer: string;
  name: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  isOpen: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  winningClaimId: bigint;
}

/**
 * Claim data structure from contract
 */
export interface Claim {
  id: bigint;
  bountyId: bigint;
  claimer: string;
  uri: string;
  createdAt: bigint;
  accepted: boolean;
  inVoting: boolean;
  votesFor: bigint;
}

/**
 * Contribution record
 */
export interface Contribution {
  contributor: string;
  amount: bigint;
}

/**
 * Contract constants
 */
export const POIDH_CONSTANTS = {
  FEE_BPS: 250,           // 2.5%
  MAX_PARTICIPANTS: 150,   // Max contributors for open bounty
  VOTING_PERIOD: 2 * 24 * 60 * 60, // 2 days in seconds
} as const;

/**
 * Calculate fee amount
 */
export function calculateFee(amount: bigint): bigint {
  return (amount * BigInt(POIDH_CONSTANTS.FEE_BPS)) / BigInt(10000);
}

/**
 * Calculate net amount after fee
 */
export function calculateNetAmount(amount: bigint): bigint {
  return amount - calculateFee(amount);
}

