import type { MenuItem } from '../../types/recommendation';
import type { RecommendationContext } from '../../types/preference';
import {
  resolveMealHealthTraits,
} from './analyzeHealthMemory';
import type { HealthMemoryScoreResult, HealthPatternTag } from './healthMemoryTypes';

/** Gentle HMIE influence — does not override weather or Food Memory. */
export const HEALTH_HEAVY_PENALTY = -10;
export const HEALTH_BALANCE_BONUS = 12;
export const HEALTH_MEMORY_WEIGHT = 0.65;

type PatternRule = {
  heavy: HealthPatternTag;
  matchesHeavy: (traits: ReturnType<typeof resolveMealHealthTraits>) => boolean;
  balances: (traits: ReturnType<typeof resolveMealHealthTraits>) => boolean;
  balanceNote: string;
  heavyNote: string;
};

const PATTERN_RULES: PatternRule[] = [
  {
    heavy: 'recent_meat_heavy',
    matchesHeavy: (t) => t.isMeat,
    balances: (t) => t.isLight || t.hasVegetable || (!t.isMeat && !t.isFried),
    balanceNote: 'health_meat_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_noodle_heavy',
    matchesHeavy: (t) => t.isNoodle,
    balances: (t) => !t.isNoodle && (t.hasVegetable || t.isLight || t.hasProtein),
    balanceNote: 'health_noodle_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_soup_heavy',
    matchesHeavy: (t) => t.isSoup,
    balances: (t) => !t.isSoup && (t.hasVegetable || !t.isFried),
    balanceNote: 'health_soup_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_fried_heavy',
    matchesHeavy: (t) => t.isFried,
    balances: (t) => t.isLight || t.hasVegetable || (!t.isFried && !t.isMeat),
    balanceNote: 'health_fried_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_spicy_heavy',
    matchesHeavy: (t) => t.isSpicy,
    balances: (t) => !t.isSpicy && (t.isLight || t.hasVegetable),
    balanceNote: 'health_spicy_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_low_vegetable',
    matchesHeavy: () => false,
    balances: (t) => t.hasVegetable || t.isLight,
    balanceNote: 'health_vegetable_balance',
    heavyNote: 'health_heavy_repeat',
  },
  {
    heavy: 'recent_low_protein',
    matchesHeavy: () => false,
    balances: (t) => t.hasProtein && !t.isFried,
    balanceNote: 'health_protein_balance',
    heavyNote: 'health_heavy_repeat',
  },
];

/**
 * Sprint 40 — gentle health-balance scoring from recent meal patterns.
 * No medical claims; category + Meal DNA only.
 */
export function scoreHealthMemory(
  menu: MenuItem,
  context?: RecommendationContext,
): HealthMemoryScoreResult {
  const snapshot = context?.healthMemory;
  if (!snapshot || snapshot.analysis.mealCount === 0) {
    return { rawDelta: 0, notes: [] };
  }

  const activeTags = new Set(snapshot.analysis.tags);
  if (activeTags.size === 0) {
    return { rawDelta: 0, notes: [] };
  }

  const traits = resolveMealHealthTraits(menu, menu.id);
  const notes: string[] = [];
  let rawDelta = 0;
  let balanceHit = false;

  for (const rule of PATTERN_RULES) {
    if (!activeTags.has(rule.heavy)) continue;

    if (rule.matchesHeavy(traits)) {
      rawDelta += HEALTH_HEAVY_PENALTY;
      if (!notes.includes(rule.heavyNote)) notes.push(rule.heavyNote);
      continue;
    }

    if (rule.balances(traits)) {
      rawDelta += HEALTH_BALANCE_BONUS;
      if (!notes.includes(rule.balanceNote)) {
        notes.push(rule.balanceNote);
        balanceHit = true;
      }
    }
  }

  if (balanceHit && !notes.includes('health_general_balance')) {
    notes.push('health_general_balance');
  }

  const weightedDelta = Math.round(rawDelta * HEALTH_MEMORY_WEIGHT);

  return {
    rawDelta: weightedDelta,
    notes: weightedDelta !== 0 || notes.length > 0 ? notes : [],
  };
}
