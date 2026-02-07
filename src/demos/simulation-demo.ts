#!/usr/bin/env ts-node
/**
 * SIMULATION DEMO: Full E2E without Real Blockchain
 *
 * This demo runs a complete bounty lifecycle using mock contracts.
 * Perfect for testing and demonstration without needing:
 * - Real ETH
 * - Contract addresses
 * - Blockchain connectivity
 *
 * Run: npx ts-node src/demos/simulation-demo.ts
 */

import { v4 as uuidv4 } from 'uuid';
import { mockPoidhContract } from '../contracts/mock-poidh';
import { aiJudge } from '../evaluation/ai-judge';
import { submissionValidator } from '../evaluation/validator';
import {
  BountyConfig,
  SelectionMode,
  ProofType,
  Submission,
  BountyStatus,
} from '../bounty/types';
import { log } from '../utils/logger';
import { config } from '../config';

// Simulated submissions for demo
// Note: 'submitter' maps to 'issuer' in the actual V3 contract
const MOCK_SUBMISSIONS = [
  {
    submitter: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    uri: 'ipfs://QmExample1',
    proofContent: {
      type: ProofType.PHOTO,
      mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      description: 'Handwritten note with date 2024-01-15 and POIDH written clearly',
    },
  },
  {
    submitter: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    uri: 'ipfs://QmExample2',
    proofContent: {
      type: ProofType.PHOTO,
      mediaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      description: 'Creative stack of books, coffee mug, glasses, phone, and plant',
    },
  },
  {
    submitter: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    uri: 'ipfs://QmExample3',
    proofContent: {
      type: ProofType.PHOTO,
      mediaUrl: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800',
      description: 'Amazing tower of office supplies - very creative arrangement!',
    },
  },
];

