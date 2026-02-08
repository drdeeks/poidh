/**
 * Configuration Tests
 * Validates chain config, environment loading, and configuration parsing
 */

import { getChainConfig, getEnabledChains, isChainEnabled, getPoidhContractAddress, getChainName } from '../src/config/chains';

describe('Configuration - Chains', () => {
  describe('getChainConfig', () => {
    it('should return Base Mainnet config', () => {
      const config = getChainConfig(8453);
      expect(config.name).toBe('Base Mainnet');
      expect(config.nativeCurrency).toBe('ETH');
      expect(config.chainId).toBe(8453);
      expect(config.poidhContractAddress).toBe('0x5555Fa783936C260f77385b4E153B9725feF1719');
    });

    it('should return Arbitrum One config', () => {
      const config = getChainConfig(42161);
      expect(config.name).toBe('Arbitrum One');
      expect(config.nativeCurrency).toBe('ETH');
      expect(config.chainId).toBe(42161);
    });

    it('should return Degen config with correct currency', () => {
      const config = getChainConfig(666666666);
      expect(config.name).toBe('Degen');
      expect(config.nativeCurrency).toBe('DEGEN');
      expect(config.chainId).toBe(666666666);
      expect(config.poidhContractAddress).toBe('0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f');
    });

    it('should throw on unknown chain', () => {
      expect(() => getChainConfig(99999)).toThrow('Unknown chain ID: 99999');
    });
  });

  describe('getEnabledChains', () => {
    it('should return at least 3 enabled chains', () => {
      const chains = getEnabledChains();
      expect(chains.length).toBeGreaterThanOrEqual(3);
    });

    it('should only return enabled chains', () => {
      const chains = getEnabledChains();
      for (const chain of chains) {
        expect(chain.enabled).toBe(true);
      }
    });

    it('should include Base, Arbitrum, and Degen', () => {
      const chains = getEnabledChains();
      const chainIds = chains.map(c => c.chainId);
      expect(chainIds).toContain(8453);  // Base
      expect(chainIds).toContain(42161); // Arbitrum
      expect(chainIds).toContain(666666666); // Degen
    });
  });

  describe('isChainEnabled', () => {
    it('should return true for Base Mainnet', () => {
      expect(isChainEnabled(8453)).toBe(true);
    });

    it('should return true for Arbitrum', () => {
      expect(isChainEnabled(42161)).toBe(true);
    });

    it('should return true for Degen', () => {
      expect(isChainEnabled(666666666)).toBe(true);
    });

    it('should return false for unknown chain', () => {
      expect(isChainEnabled(99999)).toBe(false);
    });
  });

  describe('getPoidhContractAddress', () => {
    it('should return correct address for Base', () => {
      const addr = getPoidhContractAddress(8453);
      expect(addr).toBe('0x5555Fa783936C260f77385b4E153B9725feF1719');
    });

    it('should return correct address for Arbitrum', () => {
      const addr = getPoidhContractAddress(42161);
      expect(addr).toBe('0x5555Fa783936C260f77385b4E153B9725feF1719');
    });

    it('should return correct address for Degen', () => {
      const addr = getPoidhContractAddress(666666666);
      expect(addr).toBe('0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f');
    });

    it('should throw for chain without deployed contract', () => {
      // Base Sepolia has no contract deployed
      expect(() => getPoidhContractAddress(84532)).toThrow();
    });
  });

  describe('getChainName', () => {
    it('should return correct name for Base', () => {
      expect(getChainName(8453)).toBe('Base Mainnet');
    });

    it('should return correct name for Arbitrum', () => {
      expect(getChainName(42161)).toBe('Arbitrum One');
    });

    it('should return correct name for Degen', () => {
      expect(getChainName(666666666)).toBe('Degen');
    });
  });

  describe('RPC URLs', () => {
    it('should have valid RPC URLs for active chains', () => {
      const chains = getEnabledChains();
      for (const chain of chains) {
        expect(chain.rpcUrls).toBeDefined();
        expect(chain.rpcUrls.length).toBeGreaterThan(0);
        // First RPC should be a string
        expect(typeof chain.rpcUrls[0]).toBe('string');
        // Should look like an RPC endpoint
        expect(chain.rpcUrls[0]).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Block explorers', () => {
    it('should have block explorer URLs for all chains', () => {
      const chains = getEnabledChains();
      for (const chain of chains) {
        expect(chain.blockExplorerUrls).toBeDefined();
        expect(chain.blockExplorerUrls.length).toBeGreaterThan(0);
        expect(chain.blockExplorerUrls[0]).toMatch(/^https?:\/\//);
      }
    });
  });
});
