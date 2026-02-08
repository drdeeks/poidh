/**
 * Bounty Types & Validation Tests
 * Validates bounty configuration interfaces and enums
 */

import {
  SelectionMode,
  BountyStatus,
  ProofType,
  ValidationCriteria,
  BountyConfig,
} from '../src/bounty/types';

describe('Bounty Types & Enums', () => {
  describe('SelectionMode', () => {
    it('should have FIRST_VALID mode', () => {
      expect(SelectionMode.FIRST_VALID).toBe('first_valid');
    });

    it('should have AI_JUDGED mode', () => {
      expect(SelectionMode.AI_JUDGED).toBe('ai_judged');
    });

    it('should have COMMUNITY_VOTE mode', () => {
      expect(SelectionMode.COMMUNITY_VOTE).toBe('community_vote');
    });
  });

  describe('BountyStatus', () => {
    it('should have DRAFT status', () => {
      expect(BountyStatus.DRAFT).toBe('draft');
    });

    it('should have ACTIVE status', () => {
      expect(BountyStatus.ACTIVE).toBe('active');
    });

    it('should have EVALUATING status', () => {
      expect(BountyStatus.EVALUATING).toBe('evaluating');
    });

    it('should have COMPLETED status', () => {
      expect(BountyStatus.COMPLETED).toBe('completed');
    });

    it('should have CANCELLED status', () => {
      expect(BountyStatus.CANCELLED).toBe('cancelled');
    });

    it('should have EXPIRED status', () => {
      expect(BountyStatus.EXPIRED).toBe('expired');
    });
  });

  describe('ProofType', () => {
    it('should have PHOTO type', () => {
      expect(ProofType.PHOTO).toBe('photo');
    });

    it('should have VIDEO type', () => {
      expect(ProofType.VIDEO).toBe('video');
    });

    it('should have TEXT type', () => {
      expect(ProofType.TEXT).toBe('text');
    });

    it('should have ANY type', () => {
      expect(ProofType.ANY).toBe('any');
    });
  });

  describe('ValidationCriteria', () => {
    it('should support location validation', () => {
      const criteria: ValidationCriteria = {
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          radiusMeters: 500,
          description: 'New York City',
        },
      };

      expect(criteria.location).toBeDefined();
      expect(criteria.location?.latitude).toBe(40.7128);
      expect(criteria.location?.radiusMeters).toBe(500);
    });

    it('should support time window validation', () => {
      const now = Date.now();
      const criteria: ValidationCriteria = {
        timeWindow: {
          startTimestamp: now,
          endTimestamp: now + 24 * 60 * 60 * 1000,
        },
      };

      expect(criteria.timeWindow).toBeDefined();
      expect(criteria.timeWindow?.startTimestamp).toBeLessThanOrEqual(criteria.timeWindow?.endTimestamp!);
    });

    it('should support EXIF requirement', () => {
      const criteria: ValidationCriteria = {
        requireExif: true,
        maxAgeMinutes: 60,
      };

      expect(criteria.requireExif).toBe(true);
      expect(criteria.maxAgeMinutes).toBe(60);
    });

    it('should support screenshot rejection', () => {
      const criteria: ValidationCriteria = {
        rejectScreenshots: true,
      };

      expect(criteria.rejectScreenshots).toBe(true);
    });

    it('should support AI-generated rejection', () => {
      const criteria: ValidationCriteria = {
        rejectAIGenerated: true,
        minAIConfidence: 0.8,
      };

      expect(criteria.rejectAIGenerated).toBe(true);
      expect(criteria.minAIConfidence).toBe(0.8);
    });

    it('should support keyword requirements', () => {
      const criteria: ValidationCriteria = {
        requiredKeywords: ['sunset', 'beach', 'ocean'],
      };

      expect(criteria.requiredKeywords).toContain('sunset');
      expect(criteria.requiredKeywords?.length).toBe(3);
    });

    it('should support custom AI prompt', () => {
      const prompt = 'Evaluate the quality of this artwork';
      const criteria: ValidationCriteria = {
        aiValidationPrompt: prompt,
      };

      expect(criteria.aiValidationPrompt).toBe(prompt);
    });

    it('should support image size requirements', () => {
      const criteria: ValidationCriteria = {
        minImageSize: {
          width: 1280,
          height: 720,
        },
      };

      expect(criteria.minImageSize).toBeDefined();
      expect(criteria.minImageSize?.width).toBe(1280);
    });
  });

  describe('BountyConfig', () => {
    it('should create valid bounty config', () => {
      const config: BountyConfig = {
        id: 'test-bounty-1',
        name: 'Test Bounty',
        description: 'A test bounty',
        requirements: 'Submit a photo',
        proofType: ProofType.PHOTO,
        selectionMode: SelectionMode.FIRST_VALID,
        rewardEth: '0.01',
        deadline: Date.now() + 24 * 60 * 60 * 1000,
        validation: {
          requireExif: true,
          maxAgeMinutes: 60,
        },
        tags: ['test'],
      };

      expect(config.id).toBe('test-bounty-1');
      expect(config.name).toBe('Test Bounty');
      expect(config.proofType).toBe(ProofType.PHOTO);
      expect(config.selectionMode).toBe(SelectionMode.FIRST_VALID);
      expect(config.validation.requireExif).toBe(true);
    });

    it('should support AI-judged bounty config', () => {
      const config: BountyConfig = {
        id: 'ai-bounty-1',
        name: 'AI-Judged Creative Bounty',
        description: 'Creative contest',
        requirements: 'Show your creativity',
        proofType: ProofType.PHOTO,
        selectionMode: SelectionMode.AI_JUDGED,
        rewardEth: '1.0',
        deadline: Date.now() + 48 * 60 * 60 * 1000,
        validation: {
          aiValidationPrompt: 'Rate the creativity and originality',
          minAIConfidence: 0.75,
        },
        tags: ['creative', 'ai-judged'],
      };

      expect(config.selectionMode).toBe(SelectionMode.AI_JUDGED);
      expect(config.validation.minAIConfidence).toBe(0.75);
    });

    it('should support custom reward amounts', () => {
      const configs = [
        { rewardEth: '0.001', description: 'Minimum' },
        { rewardEth: '0.1', description: 'Small' },
        { rewardEth: '1.0', description: 'Medium' },
        { rewardEth: '10.0', description: 'Large' },
        { rewardEth: '100.0', description: 'Very Large' },
      ];

      for (const reward of configs) {
        const config: BountyConfig = {
          id: `bounty-${reward.rewardEth}`,
          name: reward.description,
          description: `Bounty with ${reward.rewardEth} ETH reward`,
          requirements: 'Submit proof',
          proofType: ProofType.PHOTO,
          selectionMode: SelectionMode.FIRST_VALID,
          rewardEth: reward.rewardEth,
          deadline: Date.now() + 24 * 60 * 60 * 1000,
          validation: {},
          tags: [],
        };

        expect(config.rewardEth).toBe(reward.rewardEth);
      }
    });

    it('should have valid deadline in future', () => {
      const config: BountyConfig = {
        id: 'test-deadline',
        name: 'Test',
        description: 'Test',
        requirements: 'Test',
        proofType: ProofType.PHOTO,
        selectionMode: SelectionMode.FIRST_VALID,
        rewardEth: '0.01',
        deadline: Date.now() + 60 * 60 * 1000, // 1 hour from now
        validation: {},
        tags: [],
      };

      expect(config.deadline).toBeGreaterThan(Date.now());
    });

    it('should support multiple tags', () => {
      const config: BountyConfig = {
        id: 'test-tags',
        name: 'Test',
        description: 'Test',
        requirements: 'Test',
        proofType: ProofType.PHOTO,
        selectionMode: SelectionMode.FIRST_VALID,
        rewardEth: '0.01',
        deadline: Date.now() + 24 * 60 * 60 * 1000,
        validation: {},
        tags: ['outdoor', 'photo', 'quick', 'real-world'],
      };

      expect(config.tags).toContain('outdoor');
      expect(config.tags.length).toBe(4);
    });
  });
});
