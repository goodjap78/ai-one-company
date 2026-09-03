/**
 * Locked image specs for child recipe hero / card / step production.
 * Generation and optimization sprints must follow these constants.
 * Do not invent alternate pixel sizes without an architecture update.
 */

/** Source hero asset for Home + Recipe Detail + feed cards (reuse, no separate thumb). */
export const CHILD_HERO_IMAGE_SPEC = {
  width: 1344,
  height: 768,
  aspectRatio: 16 / 9,
  format: 'jpg' as const,
  displayAspectRatio: 1.6,
} as const;

/**
 * Card/feed thumbnails reuse the hero file at runtime.
 * Do not create a separate thumbnail asset pipeline.
 */
export const CHILD_CARD_IMAGE_SPEC = {
  source: 'hero_reuse' as const,
  separateAsset: false,
} as const;

/** Optional step illustration slots (max 3 per recipe). */
export const CHILD_STEP_IMAGE_SPEC = {
  width: 1024,
  height: 1024,
  aspectRatio: 1,
  format: 'jpg' as const,
  maxSlotsPerRecipe: 3,
  selectionOrder: ['prep', 'core_cook', 'finish_texture'] as const,
} as const;
