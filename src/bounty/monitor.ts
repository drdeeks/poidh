import { poidhContract } from '../contracts/poidh';
import { bountyManager } from './manager';
import { Submission, BountyStatus, ProofContent, ProofType } from './types';
import { log } from '../utils/logger';
import { config } from '../config';
import { uriFetcher } from '../utils/uri-fetcher';
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
        submitter: claim.issuer,
      });

      // Process the submission with on-chain bounty ID for URI fetching
      try {
        const submission = await this.processSubmission(configId, claim, onChainId);

        // Log comprehensive submission details to audit trail
        const { auditTrail } = require('../utils/audit-trail');
        auditTrail.log('SUBMISSION_RECEIVED', {
          bountyId: configId,
          onChainBountyId: onChainId,
          claimId: claim.id.toString(),
          submissionId: submission.id,
          submitter: submission.submitter,
          submittedAt: new Date(submission.timestamp).toISOString(),
          proofUri: submission.proofUri,
          proofType: submission.proofContent?.type || 'unknown',
          mediaUrl: submission.proofContent?.mediaUrl,
          description: submission.proofContent?.description,
          status: 'pending_validation',
          nextStep: 'Validation checks will be performed',
        });

        // Add to bounty
        bountyManager.addSubmission(configId, submission);

        // Mark as processed
        this.processedClaims.add(claimKey);
      } catch (error) {
        log.warn('⚠️ Skipping invalid submission', {
          claimId: claim.id.toString(),
          error: (error as Error).message,
        });
        // Mark as processed to avoid retrying
        this.processedClaims.add(claimKey);
      }
    }
  }

  /**
   * Process a raw claim into a structured submission
   *
   * NOTE: POIDH V3 uses `claim.uri` instead of `claim.proofUri`
   * The imageUri is stored in the ClaimCreated event, not in contract storage.
   * We use the enterprise URI fetcher to get it from Blockscout or RPC logs.
   */
  private async processSubmission(
    bountyConfigId: string,
    claim: any,
    onChainBountyId: string
  ): Promise<Submission> {
    let proofUri = claim.uri || claim.imageUri || claim.proofUri || '';

    // If no URI in claim data, use enterprise URI fetcher to get from event logs
    if (!proofUri) {
      const fetchResult = await uriFetcher.fetchClaimUri(onChainBountyId, claim.id.toString());
      if (fetchResult.success && fetchResult.uri) {
        proofUri = fetchResult.uri;
        log.info('✅ URI retrieved via enterprise fetcher', {
          claimId: claim.id.toString(),
          source: fetchResult.source,
          fetchTimeMs: fetchResult.fetchTimeMs,
        });
      } else {
        log.warn('❌ Could not fetch URI from any source', {
          claimId: claim.id.toString(),
          error: fetchResult.error,
        });
      }
    }

    const submission: Submission = {
      id: uuidv4(),
      bountyId: bountyConfigId,
      claimId: claim.id.toString(),
      submitter: claim.issuer,
      proofUri: proofUri,
      timestamp: Number(claim.createdAt || claim.timestamp || 0) * 1000 || Date.now(),
    };

    // Skip invalid submissions (zero address or no timestamp)
    if (submission.submitter === '0x0000000000000000000000000000000000000000') {
      log.warn('⚠️ Skipping invalid submission (zero address)', {
        claimId: claim.id.toString(),
      });
      throw new Error('Invalid submission: zero address');
    }

    // Try to fetch and parse proof content if we have a URI
    if (proofUri) {
      try {
        submission.proofContent = await this.fetchProofContent(proofUri);
      } catch (error) {
        log.warn('Could not fetch proof content', {
          uri: proofUri.slice(0, 80),
          error: (error as Error).message,
        });
      }
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
