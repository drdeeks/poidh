#!/usr/bin/env ts-node
/**
 * Close all active bounties that can be closed
 */

import { poidhContract } from '../contracts/poidh';
import { walletManager } from '../wallet';
import { logger } from '../utils/logger';

async function closeAllBounties() {
  try {
    await walletManager.initialize();
    await poidhContract.initialize();
    const walletAddress = await walletManager.getAddress();

    logger.info('🔍 Fetching all bounties...');
    
    // Get total bounty count
    let bountyCount = 0;
    try {
      bountyCount = await poidhContract.getBountyCount();
    } catch {
      bountyCount = 134; // Fallback from list output
    }

    logger.info(`📊 Total bounties to check: ${bountyCount}`);

    let closedCount = 0;
    let failedCount = 0;
    const failedBounties: number[] = [];

    for (let id = 1; id <= bountyCount; id++) {
      try {
        const bounty = await poidhContract.getBounty(String(id));
        if (!bounty) continue;

        const isActive = poidhContract.isBountyActive(bounty);
        const isCompleted = poidhContract.isBountyCompleted(bounty);
        const isCancelled = poidhContract.isBountyCancelled?.(bounty);

        // Skip if already ended
        if (!isActive || isCompleted || isCancelled) {
          continue;
        }

        // Check if we're the issuer
        if (bounty.issuer.toLowerCase() !== walletAddress.toLowerCase()) {
          continue;
        }

        logger.info(`🔄 Closing bounty ${id}: ${bounty.name}`);
        
        try {
          const txHash = await poidhContract.cancelSoloBounty(String(id));
          logger.info(`   ✅ Cancelled - TX: ${txHash}`);
          closedCount++;
        } catch (error) {
          logger.error(`   ❌ Failed to close bounty ${id}: ${(error as Error).message}`);
          failedCount++;
          failedBounties.push(id);
        }

        // Add delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`❌ Error processing bounty ${id}: ${(error as Error).message}`);
      }
    }

    logger.info(`\n✅ Completed!`);
    logger.info(`   Closed: ${closedCount}`);
    logger.info(`   Failed: ${failedCount}`);
    if (failedBounties.length > 0) {
      logger.info(`   Failed IDs: ${failedBounties.join(', ')}`);
    }

  } catch (error) {
    logger.error(`❌ Fatal error: ${(error as Error).message}`);
    process.exit(1);
  }
}

closeAllBounties();
