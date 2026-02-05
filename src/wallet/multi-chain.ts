/**
 * Multi-chain wallet management
 * Manages wallet instances across different EVM chains
 */

import { Wallet, JsonRpcProvider, formatEther } from 'ethers';
import { config, getNetworkName2, getBlockExplorerUrl } from '../config';
import { getChainConfig } from '../config/chains';
import { log } from '../utils/logger';

export interface ChainWallet {
  chainId: number;
  wallet: Wallet;
  provider: JsonRpcProvider;
  rpcUrl: string;
}

/**
 * Multi-chain wallet manager
 * Creates and manages wallet instances on multiple chains
 */
export class MultiChainWalletManager {
  private wallets: Map<number, ChainWallet> = new Map();
  private botPrivateKey: string;

  constructor(botPrivateKey: string) {
    if (!botPrivateKey) {
      throw new Error('Bot private key required');
    }
    this.botPrivateKey = botPrivateKey;
  }

  /**
   * Initialize wallet for a specific chain
   */
  async initializeChain(chainId: number): Promise<ChainWallet> {
    if (this.wallets.has(chainId)) {
      return this.wallets.get(chainId)!;
    }

    const chainConfig = getChainConfig(chainId);
    const rpcUrl = chainConfig.rpcUrls[0];

    // Create provider
    const provider = new JsonRpcProvider(rpcUrl, {
      chainId,
      name: chainConfig.name,
    });

    // Create wallet
    const wallet = new Wallet(this.botPrivateKey, provider);

    const chainWallet: ChainWallet = {
      chainId,
      wallet,
      provider,
      rpcUrl,
    };

    this.wallets.set(chainId, chainWallet);

    log.info(`Wallet initialized on ${chainConfig.name}`, {
      chainId,
      address: wallet.address,
      rpcUrl: rpcUrl.substring(0, 64),
    });

    return chainWallet;
  }

  /**
   * Initialize all enabled chains
   */
  async initializeAllChains(): Promise<ChainWallet[]> {
    const chains = config.enabledChains;
    const results: ChainWallet[] = [];

    for (const chainId of chains) {
      try {
        const chainWallet = await this.initializeChain(chainId);
        results.push(chainWallet);
      } catch (error) {
        log.warn(`Failed to initialize chain ${chainId}`, {
          error: (error as Error).message,
        });
      }
    }

    log.info('Multi-chain wallet initialization complete', {
      initialized: results.length,
      total: chains.length,
    });

    return results;
  }

  /**
   * Get wallet for specific chain
   */
  getWallet(chainId: number): Wallet {
    const chainWallet = this.wallets.get(chainId);
    if (!chainWallet) {
      throw new Error(`Wallet not initialized for chain ${chainId}`);
    }
    return chainWallet.wallet;
  }

  /**
   * Get provider for specific chain
   */
  getProvider(chainId: number): JsonRpcProvider {
    const chainWallet = this.wallets.get(chainId);
    if (!chainWallet) {
      throw new Error(`Provider not initialized for chain ${chainId}`);
    }
    return chainWallet.provider;
  }

  /**
   * Get wallet address (same on all chains)
   */
  getAddress(): string {
    const [chainWallet] = this.wallets.values();
    if (!chainWallet) {
      throw new Error('No wallets initialized');
    }
    return chainWallet.wallet.address;
  }

  /**
   * Get balance on a specific chain
   */
  async getBalance(chainId: number): Promise<string> {
    const provider = this.getProvider(chainId);
    const wallet = this.getWallet(chainId);
    const balance = await provider.getBalance(wallet.address);
    return formatEther(balance);
  }

  /**
   * Get balance on all chains
   */
  async getBalancesAllChains(): Promise<Map<number, string>> {
    const balances = new Map<number, string>();

    for (const [chainId, chainWallet] of this.wallets) {
      try {
        const balance = await chainWallet.provider.getBalance(chainWallet.wallet.address);
        balances.set(chainId, formatEther(balance));
      } catch (error) {
        log.warn(`Failed to get balance on chain ${chainId}`, {
          error: (error as Error).message,
        });
        balances.set(chainId, '0');
      }
    }

    return balances;
  }

  /**
   * Get all initialized chain wallets
   */
  getAllWallets(): ChainWallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Check if chain wallet is initialized
   */
  isChainInitialized(chainId: number): boolean {
    return this.wallets.has(chainId);
  }

  /**
   * Get initialized chain IDs
   */
  getInitializedChains(): number[] {
    return Array.from(this.wallets.keys());
  }

  /**
   * Log wallet status on all chains
   */
  async logStatus(): Promise<void> {
    const address = this.getAddress();
    log.info('Multi-chain wallet status', {
      address,
      chainsInitialized: this.getInitializedChains().length,
    });

    for (const [chainId, chainWallet] of this.wallets) {
      try {
        const balance = await chainWallet.provider.getBalance(address);
        const networkName = getNetworkName2(chainId);
        log.info(`  ${networkName}: ${formatEther(balance)} ETH`, {
          chainId,
          address,
        });
      } catch (error) {
        log.warn(`  Chain ${chainId}: Error checking balance`, {
          error: (error as Error).message,
        });
      }
    }
  }
}

/**
 * Global multi-chain wallet manager instance
 */
let multiChainManager: MultiChainWalletManager | null = null;

export function initializeMultiChainWallet(): MultiChainWalletManager {
  if (!multiChainManager) {
    multiChainManager = new MultiChainWalletManager(config.botPrivateKey);
  }
  return multiChainManager;
}

export function getMultiChainWalletManager(): MultiChainWalletManager {
  if (!multiChainManager) {
    throw new Error('Multi-chain wallet manager not initialized');
  }
  return multiChainManager;
}
