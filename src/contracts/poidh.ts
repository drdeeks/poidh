import { Contract, parseEther, formatEther } from 'ethers';
import { walletManager } from '../wallet';
import { POIDH_V3_ABI, Bounty, Claim, POIDH_CONSTANTS, calculateFee, calculateNetAmount } from './abis';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * POIDHContract - Interface for interacting with POIDH V3 smart contract
 *
 * Contract Address (Base Mainnet): 0x5555Fa783936C260f77385b4E153B9725feF1719
 *
 * Handles:
 * - Creating solo and open bounties
 * - Submitting and accepting claims
 * - Weighted voting for open bounties
 * - Pull-payment withdrawals
 * - Fee calculations (2.5%)
 */
export class POIDHContract {
  private contract: Contract | null = null;

  /**
   * Initialize contract instance
   */
  async initialize(): Promise<void> {
    const wallet = walletManager.getWallet();

    if (!config.poidhContractAddress) {
      throw new Error('POIDH_CONTRACT_ADDRESS not configured');
    }

    this.contract = new Contract(
      config.poidhContractAddress,
      POIDH_V3_ABI,
      wallet
    );

    log.info('POIDH V3 contract initialized', {
      address: config.poidhContractAddress,
      network: config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia',
    });

    // Log contract constants for verification
    try {
      const feeBps = await this.contract.FEE_BPS();
      const maxParticipants = await this.contract.MAX_PARTICIPANTS();
      const votingPeriod = await this.contract.votingPeriod();

      log.info('Contract constants verified', {
        feeBps: feeBps.toString(),
        maxParticipants: maxParticipants.toString(),
        votingPeriodDays: Number(votingPeriod) / 86400,
      });
    } catch (error) {
      log.warn('Could not fetch contract constants', { error: (error as Error).message });
    }
  }

  /**
   * Get contract instance (throws if not initialized)
   */
  private getContract(): Contract {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }
    return this.contract;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOUNTY CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a solo bounty (issuer accepts claims directly)
   *
   * @param name - Bounty title
   * @param description - Detailed description of requirements
   * @param deadlineTimestamp - Unix timestamp for deadline
   * @param amountEth - Bounty reward in ETH (sent as msg.value)
   * @returns Bounty ID and transaction hash
   */
  async createSoloBounty(
    name: string,
    description: string,
    deadlineTimestamp: number,
    amountEth: string
  ): Promise<{ bountyId: string; txHash: string }> {
    const contract = this.getContract();

    const fee = calculateFee(parseEther(amountEth));
    const netAmount = calculateNetAmount(parseEther(amountEth));

    const valueWei = parseEther(amountEth);

    log.autonomous('Creating solo bounty', {
      name,
      amount: `${amountEth} ETH`,
      valueWei: valueWei.toString(),
      fee: `${formatEther(fee)} ETH (2.5%)`,
      netReward: `${formatEther(netAmount)} ETH`,
      deadline: new Date(deadlineTimestamp * 1000).toISOString(),
      deadlineTimestamp,
    });

    // Debug: Log the exact parameters being sent
    console.log('DEBUG: Contract call parameters:');
    console.log('  name:', name);
    console.log('  description length:', description.length);
    console.log('  deadline:', deadlineTimestamp);
    console.log('  value (wei):', valueWei.toString());
    console.log('  value (ETH):', amountEth);

    const tx = await contract.createSoloBounty(
      name,
      description,
      deadlineTimestamp,
      { value: valueWei }
    );

    log.tx('Create Solo Bounty', tx.hash);

    const receipt = await tx.wait();

    // Parse the BountyCreated event to get the bounty ID
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'BountyCreated'
    );
    const bountyId = event?.args?.[0]?.toString() || '0';

    log.bounty('Created (Solo)', bountyId, {
      name,
      amount: amountEth,
      txHash: tx.hash,
    });

