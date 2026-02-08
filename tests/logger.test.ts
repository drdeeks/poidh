/**
 * Logger Tests
 * Validates logging functionality and configuration
 */

import { logger } from '../src/utils/logger';

describe('Logger', () => {
  describe('Logger initialization', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have info method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Logging methods', () => {
    it('should log info message', () => {
      expect(() => {
        logger.info('Test info message');
      }).not.toThrow();
    });

    it('should log warning message', () => {
      expect(() => {
        logger.warn('Test warning message');
      }).not.toThrow();
    });

    it('should log error message', () => {
      expect(() => {
        logger.error('Test error message');
      }).not.toThrow();
    });

    it('should log debug message', () => {
      expect(() => {
        logger.debug('Test debug message');
      }).not.toThrow();
    });

    it('should log with metadata object', () => {
      expect(() => {
        logger.info('Test message with metadata', { userId: '123', action: 'test' });
      }).not.toThrow();
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Error occurred', error);
      }).not.toThrow();
    });
  });

  describe('Logging in different scenarios', () => {
    it('should log bounty creation', () => {
      expect(() => {
        logger.info('Bounty created', {
          bountyId: 'test-bounty',
          name: 'Test Bounty',
          reward: '0.1',
          chain: 8453,
        });
      }).not.toThrow();
    });

    it('should log submission validation', () => {
      expect(() => {
        logger.info('Submission validated', {
          submitter: '0x123...',
          score: 85,
          isValid: true,
        });
      }).not.toThrow();
    });

    it('should log wallet initialization', () => {
      expect(() => {
        logger.info('Wallet initialized', {
          address: '0x...',
          balance: '10.5',
          chain: 666666666,
        });
      }).not.toThrow();
    });

    it('should log RPC calls', () => {
      expect(() => {
        logger.debug('RPC call', {
          method: 'eth_getBalance',
          params: ['0x...'],
          responseTime: '150ms',
        });
      }).not.toThrow();
    });

    it('should log contract interactions', () => {
      expect(() => {
        logger.info('Contract method called', {
          contract: 'POIDH',
          method: 'createBounty',
          txHash: '0xabc...',
        });
      }).not.toThrow();
    });
  });

  describe('Log formatting', () => {
    it('should not throw on undefined context', () => {
      expect(() => {
        logger.info('Message without context');
      }).not.toThrow();
    });

    it('should not throw on null values', () => {
      expect(() => {
        logger.info('Message', { value: null });
      }).not.toThrow();
    });

    it('should handle objects with many properties', () => {
      const obj: any = {};
      for (let i = 0; i < 50; i++) {
        obj[`prop${i}`] = `value${i}`;
      }
      
      expect(() => {
        logger.info('Message with many properties', obj);
      }).not.toThrow();
    });

    it('should log large objects without truncation', () => {
      const largeObj = {
        bounties: Array(100).fill({
          id: 'test',
          name: 'Test Bounty',
          reward: '1.0',
        }),
      };

      expect(() => {
        logger.info('Large object log', largeObj);
      }).not.toThrow();
    });
  });

  describe('Error logging', () => {
    it('should log Error instances', () => {
      const error = new Error('Test error message');
      expect(() => {
        logger.error('An error occurred', error);
      }).not.toThrow();
    });

    it('should log custom error objects', () => {
      const customError = {
        message: 'Custom error',
        code: 'ERR_CUSTOM',
        details: 'Some details',
      };

      expect(() => {
        logger.error('Custom error occurred', customError);
      }).not.toThrow();
    });

    it('should log Error with stack trace', () => {
      const error = new Error('Error with stack');
      error.stack = 'Error: Error with stack\n    at test.ts:10:15';

      expect(() => {
        logger.error('Error with stack', error);
      }).not.toThrow();
    });
  });

  describe('Operational logging patterns', () => {
    it('should log autonomous operation start', () => {
      expect(() => {
        logger.info('🤖 Autonomous operation started', {
          chain: 'Degen',
          chainId: 666666666,
          bountyType: 'proveOutside',
        });
      }).not.toThrow();
    });

    it('should log polling cycle', () => {
      expect(() => {
        logger.debug('Polling cycle', {
          cycle: 1,
          timestamp: new Date().toISOString(),
          pendingBounties: 5,
        });
      }).not.toThrow();
    });

    it('should log gas price check', () => {
      expect(() => {
        logger.info('Gas price check', {
          currentPrice: '25.5',
          maxPrice: '50',
          acceptable: true,
        });
      }).not.toThrow();
    });

    it('should log payout transaction', () => {
      expect(() => {
        logger.info('Payout transaction', {
          winner: '0xabc...',
          amount: '0.1',
          txHash: '0xdef...',
          chain: 'Base Mainnet',
        });
      }).not.toThrow();
    });
  });
});
