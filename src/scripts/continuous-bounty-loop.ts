#!/usr/bin/env ts-node
/**
 * Continuous Bounty Loop - Creates photo bounties sequentially
 *
 * This script runs indefinitely, creating simple photo-based bounties
 * one at a time. After each bounty completes, a new one is created.
 *
 * Usage:
 *   npm run bounty:continuous
 *
 * Stop with Ctrl+C
 */

import { AutonomousBountyAgent } from '../agent';
import { log } from '../utils/logger';
import { SelectionMode, ProofType } from '../bounty/types';
import { config, getNetworkName2 } from '../config';
import { auditTrail } from '../utils/audit-trail';

// Manual argument parsing
const getArg = (name: string) => {
  const argIndex = process.argv.indexOf(`--${name}`);
  if (argIndex > -1 && process.argv.length > argIndex + 1) {
    return process.argv[argIndex + 1];
  }
  return undefined;
};

const customRewardEth = getArg('reward');
const targetChain = getArg('chain');

const bounties = [
  {
    id: 'loop-outdoor-photo',
    name: '📷 Take a Photo Outside',
    description: `
Take a photo proving you are currently outdoors.

✅ ACCEPTANCE CRITERIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MUST be a REAL PHOTO taken right now (not a screenshot or old photo)
2. MUST show you are OUTDOORS (sky, trees, building, street, etc)
3. MUST have valid camera metadata (EXIF data)
4. MUST be taken within the last 60 minutes
5. Photo should be clear and show clear evidence of outdoor location

❌ REJECTED IF:
- Screenshot of another photo
- AI-generated image
- Photo taken more than 60 minutes ago
- No valid EXIF data (camera metadata required)
- Indoor photo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First submission that meets all criteria wins immediately!
    `,
    requirements: 'Photo with EXIF data taken within 60 minutes, showing outdoor location',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.0001',
    deadlineMinutes: 180,
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      rejectScreenshots: true,
      requireLocation: false,
    },
    tags: ['photo', 'outdoor', 'realworld'],
  },
  {
    id: 'loop-meal-photo',
    name: '🍽️ Photo of Your Current Meal',
    description: `
Take a photo of what you're eating right now.

✅ ACCEPTANCE CRITERIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MUST be a REAL PHOTO taken right now (not a screenshot or old photo)
2. MUST show food/drink you are currently consuming
3. MUST have valid camera metadata (EXIF data)
4. MUST be taken within the last 60 minutes
5. Photo should show plate, bowl, cup, or food clearly

❌ REJECTED IF:
- Screenshot of another photo
- AI-generated image
- Photo taken more than 60 minutes ago
- No valid EXIF data (camera metadata required)
- No actual food/drink visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First submission that meets all criteria wins immediately!
    `,
    requirements: 'Photo with EXIF data of current meal, taken within 60 minutes',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.0001',
    deadlineMinutes: 180,
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      rejectScreenshots: true,
      requireLocation: false,
    },
    tags: ['photo', 'meal', 'realworld'],
  },
  {
    id: 'loop-selfie-photo',
    name: '🤳 Take a Selfie Right Now',
    description: `
Take a selfie of yourself right now.

✅ ACCEPTANCE CRITERIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MUST be a REAL PHOTO taken right now (not a screenshot or old photo)
2. MUST show your face clearly
3. MUST have valid camera metadata (EXIF data)
4. MUST be taken within the last 60 minutes
5. Photo should be recognizable as a selfie

❌ REJECTED IF:
- Screenshot of another photo
- AI-generated image
- Photo taken more than 60 minutes ago
- No valid EXIF data (camera metadata required)
- Face not visible or recognizable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First submission that meets all criteria wins immediately!
    `,
    requirements: 'Selfie with EXIF data, face visible, taken within 60 minutes',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.0001',
    deadlineMinutes: 180,
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      rejectScreenshots: true,
      requireLocation: false,
    },
    tags: ['photo', 'selfie', 'realworld'],
  },
  {
    id: 'loop-hand-photo',
    name: '✋ Photo of Your Hand',
    description: `
Take a photo showing your hand clearly.

✅ ACCEPTANCE CRITERIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MUST be a REAL PHOTO taken right now (not a screenshot or old photo)
2. MUST show your hand clearly (fingers, palm, or both)
3. MUST have valid camera metadata (EXIF data)
4. MUST be taken within the last 60 minutes
5. Hand should be unambiguous and clearly human

❌ REJECTED IF:
- Screenshot of another photo
- AI-generated image
- Photo taken more than 60 minutes ago
- No valid EXIF data (camera metadata required)
- Hand not clearly visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First submission that meets all criteria wins immediately!
    `,
    requirements: 'Photo with EXIF data showing your hand, taken within 60 minutes',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.0001',
    deadlineMinutes: 180,
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      rejectScreenshots: true,
      requireLocation: false,
    },
    tags: ['photo', 'hand', 'realworld'],
  },
  {
    id: 'loop-object-photo',
    name: '🎯 Photo of Your Favorite Object',
    description: `
Take a photo of an object that is important to you.

✅ ACCEPTANCE CRITERIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MUST be a REAL PHOTO taken right now (not a screenshot or old photo)
2. MUST show a personal object (favorite item, collectible, gadget, etc)
3. MUST have valid camera metadata (EXIF data)
4. MUST be taken within the last 60 minutes
5. Object should be clearly visible and identifiable

❌ REJECTED IF:
- Screenshot of another photo
- AI-generated image
- Photo taken more than 60 minutes ago
- No valid EXIF data (camera metadata required)
- Object not clearly visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First submission that meets all criteria wins immediately!
    `,
    requirements: 'Photo with EXIF data of personal object, taken within 60 minutes',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.0001',
    deadlineMinutes: 180,
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      rejectScreenshots: true,
      requireLocation: false,
    },
    tags: ['photo', 'object', 'realworld'],
  },
];

