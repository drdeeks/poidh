/**
 * Production Bounties Tests
 * Validates pre-built bounty templates and custom bounty creation
 */

import {
  BOUNTY_PROVE_OUTSIDE,
  BOUNTY_HANDWRITTEN_DATE,
  BOUNTY_MEAL_PHOTO,
  BOUNTY_OBJECT_TOWER,
  BOUNTY_SHADOW_ART,
  BOUNTY_ANIMAL_PHOTO,
  PRODUCTION_BOUNTIES,
  createFreshBounty,
  createRealWorldBounty,
} from '../src/bounty/configs/production-bounties';
import { SelectionMode, ProofType } from '../src/bounty/types';

describe('Production Bounties', () => {
  describe('BOUNTY_PROVE_OUTSIDE', () => {
    it('should have valid configuration', () => {
      expect(BOUNTY_PROVE_OUTSIDE.name).toContain('Outside');
      expect(BOUNTY_PROVE_OUTSIDE.proofType).toBe(ProofType.PHOTO);
      expect(BOUNTY_PROVE_OUTSIDE.selectionMode).toBe(SelectionMode.FIRST_VALID);
      expect(BOUNTY_PROVE_OUTSIDE.rewardEth).toBeDefined();
    });

    it('should require EXIF validation', () => {
      expect(BOUNTY_PROVE_OUTSIDE.validation.requireExif).toBe(true);
    });

    it('should have max age requirement', () => {
      expect(BOUNTY_PROVE_OUTSIDE.validation.maxAgeMinutes).toBe(15);
    });

    it('should have description and requirements', () => {
      expect(BOUNTY_PROVE_OUTSIDE.description).toBeTruthy();
      expect(BOUNTY_PROVE_OUTSIDE.requirements).toBeTruthy();
    });
  });

  describe('BOUNTY_HANDWRITTEN_DATE', () => {
    it('should have valid configuration', () => {
      expect(BOUNTY_HANDWRITTEN_DATE.name).toContain('Handwritten');
      expect(BOUNTY_HANDWRITTEN_DATE.proofType).toBe(ProofType.PHOTO);
      expect(BOUNTY_HANDWRITTEN_DATE.selectionMode).toBe(SelectionMode.FIRST_VALID);
    });

    it('should require EXIF and allow 60 minutes', () => {
      expect(BOUNTY_HANDWRITTEN_DATE.validation.requireExif).toBe(true);
      expect(BOUNTY_HANDWRITTEN_DATE.validation.maxAgeMinutes).toBe(60);
    });

    it('should require keyword validation', () => {
      expect(BOUNTY_HANDWRITTEN_DATE.validation.requiredKeywords).toBeDefined();
      expect(BOUNTY_HANDWRITTEN_DATE.validation.requiredKeywords).toContain('poidh');
    });
  });

  describe('BOUNTY_MEAL_PHOTO', () => {
    it('should have valid configuration', () => {
      expect(BOUNTY_MEAL_PHOTO.name).toContain('Meal');
      expect(BOUNTY_MEAL_PHOTO.proofType).toBe(ProofType.PHOTO);
      expect(BOUNTY_MEAL_PHOTO.selectionMode).toBe(SelectionMode.FIRST_VALID);
    });

    it('should have 30 minute freshness requirement', () => {
      expect(BOUNTY_MEAL_PHOTO.validation.maxAgeMinutes).toBe(30);
    });

    it('should require EXIF', () => {
      expect(BOUNTY_MEAL_PHOTO.validation.requireExif).toBe(true);
    });
  });

  describe('BOUNTY_OBJECT_TOWER', () => {
    it('should have valid AI-judged configuration', () => {
      expect(BOUNTY_OBJECT_TOWER.name).toContain('Tower');
      expect(BOUNTY_OBJECT_TOWER.proofType).toBe(ProofType.PHOTO);
      expect(BOUNTY_OBJECT_TOWER.selectionMode).toBe(SelectionMode.AI_JUDGED);
    });

    it('should have AI validation prompt', () => {
      expect(BOUNTY_OBJECT_TOWER.validation.aiValidationPrompt).toBeTruthy();
    });

    it('should have longer deadline than first-valid bounties', () => {
      // AI-judged bounties typically have 48+ hour deadlines
      const aiDeadline = BOUNTY_OBJECT_TOWER.deadline;
      const quickDeadline = BOUNTY_PROVE_OUTSIDE.deadline;
      expect(aiDeadline).toBeGreaterThan(quickDeadline);
    });
  });

  describe('BOUNTY_SHADOW_ART', () => {
    it('should have valid AI-judged configuration', () => {
      expect(BOUNTY_SHADOW_ART.name).toContain('Shadow');
      expect(BOUNTY_SHADOW_ART.selectionMode).toBe(SelectionMode.AI_JUDGED);
    });

    it('should have AI validation prompt', () => {
      expect(BOUNTY_SHADOW_ART.validation.aiValidationPrompt).toBeTruthy();
      expect(BOUNTY_SHADOW_ART.validation.aiValidationPrompt).toContain('CREATIVITY');
    });
  });

  describe('BOUNTY_ANIMAL_PHOTO', () => {
    it('should have valid AI-judged configuration', () => {
      expect(BOUNTY_ANIMAL_PHOTO.name).toContain('Animal');
      expect(BOUNTY_ANIMAL_PHOTO.selectionMode).toBe(SelectionMode.AI_JUDGED);
    });

    it('should have AI validation prompt', () => {
      expect(BOUNTY_ANIMAL_PHOTO.validation.aiValidationPrompt).toBeTruthy();
    });
  });

  describe('PRODUCTION_BOUNTIES object', () => {
    it('should export all bounty templates', () => {
      expect(PRODUCTION_BOUNTIES.proveOutside).toBeDefined();
      expect(PRODUCTION_BOUNTIES.handwrittenDate).toBeDefined();
      expect(PRODUCTION_BOUNTIES.mealPhoto).toBeDefined();
      expect(PRODUCTION_BOUNTIES.objectTower).toBeDefined();
      expect(PRODUCTION_BOUNTIES.shadowArt).toBeDefined();
      expect(PRODUCTION_BOUNTIES.animalPhoto).toBeDefined();
    });

    it('should have 6 bounty templates', () => {
      const templates = Object.keys(PRODUCTION_BOUNTIES);
      expect(templates.length).toBe(6);
    });
  });

  describe('createFreshBounty', () => {
    it('should create fresh copy of prove outside', () => {
      const fresh = createFreshBounty('proveOutside');
      expect(fresh.name).toBe(BOUNTY_PROVE_OUTSIDE.name);
      expect(fresh.id).not.toBe(BOUNTY_PROVE_OUTSIDE.id);
      // Fresh deadline should be equal or greater (not all old bounties have valid deadlines)
      expect(fresh.deadline).toBeGreaterThanOrEqual(BOUNTY_PROVE_OUTSIDE.deadline);
    });

    it('should create fresh copy of AI-judged bounty', () => {
      const fresh = createFreshBounty('objectTower');
      expect(fresh.name).toBe(BOUNTY_OBJECT_TOWER.name);
      expect(fresh.selectionMode).toBe(SelectionMode.AI_JUDGED);
      expect(fresh.id).not.toBe(BOUNTY_OBJECT_TOWER.id);
    });

    it('should allow overrides', () => {
      const fresh = createFreshBounty('mealPhoto', {
        rewardEth: '5.0',
      });
      expect(fresh.rewardEth).toBe('5.0');
      expect(fresh.name).toBe(BOUNTY_MEAL_PHOTO.name);
    });

    it('should generate unique IDs', () => {
      // Note: createFreshBounty uses Date.now() in ID, so needs slight delay for uniqueness
      const fresh1 = createFreshBounty('proveOutside');
      // Wait a bit to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 2) {} // Small delay
      const fresh2 = createFreshBounty('proveOutside');
      expect(fresh1.id).not.toBe(fresh2.id);
    });

    it('should create all templates freshly', () => {
      const templates: (keyof typeof PRODUCTION_BOUNTIES)[] = [
        'proveOutside',
        'handwrittenDate',
        'mealPhoto',
        'objectTower',
        'shadowArt',
        'animalPhoto',
      ];

      for (const template of templates) {
        const fresh = createFreshBounty(template);
        expect(fresh).toBeDefined();
        expect(fresh.name).toBeTruthy();
        // Deadline is in Unix seconds (not ms), should be in the future
        const nowInSeconds = Math.floor(Date.now() / 1000);
        expect(fresh.deadline).toBeGreaterThan(nowInSeconds);
      }
    });
  });

  describe('createRealWorldBounty', () => {
    it('should create custom bounty with all options', () => {
      const custom = createRealWorldBounty({
        name: 'Custom Bounty',
        description: 'A custom real-world bounty',
        requirements: 'Submit proof',
        rewardEth: '2.5',
        hoursUntilDeadline: 24,
        selectionMode: SelectionMode.FIRST_VALID,
        aiJudgingPrompt: 'Evaluate the submission',
      });

      expect(custom.name).toBe('Custom Bounty');
      expect(custom.description).toBe('A custom real-world bounty');
      expect(custom.rewardEth).toBe('2.5');
      expect(custom.selectionMode).toBe(SelectionMode.FIRST_VALID);
      expect(custom.proofType).toBe(ProofType.PHOTO);
      expect(custom.validation.aiValidationPrompt).toBe('Evaluate the submission');
    });

    it('should set deadline correctly', () => {
      const before = Math.floor(Date.now() / 1000);
      const custom = createRealWorldBounty({
        name: 'Test',
        description: 'Test',
        requirements: 'Test',
        rewardEth: '1.0',
        hoursUntilDeadline: 24,
        selectionMode: SelectionMode.AI_JUDGED,
        aiJudgingPrompt: 'Test prompt',
      });
      const after = Math.floor(Date.now() / 1000);

      // Deadline should be roughly 24 hours from now (in Unix seconds)
      const expectedMinDeadline = before + 23.9 * 60 * 60;
      const expectedMaxDeadline = after + 24.1 * 60 * 60;

      expect(custom.deadline).toBeGreaterThanOrEqual(expectedMinDeadline);
      expect(custom.deadline).toBeLessThanOrEqual(expectedMaxDeadline);
    });

    it('should generate unique UUID for custom bounty', () => {
      const custom1 = createRealWorldBounty({
        name: 'Test 1',
        description: 'Test',
        requirements: 'Test',
        rewardEth: '1.0',
        hoursUntilDeadline: 24,
        selectionMode: SelectionMode.FIRST_VALID,
        aiJudgingPrompt: 'Test',
      });

      const custom2 = createRealWorldBounty({
        name: 'Test 2',
        description: 'Test',
        requirements: 'Test',
        rewardEth: '1.0',
        hoursUntilDeadline: 24,
        selectionMode: SelectionMode.FIRST_VALID,
        aiJudgingPrompt: 'Test',
      });

      expect(custom1.id).not.toBe(custom2.id);
      expect(custom1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create AI-judged and first-valid modes', () => {
      const aiJudged = createRealWorldBounty({
        name: 'AI Test',
        description: 'AI-judged',
        requirements: 'Test',
        rewardEth: '1.0',
        hoursUntilDeadline: 48,
        selectionMode: SelectionMode.AI_JUDGED,
        aiJudgingPrompt: 'Rate this',
      });

      const firstValid = createRealWorldBounty({
        name: 'First Valid Test',
        description: 'First valid',
        requirements: 'Test',
        rewardEth: '0.01',
        hoursUntilDeadline: 6,
        selectionMode: SelectionMode.FIRST_VALID,
        aiJudgingPrompt: 'Not used',
      });

      expect(aiJudged.selectionMode).toBe(SelectionMode.AI_JUDGED);
      expect(firstValid.selectionMode).toBe(SelectionMode.FIRST_VALID);
    });
  });

  describe('Common properties across bounties', () => {
    it('should all be PHOTO proof type', () => {
      const allBounties = [
        BOUNTY_PROVE_OUTSIDE,
        BOUNTY_HANDWRITTEN_DATE,
        BOUNTY_MEAL_PHOTO,
        BOUNTY_OBJECT_TOWER,
        BOUNTY_SHADOW_ART,
        BOUNTY_ANIMAL_PHOTO,
      ];

      for (const bounty of allBounties) {
        expect(bounty.proofType).toBe(ProofType.PHOTO);
      }
    });

    it('should all have reward amounts', () => {
      const allBounties = [
        BOUNTY_PROVE_OUTSIDE,
        BOUNTY_HANDWRITTEN_DATE,
        BOUNTY_MEAL_PHOTO,
        BOUNTY_OBJECT_TOWER,
        BOUNTY_SHADOW_ART,
        BOUNTY_ANIMAL_PHOTO,
      ];

      for (const bounty of allBounties) {
        expect(bounty.rewardEth).toBeTruthy();
        expect(parseFloat(bounty.rewardEth)).toBeGreaterThan(0);
      }
    });

    it('should all have tags', () => {
      const allBounties = [
        BOUNTY_PROVE_OUTSIDE,
        BOUNTY_HANDWRITTEN_DATE,
        BOUNTY_MEAL_PHOTO,
        BOUNTY_OBJECT_TOWER,
        BOUNTY_SHADOW_ART,
        BOUNTY_ANIMAL_PHOTO,
      ];

      for (const bounty of allBounties) {
        expect(bounty.tags.length).toBeGreaterThan(0);
      }
    });
  });
});
