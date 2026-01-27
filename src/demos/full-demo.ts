#!/usr/bin/env ts-node
/**
 * FULL DEMO: End-to-End Autonomous Bounty Bot
 *
 * This demo showcases BOTH bounty types running simultaneously:
 * 1. First Valid Submission bounty (instant payout)
 * 2. AI-Judged bounty (GPT-4 Vision evaluation)
 *
 * Run: npm run demo:full
 */

import { agent } from '../agent';
import {
  DEMO_FIRST_VALID_BOUNTY,
  DEMO_AI_JUDGED_BOUNTY,
  deadlineFromNow,
} from '../bounty/templates';
import { log } from '../utils/logger';
import { config } from '../config';
import { bountyManager } from '../bounty/manager';

async function runFullDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║           🚀 FULL DEMO: AUTONOMOUS BOUNTY BOT                                   ║
║                                                                                  ║
║  This demo creates TWO bounties simultaneously:                                 ║
║                                                                                  ║
║  1️⃣  FIRST VALID: Handwritten Date Challenge (instant payout)                  ║
║  2️⃣  AI JUDGED: Creative Object Stack (GPT-4 Vision selects winner)            ║
║                                                                                  ║
║  The bot operates FULLY AUTONOMOUSLY:                                           ║
║  ✅ Creates bounties on-chain                                                   ║
║  ✅ Monitors for submissions                                                    ║
║  ✅ Evaluates compliance (deterministic + AI)                                   ║
║  ✅ Pays winners automatically                                                  ║
║  ✅ No human intervention at any stage                                          ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Initialize
    log.info('🔧 Initializing autonomous agent...');
    await agent.initialize();

    // Verify OpenAI key for AI-judged bounty
    if (!config.openaiApiKey) {
      log.warn('OPENAI_API_KEY not set - AI-judged bounty will not work fully');
    }

    // Configure bounties for demo
    const firstValidConfig = {
      ...DEMO_FIRST_VALID_BOUNTY,
      id: 'demo-first-valid-full',
      deadline: deadlineFromNow(1), // 1 hour
      rewardEth: config.demoMode ? '0' : '0.001',
    };

    const aiJudgedConfig = {
      ...DEMO_AI_JUDGED_BOUNTY,
      id: 'demo-ai-judged-full',
      deadline: deadlineFromNow(0.5), // 30 minutes
      rewardEth: config.demoMode ? '0' : '0.002',
    };

    // Display bounty summaries
    console.log('\n' + '═'.repeat(80));
    console.log('📋 BOUNTY 1: FIRST VALID SUBMISSION');
    console.log('═'.repeat(80));
    console.log(`Name: ${firstValidConfig.name}`);
    console.log(`Reward: ${firstValidConfig.rewardEth} ETH`);
    console.log(`Mode: First valid submission wins INSTANTLY`);
    console.log(`Deadline: ${new Date(firstValidConfig.deadline * 1000).toISOString()}`);
    console.log(`\nRequirements: ${firstValidConfig.requirements.substring(0, 200)}...`);

    console.log('\n' + '═'.repeat(80));
    console.log('📋 BOUNTY 2: AI-JUDGED (GPT-4 VISION)');
    console.log('═'.repeat(80));
    console.log(`Name: ${aiJudgedConfig.name}`);
    console.log(`Reward: ${aiJudgedConfig.rewardEth} ETH`);
    console.log(`Mode: AI evaluates all submissions after deadline`);
    console.log(`Deadline: ${new Date(aiJudgedConfig.deadline * 1000).toISOString()}`);
    console.log(`\nRequirements: ${aiJudgedConfig.requirements.substring(0, 200)}...`);

    // Create both bounties
    console.log('\n' + '═'.repeat(80));
    console.log('🚀 CREATING BOUNTIES ON-CHAIN...');
    console.log('═'.repeat(80));

    log.info('📤 Creating first-valid bounty...');
    const bounty1 = await agent.createBounty(firstValidConfig);
    console.log(`✅ First-Valid Bounty: ${bounty1.onChainId} (TX: ${bounty1.createTxHash?.substring(0, 20)}...)`);

    log.info('📤 Creating AI-judged bounty...');
    const bounty2 = await agent.createBounty(aiJudgedConfig);
    console.log(`✅ AI-Judged Bounty: ${bounty2.onChainId} (TX: ${bounty2.createTxHash?.substring(0, 20)}...)`);

    // Start the agent
    log.info('🔍 Starting autonomous monitoring...');
    agent.start();

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║  🎯 BOTH BOUNTIES ARE NOW LIVE!                                                 ║
║                                                                                  ║
║  The autonomous agent is now:                                                   ║
║  • Polling for new submissions every ${config.pollingInterval} seconds                              ║
║  • Evaluating first-valid submissions IMMEDIATELY                               ║
║  • Collecting AI-judged submissions until deadline                              ║
║                                                                                  ║
║  When valid submissions arrive:                                                 ║
║  • First-Valid: Pays out INSTANTLY                                              ║
║  • AI-Judged: Evaluated after deadline by GPT-4 Vision                          ║
║                                                                                  ║
║  Watch the logs for autonomous actions!                                         ║
║                                                                                  ║
║  Press Ctrl+C to stop the demo.                                                 ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
`);

    // Status update loop
    const statusInterval = setInterval(() => {
      const status = agent.getStatus();
      const bounties = bountyManager.getAllBounties();

      let totalSubmissions = 0;
      bounties.forEach((b) => (totalSubmissions += b.submissions.length));

      console.log(
        `\n📊 [STATUS] Active: ${status.activeBounties} | Completed: ${status.completedBounties} | ` +
        `Submissions: ${totalSubmissions} | Payouts: ${status.totalPayouts} ETH`
      );
    }, 30000);

    // Wait for interrupt
    await new Promise((resolve) => {
      process.on('SIGINT', resolve);
    });

    clearInterval(statusInterval);
    agent.stop();

    // Final summary
    const finalStatus = agent.getStatus();
    const allBounties = bountyManager.getAllBounties();

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║                           📊 DEMO SUMMARY                                       ║
║                                                                                  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
`);

    for (const bounty of allBounties) {
      console.log(`║  ${bounty.config.name.padEnd(50)}║`);
      console.log(`║    Status: ${bounty.status.padEnd(46)}║`);
      console.log(`║    Submissions: ${String(bounty.submissions.length).padEnd(41)}║`);

      if (bounty.winnerSelection) {
        console.log(`║    Winner: ${bounty.winnerSelection.winner.submitter.substring(0, 40).padEnd(41)}║`);
        console.log(`║    Payout TX: ${(bounty.payoutTxHash || 'N/A').substring(0, 38).padEnd(38)}║`);
      }
      console.log(`║${''.padEnd(78)}║`);
    }

    console.log(`╠══════════════════════════════════════════════════════════════════════════════════╣`);
    console.log(`║  TOTALS                                                                          ║`);
    console.log(`║    Active Bounties: ${String(finalStatus.activeBounties).padEnd(57)}║`);
    console.log(`║    Completed Bounties: ${String(finalStatus.completedBounties).padEnd(54)}║`);
    console.log(`║    Total Payouts: ${(finalStatus.totalPayouts + ' ETH').padEnd(59)}║`);
    console.log(`╚══════════════════════════════════════════════════════════════════════════════════╝`);

    console.log('\n🛑 Demo stopped. All autonomous operations recorded in logs/bot.log');

  } catch (error) {
    log.error('Demo failed', { error: (error as Error).message });
    console.error('\n❌ ERROR:', (error as Error).message);
    process.exit(1);
  }
}

// Run the full demo
runFullDemo();
