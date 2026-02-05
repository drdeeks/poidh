/**
 * Multi-chain EVM configuration for POIDH Autonomous Bot
 * Supported chains: Base, Arbitrum, Degen, and others
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  poidhContractAddress: string;
  enabled: boolean;
}

/**
 * Chain registry with all supported EVM chains
 */
export const CHAINS: Record<number, ChainConfig> = {
  // Base Mainnet
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}',
      'https://base-mainnet.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://basescan.org'],
    poidhContractAddress: '0x5555Fa783936C260f77385b4E153B9725feF1719',
    enabled: true,
  },

  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia.g.alchemy.com/v2/{ALCHEMY_KEY}',
      'https://base-sepolia.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: true,
  },

  // Arbitrum One Mainnet
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-mainnet.infura.io/v3/{INFURA_KEY}',
      'https://arbitrum-one.g.alchemy.com/v2/{ALCHEMY_KEY}',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    poidhContractAddress: '0x5555Fa783936C260f77385b4E153B9725feF1719',
    enabled: true,
  },

  // Arbitrum Sepolia Testnet
  421614: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },

  // Degen Chain Mainnet
  666666666: {
    chainId: 666666666,
    name: 'Degen',
    nativeCurrency: 'DEGEN',
    rpcUrls: [
      'https://rpc.degen.tips',
      'https://degen.alt.technology',
    ],
    blockExplorerUrls: ['https://explorer.degen.tips'],
    poidhContractAddress: '0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f',
    enabled: true,
  },

  // Degen Testnet (if applicable)
  666666665: {
    chainId: 666666665,
    name: 'Degen Testnet',
    nativeCurrency: 'DEGEN',
    rpcUrls: [
      'https://testnet-rpc.degen.tips',
    ],
    blockExplorerUrls: ['https://testnet-explorer.degen.tips'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },

  // Ethereum Mainnet (future support)
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://eth.public.com',
      'https://mainnet.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },

  // Sepolia Testnet (future support)
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://sepolia.infura.io/v3/{INFURA_KEY}',
      'https://sepolia.public.com',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },

  // Polygon Mainnet (future support)
  137: {
    chainId: 137,
    name: 'Polygon',
    nativeCurrency: 'MATIC',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon-mainnet.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },

  // Optimism Mainnet (future support)
  10: {
    chainId: 10,
    name: 'Optimism',
    nativeCurrency: 'ETH',
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism-mainnet.infura.io/v3/{INFURA_KEY}',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    poidhContractAddress: '0x', // Deploy address here when available
    enabled: false,
  },
};

/**
 * Get chain config by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return chain;
}

/**
 * Get all enabled chains
 */
export function getEnabledChains(): ChainConfig[] {
  return Object.values(CHAINS).filter((chain) => chain.enabled);
}

/**
 * Check if chain is enabled
 */
export function isChainEnabled(chainId: number): boolean {
  const chain = CHAINS[chainId];
  return chain ? chain.enabled : false;
}

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  return getChainConfig(chainId).name;
}

/**
 * Get block explorer URL for transaction
 */
export function getBlockExplorerUrl(chainId: number, txHash: string): string {
  const chain = getChainConfig(chainId);
  const baseUrl = chain.blockExplorerUrls[0];
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get block explorer URL for contract
 */
export function getContractExplorerUrl(chainId: number, address: string): string {
  const chain = getChainConfig(chainId);
  const baseUrl = chain.blockExplorerUrls[0];
  return `${baseUrl}/address/${address}`;
}

/**
 * Get default RPC URL for chain
 */
export function getDefaultRpcUrl(chainId: number): string {
  const chain = getChainConfig(chainId);
  return chain.rpcUrls[0];
}

/**
 * Get POIDH contract address for chain
 */
export function getPoidhContractAddress(chainId: number): string {
  const chain = getChainConfig(chainId);
  if (!chain.poidhContractAddress || chain.poidhContractAddress === '0x') {
    throw new Error(`POIDH contract not deployed on chain ${chainId}`);
  }
  return chain.poidhContractAddress;
}
