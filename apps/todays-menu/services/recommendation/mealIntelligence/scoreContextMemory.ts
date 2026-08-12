import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { ContextMemorySnapshot } from '../../../types/contextMemory';
import {
  classifyMealArchetypes,
  getPrimaryArchetype,
} from './mealProfile';

export const CONTEXT_BONUS = 10;
export const CONTEXT_PENALTY = -6;
export const CONTEXT_COMBO_BONUS = 5;
export const CONTEXT_MEMORY_WEIGHT = 0.55;

export type ContextMemoryScoreResult = {
  rawDelta: number;
  notes: string[];
};

function emptyResult(): ContextMemoryScoreResult {
  return { rawDelta: 0, notes: [] };
}

function apply(delta: number, notes: string[]): ContextMemoryScoreResult {
  if (delta === 0 && notes.length === 0) return emptyResult();
  const weighted = Math.round(delta * CONTEXT_MEMORY_WEIGHT);
  return { rawDelta: weighted, notes };
}

function hasSituationTag(menu: MenuItem, tag: string): boolean {
  return menu.situationTags?.includes(tag as never) ?? false;
}

function hasPurpose(menu: MenuItem, purpose: string): boolean {
  return menu.mealPurpose?.includes(purpose as never) ?? false;
}

function isEasyMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return (
    menu.cookTime <= 20 ||
    menu.difficulty === 'easy' ||
    archetypes.includes('simple') ||
    hasPurpose(menu, 'quick')
  );
}

function isFamilyMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return (
    archetypes.includes('family') ||
    archetypes.includes('grill') ||
    archetypes.includes('bbq') ||
    archetypes.includes('stew') ||
    hasSituationTag(menu, 'family')
  );
}

function isDateMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return (
    archetypes.includes('special') ||
    hasSituationTag(menu, 'couple')
  );
}

function isWarmMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return archetypes.includes('soup') || archetypes.includes('stew') || archetypes.includes('hotpot');
}

function isRefreshingMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return (
    archetypes.includes('cold_meal') ||
    archetypes.includes('salad') ||
    getPrimaryArchetype(menu) === 'rice' && menu.title.includes('비빔')
  );
}

function isLightMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  const dna = menu.mealDna;
  return (
    archetypes.includes('salad') ||
    archetypes.includes('cold_meal') ||
    dna?.health === 'light' ||
    hasPurpose(menu, 'healthy') ||
    hasPurpose(menu, 'diet')
  );
}

function isFillingMeal(menu: MenuItem): boolean {
  const archetypes = classifyMealArchetypes(menu);
  return (
    archetypes.includes('stew') ||
    archetypes.includes('grill') ||
    archetypes.includes('rice') ||
    archetypes.includes('bbq') ||
    hasPurpose(menu, 'comfort') ||
    hasPurpose(menu, 'muscle')
  );
}

function scoreDining(
  menu: MenuItem,
  dining: ContextMemorySnapshot['diningSituation'],
): ContextMemoryScoreResult {
  if (!dining) return emptyResult();

  let delta = 0;
  const notes: string[] = [];

  switch (dining) {
    case 'alone':
      if (isEasyMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_alone_easy');
      }
      if (isFamilyMeal(menu) && menu.cookTime > 40) {
        delta += CONTEXT_PENALTY;
        notes.push('context_alone_heavy');
      }
      break;
    case 'family':
      if (isFamilyMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_family_meal');
      }
      break;
    case 'partner':
      if (isDateMeal(menu) || (isFillingMeal(menu) && menu.cookTime <= 45)) {
        delta += CONTEXT_BONUS;
        notes.push('context_partner_meal');
      }
      break;
    case 'friends':
      if (
        classifyMealArchetypes(menu).includes('bbq') ||
        classifyMealArchetypes(menu).includes('grill') ||
        menu.mode === 'delivery'
      ) {
        delta += CONTEXT_BONUS;
        notes.push('context_friends_share');
      }
      break;
    case 'work':
      if (isEasyMeal(menu) && menu.cookTime <= 25) {
        delta += CONTEXT_BONUS;
        notes.push('context_work_quick');
      }
      break;
    default:
      break;
  }

  return apply(delta, notes);
}

