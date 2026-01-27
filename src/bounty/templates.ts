import { BountyConfig, SelectionMode, ProofType } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bounty Templates
 *
 * Pre-configured bounty templates for common real-world proof scenarios.
 * These can be customized or used directly.
 */

/**
 * Create a bounty deadline from now + hours
 */
export function deadlineFromNow(hours: number): number {
  return Math.floor(Date.now() / 1000) + hours * 60 * 60;
}

/**
 * Template: Location Photo Bounty
 *
 * First person to submit a valid photo at a specific location wins.
 */
export function locationPhotoBounty(options: {
  name: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  rewardEth: string;
  hoursUntilDeadline?: number;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: options.description,
    requirements: `Take a photo at or near ${options.locationName}. Photo must contain visible GPS metadata or recognizable landmarks. First valid submission wins!`,
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: options.rewardEth,
    deadline: deadlineFromNow(options.hoursUntilDeadline || 24),
    validation: {
      location: {
        latitude: options.latitude,
        longitude: options.longitude,
        radiusMeters: options.radiusMeters || 500,
        description: options.locationName,
      },
    },
    tags: ['location', 'photo', 'real-world'],
  };
}

/**
 * Template: Physical Action Bounty
 *
 * Submit photo/video of yourself performing a specific action.
 * AI judges the best submission.
 */
export function physicalActionBounty(options: {
  name: string;
  action: string;
  requirements: string;
  aiJudgingCriteria: string;
  rewardEth: string;
  hoursUntilDeadline?: number;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: `Bounty: ${options.action}. AI will judge submissions based on creativity, execution, and compliance with requirements.`,
    requirements: options.requirements,
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: options.rewardEth,
    deadline: deadlineFromNow(options.hoursUntilDeadline || 48),
    validation: {
      aiValidationPrompt: options.aiJudgingCriteria,
    },
    tags: ['action', 'challenge', 'ai-judged'],
  };
}

/**
 * Template: Scavenger Hunt Item
 *
 * Find and photograph a specific item in the real world.
 */
export function scavengerHuntBounty(options: {
  name: string;
  itemToFind: string;
  hints: string;
  rewardEth: string;
  firstValidWins?: boolean;
  hoursUntilDeadline?: number;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: `Find and photograph: ${options.itemToFind}`,
    requirements: `Submit a photo clearly showing ${options.itemToFind}. ${options.hints}`,
    proofType: ProofType.PHOTO,
    selectionMode: options.firstValidWins
      ? SelectionMode.FIRST_VALID
      : SelectionMode.AI_JUDGED,
    rewardEth: options.rewardEth,
    deadline: deadlineFromNow(options.hoursUntilDeadline || 24),
    validation: {
      aiValidationPrompt: `Verify the image shows "${options.itemToFind}". Check that the photo appears authentic and not AI-generated. Look for: real-world lighting, natural imperfections, consistent perspective.`,
    },
    tags: ['scavenger-hunt', 'find', 'photo'],
  };
}

/**
 * Template: Time-Sensitive Challenge
 *
 * Complete an action within a specific time window.
 */
export function timedChallengeBounty(options: {
  name: string;
  challenge: string;
  requirements: string;
  startTime: Date;
  endTime: Date;
  rewardEth: string;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: options.challenge,
    requirements: `${options.requirements}\n\nSubmission window: ${options.startTime.toISOString()} to ${options.endTime.toISOString()}`,
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: options.rewardEth,
    deadline: Math.floor(options.endTime.getTime() / 1000),
    validation: {
      timeWindow: {
        startTimestamp: Math.floor(options.startTime.getTime() / 1000),
        endTimestamp: Math.floor(options.endTime.getTime() / 1000),
      },
    },
    tags: ['timed', 'challenge', 'window'],
  };
}

/**
 * Template: Creative Expression Bounty
 *
 * AI judges the most creative submission.
 */
