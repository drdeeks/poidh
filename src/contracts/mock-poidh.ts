/**
 * Mock POIDH V3 Contract for Local Testing
 *
 * This mock implementation allows testing the full bounty lifecycle
 * without real blockchain transactions. Use by setting DEMO_MODE=true.
 *
 * Matches the POIDH V3 contract interface.
 */

import { Bounty, Claim } from './abis';
import { log } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extended types for mock - includes URI which is stored separately in real contract
interface MockClaim extends Claim {
  uri: string; // Image URI (stored in ClaimCreated event in real contract)
}

interface MockBountyData {
  bounty: Bounty;
  claims: MockClaim[];
  isOpenBounty: boolean;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * MockPOIDHContract - Simulates POIDH V3 contract for testing
 */
export class MockPOIDHContract {
  private bounties: Map<string, MockBountyData> = new Map();
  private bountyCounter = 0;
  private claimCounter = 0;
  private mockWalletAddress = '0xMockBotWallet';

  async initialize(): Promise<void> {
    log.info('🧪 Mock POIDH V3 contract initialized (DEMO MODE)');
  }

  /**
   * Create a mock solo bounty
   * Note: Parameter order matches the agent interface (name, desc, amount, deadline)
   */
  async createSoloBounty(
    name: string,
    description: string,
    amountEth: string,
    _deadlineTimestamp: number // Deadline is embedded in description
  ): Promise<{ bountyId: string; txHash: string }> {
    this.bountyCounter++;
    const bountyId = String(this.bountyCounter);
    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    const bounty: Bounty = {
      id: BigInt(bountyId),
      issuer: this.mockWalletAddress,
      name,
      description,
      amount: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
      claimer: ZERO_ADDRESS, // Active bounty
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      claimId: BigInt(0),
    };

    this.bounties.set(bountyId, { bounty, claims: [], isOpenBounty: false });

    log.info('🧪 [MOCK] Created solo bounty', { bountyId, txHash, name });

    // Simulate transaction delay
    await this.simulateDelay();

    return { bountyId, txHash };
  }

  /**
   * Create a mock open bounty
   * Note: Parameter order matches the agent interface (name, desc, amount, deadline)
   */
  async createOpenBounty(
    name: string,
    description: string,
    amountEth: string,
    _deadlineTimestamp: number // Deadline is embedded in description
  ): Promise<{ bountyId: string; txHash: string }> {
    this.bountyCounter++;
    const bountyId = String(this.bountyCounter);
    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    const bounty: Bounty = {
      id: BigInt(bountyId),
      issuer: this.mockWalletAddress,
      name,
      description,
      amount: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
      claimer: ZERO_ADDRESS, // Active bounty
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      claimId: BigInt(0),
    };

    this.bounties.set(bountyId, { bounty, claims: [], isOpenBounty: true });

    log.info('🧪 [MOCK] Created open bounty', { bountyId, txHash, name });

    await this.simulateDelay();

    return { bountyId, txHash };
  }

  /**
   * Get mock bounty
   */
  async getBounty(bountyId: string): Promise<Bounty | null> {
    const data = this.bounties.get(bountyId);
    return data?.bounty || null;
  }

  /**
   * Get mock claims (returns base Claim without URI for type compatibility)
   */
  async getBountyClaims(bountyId: string): Promise<Claim[]> {
    const data = this.bounties.get(bountyId);
    if (!data) return [];
    // Return claims without the URI extension for type compatibility
    return data.claims.map(({ uri: _uri, ...claim }) => claim);
  }

  /**
   * Get mock claim with URI (for internal mock use)
   */
  getClaimWithUri(bountyId: string, claimId: string): MockClaim | undefined {
    const data = this.bounties.get(bountyId);
    return data?.claims.find((c) => c.id.toString() === claimId);
  }

  /**
   * Simulate a submission (for testing)
   */
  async simulateSubmission(
    bountyId: string,
    claimerAddress: string,
    uri: string
  ): Promise<MockClaim> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    this.claimCounter++;
    const claim: MockClaim = {
      id: BigInt(this.claimCounter),
      issuer: claimerAddress,
      bountyId: BigInt(bountyId),
      bountyIssuer: data.bounty.issuer,
      name: 'Submission', // Auto-generated name for mock
      description: 'Mock submission',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      accepted: false,
      uri, // Store URI for mock
    };

    data.claims.push(claim);

    log.info('🧪 [MOCK] Simulated submission', {
      bountyId,
      claimId: this.claimCounter,
      claimer: claimerAddress,
    });

    return claim;
  }

  /**
   * Accept a mock claim (solo bounty payout)
   */
  async acceptClaim(
    bountyId: string,
    claimId: string,
    _rationale: string
  ): Promise<string> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    const claim = data.claims.find((c) => c.id.toString() === claimId);
    if (!claim) throw new Error(`Claim ${claimId} not found`);

    // Update claim
    claim.accepted = true;

    // Update bounty - mark as completed by setting claimer to winner and claimId
    data.bounty.claimer = claim.issuer;
    data.bounty.claimId = claim.id;

    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    log.info('🧪 [MOCK] Accepted claim and paid winner', {
      bountyId,
      claimId,
      winner: claim.issuer,
      txHash,
    });

    await this.simulateDelay();

    return txHash;
  }

  /**
   * Get bounty count
   */
  async getBountyCount(): Promise<number> {
    return this.bountyCounter;
  }

  /**
   * Cancel solo bounty
   */
  async cancelSoloBounty(bountyId: string): Promise<string> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    // Mark as cancelled by setting claimer to issuer
    data.bounty.claimer = data.bounty.issuer;

    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    log.info('🧪 [MOCK] Cancelled solo bounty', { bountyId, txHash });

    return txHash;
  }

  /**
   * Cancel open bounty
   */
  async cancelOpenBounty(bountyId: string): Promise<string> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    // Mark as cancelled by setting claimer to issuer
    data.bounty.claimer = data.bounty.issuer;

    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    log.info('🧪 [MOCK] Cancelled open bounty', { bountyId, txHash });

    return txHash;
  }

  /**
   * Check if bounty is active
   */
  isBountyActive(bounty: Bounty): boolean {
    return bounty.claimer === ZERO_ADDRESS;
  }

  /**
   * Check if bounty is cancelled
   */
  isBountyCancelled(bounty: Bounty): boolean {
    return bounty.claimer.toLowerCase() === bounty.issuer.toLowerCase();
  }

  /**
   * Check if bounty is completed
   */
  isBountyCompleted(bounty: Bounty): boolean {
    return bounty.claimer !== ZERO_ADDRESS && bounty.claimer.toLowerCase() !== bounty.issuer.toLowerCase();
  }

  /**
   * Simulate blockchain delay
   */
  private async simulateDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
  }

  /**
   * Get all bounties (for debugging)
   */
  getAllBounties(): MockBountyData[] {
    return Array.from(this.bounties.values());
  }
}

export const mockPoidhContract = new MockPOIDHContract();
