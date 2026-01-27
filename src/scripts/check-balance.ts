#!/usr/bin/env ts-node
/**
 * Balance Check Script
 *
 * Checks the current balance of the bot wallet.
 *
 * Usage: npm run wallet:balance
 */

import { walletManager } from '../wallet';

async function main() {
  console.log('\n💰 AUTONOMOUS BOUNTY BOT - BALANCE CHECK\n');
  console.log('='.repeat(50));

  try {
    await walletManager.initialize();

    const address = await walletManager.getAddress();
    const balance = await walletManager.getBalance();
    const network = await walletManager.getNetworkInfo();

    console.log('\n📊 Wallet Status:\n');
    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${balance} ETH`);
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Block:   ${network.blockNumber}`);

    const balanceNum = parseFloat(balance);

    if (balanceNum === 0) {
      console.log('\n⚠️  Wallet is empty!');
      console.log('   Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    } else if (balanceNum < 0.01) {
      console.log('\n⚠️  Low balance! Consider adding more ETH for gas fees.');
    } else {
      console.log('\n✅ Wallet is funded and ready to use!');
    }

    console.log('\n' + '='.repeat(50) + '\n');
  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.log('\nMake sure BOT_PRIVATE_KEY is set in your .env file.');
    console.log('Run `npm run wallet:create` to generate a new wallet.\n');
    process.exit(1);
  }
}

main();
