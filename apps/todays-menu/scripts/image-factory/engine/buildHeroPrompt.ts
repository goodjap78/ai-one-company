/**
 * Official HANKKI Hero Image Style v1.1 — shared Gemini generation prompt.
 * Portable — no app imports.
 *
 * Source of truth for every future hero image (IMG engine + prompt library).
 * Do not change crop/food-size/composition rules without bumping the version.
 */
import type { ImageGenerateRequest } from './types';
import { DEFAULT_HERO_SPEC } from './types';

/** Official style label — bump when shared constraints change. */
export const HANKKI_HERO_STYLE_VERSION = 'v1.3' as const;

/**
 * Crop-safe composition — single asset reused across hero / card / thumbnail.
 */
export const CROP_SAFE_FOOD_RULE = [
  'primary food subject near image center',
  'important food area inside center 60–70% safe-zone',
  'do not place primary dish near image edges',
  'asset must survive landscape hero crop and card/thumbnail crop',
  'plated dishes prefer centered composition',
  'top-down or 70–90 degree high-angle when it improves crop safety',
  'prioritize food visibility over empty background within safe-zone',
] as const;

/**
 * Official shared shot requirements (Composition · Lighting · Styling · Never).
 * Applied to every Gemini hero generate call.
 */
export const HERO_SHOT_REQUIREMENTS = [
  // Composition — official mobile hero crop
  'main dish occupies 88–92% of the frame',
  'tight mobile-app crop',
  'main dish is the only visual focus',
  'very little or no empty table space',
  'maximum one very small side dish',
  'camera close to the food',
  'dish centered and fully visible',
  'designed for a small mobile hero card',
  'horizontal 16:9 app-friendly composition',
  // CROP_SAFE_FOOD_RULE
  ...CROP_SAFE_FOOD_RULE,
  // Home hero focal safe-area (see constants/homeHeroDisplay.ts)
  'food visual center at 42–48% vertical height from top',
  'approximately 8% top margin and 12% bottom margin',
  'keep main dish mass above bottom 12% — bottom reserved for mascot overlay',
  'minimize plate or bowl cropping at frame edges',
  'no tiny food with excessive empty margins',
  // Lighting — official standard v1.1 (do not darken)
  'bright soft natural daylight',
  'bright and airy exposure',
  'high-key food photography',
  'warm and clean lighting',
  'lift shadows slightly',
  'food should look fresh and vibrant',
  'optimized for mobile screens',
  'avoid dark restaurant mood',
  'avoid underexposure',
  'preserve realistic colors',
  'avoid washed-out whites',
  // Food styling
  'restaurant-quality Korean food',
  'ultra realistic Korean food photography',
  'steam naturally visible',
  'light wooden table',
  'one bowl of rice allowed',
  // Never include
  'no people',
  'no hands',
  'no chopsticks',
  'no text',
  'no logo',
  'no watermark',
  'no decorative clutter',
  'avoid glossy 3D or obvious AI appearance',
] as const;

export function buildHeroGenerationPrompt(input: {
  recipeName: string;
  heroImageKey: string;
  /** Optional prompt body from .md file (stripped of markdown). */
  promptBody?: string;
  /** Optional regeneration feedback lines appended to the Gemini prompt. */
  feedbackAppend?: string;
}): string {
  const shotBlock =
    `HANKKI Official Hero Style ${HANKKI_HERO_STYLE_VERSION}. ` +
    `Shot requirements: ${HERO_SHOT_REQUIREMENTS.join('; ')}.`;

  const parts: string[] = [];
  if (input.promptBody?.trim()) {
    parts.push(input.promptBody.trim(), shotBlock);
  } else {
    parts.push(
      `Ultra realistic close-up food photograph of ${input.recipeName} (${input.heroImageKey}).`,
      'Finished dish fills most of the frame — restaurant-quality Korean food, main dish as the clear visual focus.',
      shotBlock,
      'Food must look real, fresh, and edible — not glossy 3D or synthetic AI art.',
    );
  }
  if (input.feedbackAppend?.trim()) {
    parts.push(`Regeneration feedback directives: ${input.feedbackAppend.trim()}`);
  }
  return parts.join('\n');
}

export function buildHeroGenerateRequest(input: {
  recipeName: string;
  heroImageKey: string;
  promptBody?: string;
  feedbackAppend?: string;
}): ImageGenerateRequest {
  return {
    assetKey: input.heroImageKey,
    subject: input.recipeName,
    prompt: buildHeroGenerationPrompt(input),
    width: DEFAULT_HERO_SPEC.width,
    height: DEFAULT_HERO_SPEC.height,
    format: DEFAULT_HERO_SPEC.format,
  };
}