let bountyIndex = 0;
let completedCount = 0;
let totalSpent = '0';

/**
 * Extract and display winner rationale from audit trail
 */
function displayWinnerRationale(bountyId: string): void {
  const auditState = auditTrail.getState();
  
  // Find WINNER_RATIONALE entries for this bounty
  const rationaleEntries = auditState.entries.filter(
    entry => entry.action === 'WINNER_RATIONALE' && 
             entry.details.bountyId === bountyId
  );

  if (rationaleEntries.length === 0) {
    return; // No rationale found
  }

  const entry = rationaleEntries[rationaleEntries.length - 1]; // Get most recent
  const rationale = entry.details;

  log.info(`\n╔════════════════════════════════════════════════════════════════╗`);
  log.info(`║ 🏆 WINNER SELECTION RATIONALE                                 ║`);
  log.info(`╠════════════════════════════════════════════════════════════════╣`);
  
  // Winner info
  log.info(`║ Winner Address: ${rationale.winner?.address || 'N/A'}`);
  log.info(`║ Claim ID: ${rationale.winner?.claimId || 'N/A'}`);
  log.info(`║ Selection Mode: ${rationale.selectionMode === 'first_valid' ? 'FIRST VALID' : 'AI JUDGED'}`);
  
  // Validation checks
  if (rationale.validationChecks && rationale.validationChecks.length > 0) {
    log.info(`║                                                                ║`);
    log.info(`║ ✅ VALIDATION CHECKS PASSED:                                  ║`);
    for (const check of rationale.validationChecks) {
      const status = check.passed ? '✓' : '✗';
      log.info(`║   ${status} ${check.name}`);
      if (check.details) {
        log.info(`║     → ${check.details}`);
      }
    }
  }

  // AI Evaluation (if available)
  if (rationale.aiEvaluation) {
    log.info(`║                                                                ║`);
    log.info(`║ 🤖 AI EVALUATION (${rationale.aiEvaluation.model}):               ║`);
    log.info(`║   Score: ${rationale.aiEvaluation.score}/100`);
    log.info(`║   Confidence: ${(rationale.aiEvaluation.confidence * 100).toFixed(0)}%`);
    if (rationale.aiEvaluation.reasoning) {
      const reasoning = rationale.aiEvaluation.reasoning.substring(0, 55);
      log.info(`║   Reasoning: ${reasoning}...`);
    }
  }

  // Competitors summary
  if (rationale.competitorsSummary && rationale.competitorsSummary.length > 0) {
    log.info(`║                                                                ║`);
    log.info(`║ 👥 WHY OTHERS DIDN'T WIN (${rationale.competitorsSummary.length} others):    ║`);
    for (const comp of rationale.competitorsSummary.slice(0, 3)) {
      const addr = comp.address?.substring(0, 10) || 'unknown';
      const reason = comp.reason ? ` - ${comp.reason}` : '';
      log.info(`║   ✗ ${addr}... (${comp.status})${reason}`);
    }
    if (rationale.competitorsSummary.length > 3) {
      log.info(`║   ... and ${rationale.competitorsSummary.length - 3} more submissions`);
    }
  }

  // Decision summary
  if (rationale.decisionSummary) {
    log.info(`║                                                                ║`);
    log.info(`║ 📋 DECISION SUMMARY:                                          ║`);
    const summary = rationale.decisionSummary.substring(0, 58);
    log.info(`║ ${summary}`);
    if (rationale.decisionSummary.length > 58) {
      const summary2 = rationale.decisionSummary.substring(58, 116);
      log.info(`║ ${summary2}`);
    }
  }

  log.info(`║                                                                ║`);
  log.info(`║ ✅ Winner verified as REAL and VALID                           ║`);
  log.info(`╚════════════════════════════════════════════════════════════════╝\n`);
}

