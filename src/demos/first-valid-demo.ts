#!/usr/bin/env ts-node
/**
 * DEMO: First Valid Submission Bounty
 *
 * This demo creates a bounty where the first valid submission wins automatically.
 *
 * Bounty: "Handwritten Date Challenge"
 * - Take a photo of a handwritten note with today's date
 * - First valid submission wins 0.002 ETH
 *
 * Run: npm run demo:first-valid
 */

import { agent } from '../agent';
import { DEMO_FIRST_VALID_BOUNTY, deadlineFromNow } from '../bounty/templates';
import { log } from '../utils/logger';
import { config } from '../config';

async function runFirstValidDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🎯 DEMO: FIRST VALID SUBMISSION BOUNTY                            ║
║                                                                              ║
║  This bounty automatically pays the first person to submit valid proof.     ║
║  No waiting for deadline, no human judgment - instant payout!               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Initialize the agent
    log.info('🔧 Initializing agent...');
    await agent.initialize();

    // Check wallet balance first
    const walletInfo = await agent.getWalletInfo();
    const status = agent.getStatus();
    console.log(`\n💰 Wallet: ${walletInfo.address}`);
    console.log(`💰 Balance: ${walletInfo.balance} ETH`);
    console.log(`📍 Network: ${status.network}`);

    // Verify sufficient balance
    const requiredEth = 0.002; // Bounty amount (POIDH V3 minimum is ~0.0015 ETH)
    const balance = parseFloat(walletInfo.balance);
    if (balance < requiredEth + 0.0005) { // Need bounty + gas (~0.0005 ETH)
      throw new Error(
        `Insufficient balance! Have ${walletInfo.balance} ETH, need at least ${requiredEth + 0.0005} ETH (bounty + gas).\n` +
        `Send Base ETH to: ${walletInfo.address}`
      );
    }

    // Configure bounty for demo (shorter deadline)
    // IMPORTANT: Always calculate fresh deadline at runtime!
    const freshDeadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from NOW

    const bountyConfig = {
      ...DEMO_FIRST_VALID_BOUNTY,
      deadline: freshDeadline,
      rewardEth: '0.002', // Bounty amount (POIDH V3 minimum is ~0.0015 ETH)
    };

    console.log(`\n⏰ Fresh deadline calculated: ${new Date(freshDeadline * 1000).toISOString()}`);

    console.log('\n📋 BOUNTY CONFIGURATION:');
    console.log('━'.repeat(60));
    console.log(`Name: ${bountyConfig.name}`);
    console.log(`Description: ${bountyConfig.description}`);
    console.log(`Reward: ${bountyConfig.rewardEth} ETH`);
    console.log(`Selection Mode: FIRST VALID WINS`);
    console.log(`Deadline: ${new Date(bountyConfig.deadline * 1000).toISOString()}`);
    console.log('━'.repeat(60));
    console.log('\nRequirements:');
    console.log(bountyConfig.requirements);
    console.log('━'.repeat(60));

    // Create the bounty
    log.info('📤 Creating bounty on-chain...');
    const bounty = await agent.createBounty(bountyConfig);

    console.log('\n✅ BOUNTY CREATED SUCCESSFULLY!');
    console.log('━'.repeat(60));
    console.log(`On-Chain ID: ${bounty.onChainId}`);
    console.log(`Create TX: ${bounty.createTxHash}`);
    console.log(`Status: ${bounty.status}`);
    console.log('━'.repeat(60));

    // Start the agent to monitor for submissions
    log.info('🔍 Starting submission monitor...');
    agent.start();

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🎯 BOUNTY IS NOW LIVE!                                                     ║
║                                                                              ║
║  The bot is now monitoring for submissions.                                 ║
║  First valid submission will trigger AUTOMATIC payout.                      ║
║                                                                              ║
║  To submit a claim:                                                         ║
║  1. Take a photo meeting the requirements                                   ║
║  2. Upload to IPFS (e.g., via web3.storage or nft.storage)                 ║
║  3. Submit claim to bounty contract with IPFS URI                           ║
║                                                                              ║
║  Press Ctrl+C to stop the demo.                                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

    // Keep running until interrupted
    await new Promise((resolve) => {
      process.on('SIGINT', resolve);
    });

    agent.stop();
    console.log('\n🛑 Demo stopped.');

  } catch (error) {
    log.error('Demo failed', { error: (error as Error).message });
    console.error('\n❌ ERROR:', (error as Error).message);
    process.exit(1);
  }
}

// Run the demo
runFirstValidDemo();

