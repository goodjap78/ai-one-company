import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { Recipe } from '../../data/recipes/types';
import type { HomeRecommendationDTO, MealType } from '../../types/home';

/**
 * Sprint H3-13 — pick a Seed tip from recipe.recommendationMessages.
 * Avoids immediate repeat per recipe; prefers context-matching lines.
 */
export const RECENT_SEED_MESSAGES_KEY = '@todays_menu/recent_seed_messages';

/** Last shown Seed message keyed by recipe id. */
type RecentSeedMessagesMap = Record<string, string>;

export type SeedMessageContext = {
  slot?: 'morning' | 'lunch' | 'dinner' | null;
  quickMeal?: boolean;
  warmFood?: boolean;
  kidFriendly?: boolean;
};

let memoryCache: RecentSeedMessagesMap | null = null;

function normalizeMap(value: unknown): RecentSeedMessagesMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const next: RecentSeedMessagesMap = {};
  for (const [key, message] of Object.entries(value as Record<string, unknown>)) {
    if (typeof message === 'string' && message.trim()) {
      next[key] = message.trim();
    }
  }
  return next;
}

async function loadRecentMap(): Promise<RecentSeedMessagesMap> {
  if (memoryCache) return { ...memoryCache };

  try {
    const raw = await AsyncStorage.getItem(RECENT_SEED_MESSAGES_KEY);
    memoryCache = raw ? normalizeMap(JSON.parse(raw)) : {};
  } catch {
    memoryCache = {};
  }

  return { ...memoryCache };
}

async function saveRecentMessage(recipeId: string, message: string): Promise<void> {
  const current = await loadRecentMap();
  memoryCache = { ...current, [recipeId]: message };

  try {
    await AsyncStorage.setItem(RECENT_SEED_MESSAGES_KEY, JSON.stringify(memoryCache));
  } catch {
    // Keep in-memory map even if persistence fails.
  }
}

export function buildSeedMessageContext(
  recipe: Recipe | undefined,
  mealType: MealType,
): SeedMessageContext {
  const slot =
    mealType === 'breakfast'
      ? 'morning'
      : mealType === 'lunch'
        ? 'lunch'
        : mealType === 'dinner' || mealType === 'late_night'
          ? 'dinner'
          : null;

  const blob = [
    recipe?.name ?? '',
    ...(recipe?.tags ?? []),
    ...(recipe?.category ?? []),
    ...(recipe?.situation ?? []),
  ].join(' ');

  return {
    slot,
    quickMeal: (recipe?.time ?? 99) <= 20 || /빠른|간편|뚝딱/.test(blob),
    warmFood: /찌개|국물|따뜻|카레|탕/.test(blob),
    kidFriendly: /아이/.test(blob),
  };
}

function scoreMessage(message: string, context: SeedMessageContext): number {
  let score = 0;

  if (context.slot === 'morning' && /아침|가뿐|가볍게 시작|빠른 한 끼/.test(message)) {
    score += 3;
  }
  if (context.slot === 'lunch' && /점심|낮에|한 그릇|간편/.test(message)) {
    score += 3;
  }
  if (context.slot === 'dinner' && /저녁|집밥|든든|모임/.test(message)) {
    score += 2;
  }
  if (context.quickMeal && /분|간편|빠른|금방|뚝딱|빠르게/.test(message)) {
    score += 3;
  }
  if (context.warmFood && /따뜻|국물|구수|칼칼|포근|카레/.test(message)) {
    score += 3;
  }
  if (context.kidFriendly && /아이|함께|누구나/.test(message)) {
    score += 3;
  }

  return score;
}

function pickFromPool(pool: string[]): string {
  if (pool.length === 1) return pool[0];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/**
 * Choose one Seed tip for the recipe; skips the immediately previous line when possible.
 */
export async function pickSeedRecommendationMessage(
  recipeId: string,
  context: SeedMessageContext = {},
): Promise<string | null> {
  const recipe = getHankkiRecipeById(recipeId);
  const messages = (recipe?.recommendationMessages ?? [])
    .map((line) => line.trim())
    .filter(Boolean);

  if (messages.length === 0) return null;

  const recent = await loadRecentMap();
  const last = recent[recipeId];
  const withoutLast =
    last && messages.length > 1 ? messages.filter((line) => line !== last) : messages;

  const scored = withoutLast.map((line) => ({ line, score: scoreMessage(line, context) }));
  const maxScore = Math.max(...scored.map((item) => item.score));
  const preferred =
    maxScore > 0 ? scored.filter((item) => item.score === maxScore).map((item) => item.line) : withoutLast;

  const chosen = pickFromPool(preferred.length > 0 ? preferred : withoutLast);
  await saveRecentMessage(recipeId, chosen);
  return chosen;
}

/** Attach a fresh Seed tip to a Home recommendation DTO. */
export async function withSeedRecommendationMessage(
  recommendation: HomeRecommendationDTO,
  mealType: MealType,
): Promise<HomeRecommendationDTO> {
  const recipe = getHankkiRecipeById(recommendation.recipe.id);
  const context = buildSeedMessageContext(recipe, mealType);
  const seedMessage = await pickSeedRecommendationMessage(recommendation.recipe.id, context);

  return {
    ...recommendation,
    seedMessage: seedMessage ?? undefined,
  };
}

/** @internal Test helper */
export async function resetRecentSeedMessagesForTests(): Promise<void> {
  memoryCache = {};
  try {
    await AsyncStorage.removeItem(RECENT_SEED_MESSAGES_KEY);
  } catch {
    // ignore
  }
}

/** @internal Test helper — in-memory only (no AsyncStorage). */
export function pickSeedRecommendationMessageSync(
  messages: string[],
  lastMessage: string | undefined,
  context: SeedMessageContext = {},
): string | null {
  const cleaned = messages.map((line) => line.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  const withoutLast =
    lastMessage && cleaned.length > 1
      ? cleaned.filter((line) => line !== lastMessage)
      : cleaned;

  const scored = withoutLast.map((line) => ({ line, score: scoreMessage(line, context) }));
  const maxScore = Math.max(...scored.map((item) => item.score));
  const preferred =
    maxScore > 0 ? scored.filter((item) => item.score === maxScore).map((item) => item.line) : withoutLast;

  return pickFromPool(preferred.length > 0 ? preferred : withoutLast);
}
