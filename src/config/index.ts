import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface Config {
  // Blockchain
  rpcUrl: string;
  chainId: number;
  botPrivateKey: string;

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
  // Determine network based on chain ID or RPC URL
  const chainId = getEnvVarNumber('CHAIN_ID', 8453); // Default to Base Mainnet
  const isMainnet = chainId === 8453;

  // Default contract address based on network
  const defaultContractAddress = isMainnet
    ? '0x5555Fa783936C260f77385b4E153B9725feF1719' // Base Mainnet
    : ''; // Base Sepolia (requires explicit config)

  // Default RPC URL based on network
  const defaultRpcUrl = isMainnet
    ? 'https://mainnet.base.org'
    : 'https://sepolia.base.org';

  // Get the unified contract address
  const poidhContractAddress = getEnvVar('POIDH_CONTRACT_ADDRESS', defaultContractAddress);

  return {
    // Blockchain - Base Mainnet by default
    // Supports: RPC_URL (primary), BASE_RPC_URL, BASE_MAINNET_RPC_URL, BASE_SEPOLIA_RPC_URL (legacy)
    rpcUrl: getEnvVar('RPC_URL', getEnvVar('BASE_RPC_URL', getEnvVar('BASE_MAINNET_RPC_URL', getEnvVar('BASE_SEPOLIA_RPC_URL', defaultRpcUrl)))),
    chainId,
    // Supports: PRIVATE_KEY (primary), BOT_PRIVATE_KEY (legacy)
    botPrivateKey: getEnvVar('PRIVATE_KEY', getEnvVar('BOT_PRIVATE_KEY', '')),

    // POIDH V3 Contract (single unified contract)
    poidhContractAddress,

    // Legacy aliases point to same contract (for backwards compatibility)
    soloBountyAddress: poidhContractAddress,
    openBountyAddress: poidhContractAddress,
    claimNftAddress: poidhContractAddress, // NFTs are managed by same contract

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
  switch (config.chainId) {
    case 8453:
      return 'Base Mainnet';
    case 84532:
      return 'Base Sepolia';
    default:
      return `Unknown (${config.chainId})`;
  }
}

export function getBlockExplorerUrl(txHash: string): string {
  const baseUrl = isMainnet()
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org';
  return `${baseUrl}/tx/${txHash}`;
}

export function getContractExplorerUrl(): string {
  const baseUrl = isMainnet()
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org';
  return `${baseUrl}/address/${config.poidhContractAddress}`;
}