export function creativeChallengeBounty(options: {
  name: string;
  theme: string;
  requirements: string;
  rewardEth: string;
  hoursUntilDeadline?: number;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: `Creative challenge: ${options.theme}. The most creative, original submission (judged by AI) wins!`,
    requirements: options.requirements,
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: options.rewardEth,
    deadline: deadlineFromNow(options.hoursUntilDeadline || 72),
    validation: {
      aiValidationPrompt: `Judge this submission for the "${options.theme}" challenge. Rate on: 1) Creativity (0-40), 2) Execution quality (0-30), 3) Adherence to theme (0-30). Provide detailed reasoning. Detect and reject AI-generated images.`,
    },
    tags: ['creative', 'art', 'ai-judged'],
  };
}

// ===========================================
// DEMO BOUNTY CONFIGURATIONS
// ===========================================

/**
 * Demo Bounty 1: First Valid Submission
 *
 * Simple bounty - first person to submit a valid photo of a handwritten
 * note with today's date wins.
 */
export const DEMO_FIRST_VALID_BOUNTY: BountyConfig = {
  id: 'demo-first-valid-001',
  name: '📝 Handwritten Date Challenge',
  description:
    'Take a photo of a handwritten note showing today\'s date. First valid submission wins!',
  requirements: `
Submit a photo showing:
1. A handwritten note on paper
2. Today's date clearly written (any format: MM/DD/YYYY, DD-MM-YYYY, etc.)
3. The word "POIDH" written somewhere on the note

The note must be clearly legible and the date must match today's date.
First valid submission wins automatically!
  `.trim(),
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.FIRST_VALID,
  rewardEth: '0.001', // Small amount for demo
  deadline: deadlineFromNow(24),
  validation: {
    aiValidationPrompt: `
Verify this image shows a handwritten note with:
1. A clearly visible, handwritten date that matches today
2. The word "POIDH" written on the note
3. This appears to be a real photo (not AI-generated)

If ALL criteria are met, the submission is VALID.
    `.trim(),
  },
  tags: ['demo', 'first-valid', 'handwritten'],
};

/**
 * Demo Bounty 2: AI Judged (Best Submission)
 *
 * AI evaluates all submissions and picks the most creative one.
 */
export const DEMO_AI_JUDGED_BOUNTY: BountyConfig = {
  id: 'demo-ai-judged-001',
  name: '🎨 Creative Object Stack Challenge',
  description:
    'Create and photograph the most creative stack of everyday objects. AI judges the winner!',
  requirements: `
Create a tower or stack using everyday objects you can find around you.
Your stack should be:
1. At least 5 different objects
2. Physically balanced (standing on its own)
3. Creative and interesting

Submit a clear photo of your creation. After the deadline, AI will judge
all submissions and select the most creative and well-executed stack!

Judging criteria:
- Creativity & uniqueness (40%)
- Technical execution (30%)
- Variety of objects used (30%)
  `.trim(),
  proofType: ProofType.PHOTO,
  selectionMode: SelectionMode.AI_JUDGED,
  rewardEth: '0.002', // Slightly higher for competitive bounty
  deadline: deadlineFromNow(48),
  validation: {
    aiValidationPrompt: `
Evaluate this submission for the "Creative Object Stack" bounty.

Score on three criteria (total 100 points):
1. CREATIVITY (0-40): How unique, unexpected, or artistic is this stack?
2. EXECUTION (0-30): Is it well-balanced, stable-looking, and well-photographed?
3. VARIETY (0-30): Are there at least 5 different, recognizable everyday objects?

Deduct points if:
- The image appears AI-generated (auto-fail, score 0)
- Objects are digitally edited or manipulated
- Stack is clearly staged/fake (photoshopped)

Provide:
- Score for each criterion
- Total score
- Whether this is a VALID submission (meets basic requirements)
- Detailed reasoning for your judgment
    `.trim(),
  },
  tags: ['demo', 'ai-judged', 'creative', 'challenge'],
};
