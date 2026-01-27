/**
 * POIDH V3 Contract ABI
 *
 * Based on the actual PoidhV3.sol contract.
 * Contract Address (Base Mainnet): 0x5555Fa783936C260f77385b4E153B9725feF1719
 *
 * IMPORTANT: Only EOAs can create bounties (msg.sender == tx.origin check)
 */

export const POIDH_V3_ABI = [
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'event BountyCreated(uint256 indexed id, address indexed issuer, string title, string description, uint256 amount, uint256 createdAt, bool isOpenBounty)',
  'event ClaimCreated(uint256 indexed id, address indexed issuer, uint256 indexed bountyId, address bountyIssuer, string title, string description, uint256 createdAt, string imageUri)',
  'event ClaimAccepted(uint256 indexed bountyId, uint256 indexed claimId, address indexed claimIssuer, address bountyIssuer, uint256 bountyAmount, uint256 payout, uint256 fee)',
  'event BountyJoined(uint256 indexed bountyId, address indexed participant, uint256 amount, uint256 latestBountyBalance)',
  'event BountyCancelled(uint256 indexed bountyId, address indexed issuer, uint256 issuerRefund)',
  'event WithdrawFromOpenBounty(uint256 indexed bountyId, address indexed participant, uint256 amount, uint256 latestBountyAmount)',
  'event Withdrawal(address indexed user, uint256 amount)',
  'event WithdrawalTo(address indexed user, address indexed to, uint256 amount)',
  'event VotingStarted(uint256 indexed bountyId, uint256 indexed claimId, uint256 deadline, uint256 issuerYesWeight, uint256 round)',
  'event VoteCast(address indexed voter, uint256 indexed bountyId, uint256 indexed claimId, bool support, uint256 weight)',
  'event VotingResolved(uint256 indexed bountyId, uint256 indexed claimId, bool passed, uint256 yes, uint256 no)',
  'event RefundClaimed(uint256 indexed bountyId, address indexed participant, uint256 amount)',

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════

  'function FEE_BPS() view returns (uint256)',              // 250 (2.5%)
  'function BPS_DENOM() view returns (uint256)',            // 10000
  'function MIN_BOUNTY_AMOUNT() view returns (uint256)',    // Immutable, set at deploy
  'function MIN_CONTRIBUTION() view returns (uint256)',     // Immutable, set at deploy
  'function MAX_PARTICIPANTS() view returns (uint256)',     // 150
  'function votingPeriod() view returns (uint256)',         // 2 days
  'function treasury() view returns (address)',

  // ═══════════════════════════════════════════════════════════════════════════
  // COUNTERS
  // ═══════════════════════════════════════════════════════════════════════════

  'function bountyCounter() view returns (uint256)',
  'function claimCounter() view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // BOUNTY QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  'function bounties(uint256 bountyId) view returns (uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)',
  'function getBountiesLength() view returns (uint256)',
  'function getBounties(uint256 offset) view returns (tuple(uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)[])',
  'function getBountiesByUser(address user, uint256 offset) view returns (tuple(uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)[])',
  'function userBounties(address user, uint256 index) view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAIM QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  'function claims(uint256 claimId) view returns (uint256 id, address issuer, uint256 bountyId, address bountyIssuer, string name, string description, uint256 createdAt, bool accepted)',
  'function getClaimsByBountyId(uint256 bountyId, uint256 offset) view returns (tuple(uint256 id, address issuer, uint256 bountyId, address bountyIssuer, string name, string description, uint256 createdAt, bool accepted)[])',
  'function getClaimsByUser(address user, uint256 offset) view returns (tuple(uint256 id, address issuer, uint256 bountyId, address bountyIssuer, string name, string description, uint256 createdAt, bool accepted)[])',
  'function bountyClaims(uint256 bountyId, uint256 index) view returns (uint256)',
  'function userClaims(address user, uint256 index) view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTICIPANT QUERIES (Open Bounties)
  // ═══════════════════════════════════════════════════════════════════════════

  'function getParticipants(uint256 bountyId) view returns (address[], uint256[])',
  'function getParticipantsPaged(uint256 bountyId, uint256 offset, uint256 limit) view returns (address[], uint256[])',
  'function participants(uint256 bountyId, uint256 index) view returns (address)',
  'function participantAmounts(uint256 bountyId, uint256 index) view returns (uint256)',
  'function everHadExternalContributor(uint256 bountyId) view returns (bool)',

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTING QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  'function bountyCurrentVotingClaim(uint256 bountyId) view returns (uint256)',
  'function bountyVotingTracker(uint256 bountyId) view returns (uint256 yes, uint256 no, uint256 deadline)',
  'function voteRound(uint256 bountyId) view returns (uint256)',
  'function voteWeightSnapshot(uint256 bountyId, address participant) view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWAL QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  'function pendingWithdrawals(address account) view returns (uint256)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Bounty Creation (EOAs only!)
  // ═══════════════════════════════════════════════════════════════════════════

  // NOTE: These functions require msg.sender == tx.origin (EOAs only, no contracts!)
  'function createSoloBounty(string name, string description) payable',
  'function createOpenBounty(string name, string description) payable',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Open Bounty Funding
  // ═══════════════════════════════════════════════════════════════════════════

  'function joinOpenBounty(uint256 bountyId) payable',
  'function withdrawFromOpenBounty(uint256 bountyId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Cancellation
  // ═══════════════════════════════════════════════════════════════════════════

  'function cancelSoloBounty(uint256 bountyId)',
  'function cancelOpenBounty(uint256 bountyId)',
  'function claimRefundFromCancelledOpenBounty(uint256 bountyId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Claims
  // ═══════════════════════════════════════════════════════════════════════════

  'function createClaim(uint256 bountyId, string name, string description, string uri)',
  'function acceptClaim(uint256 bountyId, uint256 claimId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Voting (Open Bounties)
  // ═══════════════════════════════════════════════════════════════════════════

  'function submitClaimForVote(uint256 bountyId, uint256 claimId)',
  'function voteClaim(uint256 bountyId, bool vote)',
  'function resolveVote(uint256 bountyId)',
  'function resetVotingPeriod(uint256 bountyId)',

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS - Withdrawals
  // ═══════════════════════════════════════════════════════════════════════════

  'function withdraw()',
  'function withdrawTo(address to)',
];

// Legacy aliases
export const SOLO_BOUNTY_ABI = POIDH_V3_ABI;
export const OPEN_BOUNTY_ABI = POIDH_V3_ABI;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Bounty {
  id: bigint;
  issuer: string;
  name: string;
  description: string;
  amount: bigint;
  claimer: string;      // 0 = active, issuer = cancelled/closed, other = accepted
  createdAt: bigint;
  claimId: bigint;      // accepted claim id (0 if none)
}

export interface Claim {
  id: bigint;
  issuer: string;
  bountyId: bigint;
  bountyIssuer: string;
  name: string;
  description: string;
  createdAt: bigint;
  accepted: boolean;
}

export const POIDH_CONSTANTS = {
  FEE_BPS: 250,           // 2.5%
  BPS_DENOM: 10000,
  MAX_PARTICIPANTS: 150,
  VOTING_PERIOD: 2 * 24 * 60 * 60, // 2 days in seconds
} as const;

export function calculateFee(amount: bigint): bigint {
  return (amount * BigInt(POIDH_CONSTANTS.FEE_BPS)) / BigInt(POIDH_CONSTANTS.BPS_DENOM);
}

export function calculateNetAmount(amount: bigint): bigint {
  return amount - calculateFee(amount);
}
