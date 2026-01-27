#!/usr/bin/env ts-node
/**
 * Wallet Creation Script
 *
 * This script generates a new Ethereum wallet for the autonomous bounty bot.
 * Run this once during initial setup, then securely store the private key.
 *
 * Usage: npm run wallet:create
 */

import { Wallet } from 'ethers';

console.log('\n🔐 AUTONOMOUS BOUNTY BOT - WALLET GENERATOR\n');
console.log('='.repeat(60));

// Generate wallet directly using ethers
const wallet = Wallet.createRandom();
const address = wallet.address;
const privateKey = wallet.privateKey;
const mnemonic = wallet.mnemonic?.phrase || 'No mnemonic available';

console.log('\n✅ New wallet generated successfully!\n');
console.log('📍 Address:', address);
console.log('\n🔑 Private Key:');
console.log(privateKey);
console.log('\n📝 Recovery Phrase (Mnemonic):');
console.log(mnemonic);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT SECURITY INSTRUCTIONS:\n');
console.log('1. Copy the PRIVATE KEY above and add it to your .env file:');
console.log('   BOT_PRIVATE_KEY=' + privateKey);
console.log('\n2. BACKUP the recovery phrase in a secure location');
console.log('3. NEVER commit the .env file or share your private key');
console.log('4. Fund this wallet with Base Sepolia ETH for gas fees');
console.log('   - Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');

console.log('\n' + '='.repeat(60));
console.log('\n📊 Wallet Summary:');
console.log(`   Network: Base Sepolia (Chain ID: 84532)`);
console.log(`   Address: ${address}`);
console.log(`   Status: Ready to fund\n`);

console.log('Next steps:');
console.log('1. Add private key to .env file');
console.log('2. Fund wallet with Base Sepolia ETH');
console.log('3. Run: npm run wallet:balance');
console.log('4. Start the bot: npm run agent\n');

