#!/usr/bin/env ts-node
/**
 * Cancel a bounty and reclaim funds
 *
 * Usage: npx ts-node src/scripts/cancel-bounty.ts <bountyId>
 *
 * Note: Only works if no claims have been accepted yet
 */

import { poidhContract } from '../contracts/poidh';
import { walletManager } from '../wallet';
import { config } from '../config';

async function cancelBounty() {
  const bountyId = process.argv[2];

  if (!bountyId) {
    console.log('Usage: npx ts-node src/scripts/cancel-bounty.ts <bountyId>');
    console.log('Example: npx ts-node src/scripts/cancel-bounty.ts 123');
    process.exit(1);
  }

  console.log(`\n🔍 Checking bounty ${bountyId}...`);

  try {
    await poidhContract.initialize();

    // Get bounty info
    const bounty = await poidhContract.getBounty(bountyId);

    if (!bounty) {
      console.log(`❌ Bounty ${bountyId} not found`);
      process.exit(1);
    }

    console.log(`\n📋 Bounty Details:`);
    console.log(`   Name: ${bounty.name}`);
    console.log(`   Amount: ${bounty.amount} wei`);
    console.log(`   Issuer: ${bounty.issuer}`);
    console.log(`   Claimer: ${bounty.claimer}`);

    // Check if bounty can be cancelled
    const isActive = poidhContract.isBountyActive(bounty);
    const isCompleted = poidhContract.isBountyCompleted(bounty);

    if (isCompleted) {
      console.log(`\n❌ Cannot cancel - bounty already completed (winner paid)`);
      process.exit(1);
    }

    if (!isActive) {
      console.log(`\n❌ Cannot cancel - bounty is not active`);
      process.exit(1);
    }

    // Check if we're the issuer
    const walletAddress = await walletManager.getAddress();
    if (bounty.issuer.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log(`\n❌ Cannot cancel - you are not the bounty issuer`);
      console.log(`   Your wallet: ${walletAddress}`);
      console.log(`   Bounty issuer: ${bounty.issuer}`);
      process.exit(1);
    }

    console.log(`\n✅ Bounty can be cancelled!`);
    console.log(`\n🚀 Cancelling bounty ${bountyId}...`);

    const txHash = await poidhContract.cancelSoloBounty(bountyId);

    console.log(`\n✅ Bounty cancelled successfully!`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Explorer: https://basescan.org/tx/${txHash}`);
    console.log(`\n💰 Your funds should now be available to withdraw via pendingWithdrawals`);

  } catch (error) {
    console.error(`\n❌ Error:`, (error as Error).message);
    process.exit(1);
  }
}

cancelBounty();
