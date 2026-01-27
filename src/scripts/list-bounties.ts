#!/usr/bin/env ts-node
/**
 * List bounties created by this wallet
 *
 * Usage: npx ts-node src/scripts/list-bounties.ts [--all]
 *
 * Options:
 *   --all    Show all bounties (default: only your bounties)
 */

import { poidhContract } from '../contracts/poidh';
import { walletManager } from '../wallet';
import { ethers } from 'ethers';

async function listBounties() {
  const showAll = process.argv.includes('--all');

  console.log(`\n🔍 Fetching bounties from POIDH V3 contract...`);

  try {
    await poidhContract.initialize();
    const walletAddress = await walletManager.getAddress();

    console.log(`\n📋 Your Wallet: ${walletAddress}`);

    // Get recent bounties (last 100)
    // Note: This queries by ID, starting from most recent
    const bounties: any[] = [];
    let foundEmpty = 0;

    // Try to find bounties by checking IDs
    for (let id = 1; id <= 1000 && foundEmpty < 10; id++) {
      try {
        const bounty = await poidhContract.getBounty(id.toString());
        if (bounty) {
          bounties.push({ bountyId: id.toString(), ...bounty });
          foundEmpty = 0;
        } else {
          foundEmpty++;
        }
      } catch {
        foundEmpty++;
      }
    }

    if (bounties.length === 0) {
      console.log(`\n❌ No bounties found`);
      return;
    }

    // Filter to user's bounties unless --all
    const displayBounties = showAll
      ? bounties
      : bounties.filter(b => b.issuer.toLowerCase() === walletAddress.toLowerCase());

    if (displayBounties.length === 0) {
      console.log(`\n❌ No bounties found for your wallet`);
      console.log(`   Use --all to see all bounties`);
      return;
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(showAll ? '                    ALL BOUNTIES' : '                    YOUR BOUNTIES');
    console.log(`${'═'.repeat(80)}\n`);

    for (const bounty of displayBounties) {
      const isActive = poidhContract.isBountyActive(bounty);
      const isCompleted = poidhContract.isBountyCompleted(bounty);
      const isCancelled = !isActive && !isCompleted;

      let status = '❓ Unknown';
      if (isActive) status = '🟢 Active';
      else if (isCompleted) status = '✅ Completed';
      else if (isCancelled) status = '❌ Cancelled';

      const amountEth = ethers.formatEther(bounty.amount);

      console.log(`[${bounty.bountyId}] ${bounty.name}`);
      console.log(`    Status: ${status}`);
      console.log(`    Amount: ${amountEth} ETH`);
      console.log(`    Issuer: ${bounty.issuer}`);
      if (bounty.claimer !== '0x0000000000000000000000000000000000000000') {
        console.log(`    Claimer: ${bounty.claimer}`);
      }

      // Get claims for this bounty
      try {
        const claims = await poidhContract.getBountyClaims(bounty.bountyId);
        if (claims.length > 0) {
          console.log(`    Claims: ${claims.length}`);
        }
      } catch {
        // Ignore claim fetch errors
      }

      console.log('');
    }

    console.log(`${'─'.repeat(80)}`);
    console.log(`Total: ${displayBounties.length} bounties`);
    console.log(`Active: ${displayBounties.filter(b => poidhContract.isBountyActive(b)).length}`);
    console.log(`Completed: ${displayBounties.filter(b => poidhContract.isBountyCompleted(b)).length}`);

  } catch (error) {
    console.error(`\n❌ Error:`, (error as Error).message);
    process.exit(1);
  }
}

listBounties();
