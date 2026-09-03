/**
 * Explicit family-audience overrides.
 * Do not auto-fill toddler/elementary from kids_meal.
 *
 * Sprint v1.1 #2 — elementary breakfast pilot.
 * Sprint v1.1 elementary Batch #1 expansion — recipe_0396–0407 (batch32).
 * Sprint v1.1 elementary Batch #3 expansion — recipe_0472–0483 (batch38).
 * Sprint v1.1 toddler #1 — toddler pilot overrides are merged from TODDLER_PILOT_OVERRIDES.
 * Sprint v1.1 baby #1 — baby pilot overrides are merged from BABY_PILOT_OVERRIDES
 * (recipe_0336–0371 after expansion + transition).
 * Home / AI recommendation still ignores this map for feed switching.
 */
import type { RecipeFamilyAudienceOverride } from './recipeFamilyAudienceTypes';
import { BABY_PILOT_OVERRIDES } from './babyPilotOverrides';
import { TODDLER_PILOT_OVERRIDES } from './toddlerPilotOverrides';

const ELEMENTARY_BREAKFAST_PILOT: RecipeFamilyAudienceOverride = {
  audiences: ['general', 'elementary'],
  reviewStatus: 'explicit',
};

export const RECIPE_FAMILY_AUDIENCE_OVERRIDES: Record<string, RecipeFamilyAudienceOverride> = {
  // Complete rice + egg breakfast, 10 min, mild, no child-feed collisions.
  '002': {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  // Common Korean kids egg dish; often eaten with rice. Not a grab-and-go plate.
  '019': {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  '059': {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  '060': {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  // Handheld toast/sandwich, breakfast, ≤10 min, mild — school-morning flag from slot+time+form only.
  recipe_0168: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0173: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0175: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0293: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0295: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },

  // Sprint v1.1 #3 — new elementary breakfast recipes.
  recipe_0305: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0306: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: false, pickyEatingFriendly: null },
  },
  recipe_0307: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0308: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: false, pickyEatingFriendly: null },
  },
  recipe_0309: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0310: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0311: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0312: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0313: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0314: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0315: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0316: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0317: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0318: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0319: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },

  // Sprint v1.1 elementary Batch #1 expansion — recipe_0396–0407.
  recipe_0396: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0397: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0398: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0399: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0400: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0401: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0402: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0403: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0404: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0405: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0406: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0407: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },

  // Sprint v1.1 elementary Batch #2 — recipe_0436–0447.
  recipe_0436: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0437: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0438: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0439: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0440: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0441: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0442: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0443: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0444: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0445: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0446: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0447: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },

  // Sprint v1.1 elementary Batch #3 expansion — recipe_0472–0483 (batch38).
  recipe_0472: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: false, pickyEatingFriendly: null },
  },
  recipe_0473: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0474: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0475: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0476: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0477: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0478: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0479: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: true, pickyEatingFriendly: null },
  },
  recipe_0480: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0481: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0482: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0483: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },

  // Sprint v1.1 elementary Batch #4 expansion — recipe_0500–0517 (batch40).
  recipe_0500: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0501: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0502: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0503: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0504: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0505: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0506: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0507: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0508: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0509: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0510: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0511: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0512: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0513: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0514: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0515: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0516: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },
  recipe_0517: {
    ...ELEMENTARY_BREAKFAST_PILOT,
    childMeal: { schoolMorningFriendly: null, pickyEatingFriendly: null },
  },

  ...TODDLER_PILOT_OVERRIDES,
  ...BABY_PILOT_OVERRIDES,
};
