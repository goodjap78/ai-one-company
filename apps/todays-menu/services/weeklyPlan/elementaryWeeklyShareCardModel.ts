/**
 * Sprint v1.1 #5 — rich share-card model (no generator / DB changes).
 */
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanDay } from '../../data/recipes/recipeFamilyAudienceTypes';
import type { Recipe } from '../../data/recipes/types';
import {
  formatWeeklyPlanIngredientHints,
  resolveWeeklyPlanMainIngredientHints,
} from './elementaryWeeklyPlanDisplayCommon';

export type ElementaryWeeklyShareCardItem = {
  day: WeeklyPlanDay;
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
  ingredientHint: string;
  foodPoint: string;
};

export type ElementaryWeeklyShareCardModel = {
  items: ElementaryWeeklyShareCardItem[];
  shoppingHint: string | null;
};

export type ElementaryWeeklyShareSlotInput = {
  day: WeeklyPlanDay;
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
  ingredientHint: string;
};

const SHOPPING_STOPWORDS = new Set([
  '밥',
  '물',
  '식용유',
  '소금',
  '후추',
  '설탕',
  '참기름',
  '간장',
  '다진 마늘',
  '마늘',
  '식초',
  '올리브유',
]);

const PROTEIN_PATTERN =
  /계란|달걀|닭|소고기|쇠고기|돼지|두부|참치|생선|연어|햄|치즈|우유/;
const VEG_PATTERN =
  /야채|호박|시금치|브로콜리|당근|배추|양배추|오이|감자|고구마|버섯|채소|토마토|파프리카/;
const RICE_PATTERN = /밥|덮밥|볶음밥|국밥|주먹밥|죽|비빔밥/;

/** Short qualitative tag — never nutrition numbers. */
export function resolveWeeklyShareFoodPoint(
  recipe: Recipe | null | undefined,
  timeMinutes: number,
): string {
  if (timeMinutes > 0 && timeMinutes <= 10) return `${timeMinutes}분 완성`;
  if (timeMinutes > 0 && timeMinutes <= 15) return `${timeMinutes}분 완성`;

  if (!recipe) return timeMinutes > 0 ? `${timeMinutes}분` : '';

  const blob = [
    recipe.name,
    ...recipe.ingredients.map((item) => item.name),
    ...(recipe.standardMetadata?.mainIngredients ?? []),
  ].join(' ');

  if (PROTEIN_PATTERN.test(blob)) return '단백질';
  if (
    RICE_PATTERN.test(blob) ||
    recipe.standardMetadata?.dishType === 'rice' ||
    recipe.standardMetadata?.dishType === 'rice_bowl'
  ) {
    return '한 그릇';
  }
  if (VEG_PATTERN.test(blob)) return '채소 포함';
  if (timeMinutes > 0 && timeMinutes <= 20) return `${timeMinutes}분`;

  return '';
}

export function resolveWeeklyShareShoppingHint(
  items: readonly ElementaryWeeklyShareCardItem[],
): string | null {
  const counts = new Map<string, number>();

  for (const item of items) {
    const recipe = getHankkiRecipeById(item.recipeId);
    if (!recipe) continue;

    const names = new Set<string>();
    for (const hint of resolveWeeklyPlanMainIngredientHints(recipe)) {
      names.add(hint);
    }
    for (const ing of recipe.ingredients) {
      if (ing.group === 'main' || ing.group === 'sub') {
        names.add(ing.name);
      }
    }

    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed || SHOPPING_STOPWORDS.has(trimmed)) continue;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([name]) => name);

  if (ranked.length < 3) return null;

  // Keep 4–6 core ingredients for a clean share footer (never a long list).
  return ranked.slice(0, 6).join(' · ');
}

export function buildElementaryWeeklyShareCardModel(
  plan: WeeklyMealPlan,
  resolveSlot: (slot: WeeklyMealPlan['slots'][number]) => ElementaryWeeklyShareSlotInput,
): ElementaryWeeklyShareCardModel {
  const items: ElementaryWeeklyShareCardItem[] = plan.slots.map((slot) => {
    const display = resolveSlot(slot);
    const recipe = getHankkiRecipeById(display.recipeId);
    return {
      day: display.day,
      dayLabel: display.dayLabel,
      recipeId: display.recipeId,
      name: display.name,
      timeMinutes: display.timeMinutes,
      ingredientHint:
        display.ingredientHint ||
        formatWeeklyPlanIngredientHints(resolveWeeklyPlanMainIngredientHints(recipe)),
      foodPoint: resolveWeeklyShareFoodPoint(recipe, display.timeMinutes),
    };
  });

  return {
    items,
    shoppingHint: resolveWeeklyShareShoppingHint(items),
  };
}
