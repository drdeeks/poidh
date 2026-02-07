/**
 * Multi-chain POIDH contract handler
 * Manages contract interactions across multiple EVM chains
 */

import { Contract, parseEther } from 'ethers';
import { POIDH_V3_ABI } from './abis';
import { getChainConfig, getPoidhContractAddress } from '../config/chains';
import { getMultiChainWalletManager } from '../wallet/multi-chain';
import { log } from '../utils/logger';

export interface ChainContractConfig {
  chainId: number;
  contractAddress: string;
  name: string;
}

/**
 * Multi-chain contract manager
 */
export class MultiChainContractManager {
  private contracts: Map<number, Contract> = new Map();
  private walletManager = getMultiChainWalletManager();

  /**
   * Initialize contract for a specific chain
   */
  async initializeChain(chainId: number): Promise<Contract> {
    if (this.contracts.has(chainId)) {
      return this.contracts.get(chainId)!;
    }

    const chainConfig = getChainConfig(chainId);
    const contractAddress = getPoidhContractAddress(chainId);
    const wallet = this.walletManager.getWallet(chainId);

    const contract = new Contract(contractAddress, POIDH_V3_ABI, wallet);

    this.contracts.set(chainId, contract);

    log.info(`POIDH contract initialized on ${chainConfig.name}`, {
      chainId,
      contractAddress,
    });

    return contract;
  }

  /**
   * Initialize contracts on all enabled chains
   */
  async initializeAllChains(): Promise<Contract[]> {
    let chainIds = this.walletManager.getInitializedChains();
    if (chainIds.length === 0) {
      await this.walletManager.initializeAllChains();
      chainIds = this.walletManager.getInitializedChains();
    }
    const results: Contract[] = [];

    for (const chainId of chainIds) {
      try {
        const contract = await this.initializeChain(chainId);
        results.push(contract);
      } catch (error) {
        log.warn(`Failed to initialize contract on chain ${chainId}`, {
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Get contract for specific chain
   */
  getContract(chainId: number): Contract {
    const contract = this.contracts.get(chainId);
    if (!contract) {
      throw new Error(`Contract not initialized for chain ${chainId}`);
    }
    return contract;
  }

  /**
   * Get all initialized chain contracts
   */
  getAllContracts(): { chainId: number; contract: Contract }[] {
    return Array.from(this.contracts.entries()).map(([chainId, contract]) => ({
      chainId,
      contract,
    }));
  }

  /**
   * Check contract deployment on all chains
   */
  async checkDeploymentsOnAllChains(): Promise<
    { chainId: string; address: string; deployed: boolean }[]
  > {
    const results: { chainId: string; address: string; deployed: boolean }[] = [];

    for (const { chainId, contract } of this.getAllContracts()) {
      try {
        const chainConfig = getChainConfig(chainId);
        const contractAddress = await contract.getAddress();
        const code = await this.walletManager.getProvider(chainId).execute(p => p.getCode(contractAddress as string));
        const isDeployed = code !== '0x';

        results.push({
          chainId: chainConfig.name,
          address: contractAddress as string,
          deployed: isDeployed,
        });
      } catch (error) {
        log.warn(`Failed to check deployment on chain ${chainId}`, {
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Broadcast transaction to multiple chains
   * (Create same bounty on multiple chains)
   */
  async createBountyOnMultipleChains(
    chainIds: number[],
    name: string,
    description: string,
    deadlineTimestamp: number,
    amountEth: string
  ): Promise<{ chainId: number; txHash: string; bountyId: string }[]> {
    const results: { chainId: number; txHash: string; bountyId: string }[] = [];

    for (const chainId of chainIds) {
      try {
        const contract = this.getContract(chainId);
        const chainConfig = getChainConfig(chainId);

        log.info(`Creating bounty on ${chainConfig.name}`, {
          chainId,
          name,
          amount: amountEth,
        });

        const tx = await contract.createSoloBounty(
          name,
          description,
          { value: parseEther(amountEth) }
        );

        const receipt = await tx.wait();
        const txHash = tx.hash;

        const event = receipt.logs.find(
          (log: any) => log.fragment?.name === 'BountyCreated'
        );
        const bountyId = event?.args?.[0]?.toString() || '0';

        results.push({ chainId, txHash, bountyId });

        log.info(`Bounty created on ${chainConfig.name}`, {
          chainId,
          txHash,
          bountyId,
        });
      } catch (error) {
        log.error(`Failed to create bounty on chain ${chainId}`, {
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Batch get bounties from multiple chains
   */
  async getBountiesFromAllChains(): Promise<
    { chainId: number; chainName: string; bounties: any[] }[]
  > {
    const results: { chainId: number; chainName: string; bounties: any[] }[] = [];

    for (const { chainId, contract } of this.getAllContracts()) {
      try {
        const chainConfig = getChainConfig(chainId);
        const bounties = await contract.getBounties(0);

        results.push({
          chainId,
          chainName: chainConfig.name,
          bounties: bounties || [],
        });
      } catch (error) {
        log.warn(`Failed to get bounties on chain ${chainId}`, {
          error: (error as Error).message,
        });
      }
    }

    return results;
  }
}

/**
 * Global multi-chain contract manager instance
 */
let multiChainContractManager: MultiChainContractManager | null = null;

export function initializeMultiChainContracts(): MultiChainContractManager {
  if (!multiChainContractManager) {
    multiChainContractManager = new MultiChainContractManager();
  }
  return multiChainContractManager;
}

export function getMultiChainContractManager(): MultiChainContractManager {
  if (!multiChainContractManager) {
    throw new Error('Multi-chain contract manager not initialized');
  }
  return multiChainContractManager;
}
