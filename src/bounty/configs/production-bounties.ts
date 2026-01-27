/**
 * Production-Ready Bounty Configurations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BountyConfig,
  SelectionMode,
  ProofType,
} from '../types';

// Helper: Create deadline X hours from now
function deadlineFromNow(hours: number): number {
  return Math.floor(Date.now() / 1000) + (hours * 3600);
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRST-VALID BOUNTIES
// ═══════════════════════════════════════════════════════════════════════════

export const BOUNTY_PROVE_OUTSIDE: BountyConfig = {
  id: 'prove-outside-' + uuidv4().slice(0, 8),
  name: 'Prove You\'re Outside Right Now',
  description: 'Take a photo proving you are currently outdoors.',
  requirements: 'Submit a fresh photo showing you are outdoors.',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.FIRST_VALID,
  rewardEth: '0.003',
  deadline: deadlineFromNow(24),
  validation: {
    requireExif: true,
    maxAgeMinutes: 30,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    aiValidationPrompt: 'Verify this photo shows an outdoor scene.',
  },
  tags: ['outdoor', 'quick', 'first-valid'],
};

export const BOUNTY_HANDWRITTEN_DATE: BountyConfig = {
  id: 'handwritten-date-' + uuidv4().slice(0, 8),
  name: 'Handwritten Note with Today\'s Date',
  description: 'Write today\'s date and "POIDH" on paper and photograph it.',
  requirements: 'Submit a photo of a handwritten note with today\'s date and "POIDH".',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.FIRST_VALID,
  rewardEth: '0.002',
  deadline: deadlineFromNow(24),
  validation: {
    requireExif: true,
    maxAgeMinutes: 60,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    requiredKeywords: ['poidh'],
    aiValidationPrompt: 'Verify this photo shows a handwritten note with today\'s date and "POIDH".',
  },
  tags: ['handwritten', 'verification', 'first-valid'],
};

export const BOUNTY_MEAL_PHOTO: BountyConfig = {
  id: 'meal-photo-' + uuidv4().slice(0, 8),
  name: 'Photo of Your Current Meal',
  description: 'Take a photo of a meal you are about to eat.',
  requirements: 'Submit a fresh photo of your current meal.',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.FIRST_VALID,
  rewardEth: '0.002',
  deadline: deadlineFromNow(12),
  validation: {
    requireExif: true,
    maxAgeMinutes: 30,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    aiValidationPrompt: 'Verify this photo shows a real meal/food.',
  },
  tags: ['food', 'lifestyle', 'first-valid'],
};

// ═══════════════════════════════════════════════════════════════════════════
// AI-JUDGED BOUNTIES
// ═══════════════════════════════════════════════════════════════════════════

export const BOUNTY_OBJECT_TOWER: BountyConfig = {
  id: 'object-tower-' + uuidv4().slice(0, 8),
  name: 'Most Creative Object Tower',
  description: 'Stack household objects into the most creative tower possible.',
  requirements: 'Build and photograph a tower made of stacked household objects.',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.AI_JUDGED,
  rewardEth: '0.005',
  deadline: deadlineFromNow(48),
  validation: {
    requireExif: true,
    maxAgeMinutes: 120,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    minAIConfidence: 70,
    aiValidationPrompt: 'Judge this object tower photo for creativity.',
  },
  tags: ['creative', 'objects', 'ai-judged'],
};

export const BOUNTY_SHADOW_ART: BountyConfig = {
  id: 'shadow-art-' + uuidv4().slice(0, 8),
  name: 'Most Creative Shadow Art',
  description: 'Create art using shadows!',
  requirements: 'Submit a photo featuring creative shadow art.',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.AI_JUDGED,
  rewardEth: '0.004',
  deadline: deadlineFromNow(48),
  validation: {
    requireExif: true,
    maxAgeMinutes: 120,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    minAIConfidence: 70,
    aiValidationPrompt: 'Judge this shadow art photo for creativity.',
  },
  tags: ['creative', 'shadow', 'art', 'ai-judged'],
};

export const BOUNTY_ANIMAL_PHOTO: BountyConfig = {
  id: 'animal-photo-' + uuidv4().slice(0, 8),
  name: 'Best Pet or Wildlife Photo',
  description: 'Submit your best photo of an animal.',
  requirements: 'Submit a photo of any animal.',
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.AI_JUDGED,
  rewardEth: '0.003',
  deadline: deadlineFromNow(72),
  validation: {
    requireExif: true,
    maxAgeMinutes: 1440,
    rejectScreenshots: true,
    rejectAIGenerated: true,
    minAIConfidence: 70,
    aiValidationPrompt: 'Judge this animal photo for quality.',
  },
  tags: ['animals', 'photography', 'ai-judged'],
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const PRODUCTION_BOUNTIES = {
  proveOutside: BOUNTY_PROVE_OUTSIDE,
  handwrittenDate: BOUNTY_HANDWRITTEN_DATE,
  mealPhoto: BOUNTY_MEAL_PHOTO,
  objectTower: BOUNTY_OBJECT_TOWER,
  shadowArt: BOUNTY_SHADOW_ART,
  animalPhoto: BOUNTY_ANIMAL_PHOTO,
};

export function createFreshBounty(
  base: BountyConfig,
  overrides?: Partial<BountyConfig>
): BountyConfig {
  return {
    ...base,
    id: base.id.split('-').slice(0, -1).join('-') + '-' + uuidv4().slice(0, 8),
    deadline: deadlineFromNow(24),
    ...overrides,
  };
}