function scoreGoal(
  menu: MenuItem,
  goal: ContextMemorySnapshot['mealGoal'],
): ContextMemoryScoreResult {
  if (!goal) return emptyResult();

  let delta = 0;
  const notes: string[] = [];

  switch (goal) {
    case 'light':
      if (isLightMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_goal_light');
      } else if (isFillingMeal(menu) && classifyMealArchetypes(menu).includes('bbq')) {
        delta += CONTEXT_PENALTY;
        notes.push('context_goal_heavy');
      }
      break;
    case 'filling':
      if (isFillingMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_goal_filling');
      }
      break;
    case 'quick':
      if (menu.cookTime <= 20 || isEasyMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_goal_quick');
      } else if (menu.cookTime > 45) {
        delta += CONTEXT_PENALTY;
        notes.push('context_goal_slow');
      }
      break;
    case 'warm':
      if (isWarmMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_goal_warm');
      }
      break;
    case 'refreshing':
      if (isRefreshingMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_goal_refreshing');
      } else if (isWarmMeal(menu)) {
        delta += CONTEXT_PENALTY;
        notes.push('context_goal_warm_mismatch');
      }
      break;
    default:
      break;
  }

  return apply(delta, notes);
}

function scoreMood(
  menu: MenuItem,
  mood: ContextMemorySnapshot['mood'],
): ContextMemoryScoreResult {
  if (!mood) return emptyResult();

  let delta = 0;
  const notes: string[] = [];

  switch (mood) {
    case 'good':
      if (classifyMealArchetypes(menu).includes('special')) {
        delta += Math.round(CONTEXT_BONUS * 0.6);
        notes.push('context_mood_good');
      }
      break;
    case 'tired':
      if (isEasyMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_mood_tired_easy');
      } else if (menu.cookTime > 35 || menu.difficulty === 'hard') {
        delta += CONTEXT_PENALTY;
        notes.push('context_mood_tired_hard');
      }
      break;
    case 'stressed':
      if (isWarmMeal(menu) || isEasyMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_mood_stressed_comfort');
      }
      break;
    case 'sick':
      if (isWarmMeal(menu) || isLightMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_mood_sick_gentle');
      }
      if (menu.tags.includes('spicy' as never)) {
        delta += CONTEXT_PENALTY;
        notes.push('context_mood_sick_spicy');
      }
      break;
    case 'special':
      if (classifyMealArchetypes(menu).includes('special') || isDateMeal(menu)) {
        delta += CONTEXT_BONUS;
        notes.push('context_mood_special');
      }
      break;
    default:
      break;
  }

  return apply(delta, notes);
}

function scoreCombos(
  menu: MenuItem,
  snapshot: ContextMemorySnapshot,
): ContextMemoryScoreResult {
  const { diningSituation, mealGoal } = snapshot;
  if (!diningSituation || !mealGoal) return emptyResult();

  let delta = 0;
  const notes: string[] = [];

  if (diningSituation === 'alone' && mealGoal === 'quick' && isEasyMeal(menu)) {
    delta += CONTEXT_COMBO_BONUS;
    notes.push('context_combo_alone_quick');
  }
  if (diningSituation === 'family' && mealGoal === 'filling' && isFamilyMeal(menu)) {
    delta += CONTEXT_COMBO_BONUS;
    notes.push('context_combo_family_filling');
  }
  if (diningSituation === 'partner' && isDateMeal(menu)) {
    delta += CONTEXT_COMBO_BONUS;
    notes.push('context_combo_partner_date');
  }

  return apply(delta, notes);
}

function mergeResults(parts: ContextMemoryScoreResult[]): ContextMemoryScoreResult {
  let rawDelta = 0;
  const notes: string[] = [];
  for (const part of parts) {
    rawDelta += part.rawDelta;
    notes.push(...part.notes);
  }
  return { rawDelta, notes };
}

/**
 * Sprint 41 — HMIE scoring from explicit Context Memory only.
 * Never infers mood or dining situation; null fields are ignored.
 */
export function scoreContextMemory(
  menu: MenuItem,
  context?: RecommendationContext,
): ContextMemoryScoreResult {
  const snapshot = context?.contextMemory;
  if (!snapshot?.hasExplicitInput) return emptyResult();

  return mergeResults([
    scoreDining(menu, snapshot.diningSituation),
    scoreGoal(menu, snapshot.mealGoal),
    scoreMood(menu, snapshot.mood),
    scoreCombos(menu, snapshot),
  ]);
}
