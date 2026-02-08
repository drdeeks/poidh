/**
 * Chain Selector Tests
 * Validates chain parsing, selection, and validation
 */

import { parseChainFlag, validateChainSelection } from '../src/utils/chain-selector';

describe('Chain Selector', () => {
  describe('parseChainFlag', () => {
    it('should parse chain by name', () => {
      expect(parseChainFlag('base')).toBe(8453);
      expect(parseChainFlag('arbitrum')).toBe(42161);
      expect(parseChainFlag('degen')).toBe(666666666);
    });

    it('should parse chain by full name', () => {
      expect(parseChainFlag('base-mainnet')).toBe(8453);
      expect(parseChainFlag('arbitrum-one')).toBe(42161);
      expect(parseChainFlag('base-sepolia')).toBe(84532);
    });

    it('should parse chain by alias', () => {
      expect(parseChainFlag('eth')).toBe(1);
      expect(parseChainFlag('ethereum')).toBe(1);
      expect(parseChainFlag('matic')).toBe(137);
      expect(parseChainFlag('polygon')).toBe(137);
      expect(parseChainFlag('op')).toBe(10);
      expect(parseChainFlag('optimism')).toBe(10);
    });

    it('should parse chain by numeric ID', () => {
      expect(parseChainFlag('8453')).toBe(8453);
      expect(parseChainFlag('42161')).toBe(42161);
      expect(parseChainFlag('666666666')).toBe(666666666);
    });

    it('should be case-insensitive', () => {
      expect(parseChainFlag('BASE')).toBe(8453);
      expect(parseChainFlag('Arbitrum')).toBe(42161);
      expect(parseChainFlag('DEGEN')).toBe(666666666);
    });

    it('should handle mixed case', () => {
      expect(parseChainFlag('Base-Mainnet')).toBe(8453);
      expect(parseChainFlag('Arbitrum-One')).toBe(42161);
    });

    it('should return null for invalid chain', () => {
      expect(parseChainFlag('invalid')).toBeNull();
      // Note: numeric strings are parsed as chain IDs even if they don't exist
      // That's OK - validation happens in validateChainSelection()
      expect(parseChainFlag('bitcoin')).toBeNull();
    });

    it('should handle empty string', () => {
      expect(parseChainFlag('')).toBeNull();
    });

    it('should handle undefined', () => {
      expect(parseChainFlag(undefined)).toBeNull();
    });

    it('should parse active chains correctly', () => {
      // Base
      expect(parseChainFlag('base')).toBe(8453);
      // Arbitrum
      expect(parseChainFlag('arbitrum')).toBe(42161);
      // Degen
      expect(parseChainFlag('degen')).toBe(666666666);
    });

    it('should parse testnet chains', () => {
      expect(parseChainFlag('base-sepolia')).toBe(84532);
      expect(parseChainFlag('arbitrum-sepolia')).toBe(421614);
      expect(parseChainFlag('sepolia')).toBe(11155111);
    });

    it('should recognize all documented aliases', () => {
      const aliases: { [key: string]: number } = {
        base: 8453,
        'base-mainnet': 8453,
        'base-sepolia': 84532,
        arbitrum: 42161,
        'arbitrum-one': 42161,
        'arbitrum-sepolia': 421614,
        degen: 666666666,
        ethereum: 1,
        eth: 1,
        sepolia: 11155111,
        polygon: 137,
        matic: 137,
        optimism: 10,
        op: 10,
      };

      for (const [alias, chainId] of Object.entries(aliases)) {
        expect(parseChainFlag(alias)).toBe(chainId);
      }
    });
  });

  describe('validateChainSelection', () => {
    it('should validate Base Mainnet', () => {
      expect(() => validateChainSelection(8453)).not.toThrow();
    });

    it('should validate Arbitrum One', () => {
      expect(() => validateChainSelection(42161)).not.toThrow();
    });

    it('should validate Degen', () => {
      expect(() => validateChainSelection(666666666)).not.toThrow();
    });

    it('should throw for disabled chain', () => {
      // Base Sepolia is disabled in chains.ts
      expect(() => validateChainSelection(84532)).toThrow();
    });

    it('should throw for unknown chain', () => {
      expect(() => validateChainSelection(99999)).toThrow();
    });

    it('should throw for chain without contract', () => {
      // Ethereum Mainnet doesn't have POIDH deployed
      expect(() => validateChainSelection(1)).toThrow();
    });

    it('should validate only enabled chains', () => {
      const validChains = [8453, 42161, 666666666];
      for (const chainId of validChains) {
        expect(() => validateChainSelection(chainId)).not.toThrow();
      }
    });
  });

  describe('Integration: Parse and Validate', () => {
    it('should parse and validate Base', () => {
      const chainId = parseChainFlag('base');
      expect(chainId).not.toBeNull();
      if (chainId) {
        expect(() => validateChainSelection(chainId)).not.toThrow();
      }
    });

    it('should parse and validate Arbitrum', () => {
      const chainId = parseChainFlag('arbitrum');
      expect(chainId).not.toBeNull();
      if (chainId) {
        expect(() => validateChainSelection(chainId)).not.toThrow();
      }
    });

    it('should parse and validate Degen', () => {
      const chainId = parseChainFlag('degen');
      expect(chainId).not.toBeNull();
      if (chainId) {
        expect(() => validateChainSelection(chainId)).not.toThrow();
      }
    });

    it('should handle invalid chain from CLI', () => {
      const chainId = parseChainFlag('invalid-chain');
      expect(chainId).toBeNull();
    });

    it('should handle all active chain names', () => {
      const activeChains = ['base', 'arbitrum', 'degen'];
      for (const name of activeChains) {
        const chainId = parseChainFlag(name);
        expect(chainId).not.toBeNull();
        if (chainId) {
          expect(() => validateChainSelection(chainId)).not.toThrow();
        }
      }
    });
  });
});
