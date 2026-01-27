#!/usr/bin/env ts-node
/**
 * DEMO: AI-Judged Bounty (GPT-4 Vision)
 *
 * This demo creates a bounty where GPT-4 Vision evaluates all submissions
 * and picks the best one after the deadline.
 *
 * Bounty: "Creative Object Stack Challenge"
 * - Create a creative tower/stack of everyday objects
 * - AI judges creativity, execution, and variety
 * - Highest scoring valid submission wins 0.002 ETH
 *
 * Run: npm run demo:ai-judged
 */

import { agent } from '../agent';
import { DEMO_AI_JUDGED_BOUNTY, deadlineFromNow } from '../bounty/templates';
import { log } from '../utils/logger';
import { config } from '../config';

async function runAIJudgedDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🤖 DEMO: AI-JUDGED BOUNTY (GPT-4 VISION)                          ║
║                                                                              ║
║  This bounty collects submissions until deadline, then GPT-4 Vision         ║
║  evaluates all entries and selects the winner based on:                     ║
║  - Creativity (40%)                                                         ║
║  - Execution quality (30%)                                                  ║
║  - Variety of objects (30%)                                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Verify OpenAI API key is set
    if (!config.openaiApiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. AI-judged bounties require GPT-4 Vision access.'
      );
    }

    // Initialize the agent
    log.info('🔧 Initializing agent...');
    await agent.initialize();

    // Configure bounty for demo (shorter deadline)
    const bountyConfig = {
      ...DEMO_AI_JUDGED_BOUNTY,
      deadline: deadlineFromNow(0.5), // 30 minutes for demo
      rewardEth: config.demoMode ? '0' : '0.002',
    };

    console.log('\n📋 BOUNTY CONFIGURATION:');
    console.log('━'.repeat(60));
    console.log(`Name: ${bountyConfig.name}`);
    console.log(`Description: ${bountyConfig.description}`);
    console.log(`Reward: ${bountyConfig.rewardEth} ETH`);
    console.log(`Selection Mode: AI JUDGED (GPT-4 Vision)`);
    console.log(`Deadline: ${new Date(bountyConfig.deadline * 1000).toISOString()}`);
    console.log('━'.repeat(60));
    console.log('\nRequirements:');
    console.log(bountyConfig.requirements);
    console.log('━'.repeat(60));
    console.log('\nAI Judging Criteria:');
    console.log(bountyConfig.validation.aiValidationPrompt);
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

    // Start the agent
    log.info('🔍 Starting submission monitor...');
    agent.start();

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🎯 BOUNTY IS NOW LIVE!                                                     ║
║                                                                              ║
║  The bot is collecting submissions until the deadline.                      ║
║  After deadline, GPT-4 Vision will evaluate all entries.                    ║
║                                                                              ║
║  How AI Judging Works:                                                      ║
║  1. Each submission image is sent to GPT-4 Vision                           ║
║  2. AI scores based on creativity, execution, and variety                   ║
║  3. AI checks for authenticity (rejects AI-generated images)                ║
║  4. Highest scoring valid submission wins automatically                     ║
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

    // Show final status
    const status = agent.getStatus();
    console.log('\n📊 DEMO SUMMARY:');
    console.log('━'.repeat(40));
    console.log(`Active Bounties: ${status.activeBounties}`);
    console.log(`Completed Bounties: ${status.completedBounties}`);
    console.log(`Total Payouts: ${status.totalPayouts} ETH`);
    console.log('━'.repeat(40));

    console.log('\n🛑 Demo stopped.');

  } catch (error) {
    log.error('Demo failed', { error: (error as Error).message });
    console.error('\n❌ ERROR:', (error as Error).message);
    process.exit(1);
  }
}

// Run the demo
runAIJudgedDemo();
