import { getEnabledChains, getChainConfig, ChainConfig } from '../config/chains';

export interface ChainSelection {
  chainId: number;
  config: ChainConfig;
}

export function parseChainFlag(flag?: string): number | null {
  if (!flag) return null;
  
  const chainMap: Record<string, number> = {
    'base': 8453,
    'base-mainnet': 8453,
    'base-sepolia': 84532,
    'arbitrum': 42161,
    'arbitrum-one': 42161,
    'arbitrum-sepolia': 421614,
    'degen': 666666666,
    'ethereum': 1,
    'eth': 1,
    'sepolia': 11155111,
    'polygon': 137,
    'matic': 137,
    'optimism': 10,
    'op': 10,
  };

  // Try direct chain ID
  const chainId = parseInt(flag);
  if (!isNaN(chainId)) {
    return chainId;
  }

  // Try chain name mapping
  const mappedChainId = chainMap[flag.toLowerCase()];
  if (mappedChainId) {
    return mappedChainId;
  }

  return null;
}

export async function selectChainInteractively(): Promise<ChainSelection> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const enabledChains = getEnabledChains();
  
  console.log('\n🔗 Select a blockchain network:');
  console.log('═'.repeat(50));
  
  enabledChains.forEach((chain, index) => {
    const status = chain.poidhContractAddress && chain.poidhContractAddress !== '0x' ? '✅' : '⚠️';
    console.log(`${index + 1}. ${status} ${chain.name} (${chain.chainId})`);
    console.log(`   Currency: ${chain.nativeCurrency}`);
    if (chain.poidhContractAddress && chain.poidhContractAddress !== '0x') {
      console.log(`   Contract: ${chain.poidhContractAddress}`);
    } else {
      console.log(`   Contract: Not deployed`);
    }
    console.log('');
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter your choice (1-' + enabledChains.length + '): ', (answer: string) => {
      rl.close();
      
      const choice = parseInt(answer);
      if (isNaN(choice) || choice < 1 || choice > enabledChains.length) {
        reject(new Error('Invalid selection'));
        return;
      }

      const selectedChain = enabledChains[choice - 1];
      resolve({
        chainId: selectedChain.chainId,
        config: selectedChain
      });
    });
  });
}

export function validateChainSelection(chainId: number): void {
  try {
    const config = getChainConfig(chainId);
    
    if (!config.enabled) {
      throw new Error(`Chain ${chainId} (${config.name}) is not enabled`);
    }

    if (!config.poidhContractAddress || config.poidhContractAddress === '0x') {
      throw new Error(`POIDH contract not deployed on ${config.name} (${chainId})`);
    }

    console.log(`✅ Selected: ${config.name} (${chainId})`);
    console.log(`   Contract: ${config.poidhContractAddress}`);
    console.log(`   Explorer: ${config.blockExplorerUrls[0]}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid chain selection: ${errorMessage}`);
  }
}
