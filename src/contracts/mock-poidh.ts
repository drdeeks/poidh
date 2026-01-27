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

interface MockBountyData {
  bounty: Bounty;
  claims: Claim[];
}

/**
 * MockPOIDHContract - Simulates POIDH V3 contract for testing
 */
export class MockPOIDHContract {
  private bounties: Map<string, MockBountyData> = new Map();
  private bountyCounter = 0;
  private claimCounter = 0;

  async initialize(): Promise<void> {
    log.info('🧪 Mock POIDH V3 contract initialized (DEMO MODE)');
  }

  /**
   * Create a mock solo bounty
   */
  async createSoloBounty(
    name: string,
    description: string,
    amountEth: string,
    deadlineTimestamp: number
  ): Promise<{ bountyId: string; txHash: string }> {
    this.bountyCounter++;
    const bountyId = String(this.bountyCounter);
    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    const bounty: Bounty = {
      id: BigInt(bountyId),
      issuer: '0xMockBotWallet',
      name,
      description,
      amount: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
      deadline: BigInt(deadlineTimestamp),
      isOpen: false, // Solo bounty
      isCompleted: false,
      isCancelled: false,
      winningClaimId: BigInt(0),
    };

    this.bounties.set(bountyId, { bounty, claims: [] });

    log.info('🧪 [MOCK] Created solo bounty', { bountyId, txHash, name });

    // Simulate transaction delay
    await this.simulateDelay();

    return { bountyId, txHash };
  }

  /**
   * Create a mock open bounty
   */
  async createOpenBounty(
    name: string,
    description: string,
    amountEth: string,
    deadlineTimestamp: number
  ): Promise<{ bountyId: string; txHash: string }> {
    this.bountyCounter++;
    const bountyId = String(this.bountyCounter);
    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    const bounty: Bounty = {
      id: BigInt(bountyId),
      issuer: '0xMockBotWallet',
      name,
      description,
      amount: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
      deadline: BigInt(deadlineTimestamp),
      isOpen: true, // Open bounty
      isCompleted: false,
      isCancelled: false,
      winningClaimId: BigInt(0),
    };

    this.bounties.set(bountyId, { bounty, claims: [] });

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
   * Get mock claims
   */
  async getBountyClaims(bountyId: string): Promise<Claim[]> {
    const data = this.bounties.get(bountyId);
    return data?.claims || [];
  }

  /**
   * Simulate a submission (for testing)
   */
  async simulateSubmission(
    bountyId: string,
    claimer: string,
    uri: string
  ): Promise<Claim> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    this.claimCounter++;
    const claim: Claim = {
      id: BigInt(this.claimCounter),
      bountyId: BigInt(bountyId),
      claimer,
      uri,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      accepted: false,
      inVoting: false,
      votesFor: BigInt(0),
    };

    data.claims.push(claim);

    log.info('🧪 [MOCK] Simulated submission', {
      bountyId,
      claimId: this.claimCounter,
      claimer,
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

    // Update bounty
    data.bounty.isCompleted = true;
    data.bounty.winningClaimId = claim.id;

    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    log.info('🧪 [MOCK] Accepted claim and paid winner', {
      bountyId,
      claimId,
      winner: claim.claimer,
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
   * Cancel mock bounty
   */
  async cancelBounty(bountyId: string): Promise<string> {
    const data = this.bounties.get(bountyId);
    if (!data) throw new Error(`Bounty ${bountyId} not found`);

    data.bounty.isCancelled = true;

    const txHash = `0x${uuidv4().replace(/-/g, '')}`;

    log.info('🧪 [MOCK] Cancelled bounty', { bountyId, txHash });

    return txHash;
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

