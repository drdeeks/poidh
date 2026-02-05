/**
 * Multi-Chain Usage Example
 * 
 * This example demonstrates how to use the multi-chain functionality
 * to create bounties and monitor submissions across multiple EVM chains.
 */

import { config, getNetworkName2, isChainConfigured, getEnabledChainsConfig } from '../config';
import { initializeMultiChainWallet } from '../wallet/multi-chain';
import { initializeMultiChainContracts } from '../contracts/multi-chain';
import { log } from '../utils/logger';

/**
 * Example 1: Initialize and Display Multi-Chain Setup
 */
export async function exampleDisplayMultiChainSetup(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         Multi-Chain Setup Example                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Show configured chains
  console.log('📋 Configured Chains:');
  for (const chainId of config.supportedChains) {
    const name = getNetworkName2(chainId);
    const configured = isChainConfigured(chainId);
    const status = configured ? '✅ Configured' : '⏳ Not Ready';
    console.log(`   ${name} (${chainId}): ${status}`);
  }

  console.log('\n✨ Enabled Chains (with POIDH deployed):');
  const enabledChains = getEnabledChainsConfig();
  for (const chain of enabledChains) {
    console.log(`   ${chain.name} (${chain.chainId})`);
    console.log(`      Contract: ${chain.poidhContractAddress}`);
    console.log(`      RPC: ${chain.rpcUrls[0]}`);
    console.log(`      Explorer: ${chain.blockExplorerUrls[0]}`);
  }
}

/**
 * Example 2: Initialize Multi-Chain Wallet
 */
export async function exampleInitializeWallet(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       Initialize Multi-Chain Wallet Example            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const walletManager = initializeMultiChainWallet();
    console.log('📱 Initializing wallets on all enabled chains...\n');

    const chains = await walletManager.initializeAllChains();
    console.log(`✅ Initialized ${chains.length} chain(s):`);

    for (const chainWallet of chains) {
      const chain = getNetworkName2(chainWallet.chainId);
      console.log(`\n   ${chain} (${chainWallet.chainId})`);
      console.log(`   Wallet: ${chainWallet.wallet.address}`);
      console.log(`   RPC: ${chainWallet.rpcUrl.substring(0, 50)}...`);
    }

    // Show balance on all chains
    console.log('\n💰 Wallet Balances:');
    const balances = await walletManager.getBalancesAllChains();
    for (const [chainId, balance] of balances) {
      const name = getNetworkName2(chainId);
      console.log(`   ${name}: ${balance} ETH`);
    }
  } catch (error) {
    console.error('❌ Error initializing wallet:', (error as Error).message);
  }
}

/**
 * Example 3: Initialize Multi-Chain Contracts
 */
export async function exampleInitializeContracts(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       Initialize Multi-Chain Contracts Example         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // First initialize wallet
    const walletManager = initializeMultiChainWallet();
    await walletManager.initializeAllChains();

    // Then initialize contracts
    const contractManager = initializeMultiChainContracts();
    console.log('🔗 Initializing POIDH contracts on all chains...\n');

    const contracts = await contractManager.initializeAllChains();
    console.log(`✅ Initialized ${contracts.length} contract(s):`);

    // Check deployment status
    const deployments = await contractManager.checkDeploymentsOnAllChains();
    for (const deployment of deployments) {
      const status = deployment.deployed ? '✅ Deployed' : '⏳ Not Deployed';
      console.log(`\n   ${deployment.chainId}`);
      console.log(`   Address: ${deployment.address}`);
      console.log(`   Status: ${status}`);
    }
  } catch (error) {
    console.error('❌ Error initializing contracts:', (error as Error).message);
  }
}

/**
 * Example 4: Create Bounty on Multiple Chains
 */
