#!/usr/bin/env ts-node
/**
 * Deploy a test bounty on Base Mainnet to validate:
 * - Audit logs
 * - Web UI enhancements
 * - Bounty lifecycle
 */

import { poidhContract } from '../contracts/poidh';
import { walletManager } from '../wallet';
import { logger } from '../utils/logger';
import { parseEther } from 'ethers';

async function deployTestBounty() {
  try {
    await walletManager.initialize();
    await poidhContract.initialize();

    const bountyName = '🧪 TEST: Audit Log & UI Validation';
    const description = `This is a test bounty deployed to validate:
- Proper audit logging
- Web UI enhancements
- Bounty lifecycle tracking
- Real blockchain integration`;
    const rewardEth = '0.1';
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    logger.info('📋 Creating test bounty...', {
      name: bountyName,
      reward: rewardEth,
      deadline: new Date(deadline * 1000).toISOString(),
    });

    const { bountyId, txHash } = await poidhContract.createSoloBounty(
      bountyName,
      description,
      deadline,
      rewardEth
    );

    logger.info('✅ Test bounty created!', {
      bountyId,
      txHash,
      explorer: `https://basescan.org/tx/${txHash}`,
    });

    // Give it a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch and display bounty
    const bounty = await poidhContract.getBounty(bountyId);
    if (bounty) {
      logger.info('📊 Bounty Details:', {
        id: bountyId,
        name: bounty.name,
        description: bounty.description,
        amount: bounty.amount,
        issuer: bounty.issuer,
        createdAt: new Date(Number(bounty.createdAt) * 1000).toISOString(),
      });
    }

    console.log(`\n✨ Test bounty deployed successfully!`);
    console.log(`   ID: ${bountyId}`);
    console.log(`   Name: ${bountyName}`);
    console.log(`   TX: ${txHash}`);
    console.log(`   Explorer: https://basescan.org/tx/${txHash}`);
    console.log(`\n🔍 Check audit logs in: ./logs/bot.log`);
    console.log(`🌐 View in UI: Check bounty #${bountyId}\n`);

  } catch (error) {
    logger.error('❌ Failed to deploy test bounty', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

deployTestBounty();
