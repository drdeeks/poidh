/**
 * PRODUCTION BOUNTY CONFIGURATIONS
 *
 * Ready-to-run bounty configs designed for real-world proof tasks.
 * These bounties require genuine physical actions that cannot be faked.
 *
 * All bounties are designed to:
 * - Require IRL (in real life) actions
 * - Be verifiable through photo/video evidence
 * - Have clear, deterministic or AI-driven selection criteria
 * - Be completable by strangers on poidh (not by the bot operator)
 */

import { BountyConfig, SelectionMode, ProofType, ValidationCriteria } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper: Calculate deadline from now
 * IMPORTANT: This is called at runtime, not module load time
 */
function freshDeadline(hours: number): number {
  return Math.floor(Date.now() / 1000) + (hours * 60 * 60);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOUNTY TEMPLATE FACTORIES (create fresh configs at runtime)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PRODUCTION BOUNTY: Prove You're Outside Right Now
 */
function createProveOutsideBounty(): BountyConfig {
  return {
    id: `prove-outside-${Date.now()}`,
    name: '🌳 Prove You\'re Outside Right Now',
    description: `Take a photo proving you're currently outdoors. First valid submission wins!`,
    requirements: `
Submit a photo that clearly shows:
1. You are OUTDOORS (visible sky, natural lighting, outdoor environment)
2. Current conditions (weather, time of day must match)
3. Photo must be taken FRESH - within the last 15 minutes

Requirements:
✅ Photo must have valid EXIF timestamp from the last 15 minutes
✅ Must show visible sky or horizon
✅ Must show ground/surface (grass, pavement, sand, etc.)
✅ Natural outdoor lighting required
✅ No screenshots, no indoor photos, no AI-generated images

First valid submission wins automatically!
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.003',
    deadline: freshDeadline(6),
    validation: {
      requireExif: true,
      maxAgeMinutes: 15,
      aiValidationPrompt: `
Analyze this photo to verify it's a genuine outdoor photo taken recently:

REQUIRED CHECKS:
1. OUTDOOR VERIFICATION: Is this clearly outdoors? Look for:
   - Visible sky or natural horizon
   - Natural outdoor lighting (sunlight, overcast, etc.)
   - Outdoor surfaces (ground, pavement, grass, etc.)
   - Environment consistent with being outside

2. AUTHENTICITY CHECK:
   - Does this appear to be a real photo (not AI-generated)?
   - Is this a photo OF a screen/monitor (screenshot)?
   - Are there signs of manipulation or editing?
   - Does lighting look natural and consistent?

3. FRESHNESS INDICATORS:
   - Does the lighting/weather appear current?
   - Any time-indicating elements (shadows, sun position)?

PASS if ALL conditions are met:
- Clearly outdoors with visible sky/horizon
- Real photo (not AI-generated or screenshot)
- Natural lighting and environment
- No obvious signs of manipulation

FAIL if ANY of these:
- Indoor photo or through a window
- AI-generated image (look for: unnatural smoothness, weird hands/text, impossible geometry)
- Screenshot of another image
- Heavy editing or manipulation
- No clear outdoor indicators
      `.trim(),
    },
    tags: ['outdoor', 'photo', 'first-valid', 'quick', 'real-world'],
  };
}

/**
 * PRODUCTION BOUNTY: Handwritten Note with Today's Date
 */
function createHandwrittenDateBounty(): BountyConfig {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  return {
    id: `handwritten-date-${Date.now()}`,
    name: '📝 Handwritten Date Challenge',
    description: `Write today's date and a secret word by hand. First valid photo wins!`,
    requirements: `
Write the following BY HAND on a piece of paper:
1. Today's date in format: ${today}
2. The word "POIDH" (must be clearly visible)
3. A small drawing of a star ⭐

Then photograph the note clearly.

Requirements:
✅ Must be handwritten (not printed or typed)
✅ Date must match TODAY's date exactly
✅ Word "POIDH" must be clearly legible
✅ Star drawing must be visible
✅ Photo must be clear and readable
✅ No digital editing or overlay

First submission with all elements clearly visible wins!
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.002',
    deadline: freshDeadline(24),
    validation: {
      requireExif: true,
      maxAgeMinutes: 60,
      requiredKeywords: ['poidh'],
      aiValidationPrompt: `
Verify this image shows a handwritten note with the required elements:

REQUIRED ELEMENTS (ALL must be present):
1. TODAY'S DATE: Must show "${today}" or equivalent format
2. THE WORD "POIDH": Must be clearly written and legible
3. A STAR DRAWING: Simple hand-drawn star shape

VERIFICATION CHECKS:
- Is this genuinely HANDWRITTEN? (Look for natural pen strokes, slight imperfections)
- Is the date CORRECT for today?
- Is "POIDH" clearly readable?
- Is there a star drawing (even simple)?
- Is this a real photo (not digitally created)?

PASS ONLY IF:
- All three elements are present and visible
- Writing appears genuinely handwritten
- Photo is clear enough to read
- No digital manipulation detected

FAIL IF:
- Any required element is missing
- Text appears printed/typed
- Wrong date
- AI-generated image
- Heavy digital editing
      `.trim(),
    },
    tags: ['handwritten', 'date', 'first-valid', 'verification', 'real-world'],
  };
}

/**
 * PRODUCTION BOUNTY: Show Your Meal
 */
function createMealPhotoBounty(): BountyConfig {
  return {
    id: `meal-photo-${Date.now()}`,
    name: '🍽️ Show Your Current Meal',
    description: `Photograph a meal you're eating RIGHT NOW. First valid submission wins!`,
    requirements: `
Take a photo of a meal you are currently eating (or about to eat).

Requirements:
✅ Must be REAL FOOD on a plate, bowl, or container
✅ Photo must be taken within the last 30 minutes
✅ Must appear to be a genuine meal setting (table, desk, etc.)
✅ Food must be clearly visible (not blurry)
✅ No restaurant menu photos or stock images
✅ No obviously old/leftover food

This is a "first valid wins" bounty - speed matters!
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.FIRST_VALID,
    rewardEth: '0.002',
    deadline: freshDeadline(4),
    validation: {
      requireExif: true,
      maxAgeMinutes: 30,
      aiValidationPrompt: `
Verify this is a genuine photo of a real meal being eaten now:

CHECK FOR:
1. REAL FOOD: Actual food items on a plate/bowl/container
2. FRESH SETTING: Appears to be actively being eaten (utensils, napkins, drinks nearby)
3. AUTHENTIC PHOTO: Real photograph, not from internet/menu/stock
4. RECENT: Nothing indicating this is an old photo

PASS IF:
- Shows real, identifiable food
- Setting looks like genuine meal time
- Photo appears authentic and recently taken
- Not a screenshot or stock image

FAIL IF:
- Food appears fake/plastic/artificial
- Clearly a restaurant menu or advertisement
- Stock photo or professional food photography
- AI-generated image
- Screenshot from social media
      `.trim(),
    },
    tags: ['food', 'meal', 'first-valid', 'quick', 'real-world'],
  };
}

/**
 * PRODUCTION BOUNTY: Creative Object Tower
 */
function createObjectTowerBounty(): BountyConfig {
  return {
    id: `object-tower-${Date.now()}`,
    name: '🗼 Creative Object Tower Challenge',
    description: `Build and photograph the most creative tower/stack of everyday objects. AI judges the winner!`,
    requirements: `
Create a tower or balanced stack using everyday objects you can find around you.

Your submission will be judged on:
🎨 CREATIVITY (35%): How unique and unexpected is your tower?
🏗️ ENGINEERING (25%): Is it well-balanced and structurally interesting?
📸 PRESENTATION (25%): Photo quality and composition
🔢 COMPLEXITY (15%): Number and variety of objects used (minimum 5)

Rules:
✅ Must use at least 5 different objects
✅ Tower must be freestanding (not held up)
✅ Real physical objects only
✅ Photo must clearly show the full tower
✅ No digital editing or CGI

After the deadline, AI will evaluate all submissions and select the winner!
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: '0.005',
    deadline: freshDeadline(48),
    validation: {
      requireExif: true,
      maxAgeMinutes: 2880,
      aiValidationPrompt: `
Judge this "Creative Object Tower" submission on a 100-point scale:

SCORING CRITERIA:

1. CREATIVITY (0-35 points):
   - How unique/unexpected is this tower design?
   - Are objects used in clever or surprising ways?
   - Does it show imagination and originality?

2. ENGINEERING (0-25 points):
   - Does the tower appear stable and well-balanced?
   - Is there interesting structural design?
   - How challenging was this to build?

3. PRESENTATION (0-25 points):
   - Is the photo clear and well-composed?
   - Can you see the full tower clearly?
   - Good lighting and background?

4. COMPLEXITY (0-15 points):
   - How many distinct objects are used? (5+ required)
   - Variety of object types?
   - Impressive height or size?

AUTOMATIC DISQUALIFICATION (score = 0):
- Fewer than 5 objects
- AI-generated image
- Digital manipulation/CGI
- Objects clearly held up/suspended
- Screenshot or stolen image

Provide:
- Score for each category
- Total score (0-100)
- Whether submission is VALID (meets basic requirements)
- Detailed reasoning for your judgment
      `.trim(),
    },
    tags: ['creative', 'building', 'ai-judged', 'competition', 'real-world'],
  };
}

/**
 * PRODUCTION BOUNTY: Most Creative Shadow Photo
 */
function createShadowArtBounty(): BountyConfig {
  return {
    id: `shadow-art-${Date.now()}`,
    name: '🌗 Creative Shadow Photography',
    description: `Capture the most creative shadow photo. Use sunlight to create art!`,
    requirements: `
Create an artistic photograph featuring interesting shadows.

Ideas:
- Use objects to cast creative shadow shapes
- Play with shadow and light contrast
- Create shadow art or patterns
- Capture naturally occurring interesting shadows

Judging criteria:
🎨 CREATIVITY (40%): Originality and artistic vision
📸 TECHNICAL (30%): Composition, lighting, photo quality
💡 CONCEPT (30%): Interesting idea or story behind the shadow

Rules:
✅ Must feature shadows prominently (sunlight or artificial light)
✅ Must be a real photograph (no digital shadows added)
✅ No heavy editing beyond basic adjustments
✅ Must be original work taken for this bounty
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: '0.004',
    deadline: freshDeadline(72),
    validation: {
      requireExif: true,
      maxAgeMinutes: 4320,
      aiValidationPrompt: `
Judge this shadow photography submission:

SCORING (100 points total):

1. CREATIVITY (0-40 points):
   - How original is this shadow concept?
   - Does it show artistic vision?
   - Is it visually striking or thought-provoking?

2. TECHNICAL EXECUTION (0-30 points):
   - Photo quality and sharpness
   - Good use of light and contrast
   - Composition and framing

3. CONCEPT/STORY (0-30 points):
   - Is there an interesting idea behind this?
   - Does the shadow create meaning or emotion?
   - Overall artistic impact

VALID submission must have:
- Shadows as a prominent visual element
- Real photograph (not digitally created shadows)
- Clear enough to appreciate the artistic intent

INVALID if:
- No significant shadow element
- AI-generated image
- Shadows added digitally
- Extremely low quality/blurry
      `.trim(),
    },
    tags: ['creative', 'photography', 'shadows', 'ai-judged', 'art', 'real-world'],
  };
}

/**
 * PRODUCTION BOUNTY: Pet or Animal Photo
 */
function createAnimalPhotoBounty(): BountyConfig {
  return {
    id: `animal-photo-${Date.now()}`,
    name: '🐾 Best Animal Photo',
    description: `Photograph any animal - pet, wildlife, or farm animal. Most interesting wins!`,
    requirements: `
Take a photo of any real animal - could be:
- Your pet (dog, cat, bird, fish, etc.)
- Wildlife (birds, squirrels, insects, etc.)
- Farm animals
- Any living creature!

Judging criteria:
📸 PHOTO QUALITY (30%): Clear, well-composed shot
🐾 SUBJECT (30%): Interesting animal or pose
🎨 CREATIVITY (25%): Unique angle or moment captured
❤️ APPEAL (15%): Overall charm and interest

Rules:
✅ Must be a REAL animal (not a toy, statue, or image)
✅ Photo must be taken for this bounty (fresh)
✅ Animal must be clearly visible
✅ No animal cruelty or distressing images
    `.trim(),
    proofType: ProofType.PHOTO,
    selectionMode: SelectionMode.AI_JUDGED,
    rewardEth: '0.003',
    deadline: freshDeadline(48),
    validation: {
      requireExif: true,
      maxAgeMinutes: 2880,
      aiValidationPrompt: `
Judge this animal photo submission:

SCORING (100 points total):

1. PHOTO QUALITY (0-30 points):
   - Is the image clear and in focus?
   - Good lighting and composition?
   - Animal clearly visible?

2. SUBJECT (0-30 points):
   - Is this a real, living animal?
   - Interesting species or individual?
   - Good capture of the animal?

3. CREATIVITY (0-25 points):
   - Interesting angle or perspective?
   - Unique moment captured?
   - Artistic merit?

4. APPEAL (0-15 points):
   - Overall charm of the photo
   - Would people enjoy looking at this?
   - Emotional connection?

MUST VERIFY:
- This is a REAL animal (not a toy/statue/plushie)
- This appears to be an original photo
- No signs of AI generation

INVALID if:
- No real animal visible
- AI-generated image
- Toy/statue/fake animal
- Screenshot from internet
- Animal appears distressed (auto-fail)
      `.trim(),
    },
    tags: ['animals', 'pets', 'photography', 'ai-judged', 'real-world'],
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT: Production bounty getters (always return fresh configs)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All production bounty configs - FACTORY FUNCTIONS for fresh configs
 * Each call creates a new config with current timestamp and deadline
 */
export const PRODUCTION_BOUNTIES = {
  // First-valid (quick, competitive)
  proveOutside: createProveOutsideBounty(),
  handwrittenDate: createHandwrittenDateBounty(),
  mealPhoto: createMealPhotoBounty(),

  // AI-judged (creative, longer deadline)
  objectTower: createObjectTowerBounty(),
  shadowArt: createShadowArtBounty(),
  animalPhoto: createAnimalPhotoBounty(),
};

/**
 * Get a fresh bounty config - ALWAYS call this for production use!
 * This ensures deadlines are calculated at runtime, not module load time.
 */
export function createFreshBounty(
  bountyType: keyof typeof PRODUCTION_BOUNTIES,
  overrides?: Partial<BountyConfig>
): BountyConfig {
  // Get factory function based on bounty type
  const factories: Record<string, () => BountyConfig> = {
    proveOutside: createProveOutsideBounty,
    handwrittenDate: createHandwrittenDateBounty,
    mealPhoto: createMealPhotoBounty,
    objectTower: createObjectTowerBounty,
    shadowArt: createShadowArtBounty,
    animalPhoto: createAnimalPhotoBounty,
  };

  const factory = factories[bountyType];
  if (!factory) {
    throw new Error(`Unknown bounty type: ${bountyType}`);
  }

  // Create fresh config
  const fresh = factory();

  // Apply overrides
  return {
    ...fresh,
    ...overrides,
  };
}

/**
 * Create a custom real-world bounty
 */
export function createRealWorldBounty(options: {
  name: string;
  description: string;
  requirements: string;
  rewardEth: string;
  hoursUntilDeadline: number;
  selectionMode: SelectionMode;
  aiJudgingPrompt: string;
}): BountyConfig {
  return {
    id: uuidv4(),
    name: options.name,
    description: options.description,
    requirements: options.requirements,
    proofType: ProofType.PHOTO,
    selectionMode: options.selectionMode,
    rewardEth: options.rewardEth,
    deadline: freshDeadline(options.hoursUntilDeadline),
    validation: {
      requireExif: true,
      maxAgeMinutes: options.hoursUntilDeadline * 60,
      aiValidationPrompt: options.aiJudgingPrompt,
    },
    tags: ['custom', 'real-world'],
  };
}

