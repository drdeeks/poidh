#!/usr/bin/env ts-node
/**
 * List bounties from POIDH V3 contract
 *
 * Usage: npx ts-node src/scripts/list-bounties.ts [--all] [--mine]
 *
 * Options:
 *   --all    Show all bounties (default behavior)
 *   --mine   Show only your bounties (requires PRIVATE_KEY in .env)
 */

import { ethers } from 'ethers';
import { config } from '../config';

// POIDH V3 ABI - minimal for reading bounties
const POIDH_ABI = [
  'function bounties(uint256) view returns (uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)',
  'function claimCounter(uint256 bountyId) view returns (uint256)',
];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface BountyInfo {
  id: string;
  issuer: string;
  name: string;
  description: string;
  amount: bigint;
  claimer: string;
  createdAt: bigint;
  claimId: bigint;
}

function isBountyActive(bounty: BountyInfo): boolean {
  return bounty.claimer === ZERO_ADDRESS;
}

function isBountyCompleted(bounty: BountyInfo): boolean {
  return bounty.claimer !== ZERO_ADDRESS && bounty.claimer !== bounty.issuer;
}

function isBountyCancelled(bounty: BountyInfo): boolean {
  return bounty.claimer === bounty.issuer;
}

async function listBounties() {
  const showMine = process.argv.includes('--mine');

  console.log(`\n🔍 Fetching bounties from POIDH V3 contract...`);
  console.log(`   Contract: ${config.poidhContractAddress}`);
  console.log(`   Network: ${config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}`);

  try {
    // Create a read-only provider (no wallet needed)
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const contract = new ethers.Contract(config.poidhContractAddress, POIDH_ABI, provider);

    // If --mine flag, get wallet address
    let walletAddress: string | null = null;
    if (showMine) {
      if (!config.botPrivateKey) {
        console.log(`\n❌ Error: --mine requires PRIVATE_KEY in .env`);
        console.log(`   Use without --mine to see all bounties`);
        process.exit(1);
      }
      const wallet = new ethers.Wallet(config.botPrivateKey);
      walletAddress = wallet.address;
      console.log(`\n📋 Your Wallet: ${walletAddress}`);
    }

    // Fetch bounties by scanning IDs
    const bounties: BountyInfo[] = [];
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 20; // Stop after 20 consecutive empty slots

    console.log(`\n   Scanning bounties...`);

    for (let id = 1; consecutiveEmpty < MAX_EMPTY; id++) {
      try {
        const result = await contract.bounties(id);

        // Check if bounty exists (has an issuer)
        if (result.issuer === ZERO_ADDRESS) {
          consecutiveEmpty++;
          continue;
        }

        const bounty: BountyInfo = {
          id: id.toString(),
          issuer: result.issuer,
          name: result.name,
          description: result.description,
          amount: result.amount,
          claimer: result.claimer,
          createdAt: result.createdAt,
          claimId: result.claimId,
        };

        bounties.push(bounty);
        consecutiveEmpty = 0;

        // Progress indicator
        if (bounties.length % 10 === 0) {
          process.stdout.write(`   Found ${bounties.length} bounties...\r`);
        }
      } catch (error) {
        consecutiveEmpty++;
      }
    }

    console.log(`   Scanned up to ID ${bounties.length > 0 ? bounties[bounties.length - 1].id : 0}, found ${bounties.length} bounties`);

    if (bounties.length === 0) {
      console.log(`\n❌ No bounties found on contract`);
      return;
    }

    // Filter to user's bounties if --mine
    const displayBounties = showMine && walletAddress
      ? bounties.filter(b => b.issuer.toLowerCase() === walletAddress!.toLowerCase())
      : bounties;

    if (displayBounties.length === 0) {
      console.log(`\n❌ No bounties found for your wallet`);
      console.log(`   Remove --mine flag to see all bounties`);
      return;
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(showMine ? '                    YOUR BOUNTIES' : '                    ALL BOUNTIES');
    console.log(`${'═'.repeat(80)}\n`);

    for (const bounty of displayBounties) {
      let status = '❓ Unknown';
      if (isBountyActive(bounty)) status = '🟢 Active';
      else if (isBountyCompleted(bounty)) status = '✅ Completed';
      else if (isBountyCancelled(bounty)) status = '🔴 Cancelled';

      const amountEth = ethers.formatEther(bounty.amount);

      console.log(`[${bounty.id}] ${bounty.name}`);
      console.log(`    Status: ${status}`);
      console.log(`    Amount: ${amountEth} ETH`);
      console.log(`    Issuer: ${bounty.issuer}`);

      if (bounty.claimer !== ZERO_ADDRESS && bounty.claimer !== bounty.issuer) {
        console.log(`    Winner: ${bounty.claimer}`);
      }

      // Try to get claim count
      try {
        const claimCount = await contract.claimCounter(bounty.id);
        if (claimCount > 0) {
          console.log(`    Claims: ${claimCount.toString()}`);
        }
      } catch {
        // Ignore - claimCounter might not exist
      }

      console.log('');
    }

    // Summary
    const active = displayBounties.filter(b => isBountyActive(b));
    const completed = displayBounties.filter(b => isBountyCompleted(b));
    const cancelled = displayBounties.filter(b => isBountyCancelled(b));

    console.log(`${'─'.repeat(80)}`);
    console.log(`Total: ${displayBounties.length} bounties`);
    console.log(`🟢 Active: ${active.length}`);
    console.log(`✅ Completed: ${completed.length}`);
    console.log(`🔴 Cancelled: ${cancelled.length}`);

    if (active.length > 0) {
      console.log(`\n💡 To monitor an active bounty:`);
      console.log(`   npm run agent monitor ${active[0].id}`);
    }

  } catch (error) {
    console.error(`\n❌ Error:`, (error as Error).message);
    process.exit(1);
  }
}

listBounties();

