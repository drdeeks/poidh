/**
 * Audit Trail Tests
 * Validates audit logging, verification, and integrity
 */

import { auditTrail } from '../src/utils/audit-trail';
import * as fs from 'fs';

describe('AuditTrail', () => {
  let initialEntryCount: number;

  beforeAll(() => {
    // Initialize audit trail for tests (may already have entries from previous runs)
    auditTrail.initialize(8453, '0x5555Fa783936C260f77385b4E153B9725feF1719', '0xTestBot');
    initialEntryCount = auditTrail.getState().entries.length;
  });

  describe('initialize', () => {
    it('should initialize with chain info', () => {
      const state = auditTrail.getState();
      expect(state.chainId).toBe(8453);
      expect(state.contractAddress).toBe('0x5555Fa783936C260f77385b4E153B9725feF1719');
      expect(state.agentWallet).toBe('0xTestBot');
    });

    it('should have at least one AGENT_STARTED entry', () => {
      const state = auditTrail.getState();
      const agentStarted = state.entries.filter((e: any) => e.action === 'AGENT_STARTED');
      expect(agentStarted.length).toBeGreaterThan(0);
    });
  });

  describe('log', () => {
    it('should create entries with valid hash chain', () => {
      const beforeCount = auditTrail.getState().entries.length;
      
      auditTrail.log('BOUNTY_CREATED', { name: 'Test Bounty Hash Chain', rewardEth: '0.01' });
      
      const state = auditTrail.getState();
      expect(state.entries.length).toBe(beforeCount + 1);
      
      // Verify hash chain integrity
      const lastEntry = state.entries[state.entries.length - 1];
      const prevEntry = state.entries[state.entries.length - 2];
      expect(lastEntry.previousHash).toBe(prevEntry.entryHash);
    });

    it('should log SUBMISSION_REJECTED with failed and passed checks', () => {
      auditTrail.log('SUBMISSION_REJECTED', {
        bountyId: 'test-rejection-' + Date.now(),
        submitter: '0xUser',
        claimId: '999',
        reason: 'Test rejection reason',
        validationScore: 35,
        failedChecks: [
          { name: 'Test Failed Check 1', details: 'Failed detail 1' },
          { name: 'Test Failed Check 2', details: 'Failed detail 2' },
        ],
        passedChecks: [
          { name: 'Test Passed Check', details: 'Passed detail' },
        ],
      });

      const state = auditTrail.getState();
      const lastEntry = state.entries[state.entries.length - 1];
      
      expect(lastEntry.action).toBe('SUBMISSION_REJECTED');
      expect(lastEntry.details.failedChecks).toHaveLength(2);
      expect(lastEntry.details.passedChecks).toHaveLength(1);
      expect(lastEntry.details.reason).toBe('Test rejection reason');
    });

    it('should log BOUNTIES_AUTO_INDEXED with verification logic', () => {
      const testBountyId = 'test-indexed-' + Date.now();
      
      auditTrail.log('BOUNTIES_AUTO_INDEXED', {
        botWalletAddress: '0xTestBot',
        chainId: 8453,
        chainName: 'Base Mainnet',
        nativeCurrency: 'ETH',
        totalBountiesScanned: 100,
        botBountiesFound: 3,
        filterCriteria: 'issuer.toLowerCase() === "0xtestbot" && isActive',
        verificationLogic: [
          '1. Fetch all bounties from contract',
          '2. Filter by issuer address',
          '3. Check bounty is active',
        ],
        discoveredBounties: [
          { id: testBountyId, name: 'Test Bounty', rewardAmount: '0.01', rewardCurrency: 'ETH', chainName: 'Base Mainnet' },
        ],
      });

      const state = auditTrail.getState();
      const lastEntry = state.entries[state.entries.length - 1];
      
      expect(lastEntry.action).toBe('BOUNTIES_AUTO_INDEXED');
      expect(lastEntry.details.chainName).toBe('Base Mainnet');
      expect(lastEntry.details.nativeCurrency).toBe('ETH');
      expect(lastEntry.details.botBountiesFound).toBe(3);
      expect(lastEntry.details.verificationLogic).toHaveLength(3);
    });

    it('should log SUBMISSION_VALIDATED with decision reason', () => {
      auditTrail.log('SUBMISSION_VALIDATED', {
        bountyId: 'test-validated-' + Date.now(),
        submitter: '0xUser',
        claimId: '123',
        isValid: true,
        validationScore: 85,
        passingThreshold: 50,
        decisionReason: 'ACCEPTED: Score 85/100 meets threshold of 50.',
        validationChecks: [
          { checkName: 'Format Check', passed: true, details: 'Valid JPEG' },
          { checkName: 'EXIF Check', passed: true, details: 'Valid EXIF data' },
        ],
      });

      const state = auditTrail.getState();
      const lastEntry = state.entries[state.entries.length - 1];
      
      expect(lastEntry.action).toBe('SUBMISSION_VALIDATED');
      expect(lastEntry.details.isValid).toBe(true);
      expect(lastEntry.details.validationScore).toBe(85);
      expect(lastEntry.details.decisionReason).toContain('ACCEPTED');
    });
  });

  describe('verify', () => {
    it('should verify chain integrity', () => {
      const result = auditTrail.verify();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have valid genesis entry', () => {
      const state = auditTrail.getState();
      expect(state.entries[0].previousHash).toBe('GENESIS');
    });

    it('should have contiguous hash chain', () => {
      const state = auditTrail.getState();
      for (let i = 1; i < state.entries.length; i++) {
        expect(state.entries[i].previousHash).toBe(state.entries[i - 1].entryHash);
      }
    });
  });

  describe('summary', () => {
    it('should return valid summary', () => {
      const summary = auditTrail.getSummary();
      expect(summary).toHaveProperty('totalEntries');
      expect(summary).toHaveProperty('isValid');
      expect(summary).toHaveProperty('bountiesCreated');
      expect(summary.totalEntries).toBeGreaterThan(0);
    });

    it('should count entries correctly', () => {
      const state = auditTrail.getState();
      const summary = auditTrail.getSummary();
      expect(summary.totalEntries).toBe(state.entries.length);
    });
  });

  describe('persistence', () => {
    it('should save JSON file to disk', () => {
      const paths = auditTrail.getPaths();
      expect(fs.existsSync(paths.json)).toBe(true);

      const content = JSON.parse(fs.readFileSync(paths.json, 'utf-8'));
      expect(content).toHaveProperty('entries');
      expect(content).toHaveProperty('summary');
      expect(content.entries.length).toBeGreaterThan(0);
    });

    it('should save human-readable TXT file', () => {
      const paths = auditTrail.getPaths();
      expect(fs.existsSync(paths.txt)).toBe(true);

      const content = fs.readFileSync(paths.txt, 'utf-8');
      expect(content).toContain('AUTONOMOUS BOUNTY BOT - AUDIT TRAIL');
      expect(content).toContain('VERIFICATION');
    });

    it('should include action details in TXT file', () => {
      auditTrail.log('BOUNTY_CREATED', { name: 'TXT Test Bounty', rewardEth: '0.05', chainName: 'Base Mainnet' });
      
      const paths = auditTrail.getPaths();
      const content = fs.readFileSync(paths.txt, 'utf-8');
      expect(content).toContain('TXT Test Bounty');
    });
  });

  describe('audit action types', () => {
    it('should support all required action types', () => {
      const actions = [
        'AGENT_STARTED',
        'BOUNTY_CREATED',
        'BOUNTIES_AUTO_INDEXED',
        'SUBMISSION_RECEIVED',
        'SUBMISSION_VALIDATED',
        'SUBMISSION_REJECTED',
        'WINNER_SELECTED',
        'WINNER_RATIONALE',
        'PAYOUT_CONFIRMED',
      ];

      // Just verify we can log each type without error
      for (const action of actions) {
        expect(() => {
          auditTrail.log(action as any, { test: true });
        }).not.toThrow();
      }
    });
  });
});
