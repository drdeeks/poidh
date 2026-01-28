#!/usr/bin/env ts-node
/**
 * CHECK CLAIMS - Enterprise Bounty Claim Indexer
 *
 * Usage: npx ts-node src/scripts/check-claims.ts <bountyId>
 *    or: npm run bounty:claims <bountyId>
 *
 * This script uses the enterprise-grade URI fetcher to index and display
 * all claims for a bounty with full metadata and verification.
 *
 * Features:
 * - Multi-strategy URI fetching (Cache → Blockscout → RPC)
 * - Circuit breaker status display
 * - Cache statistics
 * - IPFS metadata resolution
 * - Clean formatted output
 */

import { ethers } from 'ethers';
import { config } from '../config';
import { uriFetcher, ClaimData } from '../utils/uri-fetcher';
import axios from 'axios';

// POIDH V3 ABI - minimal for reading bounty info
const POIDH_ABI = [
  'function bounties(uint256) view returns (uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)',
];

async function checkClaims() {
  const bountyId = process.argv[2];

  if (!bountyId) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                      POIDH CLAIM INDEXER v2.0                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Usage: npm run bounty:claims <bountyId>                                     ║
║                                                                              ║
║  Example: npm run bounty:claims 16                                           ║
║                                                                              ║
║  This tool indexes all claims for a bounty using multiple sources:           ║
║    1. Cache (instant)                                                        ║
║    2. Blockscout Logs API (reliable)                                         ║
║    3. RPC Event Logs (on-chain fallback)                                     ║
║                                                                              ║
║  Contract: 0x5555Fa783936C260f77385b4E153B9725feF1719                        ║
║  Network:  Base Mainnet                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                      POIDH CLAIM INDEXER v2.0                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  console.log(`🔍 Indexing bounty #${bountyId}...`);
  console.log(`   Contract: ${config.poidhContractAddress}`);
  console.log(`   Network:  ${config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}\n`);

  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const contract = new ethers.Contract(config.poidhContractAddress, POIDH_ABI, provider);

    // Get bounty info
    console.log(`📋 Fetching bounty info from contract...\n`);
    const bounty = await contract.bounties(bountyId);

    if (bounty.issuer === ethers.ZeroAddress) {
      console.log(`❌ Bounty #${bountyId} not found on chain\n`);
      process.exit(1);
    }

    // Format bounty status
    const isCompleted = bounty.claimer !== ethers.ZeroAddress;
    const statusText = isCompleted ? '✅ Completed' : '🔄 Active';
    const rewardEth = ethers.formatEther(bounty.amount);

    console.log(`┌─────────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ BOUNTY #${bountyId.toString().padEnd(69)}│`);
    console.log(`├─────────────────────────────────────────────────────────────────────────────┤`);
    console.log(`│ Name:   ${bounty.name.slice(0, 67).padEnd(67)}│`);
    console.log(`│ Reward: ${(rewardEth + ' ETH').padEnd(67)}│`);
    console.log(`│ Issuer: ${bounty.issuer.padEnd(67)}│`);
    console.log(`│ Status: ${statusText.padEnd(67)}│`);
    if (isCompleted) {
      console.log(`│ Winner: ${bounty.claimer.padEnd(67)}│`);
      console.log(`│ ClaimID:${(' #' + bounty.claimId.toString()).padEnd(68)}│`);
    }
    console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

    // Use the indexBountyClaims method for clean, verified data
    console.log(`📡 Fetching claims from blockchain events...\n`);
    const startTime = Date.now();
    const claims: ClaimData[] = await uriFetcher.indexBountyClaims(bountyId);
    const elapsed = Date.now() - startTime;

    if (claims.length === 0) {
      console.log(`   ⚠️  No claims found for bounty #${bountyId}\n`);
      console.log(`   This could mean:`);
      console.log(`   - No one has submitted a claim yet`);
      console.log(`   - The claim events are older than the search range (~3-4 days)`);
      console.log(`   - There was an error fetching from Blockscout\n`);
    } else {
      console.log(`   Found ${claims.length} claim(s) in ${elapsed}ms\n`);

      console.log(`┌─────────────────────────────────────────────────────────────────────────────┐`);
      console.log(`│                              CLAIMS                                         │`);
      console.log(`└─────────────────────────────────────────────────────────────────────────────┘`);

      for (const claim of claims) {
        const claimIdPadding = Math.max(0, 64 - claim.claimId.length);
        console.log(`\n┌── Claim #${claim.claimId} ${'─'.repeat(claimIdPadding)}┐`);
        console.log(`│`);
        console.log(`│  Title:       ${claim.title.slice(0, 60)}`);
        console.log(`│  Description: ${claim.description.slice(0, 60)}`);
        console.log(`│  Submitter:   ${claim.issuer}`);
        console.log(`│  Created:     ${new Date(claim.createdAt * 1000).toISOString()}`);
        console.log(`│  Round:       ${claim.round}`);
        console.log(`│`);
        console.log(`│  📎 Metadata URI:`);
        console.log(`│     ${claim.imageUri}`);

        // Fetch metadata from IPFS/Pinata
        try {
          let fetchUrl = claim.imageUri;

          // Convert IPFS URI to HTTP gateway
          if (fetchUrl.startsWith('ipfs://')) {
            fetchUrl = `https://ipfs.io/ipfs/${fetchUrl.slice(7)}`;
          }

          console.log(`│`);
          console.log(`│  📦 Fetching metadata...`);

          const metaResponse = await axios.get(fetchUrl, { timeout: 15000 });
          const metadata = metaResponse.data;

          if (metadata.name) {
            console.log(`│     Name: ${metadata.name}`);
          }

          if (metadata.description) {
            console.log(`│     Desc: ${metadata.description.slice(0, 55)}${metadata.description.length > 55 ? '...' : ''}`);
          }

          if (metadata.image) {
            let imageUrl = metadata.image;
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
            }
            console.log(`│`);
            console.log(`│  🖼️  Proof Image:`);
            console.log(`│     ${imageUrl}`);
          }

          if (metadata.attributes && metadata.attributes.length > 0) {
            console.log(`│`);
            console.log(`│  🏷️  Attributes: ${JSON.stringify(metadata.attributes).slice(0, 50)}`);
          }

          if (metadata.external_url) {
            console.log(`│  🔗 External: ${metadata.external_url}`);
          }

        } catch (err) {
          const errorMsg = (err as Error).message;
          console.log(`│`);
          console.log(`│  ⚠️  Metadata fetch failed:`);
          console.log(`│     ${errorMsg.slice(0, 60)}`);
        }

        // Transaction link
        if (claim.txHash) {
          const explorerUrl = config.chainId === 8453 ? 'basescan.org' : 'sepolia.basescan.org';
          console.log(`│`);
          console.log(`│  🔗 Transaction:`);
          console.log(`│     https://${explorerUrl}/tx/${claim.txHash}`);
        }

        if (claim.blockNumber) {
          console.log(`│  📦 Block: ${claim.blockNumber}`);
        }

        console.log(`│`);
        console.log(`└${'─'.repeat(78)}┘`);
      }
    }

    // System Status Section
    console.log(`\n┌─────────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│                          SYSTEM STATUS                                       │`);
    console.log(`├─────────────────────────────────────────────────────────────────────────────┤`);

    // Cache statistics
    const cacheStats = uriFetcher.getCacheStats();
    const cacheInfo = `${cacheStats.entries} entries | ${cacheStats.hits} hits | ${cacheStats.misses} misses | ${cacheStats.hitRate} hit rate`;
    console.log(`│  Cache:    ${cacheInfo.padEnd(64)}│`);

    // Circuit breaker status
    const circuits = uriFetcher.getCircuitStatus();
    const circuitLine = Object.entries(circuits)
      .map(([name, state]) => {
        const icon = state === 'closed' ? '🟢' : state === 'open' ? '🔴' : '🟡';
        return `${icon} ${name}: ${state}`;
      })
      .join(' | ');
    console.log(`│  Circuits: ${circuitLine.padEnd(64)}│`);

    // Network info
    const networkName = config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia';
    console.log(`│  Network:  ${networkName.padEnd(64)}│`);
    console.log(`│  RPC:      ${config.rpcUrl.slice(0, 64).padEnd(64)}│`);

    console.log(`└─────────────────────────────────────────────────────────────────────────────┘`);

    // Helpful tips
    console.log(`
💡 Tips:
   • URIs are cached locally in ./data/uri-cache.json
   • Run again to see improved cache hit rate
   • Circuit breakers auto-reset after 60 seconds
   • Use 'npm run bounty:list' to see all bounties
`);

    // Flush cache before exit
    uriFetcher.flushCache();

  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);

    // Provide helpful error context
    if ((error as Error).message.includes('could not coalesce')) {
      console.error(`\n   This is usually a temporary RPC issue. Try again in a few seconds.`);
    } else if ((error as Error).message.includes('timeout')) {
      console.error(`\n   Request timed out. The Blockscout API may be slow.`);
    } else if ((error as Error).message.includes('ENOTFOUND')) {
      console.error(`\n   Network error. Check your internet connection.`);
    }

    console.error(`\n`);
    process.exit(1);
  }
}

// Run the script
checkClaims().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
