import { ethers, Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * WalletManager - Handles all wallet operations for the autonomous bounty bot
 *
 * This class manages:
 * - Wallet creation and recovery
 * - Balance checking
 * - Transaction signing
 * - Gas estimation
 */
export class WalletManager {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl, {
      chainId: config.chainId,
      name: 'base-sepolia',
    });
  }

  /**
   * Initialize wallet from private key in config
   */
  async initialize(): Promise<void> {
    if (!config.botPrivateKey) {
      throw new Error(
        'BOT_PRIVATE_KEY not set. Run `npm run wallet:create` to generate a new wallet.'
      );
    }

    this.wallet = new Wallet(config.botPrivateKey, this.provider);

    const address = await this.wallet.getAddress();
    const balance = await this.getBalance();
    const network = await this.provider.getNetwork();
    const chainName = this.getChainName(Number(network.chainId));

    log.info(`🔑 Wallet initialized`, {
      address,
      balance: `${balance} ETH`,
      network: chainName,
    });
  }

  /**
   * Generate a new wallet (for initial setup)
   */
  static generateNewWallet(): { address: string; privateKey: string; mnemonic: string } {
    const wallet = Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || '',
    };
  }

  /**
   * Get current wallet address
   */
  async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return this.wallet.getAddress();
  }

  /**
   * Get wallet balance in ETH
   */
  async getBalance(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const balance = await this.provider.getBalance(this.wallet.address);
    return formatEther(balance);
  }

  /**
   * Get wallet balance in wei
   */
  async getBalanceWei(): Promise<bigint> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return this.provider.getBalance(this.wallet.address);
  }

  /**
   * Check if wallet has sufficient balance for a transaction
   */
  async hasSufficientBalance(amountEth: string, estimatedGas: bigint = BigInt(100000)): Promise<boolean> {
    const balance = await this.getBalanceWei();
    const amount = parseEther(amountEth);
    const gasPrice = await this.provider.getFeeData();
    const gasCost = estimatedGas * (gasPrice.gasPrice || BigInt(0));

    return balance >= amount + gasCost;
  }

  /**
   * Get the underlying ethers Wallet instance
   */
  getWallet(): Wallet {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return this.wallet;
  }

  /**
   * Get the provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Send ETH to an address
   */
  async sendEth(to: string, amountEth: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');

    log.autonomous('Sending ETH', {
      to,
      amount: `${amountEth} ETH`,
    });

    const tx = await this.wallet.sendTransaction({
      to,
      value: parseEther(amountEth),
    });

    log.tx('ETH Transfer', tx.hash, { to, amount: amountEth });

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    log.info(`✅ ETH sent successfully`, {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });

    return tx.hash;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return this.provider.estimateGas(tx);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  /**
   * Check if gas price is acceptable (below max threshold)
   */
  async isGasPriceAcceptable(): Promise<boolean> {
    const gasPrice = await this.getGasPrice();
    const maxGasWei = BigInt(config.maxGasPriceGwei) * BigInt(1e9);
    return gasPrice <= maxGasWei;
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{ chainId: number; name: string; blockNumber: number }> {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    return {
      chainId: Number(network.chainId),
      name: this.getChainName(Number(network.chainId)),
      blockNumber,
    };
  }

  /**
   * Get chain name from chain ID
   */
  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      8453: 'Base Mainnet',
      84532: 'Base Sepolia',
      42161: 'Arbitrum One',
      421614: 'Arbitrum Sepolia',
      666666666: 'Degen',
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia',
      137: 'Polygon',
      10: 'Optimism',
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }
}

// Export singleton instance
export const walletManager = new WalletManager();