    return { bountyId, txHash: tx.hash };
  }

  /**
   * Create an open bounty (weighted voting by contributors)
   *
   * @param name - Bounty title
   * @param description - Detailed description of requirements
   * @param deadlineTimestamp - Unix timestamp for deadline
   * @param amountEth - Initial contribution in ETH (sent as msg.value)
   * @returns Bounty ID and transaction hash
   */
  async createOpenBounty(
    name: string,
    description: string,
    deadlineTimestamp: number,
    amountEth: string
  ): Promise<{ bountyId: string; txHash: string }> {
    const contract = this.getContract();

    log.autonomous('Creating open bounty', {
      name,
      initialAmount: `${amountEth} ETH`,
      deadline: new Date(deadlineTimestamp * 1000).toISOString(),
    });

    const tx = await contract.createOpenBounty(
      name,
      description,
      deadlineTimestamp,
      { value: parseEther(amountEth) }
    );

    log.tx('Create Open Bounty', tx.hash);

    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'BountyCreated'
    );
    const bountyId = event?.args?.[0]?.toString() || '0';

    log.bounty('Created (Open)', bountyId, {
      name,
      amount: amountEth,
      txHash: tx.hash,
    });

    return { bountyId, txHash: tx.hash };
  }

  /**
   * Contribute to an existing open bounty
   */
  async contribute(bountyId: string, amountEth: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Contributing to bounty', {
      bountyId,
      amount: `${amountEth} ETH`,
    });

    const tx = await contract.contribute(bountyId, {
      value: parseEther(amountEth),
    });

    log.tx('Contribute', tx.hash, { bountyId, amount: amountEth });

    await tx.wait();

    return tx.hash;
  }

  /**
   * Cancel a bounty (only issuer, before any claims)
   */
  async cancelBounty(bountyId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Cancelling bounty', { bountyId });

    const tx = await contract.cancelBounty(bountyId);
    await tx.wait();

    log.bounty('Cancelled', bountyId, { txHash: tx.hash });

    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAIMS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Submit a claim with proof URI
   */
  async createClaim(bountyId: string, proofUri: string): Promise<{ claimId: string; txHash: string }> {
    const contract = this.getContract();

    log.autonomous('Creating claim', { bountyId, proofUri });

    const tx = await contract.createClaim(bountyId, proofUri);

    log.tx('Create Claim', tx.hash, { bountyId });

    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'ClaimCreated'
    );
    const claimId = event?.args?.[1]?.toString() || '0';

    return { claimId, txHash: tx.hash };
  }

  /**
   * Accept a claim (solo bounties - issuer only)
   * This is the autonomous payout function for solo bounties!
   */
  async acceptClaim(
    bountyId: string,
    claimId: string,
    rationale: string
  ): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Accepting claim (solo bounty payout)', {
      bountyId,
      claimId,
      rationale,
    });

    const tx = await contract.acceptClaim(bountyId, claimId);

    log.tx('Accept Claim', tx.hash, { bountyId, claimId });

    await tx.wait();

    log.bounty('Claim Accepted', bountyId, {
      claimId,
      txHash: tx.hash,
      rationale,
    });

    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTING (Open Bounties)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Submit a claim for voting (open bounties)
   */
  async submitClaimForVote(bountyId: string, claimId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Submitting claim for vote', { bountyId, claimId });

    const tx = await contract.submitClaimForVote(bountyId, claimId);

    log.tx('Submit for Vote', tx.hash, { bountyId, claimId });

    await tx.wait();

    return tx.hash;
  }

  /**
   * Vote for a claim (weighted by contribution)
   */
  async voteClaim(bountyId: string, claimId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Voting for claim', { bountyId, claimId });

    const tx = await contract.voteClaim(bountyId, claimId);

    log.tx('Vote Claim', tx.hash, { bountyId, claimId });

    await tx.wait();

    return tx.hash;
  }

  /**
   * Resolve voting after period ends
   */
  async resolveVote(bountyId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Resolving vote', { bountyId });

    const tx = await contract.resolveVote(bountyId);

    log.tx('Resolve Vote', tx.hash, { bountyId });

    await tx.wait();

    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWALS (Pull-Payment Pattern)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check pending withdrawal balance for an address
   */
  async getPendingWithdrawal(address: string): Promise<string> {
    const contract = this.getContract();
    const balance = await contract.pendingWithdrawals(address);
    return formatEther(balance);
  }

  /**
   * Withdraw pending balance to caller
   */
  async withdraw(): Promise<string> {
    const contract = this.getContract();

    const address = await walletManager.getAddress();
    const pending = await this.getPendingWithdrawal(address);

    if (parseFloat(pending) === 0) {
      log.warn('No pending withdrawal balance');
      throw new Error('No pending withdrawal balance');
    }

    log.autonomous('Withdrawing pending balance', {
      amount: `${pending} ETH`,
    });

    const tx = await contract.withdraw();

    log.tx('Withdraw', tx.hash, { amount: pending });

    await tx.wait();

    log.info('Withdrawal complete', { amount: pending, txHash: tx.hash });

    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get bounty details by ID
   */
  async getBounty(bountyId: string): Promise<Bounty | null> {
    const contract = this.getContract();

    try {
      const bounty = await contract.getBounty(bountyId);
      return {
        id: bounty.id,
        issuer: bounty.issuer,
        name: bounty.name,
        description: bounty.description,
        amount: bounty.amount,
        deadline: bounty.deadline,
        isOpen: bounty.isOpen,
        isCompleted: bounty.isCompleted,
        isCancelled: bounty.isCancelled,
        winningClaimId: bounty.winningClaimId,
      };
    } catch (error) {
      log.error('Failed to get bounty', { bountyId, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get all claims for a bounty
   */
  async getBountyClaims(bountyId: string): Promise<Claim[]> {
    const contract = this.getContract();

    try {
      const claims = await contract.getClaims(bountyId);
      return claims.map((claim: any) => ({
        id: claim.id,
        bountyId: claim.bountyId,
        claimer: claim.claimer,
        uri: claim.uri,
        createdAt: claim.createdAt,
        accepted: claim.accepted,
        inVoting: claim.inVoting,
        votesFor: claim.votesFor,
      }));
    } catch (error) {
      log.error('Failed to get claims', { bountyId, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Get claim count for a bounty
   */
  async getClaimCount(bountyId: string): Promise<number> {
    const contract = this.getContract();
    const count = await contract.getClaimCount(bountyId);
    return Number(count);
  }

  /**
   * Get total bounty count
   */
  async getBountyCount(): Promise<number> {
    const contract = this.getContract();
    const count = await contract.bountyCount();
    return Number(count);
  }

  /**
   * Get contribution amount for a specific contributor
   */
  async getContribution(bountyId: string, contributor: string): Promise<string> {
    const contract = this.getContract();
    const amount = await contract.contributions(bountyId, contributor);
    return formatEther(amount);
  }

  /**
   * Get all contributors for a bounty
   */
  async getContributors(bountyId: string): Promise<string[]> {
    const contract = this.getContract();
    return contract.getContributors(bountyId);
  }

  /**
   * Get participant count for open bounty
   */
  async getParticipantCount(bountyId: string): Promise<number> {
    const contract = this.getContract();
    const count = await contract.participantCount(bountyId);
    return Number(count);
  }

  /**
   * Check if address has voted
   */
  async hasVoted(bountyId: string, voter: string): Promise<boolean> {
    const contract = this.getContract();
    return contract.hasVoted(bountyId, voter);
  }

  /**
   * Get votes for a claim
   */
  async getVotes(claimId: string): Promise<string> {
    const contract = this.getContract();
    const votes = await contract.getVotes(claimId);
    return formatEther(votes);
  }

  /**
   * Get voting end time for a claim
   */
  async getVotingEndTime(claimId: string): Promise<number> {
    const contract = this.getContract();
    const endTime = await contract.votingEndTime(claimId);
    return Number(endTime);
  }

  /**
   * Check if voting period has ended for a claim
   */
  async isVotingEnded(claimId: string): Promise<boolean> {
    const endTime = await this.getVotingEndTime(claimId);
    return Date.now() / 1000 > endTime;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get fee percentage
   */
  getFeePercentage(): number {
    return POIDH_CONSTANTS.FEE_BPS / 100; // 2.5%
  }

  /**
   * Calculate fee for a given amount
   */
  calculateFee(amountEth: string): string {
    const fee = calculateFee(parseEther(amountEth));
    return formatEther(fee);
  }

  /**
   * Calculate net reward after fee
   */
  calculateNetReward(amountEth: string): string {
    const net = calculateNetAmount(parseEther(amountEth));
    return formatEther(net);
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return config.poidhContractAddress;
  }

  /**
   * Get maximum participants for open bounties
   */
  getMaxParticipants(): number {
    return POIDH_CONSTANTS.MAX_PARTICIPANTS;
  }

  /**
   * Get voting period in seconds
   */
  getVotingPeriodSeconds(): number {
    return POIDH_CONSTANTS.VOTING_PERIOD;
  }
}

export const poidhContract = new POIDHContract();