async function runSimulation() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║           🧪 SIMULATION DEMO: AUTONOMOUS BOUNTY BOT                             ║
║                                                                                  ║
║  This demo simulates the FULL bounty lifecycle without real blockchain.         ║
║  All actions are logged as if they were real autonomous operations.             ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
`);

  // Initialize mock contract
  await mockPoidhContract.initialize();

  console.log('\n' + '═'.repeat(80));
  console.log('PHASE 1: CREATE BOUNTIES');
  console.log('═'.repeat(80));

  // Create first-valid bounty
  const firstValidConfig: BountyConfig = {
    id: 'sim-first-valid',
    name: '📝 Handwritten Date Challenge',
    description: 'First valid handwritten date photo wins!',
    requirements: 'Photo of handwritten note with today\'s date and "POIDH"',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.001',
    deadline: Math.floor(Date.now() / 1000) + 3600,
    validation: {
      aiValidationPrompt: 'Check for handwritten date and POIDH text',
    },
    tags: ['demo'],
  };

  const { bountyId: bounty1Id, txHash: tx1 } = await mockPoidhContract.createSoloBounty(
    firstValidConfig.name,
    firstValidConfig.description,
    firstValidConfig.deadline,
    firstValidConfig.rewardEth
  );

  console.log(`\n✅ First-Valid Bounty Created`);
  console.log(`   ID: ${bounty1Id}`);
  console.log(`   TX: ${tx1}`);

  // Create AI-judged bounty
  const aiJudgedConfig: BountyConfig = {
    id: 'sim-ai-judged',
    name: '🎨 Creative Object Stack Challenge',
    description: 'Most creative object stack wins (AI judged)',
    requirements: 'Stack 5+ everyday objects creatively',
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: '0.002',
    deadline: Math.floor(Date.now() / 1000) + 1800,
    validation: {
      aiValidationPrompt: `Score on creativity (40), execution (30), variety (30). Total 100.`,
    },
    tags: ['demo', 'creative'],
  };

  const { bountyId: bounty2Id, txHash: tx2 } = await mockPoidhContract.createSoloBounty(
    aiJudgedConfig.name,
    aiJudgedConfig.description,
    aiJudgedConfig.deadline,
    aiJudgedConfig.rewardEth
  );

  console.log(`\n✅ AI-Judged Bounty Created`);
  console.log(`   ID: ${bounty2Id}`);
  console.log(`   TX: ${tx2}`);

  console.log('\n' + '═'.repeat(80));
  console.log('PHASE 2: SIMULATE SUBMISSIONS');
  console.log('═'.repeat(80));

  // Simulate submissions for first-valid bounty
  console.log('\n📥 Simulating submission to First-Valid bounty...');
  const claim1 = await mockPoidhContract.simulateSubmission(
    bounty1Id,
    MOCK_SUBMISSIONS[0].submitter, // 'submitter' maps to 'issuer' in V3
    MOCK_SUBMISSIONS[0].uri
  );

  const submission1: Submission = {
    id: uuidv4(),
    bountyId: 'sim-first-valid',
    claimId: claim1.id.toString(),
    submitter: claim1.issuer, // V3 uses 'issuer' not 'claimer'
    proofUri: claim1.uri,
    timestamp: Date.now(),
    proofContent: MOCK_SUBMISSIONS[0].proofContent,
  };

  console.log(`   Submission from: ${submission1.submitter.substring(0, 20)}...`);

  // Simulate multiple submissions for AI-judged bounty
  const aiSubmissions: Submission[] = [];
  for (let i = 1; i < MOCK_SUBMISSIONS.length; i++) {
    console.log(`\n📥 Simulating submission ${i} to AI-Judged bounty...`);
    const claim = await mockPoidhContract.simulateSubmission(
      bounty2Id,
      MOCK_SUBMISSIONS[i].submitter, // 'submitter' maps to 'issuer' in V3
      MOCK_SUBMISSIONS[i].uri
    );

    aiSubmissions.push({
      id: uuidv4(),
      bountyId: 'sim-ai-judged',
      claimId: claim.id.toString(),
      submitter: claim.issuer, // V3 uses 'issuer' not 'claimer'
      proofUri: claim.uri,
      timestamp: Date.now(),
      proofContent: MOCK_SUBMISSIONS[i].proofContent,
    });

    console.log(`   Submission from: ${MOCK_SUBMISSIONS[i].submitter.substring(0, 20)}...`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('PHASE 3: EVALUATE FIRST-VALID BOUNTY');
  console.log('═'.repeat(80));

  // Validate first submission
  console.log('\n⚡ Evaluating submission for first-valid bounty...');

  const validationResult = await submissionValidator.validate(
    submission1,
    firstValidConfig.validation
  );
  submission1.validationResult = validationResult;

  console.log(`\n📋 Validation Result:`);
  console.log(`   Valid: ${validationResult.isValid ? '✅ YES' : '❌ NO'}`);
  console.log(`   Score: ${validationResult.score}/100`);
  for (const check of validationResult.checks) {
    console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}: ${check.details}`);
  }

  if (validationResult.isValid) {
    console.log('\n🏆 FIRST VALID SUBMISSION FOUND!');

    // Pay out
    const payoutTx = await mockPoidhContract.acceptClaim(
      bounty1Id,
      submission1.claimId,
      'First valid submission - passed all validation checks'
    );

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🏆 WINNER: FIRST-VALID BOUNTY 🏆                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Winner: ${submission1.submitter.padEnd(54)}║
║  Reward: ${(firstValidConfig.rewardEth + ' ETH').padEnd(54)}║
║  TX: ${payoutTx.substring(0, 58)}...  ║
║                                                                              ║
║  Rationale: First submission to pass all validation checks.                 ║
║  ✅ Payment executed AUTONOMOUSLY                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('PHASE 4: EVALUATE AI-JUDGED BOUNTY');
  console.log('═'.repeat(80));

  if (config.openaiApiKey) {
    console.log('\n🤖 Running GPT-4 Vision evaluation on all submissions...');

    // Evaluate each submission
    const evaluations: { submission: Submission; score: number; reasoning: string }[] = [];

    for (const sub of aiSubmissions) {
      console.log(`\n   Evaluating submission from ${sub.submitter.substring(0, 20)}...`);

      try {
        const evaluation = await aiJudge.evaluate(sub, aiJudgedConfig);
        sub.aiEvaluation = evaluation;

        evaluations.push({
          submission: sub,
          score: evaluation.score,
          reasoning: evaluation.reasoning,
        });

        console.log(`   Score: ${evaluation.score}/100`);
        console.log(`   Valid: ${evaluation.isValid ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ❌ Evaluation failed: ${(error as Error).message}`);
        evaluations.push({
          submission: sub,
          score: 0,
          reasoning: 'Evaluation failed',
        });
      }
    }

    // Sort by score
    evaluations.sort((a, b) => b.score - a.score);

    if (evaluations.length > 0 && evaluations[0].score > 0) {
      const winner = evaluations[0];

      // Pay out
      const payoutTx = await mockPoidhContract.acceptClaim(
        bounty2Id,
        winner.submission.claimId,
        winner.reasoning
      );

      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🏆 WINNER: AI-JUDGED BOUNTY 🏆                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Winner: ${winner.submission.submitter.padEnd(54)}║
║  Score: ${(winner.score + '/100').padEnd(55)}║
║  Reward: ${(aiJudgedConfig.rewardEth + ' ETH').padEnd(54)}║
║  TX: ${payoutTx.substring(0, 58)}...  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  AI Reasoning:                                                              ║
║  ${winner.reasoning.substring(0, 72).padEnd(72)}║
║                                                                              ║
║  ✅ Payment executed AUTONOMOUSLY by GPT-4 Vision judgment                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    }
  } else {
    console.log('\n⚠️  OPENAI_API_KEY not set - skipping AI evaluation');
    console.log('   Set OPENAI_API_KEY in .env to enable GPT-4 Vision judging');

    // Simulate a winner for demo purposes
    const mockWinner = aiSubmissions[0];
    const payoutTx = await mockPoidhContract.acceptClaim(
      bounty2Id,
      mockWinner.claimId,
      'Mock winner selected (AI evaluation disabled)'
    );

    console.log(`\n🧪 [MOCK] Selected first submission as winner for demo`);
    console.log(`   Winner: ${mockWinner.submitter}`);
    console.log(`   TX: ${payoutTx}`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('SIMULATION COMPLETE');
  console.log('═'.repeat(80));

  const allBounties = mockPoidhContract.getAllBounties();
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Total Bounties: ${allBounties.length}`);
  console.log(`   Completed: ${allBounties.filter(b => mockPoidhContract.isBountyCompleted(b.bounty)).length}`);
  console.log(`   Total Claims: ${allBounties.reduce((sum, b) => sum + b.claims.length, 0)}`);

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║  ✅ SIMULATION COMPLETE                                                         ║
║                                                                                  ║
║  This demo showed the full autonomous bounty lifecycle:                         ║
║  1. Created bounties (simulated on-chain)                                       ║
║  2. Received submissions (simulated claims)                                     ║
║  3. Evaluated proofs (deterministic + AI)                                       ║
║  4. Paid winners (simulated transactions)                                       ║
║                                                                                  ║
║  All operations were AUTONOMOUS - no human intervention!                        ║
║                                                                                  ║
║  To run with REAL blockchain:                                                   ║
║  1. Set contract addresses in .env                                              ║
║  2. Fund bot wallet with Base ETH                                               ║
║  3. Run: npm run demo:full                                                      ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
`);
}

// Run simulation
runSimulation().catch((error) => {
  console.error('Simulation failed:', error);
  process.exit(1);
});