/**
 * Display rejection details from audit trail
 */
function displayRejectionDetails(bountyId: string): void {
  const auditState = auditTrail.getState();
  
  const rejectionEntries = auditState.entries.filter(
    entry => entry.action === 'SUBMISSION_REJECTED' && 
             entry.details.bountyId === bountyId
  );

  if (rejectionEntries.length === 0) {
    return;
  }

  if (rejectionEntries.length > 0) {
    log.info(`\n⚠️  REJECTED SUBMISSIONS SUMMARY:`);
    for (const entry of rejectionEntries.slice(0, 3)) {
      const submitter = entry.details.submitter?.substring(0, 10) || 'unknown';
      const reason = entry.details.reason || 'validation failed';
      log.info(`   ✗ ${submitter}... - ${reason}`);
      
      if (entry.details.failedChecks && entry.details.failedChecks.length > 0) {
        for (const check of entry.details.failedChecks.slice(0, 2)) {
          log.info(`     • ${check.name}: ${check.details}`);
        }
      }
    }
    if (rejectionEntries.length > 3) {
      log.info(`   ... and ${rejectionEntries.length - 3} more rejections`);
    }
  }
}

async function runContinuousLoop() {
  const agent = new AutonomousBountyAgent();

  log.info('🚀 Starting Continuous Bounty Loop');
  log.info(`📋 Queue: ${bounties.length} photo bounties`);
  const effectiveRewardEth = customRewardEth || bounties[0].rewardEth;
  log.info(`💰 Reward per bounty: ${effectiveRewardEth} ${getNetworkName2(config.chainId).includes('Degen') ? 'DEGEN' : 'ETH'}`);
  log.info('⏸️  Press Ctrl+C to stop\n');

  try {
    await agent.initialize();
    agent.start();

    while (true) {
      const bountyConfig = bounties[bountyIndex % bounties.length];

      log.info(`\n╔════════════════════════════════════════════════════════════════╗`);
      log.info(
        `║ LAUNCHING BOUNTY ${completedCount + 1} - ${bountyConfig.name.substring(0, 50)}`
      );
      log.info(`╠════════════════════════════════════════════════════════════════╣`);
      log.info(`║ ID: ${bountyConfig.id}`);
      log.info(`║ Reward: ${effectiveRewardEth} ${getNetworkName2(config.chainId).includes('Degen') ? 'DEGEN' : 'ETH'}`);
      log.info(`║ Mode: FIRST_VALID (instant winner)`);
      log.info(`║ Photo Required: YES (with EXIF metadata)`);
      log.info(`║ Valid for: ${bountyConfig.validation.maxAgeMinutes} minutes`);
      log.info(`╚════════════════════════════════════════════════════════════════╝\n`);

      try {
        // Create and launch the bounty
        const bounty = await agent.createBounty({
          id: bountyConfig.id + '-' + Date.now(),
          name: bountyConfig.name,
          description: bountyConfig.description,
          requirements: bountyConfig.requirements,
          proofType: bountyConfig.proofType,
          selectionMode: bountyConfig.selectionMode,
          rewardEth: effectiveRewardEth,
          deadline: Math.floor(Date.now() / 1000) + bountyConfig.deadlineMinutes * 60,
          validation: bountyConfig.validation,
          tags: bountyConfig.tags,
        });

        log.info(`✅ Bounty created: ${bounty.config.id}`);
        log.info(`⏰ Monitoring for submissions...`);

        // Wait for bounty to complete (with timeout)
        const completionTimeout = (bountyConfig.deadlineMinutes + 10) * 60 * 1000; // deadline + 10 min buffer
        const startTime = Date.now();

        while (Date.now() - startTime < completionTimeout) {
          // Check if bounty is completed
          const status = agent.getStatus();
          const activeBounties = status.activeBounties || 0;

          if (activeBounties === 0) {
            log.info(`\n✨ Bounty Complete!\n`);
            
            // Display detailed winner rationale and reasoning
            displayWinnerRationale(bounty.config.id);
            
            // Display rejected submissions for context
            displayRejectionDetails(bounty.config.id);
            
            completedCount++;
            totalSpent = (
              parseFloat(totalSpent) + parseFloat(bountyConfig.rewardEth)
            ).toString();

            log.info(`\n📊 Progress:`);
            log.info(`   Bounties Completed: ${completedCount}`);
            log.info(`   Total Spent: ${totalSpent} ETH`);
            log.info(`   Next Bounty Starting in 5 seconds...\n`);

            // Wait before next bounty
            await new Promise(resolve => setTimeout(resolve, 5000));
            break;
          }

          // Poll every 15 seconds
          await new Promise(resolve => setTimeout(resolve, 15000));
        }

        if (Date.now() - startTime >= completionTimeout) {
          log.warn(`⏱️  Bounty timeout reached. Moving to next bounty.`);
          completedCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error(`❌ Error creating bounty: ${errorMsg}`);
        log.info(`Retrying in 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      // Move to next bounty
      bountyIndex++;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error(`💥 Fatal error in continuous loop: ${errorMsg}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info(`\n\n╔════════════════════════════════════════════════════════════════╗`);
  log.info(`║ CONTINUOUS LOOP STOPPED`);
  log.info(`╠════════════════════════════════════════════════════════════════╣`);
  log.info(`║ Bounties Completed: ${completedCount}`);
  log.info(`║ Total ETH Spent: ${totalSpent}`);
  log.info(`║ Queue Rotations: ${Math.floor(bountyIndex / bounties.length)}`);
  log.info(`╚════════════════════════════════════════════════════════════════╝\n`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info(`\nShutting down gracefully...`);
  process.exit(0);
});

// Run the loop
runContinuousLoop().catch(error => {
  log.error('Unhandled error:', error);
  process.exit(1);
});
