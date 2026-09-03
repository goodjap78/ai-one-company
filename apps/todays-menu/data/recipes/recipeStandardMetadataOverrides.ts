/**
 * Sprint 25 — Per-recipe manual metadata overrides (only when auto-derivation is wrong or ambiguous).
 * Prefer deriveRecipeStandardMetadata; add entries here sparingly with evidence from recipe content.
 */
import type { RecipeStandardMetadataOverride } from './recipeStandardMetadataTypes';

export const RECIPE_STANDARD_METADATA_OVERRIDES: Record<string, RecipeStandardMetadataOverride> = {
  /** Category is 외식/간편식 but menu is Japanese tonkatsu. */
  '009': {
    cuisine: 'japanese',
    dishType: 'fried',
    reviewNeeded: false,
    reviewNotes: [],
  },
  /** kidFriendly + spicyLevel 2 conflict flagged in derive; remove kids_meal for safety. */
  '044': {
    cuisine: 'snack',
    situationTags: ['drinking_snack', 'comfort_food', 'cold_day', 'solo_meal'],
    reviewNeeded: true,
    appendReviewNotes: true,
    reviewNotes: [
      'BLOCKER fix: removed kids_meal tag from spicy menu',
      'Manual flag: kidFriendly with spicyLevel 2 — verify kids_meal suitability',
    ],
  },
  /**
   * 로제떡볶이: mild aiTag triggers kidFriendly but this is a late-night snack, not kids_meal.
   * Critical Recipe Correction kept rose sauce fix; kids_meal is explicitly excluded.
   */
  '061': {
    situationTags: ['drinking_snack', 'comfort_food'],
    reviewNeeded: true,
    appendReviewNotes: true,
    reviewNotes: [
      'Critical correction: mild aiTag must not imply kids_meal for late_night snack',
    ],
  },
};