export async function exampleCreateMultiChainBounty(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      Create Multi-Chain Bounty Example                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize wallet and contracts
    const walletManager = initializeMultiChainWallet();
    await walletManager.initializeAllChains();

    const contractManager = initializeMultiChainContracts();
    await contractManager.initializeAllChains();

    // Prepare bounty data
    const bountyName = 'Prove You Are Outside';
    const bountyDescription = 'Take a photo outdoors with EXIF data to prove you are outside';
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const amount = '0.01'; // 0.01 ETH per chain

    // Create bounty on all enabled chains
    console.log(`📝 Creating "${bountyName}" on all chains...\n`);
    const results = await contractManager.createBountyOnMultipleChains(
      config.enabledChains,
      bountyName,
      bountyDescription,
      deadline,
      amount
    );

    console.log(`✅ Created bounty on ${results.length} chain(s):\n`);
    for (const result of results) {
      const chainName = getNetworkName2(result.chainId);
      console.log(`   ${chainName}`);
      console.log(`   Transaction: ${result.txHash}`);
      console.log(`   Bounty ID: ${result.bountyId}\n`);
    }
  } catch (error) {
    console.error('❌ Error creating bounty:', (error as Error).message);
  }
}

/**
 * Example 5: Monitor All Chains
 */
export async function exampleMonitorAllChains(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      Monitor All Chains Example                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const walletManager = initializeMultiChainWallet();
    const contractManager = initializeMultiChainContracts();

    await walletManager.initializeAllChains();
    await contractManager.initializeAllChains();

    console.log('🔍 Monitoring all chains...\n');
    console.log(`Initialized chains: ${walletManager.getInitializedChains().join(', ')}`);
    console.log(`Monitoring interval: ${config.pollingInterval} seconds\n`);

    // Example monitoring loop (runs once in this example)
    for (const chainId of config.enabledChains) {
      try {
        const chainName = getNetworkName2(chainId);
        const balance = await walletManager.getBalance(chainId);
        console.log(`✅ ${chainName}: Balance = ${balance} ETH`);
      } catch (error) {
        const chainName = getNetworkName2(chainId);
        console.log(`❌ ${chainName}: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error monitoring chains:', (error as Error).message);
  }
}

/**
 * Example 6: Check Chain Configuration
 */
export async function exampleCheckChainConfiguration(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      Check Chain Configuration Example                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔧 Configuration Summary:\n');
  console.log(`Primary Chain ID: ${config.chainId} (${getNetworkName2(config.chainId)})`);
  console.log(`Supported Chains: ${config.supportedChains.join(', ')}`);
  console.log(`Enabled Chains: ${config.enabledChains.join(', ')}`);
  console.log(`\nBot Private Key: ${config.botPrivateKey.substring(0, 10)}...`);
  console.log(`Polling Interval: ${config.pollingInterval} seconds`);
  console.log(`Max Gas Price: ${config.maxGasPriceGwei} gwei`);
  console.log(`Demo Mode: ${config.demoMode ? 'YES' : 'NO'}\n`);

  console.log('📊 Enabled Chain Details:\n');
  const enabledChains = getEnabledChainsConfig();
  for (const chain of enabledChains) {
    console.log(`   ${chain.name} (${chain.chainId})`);
    console.log(`   ├─ Contract: ${chain.poidhContractAddress}`);
    console.log(`   ├─ RPC: ${chain.rpcUrls[0]}`);
    console.log(`   └─ Explorer: ${chain.blockExplorerUrls[0]}\n`);
  }
}

/**
 * Main: Run all examples
 */
async function main(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       POIDH Multi-Chain Examples                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Display configuration
  await exampleCheckChainConfiguration();

  // Show setup
  await exampleDisplayMultiChainSetup();

  // Initialize wallet (requires valid private key)
  if (config.botPrivateKey) {
    // Note: These examples require actual configuration to work
    // await exampleInitializeWallet();
    // await exampleInitializeContracts();
    // For demo, we skip actual initialization
    console.log('\n✅ Multi-chain wallet and contracts ready to initialize');
    console.log('   (Set valid BOT_PRIVATE_KEY to actually initialize)\n');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
