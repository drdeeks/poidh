import { poidhContract } from '../contracts/poidh';
import { bountyManager } from './manager';
import { Submission, BountyStatus, ProofContent, ProofType } from './types';
import { log } from '../utils/logger';
import { config } from '../config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * SubmissionMonitor - Monitors for new bounty submissions
 *
 * Polls the blockchain for new claims and processes them.
 * In a production system, this would use event subscriptions.
 */
export class SubmissionMonitor {
  private isRunning = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private processedClaims: Set<string> = new Set();

  /**
   * Start monitoring for submissions
   */
  start(): void {
    if (this.isRunning) {
      log.warn('Monitor already running');
      return;
    }

    this.isRunning = true;
    log.info('🔍 Submission monitor started', {
      pollInterval: `${config.pollingInterval}s`,
    });

    // Initial poll
    this.poll();

    // Set up recurring poll
    this.pollInterval = setInterval(
      () => this.poll(),
      config.pollingInterval * 1000
    );
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    log.info('🔍 Submission monitor stopped');
  }

  /**
   * Poll for new submissions
   */
  private async poll(): Promise<void> {
    const activeBounties = bountyManager.getBountiesByStatus(BountyStatus.ACTIVE);

    for (const bounty of activeBounties) {
      if (!bounty.onChainId) continue;

      try {
        await this.checkBountySubmissions(bounty.config.id, bounty.onChainId);
      } catch (error) {
        log.error('Error checking submissions', {
          bountyId: bounty.config.id,
          error: (error as Error).message,
        });
      }

      // Check if bounty expired
      if (bountyManager.isExpired(bounty.config.id)) {
        log.bounty('Deadline passed', bounty.config.id);
        bountyManager.updateStatus(bounty.config.id, BountyStatus.EVALUATING);
      }
    }
  }

  /**
   * Check for new submissions on a specific bounty
   */
  private async checkBountySubmissions(
    configId: string,
    onChainId: string
  ): Promise<void> {
    const claims = await poidhContract.getBountyClaims(onChainId);

    for (const claim of claims) {
      const claimKey = `${onChainId}-${claim.id}`;

      // Skip already processed claims
      if (this.processedClaims.has(claimKey)) continue;

      log.info('📥 New submission detected', {
        bountyId: configId,
        claimId: claim.id.toString(),
        submitter: claim.issuer, // V3 uses 'issuer' not 'claimer'
      });

      // Process the submission
      const submission = await this.processSubmission(configId, claim);

      // Add to bounty
      bountyManager.addSubmission(configId, submission);

      // Mark as processed
      this.processedClaims.add(claimKey);
    }
  }

  /**
   * Process a raw claim into a structured submission
   *
   * NOTE: POIDH V3 uses `claim.uri` instead of `claim.proofUri`
   */
  private async processSubmission(
    bountyConfigId: string,
    claim: any
  ): Promise<Submission> {
    // V3 contract: imageUri comes from ClaimCreated event, not stored on claim struct
    // For now, we expect the caller to provide uri from event or use description as fallback
    const proofUri = claim.uri || claim.imageUri || claim.proofUri || '';

    const submission: Submission = {
      id: uuidv4(),
      bountyId: bountyConfigId,
      claimId: claim.id.toString(),
      submitter: claim.issuer, // V3 uses 'issuer' not 'claimer'
      proofUri: proofUri,
      timestamp: Number(claim.createdAt || claim.timestamp) * 1000,
    };

    // Try to fetch and parse proof content
    try {
      submission.proofContent = await this.fetchProofContent(proofUri);
    } catch (error) {
      log.warn('Could not fetch proof content', {
        uri: proofUri,
        error: (error as Error).message,
      });
    }

    return submission;
  }

  /**
   * Fetch and parse proof content from URI
   */
  private async fetchProofContent(uri: string): Promise<ProofContent> {
    // Handle IPFS URIs
    let fetchUrl = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUrl = `https://ipfs.io/ipfs/${uri.slice(7)}`;
    }

    const response = await axios.get(fetchUrl, {
      timeout: 30000,
      responseType: 'json',
    });

    const data = response.data;

    // Parse based on content type
    if (data.image || data.imageUrl || data.mediaUrl) {
      return {
        type: ProofType.PHOTO,
        mediaUrl: data.image || data.imageUrl || data.mediaUrl,
        description: data.description || data.caption || '',
        metadata: data,
      };
    }

    if (data.video || data.videoUrl) {
      return {
        type: ProofType.VIDEO,
        mediaUrl: data.video || data.videoUrl,
        description: data.description || '',
        metadata: data,
      };
    }

    // Default to text if no media found
    return {
      type: ProofType.TEXT,
      description: JSON.stringify(data),
      metadata: data,
    };
  }

  /**
   * Get the count of processed claims
   */
  getProcessedCount(): number {
    return this.processedClaims.size;
  }

  /**
   * Check if monitor is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const submissionMonitor = new SubmissionMonitor();
