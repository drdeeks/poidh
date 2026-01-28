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
Output
The file /monorepo/packages/service.miniapp-generator/gen/app/autonomous-bounty-bot/src/scripts/check-claims.ts has been updated. Here's the result of running `cat -n` on a snippet of the edited file:
     1→#!/usr/bin/env ts-node
     2→/**
     3→ * CHECK CLAIMS - Enterprise Bounty Claim Indexer
     4→ *
     5→ * Usage: npx ts-node src/scripts/check-claims.ts <bountyId>
     6→ *    or: npm run bounty:claims <bountyId>
     7→ *
     8→ * This script uses the enterprise-grade URI fetcher to index and display
     9→ * all claims for a bounty with full metadata and verification.
    10→ *
    11→ * Features:
    12→ * - Multi-strategy URI fetching (Cache → Blockscout → RPC)
    13→ * - Circuit breaker status display
    14→ * - Cache statistics
    15→ * - IPFS metadata resolution
    16→ * - Clean formatted output
    17→ */
    18→
    19→import { ethers } from 'ethers';
    20→import { config } from '../config';
    21→import { uriFetcher, ClaimData } from '../utils/uri-fetcher';
    22→import axios from 'axios';
    23→
    24→// POIDH V3 ABI - minimal for reading bounty info
    25→const POIDH_ABI = [
    26→  'function bounties(uint256) view returns (uint256 id, address issuer, string name, string description, uint256 amount, address claimer, uint256 createdAt, uint256 claimId)',
    27→];
    28→
    29→async function checkClaims() {
    30→  const bountyId = process.argv[2];
    31→
    32→  if (!bountyId) {
    33→    console.log(`
    34→╔══════════════════════════════════════════════════════════════════════════════╗
    35→║                      POIDH CLAIM INDEXER v2.0                                 ║
    36→╠══════════════════════════════════════════════════════════════════════════════╣
    37→║                                                                              ║
    38→║  Usage: npm run bounty:claims <bountyId>                                     ║
    39→║                                                                              ║
    40→║  Example: npm run bounty:claims 16                                           ║
    41→║                                                                              ║
    42→║  This tool indexes all claims for a bounty using multiple sources:           ║
    43→║    1. Cache (instant)                                                        ║
    44→║    2. Blockscout Logs API (reliable)                                         ║
    45→║    3. RPC Event Logs (on-chain fallback)                                     ║
    46→║                                                                              ║
    47→║  Contract: 0x5555Fa783936C260f77385b4E153B9725feF1719                        ║
    48→║  Network:  Base Mainnet                                                      ║
    49→║                                                                              ║
    50→╚══════════════════════════════════════════════════════════════════════════════╝
    51→`);
    52→    process.exit(1);
    53→  }
    54→
    55→  console.log(`
    56→╔══════════════════════════════════════════════════════════════════════════════╗
    57→║                      POIDH CLAIM INDEXER v2.0                                 ║
    58→╚══════════════════════════════════════════════════════════════════════════════╝
    59→`);
    60→
    61→  console.log(`🔍 Indexing bounty #${bountyId}...`);
    62→  console.log(`   Contract: ${config.poidhContractAddress}`);
    63→  console.log(`   Network:  ${config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}\n`);
    64→
    65→  try {
    66→    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    67→    const contract = new ethers.Contract(config.poidhContractAddress, POIDH_ABI, provider);
    68→
    69→    // Get bounty info
    70→    console.log(`📋 Fetching bounty info from contract...\n`);
    71→    const bounty = await contract.bounties(bountyId);
    72→
    73→    if (bounty.issuer === ethers.ZeroAddress) {
    74→      console.log(`❌ Bounty #${bountyId} not found on chain\n`);
    75→      process.exit(1);
    76→    }
    77→
    78→    // Format bounty status
    79→    const isCompleted = bounty.claimer !== ethers.ZeroAddress;
    80→    const statusText = isCompleted ? '✅ Completed' : '🔄 Active';
    81→    const rewardEth = ethers.formatEther(bounty.amount);
    82→
    83→    console.log(`┌─────────────────────────────────────────────────────────────────────────────┐`);
    84→    console.log(`│ BOUNTY #${bountyId.toString().padEnd(69)}│`);
    85→    console.log(`├─────────────────────────────────────────────────────────────────────────────┤`);
    86→    console.log(`│ Name:   ${bounty.name.slice(0, 67).padEnd(67)}│`);
    87→    console.log(`│ Reward: ${(rewardEth + ' ETH').padEnd(67)}│`);
    88→    console.log(`│ Issuer: ${bounty.issuer.padEnd(67)}│`);
    89→    console.log(`│ Status: ${statusText.padEnd(67)}│`);
    90→    if (isCompleted) {
    91→      console.log(`│ Winner: ${bounty.claimer.padEnd(67)}│`);
    92→      console.log(`│ ClaimID:${(' #' + bounty.claimId.toString()).padEnd(68)}│`);
    93→    }
    94→    console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);
    95→
    96→    // Use the indexBountyClaims method for clean, verified data
    97→    console.log(`📡 Fetching claims from blockchain events...\n`);
    98→    const startTime = Date.now();
    99→    const claims: ClaimData[] = await uriFetcher.indexBountyClaims(bountyId);
   100→    const elapsed = Date.now() - startTime;
   101→
   102→    if (claims.length === 0) {
   103→      console.log(`   ⚠️  No claims found for bounty #${bountyId}\n`);
   104→      console.log(`   This could mean:`);
   105→      console.log(`   - No one has submitted a claim yet`);
   106→      console.log(`   - The claim events are older than the search range (~3-4 days)`);
   107→      console.log(`   - There was an error fetching from Blockscout\n`);
   108→    } else {
   109→      console.log(`   Found ${claims.length} claim(s) in ${elapsed}ms\n`);
   110→
   111→      console.log(`┌─────────────────────────────────────────────────────────────────────────────┐`);
   112→      console.log(`│                              CLAIMS                                         │`);
   113→      console.log(`└─────────────────────────────────────────────────────────────────────────────┘`);
   114→
   115→      for (const claim of claims) {
   116→        const claimIdPadding = Math.max(0, 64 - claim.claimId.length);
   117→        console.log(`\n┌── Claim #${claim.claimId} ${'─'.repeat(claimIdPadding)}┐`);
   118→        console.log(`│`);
   119→        console.log(`│  Title:       ${claim.title.slice(0, 60)}`);
   120→        console.log(`│  Description: ${claim.description.slice(0, 60)}`);
   121→        console.log(`│  Submitter:   ${claim.issuer}`);
   122→        console.log(`│  Created:     ${new Date(claim.createdAt * 1000).toISOString()}`);
   123→        console.log(`│  Round:       ${claim.round}`);
   124→        console.log(`│`);
   125→        console.log(`│  📎 Metadata URI:`);
   126→        console.log(`│     ${claim.imageUri}`);
   127→
   128→        // Fetch metadata from IPFS/Pinata
   129→        try {
   130→          let fetchUrl = claim.imageUri;
   131→
   132→          // Convert IPFS URI to HTTP gateway
   133→          if (fetchUrl.startsWith('ipfs://')) {
   134→            fetchUrl = `https://ipfs.io/ipfs/${fetchUrl.slice(7)}`;
   135→          }
   136→
   137→          console.log(`│`);
   138→          console.log(`│  📦 Fetching metadata...`);
   139→
   140→          const metaResponse = await axios.get(fetchUrl, { timeout: 15000 });
   141→          const metadata = metaResponse.data;
   142→
   143→          if (metadata.name) {
   144→            console.log(`│     Name: ${metadata.name}`);
   145→          }
   146→
   147→          if (metadata.description) {
   148→            console.log(`│     Desc: ${metadata.description.slice(0, 55)}${metadata.description.length > 55 ? '...' : ''}`);
   149→          }
   150→
   151→          if (metadata.image) {
   152→            let imageUrl = metadata.image;
   153→            if (imageUrl.startsWith('ipfs://')) {
   154→              imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
   155→            }
   156→            console.log(`│`);
   157→            console.log(`│  🖼️  Proof Image:`);
   158→            console.log(`│     ${imageUrl}`);
   159→          }
   160→
   161→          if (metadata.attributes && metadata.attributes.length > 0) {
   162→            console.log(`│`);
   163→            console.log(`│  🏷️  Attributes: ${JSON.stringify(metadata.attributes).slice(0, 50)}`);
   164→          }
   165→
   166→          if (metadata.external_url) {
   167→            console.log(`│  🔗 External: ${metadata.external_url}`);
   168→          }
   169→
   170→        } catch (err) {
   171→          const errorMsg = (err as Error).message;
   172→          console.log(`│`);
   173→          console.log(`│  ⚠️  Metadata fetch failed:`);
   174→          console.log(`│     ${errorMsg.slice(0, 60)}`);
   175→        }
   176→
   177→        // Transaction link
   178→        if (claim.txHash) {
   179→          const explorerUrl = config.chainId === 8453 ? 'basescan.org' : 'sepolia.basescan.org';
   180→          console.log(`│`);
   181→          console.log(`│  🔗 Transaction:`);
   182→          console.log(`│     https://${explorerUrl}/tx/${claim.txHash}`);
   183→        }
   184→
   185→        if (claim.blockNumber) {
   186→          console.log(`│  📦 Block: ${claim.blockNumber}`);
   187→        }
   188→
   189→        console.log(`│`);
   190→        console.log(`└${'─'.repeat(78)}┘`);
   191→      }
   192→    }
   193→
   194→    // System Status Section
   195→    console.log(`\n┌─────────────────────────────────────────────────────────────────────────────┐`);
   196→    console.log(`│                          SYSTEM STATUS                                       │`);
   197→    console.log(`├─────────────────────────────────────────────────────────────────────────────┤`);
   198→
   199→    // Cache statistics
   200→    const cacheStats = uriFetcher.getCacheStats();
   201→    const cacheInfo = `${cacheStats.entries} entries | ${cacheStats.hits} hits | ${cacheStats.misses} misses | ${cacheStats.hitRate} hit rate`;
   202→    console.log(`│  Cache:    ${cacheInfo.padEnd(64)}│`);
   203→
   204→    // Circuit breaker status
   205→    const circuits = uriFetcher.getCircuitStatus();
   206→    const circuitLine = Object.entries(circuits)
   207→      .map(([name, state]) => {
   208→        const icon = state === 'closed' ? '🟢' : state === 'open' ? '🔴' : '🟡';
   209→        return `${icon} ${name}: ${state}`;
   210→      })
   211→      .join(' | ');
   212→    console.log(`│  Circuits: ${circuitLine.padEnd(64)}│`);
   213→
   214→    // Network info
   215→    const networkName = config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia';
   216→    console.log(`│  Network:  ${networkName.padEnd(64)}│`);
   217→    console.log(`│  RPC:      ${config.rpcUrl.slice(0, 64).padEnd(64)}│`);
   218→
   219→    console.log(`└─────────────────────────────────────────────────────────────────────────────┘`);
   220→
   221→    // Helpful tips
   222→    console.log(`
   223→💡 Tips:
   224→   • URIs are cached locally in ./data/uri-cache.json
   225→   • Run again to see improved cache hit rate
   226→   • Circuit breakers auto-reset after 60 seconds
   227→   • Use 'npm run bounty:list' to see all bounties
   228→`);
   229→
   230→    // Flush cache before exit
   231→    uriFetcher.flushCache();
   232→
   233→  } catch (error) {
   234→    console.error(`\n❌ Error: ${(error as Error).message}`);
   235→
   236→    // Provide helpful error context
   237→    if ((error as Error).message.includes('could not coalesce')) {
   238→      console.error(`\n   This is usually a temporary RPC issue. Try again in a few seconds.`);
   239→    } else if ((error as Error).message.includes('timeout')) {
   240→      console.error(`\n   Request timed out. The Blockscout API may be slow.`);
   241→    } else if ((error as Error).message.includes('ENOTFOUND')) {
   242→      console.error(`\n   Network error. Check your internet connection.`);
   243→    }
   244→
   245→    console.error(`\n`);
   246→    process.exit(1);
   247→  }
   248→}
   249→
   250→// Run the script
   251→checkClaims().catch((err) => {
   252→  console.error('Unhandled error:', err);
   253→  process.exit(1);
   254→});
   255→