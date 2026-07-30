import type { AiRecommendationReason } from '../../utils/recommendationDisplayReason';
import type { GoldMealRecord } from '../../types/goldMeal';
import type { MealMode } from '../../types/home';
import type { MenuBadge, MenuItem } from '../../types/recommendation';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { hankkiRecipeToGoldMeal } from '../../data/recipes/hankkiRecipeMapper';
import { resolveMealDna } from './mealIntelligence/mealDna';

/**
 * Sprint H3-5 / H3-5.1 — Home homemade recommendations use HANKKI_RECIPES only.
 * CORE_RECIPES remains in the repo for later migration; not used as catalog source.
 */
const HANKKI_GOLD_MEALS: GoldMealRecord[] = HANKKI_RECIPES.map(hankkiRecipeToGoldMeal);
const HANKKI_GOLD_MEAL_BY_ID = new Map(HANKKI_GOLD_MEALS.map((meal) => [meal.id, meal]));

function buildConfidenceReasons(meal: GoldMealRecord): AiRecommendationReason[] | undefined {
  const hankki = HANKKI_RECIPES.find((item) => item.id === meal.id);
  const lines = hankki?.situation ?? [];
  if (lines.length === 0) return undefined;

  const emoji = meal.heroImage.emoji ?? '✨';
  return lines.slice(0, 3).map((text, index) => ({
    emoji: [emoji, '🍽️', '💡'][index] ?? '✨',
    text,
  }));
}

function buildBadges(meal: GoldMealRecord): MenuBadge[] {
  const badges: MenuBadge[] = [];

  if (meal.cookTime <= 20) {
    badges.push({ label: `${meal.cookTime}분`, type: 'time' });
  }
  if (meal.tags.includes('family')) {
    badges.push({ label: '가족', type: 'family' });
  }
  if (meal.weatherTags.includes('rain')) {
    badges.push({ label: '비오는날', type: 'weather' });
  }

  return badges;
}

/** Map a published Gold Meal to the recommendation catalog `MenuItem`. */
export function goldMealToMenuItem(meal: GoldMealRecord): MenuItem {
  const item: MenuItem = {
    id: meal.id,
    mode: meal.mode,
    type: meal.type,
    mealStyle: meal.mealStyle,
    title: meal.title,
    subtitle: meal.subtitle,
    mealTime: meal.mealTime,
    cookTime: meal.cookTime,
    difficulty: meal.difficulty,
    aiReason: meal.aiReason,
    tags: meal.tags,
    badges: buildBadges(meal),
    honeyTip: meal.cookingSupport?.tip ?? meal.enjoyGuide?.lines[0],
    mealPurpose: meal.mealPurpose,
    weatherTags: meal.weatherTags,
    situationTags: meal.situationTags,
    experienceLabel: meal.experienceLabel,
    suggestedPairingNames: meal.suggestedPairings.map((pairing) => pairing.name),
    confidenceReasons: buildConfidenceReasons(meal),
  };

  return {
    ...item,
    mealDna: meal.mealDna ?? resolveMealDna(item),
  };
}

/** Sprint H3-5.1 — homemade catalog from HANKKI_RECIPES. */
export function getFlagshipMenuCatalog(mealMode: MealMode): MenuItem[] {
  return HANKKI_GOLD_MEALS.filter((meal) => meal.mode === mealMode).map(goldMealToMenuItem);
}

export function getFlagshipMenuById(id: string): MenuItem | null {
  const meal = HANKKI_GOLD_MEAL_BY_ID.get(id);
  return meal ? goldMealToMenuItem(meal) : null;
}

export function isFlagshipMenuId(id: string): boolean {
  return HANKKI_GOLD_MEAL_BY_ID.has(id);
}

export function getFlagshipGoldMealById(id: string): GoldMealRecord | undefined {
  return HANKKI_GOLD_MEAL_BY_ID.get(id);
}
