import dotenv from 'dotenv';
import path from 'path';
import { getChainConfig, getPoidhContractAddress, getDefaultRpcUrl, isChainEnabled, CHAINS } from './chains';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface Config {
  // Blockchain - Multi-chain support
  rpcUrl: string;
  chainId: number;
  botPrivateKey: string;
  
  // Multi-chain support
  supportedChains: number[]; // Array of chain IDs to operate on
  enabledChains: number[];   // Only chains that have POIDH deployed + enabled

  // POIDH V3 Contract (unified contract for both solo and open bounties)
  poidhContractAddress: string;

  // Legacy aliases (for backwards compatibility)
  soloBountyAddress: string;
  openBountyAddress: string;
  claimNftAddress: string;

  // OpenAI
  openaiApiKey: string;
  openaiVisionModel: string;

  // Bot settings
  pollingInterval: number;
  maxGasPriceGwei: number;
  autoApproveGas: boolean;

  // Logging
  logLevel: string;
  logFile: string;

  // Demo mode
  demoMode: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getEnvVarBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getEnvVarNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function loadConfig(): Config {
  // Primary chain (for backwards compatibility, defaults to Base Mainnet)
  const primaryChainId = getEnvVarNumber('CHAIN_ID', 8453);

  // Multi-chain support: allow specifying multiple chains
  // Format: "8453,42161,666666666" (Base, Arbitrum, Degen)
  const supportedChainsStr = process.env.SUPPORTED_CHAINS;
  let supportedChains: number[] = [primaryChainId];
  
  if (supportedChainsStr) {
    supportedChains = supportedChainsStr
      .split(',')
      .map((id) => {
        const parsed = parseInt(id.trim(), 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((id): id is number => id !== null);
  }

  // Filter to only enabled chains with deployed contracts
  const enabledChains = supportedChains.filter((chainId) => {
    try {
      if (!isChainEnabled(chainId)) return false;
      // Check if POIDH contract is deployed on this chain
      try {
        getPoidhContractAddress(chainId);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  });

  // Get config for primary chain
  let chainConfig;
  try {
    chainConfig = getChainConfig(primaryChainId);
  } catch {
    throw new Error(`Invalid CHAIN_ID: ${primaryChainId}. Check SUPPORTED_CHAINS or CHAIN_ID.`);
  }

  // Get primary chain's contract address
  let poidhContractAddress: string;
  const overrideAddress = getEnvVar('POIDH_CONTRACT_ADDRESS', '');
  if (overrideAddress && overrideAddress !== '0x') {
    poidhContractAddress = overrideAddress;
  } else {
    try {
      poidhContractAddress = getPoidhContractAddress(primaryChainId);
    } catch {
      throw new Error(`POIDH contract not deployed on chain ${primaryChainId}. Set POIDH_CONTRACT_ADDRESS or use a different CHAIN_ID.`);
    }
  }

  // Get RPC URL with fallback support
  const rpcUrl = getEnvVar('RPC_URL', 
    getEnvVar('BASE_RPC_URL', 
      getEnvVar('BASE_MAINNET_RPC_URL', 
        getEnvVar('BASE_SEPOLIA_RPC_URL', 
          getDefaultRpcUrl(primaryChainId)
        )
      )
    )
  );

  return {
    // Blockchain - Multi-chain support
    rpcUrl,
    chainId: primaryChainId,
    botPrivateKey: getEnvVar('PRIVATE_KEY', getEnvVar('BOT_PRIVATE_KEY', '')),

    // Multi-chain configuration
    supportedChains,
    enabledChains,

    // POIDH V3 Contract (single unified contract on primary chain)
    poidhContractAddress,

    // Legacy aliases point to same contract (for backwards compatibility)
    soloBountyAddress: poidhContractAddress,
    openBountyAddress: poidhContractAddress,
    claimNftAddress: poidhContractAddress,

    // OpenAI
    openaiApiKey: getEnvVar('OPENAI_API_KEY', ''),
    openaiVisionModel: getEnvVar('OPENAI_VISION_MODEL', 'gpt-4o'),

    // Bot settings
    pollingInterval: getEnvVarNumber('POLLING_INTERVAL', 30),
    maxGasPriceGwei: getEnvVarNumber('MAX_GAS_PRICE_GWEI', 50),
    autoApproveGas: getEnvVarBool('AUTO_APPROVE_GAS', true),

    // Logging
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    logFile: getEnvVar('LOG_FILE', './logs/bot.log'),

    // Demo mode
    demoMode: getEnvVarBool('DEMO_MODE', false),
  };
}

export const config = loadConfig();

// Export network helpers
export function isMainnet(): boolean {
  return config.chainId === 8453;
}

export function isTestnet(): boolean {
  return config.chainId === 84532;
}

export function getNetworkName(): string {
  try {
    return getChainConfig(config.chainId).name;
  } catch {
    return `Unknown (${config.chainId})`;
  }
}

export function getNetworkName2(chainId: number): string {
  try {
    return getChainConfig(chainId).name;
  } catch {
    return `Unknown (${chainId})`;
  }
}

export function getBlockExplorerUrl(txHash: string, chainId?: number): string {
  const targetChainId = chainId || config.chainId;
  try {
    const chain = getChainConfig(targetChainId);
    const baseUrl = chain.blockExplorerUrls[0];
    return `${baseUrl}/tx/${txHash}`;
  } catch {
    return `#/unknown-chain-${targetChainId}`;
  }
}

export function getContractExplorerUrl(address?: string, chainId?: number): string {
  const targetChainId = chainId || config.chainId;
  const targetAddress = address || config.poidhContractAddress;
  try {
    const chain = getChainConfig(targetChainId);
    const baseUrl = chain.blockExplorerUrls[0];
    return `${baseUrl}/address/${targetAddress}`;
  } catch {
    return `#/unknown-chain-${targetChainId}`;
  }
}

/**
 * Get all enabled chains with their configurations
 */
export function getEnabledChainsConfig() {
  return config.enabledChains.map((chainId) => {
    try {
      return getChainConfig(chainId);
    } catch {
      return null;
    }
  }).filter((chain): chain is typeof CHAINS[keyof typeof CHAINS] => chain !== null);
}

/**
 * Check if a specific chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return config.supportedChains.includes(chainId);
}

/**
 * Check if a specific chain is enabled (has POIDH deployed)
 */
export function isChainConfigured(chainId: number): boolean {
  return config.enabledChains.includes(chainId);
}

