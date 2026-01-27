import { Contract, parseEther, formatEther } from 'ethers';
import { walletManager } from '../wallet';
import { POIDH_V3_ABI, Bounty, Claim, POIDH_CONSTANTS, calculateFee, calculateNetAmount } from './abis';
import { config } from '../config';
import { log } from '../utils/logger';
import axios from 'axios';

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
      const minBounty = await this.contract.MIN_BOUNTY_AMOUNT();
      const minContribution = await this.contract.MIN_CONTRIBUTION();

      log.info('Contract constants verified', {
        minBountyAmount: `${formatEther(minBounty)} ETH`,
        minContribution: `${formatEther(minContribution)} ETH`,
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

    // Note: Contract signature is createSoloBounty(name, description) payable
    // No deadline parameter in contract - deadline is embedded in description
    const tx = await contract.createSoloBounty(
      name,
      description,
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

    // Note: Contract signature is createOpenBounty(name, description) payable
    // No deadline parameter in contract - deadline is embedded in description
    const tx = await contract.createOpenBounty(
      name,
      description,
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
   * Join/contribute to an existing open bounty
   *
   * Contract signature: joinOpenBounty(uint256 bountyId) payable
   */
  async joinOpenBounty(bountyId: string, amountEth: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Joining open bounty', {
      bountyId,
      amount: `${amountEth} ETH`,
    });

    const tx = await contract.joinOpenBounty(bountyId, {
      value: parseEther(amountEth),
    });

    log.tx('Join Open Bounty', tx.hash, { bountyId, amount: amountEth });

    await tx.wait();

    return tx.hash;
  }

  /**
   * Cancel a solo bounty (only issuer, before any claims accepted)
   */
  async cancelSoloBounty(bountyId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Cancelling solo bounty', { bountyId });

    const tx = await contract.cancelSoloBounty(bountyId);
    await tx.wait();

    log.bounty('Cancelled (Solo)', bountyId, { txHash: tx.hash });

    return tx.hash;
  }

  /**
   * Cancel an open bounty (only issuer, returns proportional refunds to participants)
   */
  async cancelOpenBounty(bountyId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Cancelling open bounty', { bountyId });

    const tx = await contract.cancelOpenBounty(bountyId);
    await tx.wait();

    log.bounty('Cancelled (Open)', bountyId, { txHash: tx.hash });

    return tx.hash;
  }

  /**
   * Withdraw from an open bounty (participants can leave before voting)
   */
  async withdrawFromOpenBounty(bountyId: string): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Withdrawing from open bounty', { bountyId });

    const tx = await contract.withdrawFromOpenBounty(bountyId);
    await tx.wait();

    log.bounty('Withdrawn from Open', bountyId, { txHash: tx.hash });

    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAIMS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Submit a claim with proof URI
   *
   * Contract signature: createClaim(uint256 bountyId, string name, string description, string uri)
   *
   * @param bountyId - The bounty to claim
   * @param name - Title of the claim
   * @param description - Description of the claim/proof
   * @param proofUri - IPFS URI to the proof image
   */
  async createClaim(
    bountyId: string,
    name: string,
    description: string,
    proofUri: string
  ): Promise<{ claimId: string; txHash: string }> {
    const contract = this.getContract();

    log.autonomous('Creating claim', { bountyId, name, proofUri });

    const tx = await contract.createClaim(bountyId, name, description, proofUri);

    log.tx('Create Claim', tx.hash, { bountyId });

    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'ClaimCreated'
    );
    // ClaimCreated event: (id, issuer, bountyId, bountyIssuer, title, description, createdAt, imageUri)
    const claimId = event?.args?.[0]?.toString() || '0';

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
   * Vote on a claim (weighted by contribution)
   *
   * Contract signature: voteClaim(uint256 bountyId, bool vote)
   *
   * @param bountyId - The bounty ID
   * @param support - true for YES, false for NO
   */
  async voteClaim(bountyId: string, support: boolean): Promise<string> {
    const contract = this.getContract();

    log.autonomous('Voting on claim', { bountyId, support: support ? 'YES' : 'NO' });

    const tx = await contract.voteClaim(bountyId, support);

    log.tx('Vote Claim', tx.hash, { bountyId, support });

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
   *
   * Contract returns: (id, issuer, name, description, amount, claimer, createdAt, claimId)
   * - claimer == 0x0: active bounty
   * - claimer == issuer: cancelled or closed
   * - claimer == other address: completed (claim accepted)
   */
  async getBounty(bountyId: string): Promise<Bounty | null> {
    const contract = this.getContract();

    try {
      const bounty = await contract.bounties(bountyId);
      return {
        id: bounty.id || bounty[0],
        issuer: bounty.issuer || bounty[1],
        name: bounty.name || bounty[2],
        description: bounty.description || bounty[3],
        amount: bounty.amount || bounty[4],
        claimer: bounty.claimer || bounty[5],
        createdAt: bounty.createdAt || bounty[6],
        claimId: bounty.claimId || bounty[7],
      };
    } catch (error) {
      log.error('Failed to get bounty', { bountyId, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get paginated bounties
   */
  async getBounties(offset: number = 0): Promise<Bounty[]> {
    const contract = this.getContract();

    try {
      const bounties = await contract.getBounties(offset);
      return bounties.map((b: any) => ({
        id: b.id || b[0],
        issuer: b.issuer || b[1],
        name: b.name || b[2],
        description: b.description || b[3],
        amount: b.amount || b[4],
        claimer: b.claimer || b[5],
        createdAt: b.createdAt || b[6],
        claimId: b.claimId || b[7],
      }));
    } catch (error) {
      log.error('Failed to get bounties', { offset, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Get claims for a bounty (paginated)
   *
   * NOTE: The POIDH V3 contract's claims() and getClaimsByBountyId() do NOT return the URI.
   * The URI is only available in the createClaim transaction input data.
   * We fetch URIs from Blockscout's indexed transaction data.
   */
  async getBountyClaims(bountyId: string, offset: number = 0): Promise<Claim[]> {
    const contract = this.getContract();

    try {
      const claims = await contract.getClaimsByBountyId(bountyId, offset);
      const claimList = claims.map((c: any) => ({
        id: c.id || c[0],
        issuer: c.issuer || c[1],
        bountyId: c.bountyId || c[2],
        bountyIssuer: c.bountyIssuer || c[3],
        name: c.name || c[4],
        description: c.description || c[5],
        createdAt: c.createdAt || c[6],
        accepted: c.accepted || c[7],
        uri: '', // Will be fetched separately
      }));

      // Fetch URIs for each claim from Blockscout
      for (const claim of claimList) {
        try {
          const uri = await this.fetchClaimUriFromBlockscout(claim.issuer, bountyId, claim.name);
          if (uri) {
            claim.uri = uri;
          }
        } catch (err) {
          log.warn('Could not fetch URI for claim', { claimId: claim.id.toString() });
        }
      }

      return claimList;
    } catch (error) {
      log.error('Failed to get claims', { bountyId, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Fetch claim URI from Blockscout transaction data
   *
   * The URI is only stored in the createClaim() transaction input, not in contract storage.
   * We query Blockscout's API to find the transaction and extract the URI parameter.
   */
  private async fetchClaimUriFromBlockscout(
    claimerAddress: string,
    bountyId: string,
    claimName: string
  ): Promise<string | null> {
    try {
      const baseUrl = config.chainId === 8453
        ? 'https://base.blockscout.com'
        : 'https://base-sepolia.blockscout.com';

      // Get transactions from the claimer to the POIDH contract
      const response = await axios.get(
        `${baseUrl}/api/v2/addresses/${claimerAddress}/transactions`,
        { timeout: 10000 }
      );

      const transactions = response.data?.items || [];

      // Find createClaim transactions to the POIDH contract for this bounty
      for (const tx of transactions) {
        const toAddress = typeof tx.to === 'object' ? tx.to?.hash : tx.to;

        if (toAddress?.toLowerCase() !== config.poidhContractAddress.toLowerCase()) {
          continue;
        }

        if (tx.method !== 'createClaim') {
          continue;
        }

        const decoded = tx.decoded_input;
        if (!decoded?.parameters) {
          continue;
        }

        // Check if this transaction is for our bounty
        const txBountyId = decoded.parameters.find((p: any) => p.name === 'bountyId')?.value;
        const txUri = decoded.parameters.find((p: any) => p.name === 'uri')?.value;
        const txName = decoded.parameters.find((p: any) => p.name === 'name')?.value;

        if (txBountyId?.toString() === bountyId.toString()) {
          // If multiple claims from same user, match by name
          if (txName && txName !== claimName) {
            continue;
          }

          if (txUri) {
            log.info('Found claim URI from Blockscout', {
              bountyId,
              claimerAddress: claimerAddress.slice(0, 10) + '...',
              uri: txUri.slice(0, 60) + '...'
            });
            return txUri;
          }
        }
      }

      return null;
    } catch (error) {
      log.warn('Blockscout API error', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get a specific claim by ID
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    const contract = this.getContract();

    try {
      const c = await contract.claims(claimId);
      return {
        id: c.id || c[0],
        issuer: c.issuer || c[1],
        bountyId: c.bountyId || c[2],
        bountyIssuer: c.bountyIssuer || c[3],
        name: c.name || c[4],
        description: c.description || c[5],
        createdAt: c.createdAt || c[6],
        accepted: c.accepted || c[7],
      };
    } catch (error) {
      log.error('Failed to get claim', { claimId, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get total bounty count
   */
  async getBountyCount(): Promise<number> {
    const contract = this.getContract();
    const count = await contract.bountyCounter();
    return Number(count);
  }

  /**
   * Get total claim count
   */
  async getClaimCount(): Promise<number> {
    const contract = this.getContract();
    const count = await contract.claimCounter();
    return Number(count);
  }

  /**
   * Get participants and their amounts for an open bounty
   */
  async getParticipants(bountyId: string): Promise<{ addresses: string[]; amounts: bigint[] }> {
    const contract = this.getContract();
    const [addresses, amounts] = await contract.getParticipants(bountyId);
    return { addresses, amounts };
  }

  /**
   * Get voting tracker for a bounty
   */
  async getVotingTracker(bountyId: string): Promise<{ yes: bigint; no: bigint; deadline: number }> {
    const contract = this.getContract();
    const tracker = await contract.bountyVotingTracker(bountyId);
    return {
      yes: tracker.yes || tracker[0],
      no: tracker.no || tracker[1],
      deadline: Number(tracker.deadline || tracker[2]),
    };
  }

  /**
   * Get current voting claim for a bounty
   */
  async getCurrentVotingClaim(bountyId: string): Promise<string> {
    const contract = this.getContract();
    const claimId = await contract.bountyCurrentVotingClaim(bountyId);
    return claimId.toString();
  }

  /**
   * Check if voting deadline has passed for a bounty
   */
  async isVotingEnded(bountyId: string): Promise<boolean> {
    const tracker = await this.getVotingTracker(bountyId);
    return Date.now() / 1000 > tracker.deadline;
  }

  /**
   * Check if a bounty is active (not cancelled/completed)
   */
  isBountyActive(bounty: Bounty): boolean {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    return bounty.claimer === zeroAddress;
  }

  /**
   * Check if a bounty is cancelled
   */
  isBountyCancelled(bounty: Bounty): boolean {
    return bounty.claimer.toLowerCase() === bounty.issuer.toLowerCase();
  }

  /**
   * Check if a bounty is completed (has accepted claim)
   */
  isBountyCompleted(bounty: Bounty): boolean {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    return bounty.claimer !== zeroAddress && bounty.claimer.toLowerCase() !== bounty.issuer.toLowerCase();
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

