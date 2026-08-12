/**
 * Sprint 61-B — cross-slot hero diversity QA.
 * Run: npm run test:cross-slot-hero-diversity
 *
 * Uses metadata-weighted ranking (no Metro image require chain in Node).
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { isRecommendableMenu } from '../services/recommendation/mealCoursePolicy';
import { resolveRecommendationCandidates } from '../services/recommendation/buildCandidatePool';
import { pickDiverseMealTimeSet } from '../services/recommendation/mealTime/mealTimeSetPicker';
import { mealTimeSlotToMealType, buildSlotEmphasisWeights } from '../services/recommendation/mealTime/mealTimeSlotMapping';
import { blendFitWithClockWeights } from '../services/recommendation/mealTime/mealTimeTransitionPolicy';
import { getRecipeMealTimeMetadata } from '../data/recommendation/recipeMealTimeMetadata';
import { DEFAULT_AI_RECOMMENDATION_SETTINGS } from '../types/aiRecommendationSettings';
import {
  addSessionHeroId,
  clearRecommendationSession,
  getSessionHeroIds,
  MAX_SESSION_HERO_IDS,
  resetSessionHeroIds,
} from '../services/recommendationSession';
import { MEAL_TIME_SLOT_KEYS } from '../types/mealTimeRecommendation';
import type { MenuItem } from '../types/recommendation';
import type { MealTimeSlot } from '../types/mealTime';
import type { Recipe } from '../data/recipes/types';
import type { HomeRecommendationDTO } from '../types/home';
import type { ScoredMenuItem } from '../types/mealIntelligenceEngine';

const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  간식: 'LATE_NIGHT',
};

function mapMealTimes(mealType: string[]): MealTimeSlot[] {
  const slots = mealType
    .map((item) => MEAL_TYPE_KO_TO_SLOT[item])
    .filter((slot): slot is MealTimeSlot => Boolean(slot));
  return slots.length > 0 ? [...new Set(slots)] : ['DINNER'];
}

function recipeToMenuItem(recipe: Recipe): MenuItem {
  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: recipe.time <= 15 ? 'instant' : 'recipe',
    title: recipe.name,
    subtitle: recipe.situation[0] ?? recipe.name,
    mealTime: mapMealTimes(recipe.mealType),
    cookTime: recipe.time,
    difficulty:
      recipe.difficulty === '쉬움' ? 'easy' : recipe.difficulty === '어려움' ? 'hard' : 'normal',
    aiReason: recipe.situation[0] ?? recipe.name,
    tags: [],
    badges: [],
  };
}

const catalog = HANKKI_RECIPES.map(recipeToMenuItem).filter(isRecommendableMenu);

const emptyContext = {
  recentMeals: [],
  favorites: [],
  favoriteRecipeIds: [],
  preferenceDNA: {
    favoriteCategories: [],
    favoriteMealTypes: [],
    favoriteTags: [],
    favoriteEmotionTags: [],
    favoriteCookingTimes: [],
    favoriteDifficulty: [],
    favoriteSeasons: [],
    totalFavorites: 0,
  },
  conversationMemory: { messages: [], updatedAt: '' },
  aiRecommendationSettings: DEFAULT_AI_RECOMMENDATION_SETTINGS,
};

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function buildSessionExcludeIds(
  sessionShownIds: string[],
  repeatPenaltyIds: string[],
  excludeMenuId?: string,
): string[] {
  return sessionShownIds.filter(
    (id) => id !== excludeMenuId && !repeatPenaltyIds.includes(id),
  );
}

function scoreCandidates(
  candidates: MenuItem[],
  slot: typeof MEAL_TIME_SLOT_KEYS[number],
): ScoredMenuItem[] {
  return candidates
    .map((menu) => {
      const meta = getRecipeMealTimeMetadata(menu.id);
      let total = 55;
      if (meta) {
        const w = buildSlotEmphasisWeights(slot);
        total += Math.round(blendFitWithClockWeights(meta.fit, w) * 35);
      }
      return {
        menuId: menu.id,
        score: total,
        breakdown: {
          baseScore: 0,
          total,
          factors: {},
          notes: [],
          excluded: false,
          exclusionReasons: [],
        },
      };
    })
    .sort((a, b) => b.score - a.score || a.menuId.localeCompare(b.menuId));
}

function heroForSlot(
  slot: typeof MEAL_TIME_SLOT_KEYS[number],
  sessionShownIds: string[],
  refreshGen = 0,
  repeatPenaltyIds: string[] = [],
  excludeMenuId?: string,
): string {
  const mealType = mealTimeSlotToMealType(slot);
  const mealMode = 'homemade' as const;
  const { candidates } = resolveRecommendationCandidates({
    menus: catalog,
    mealType,
    mealMode,
    excludeMenuId,
    recentMenuIds: repeatPenaltyIds,
    context: emptyContext,
  });
  const scored = scoreCandidates(candidates, slot);
  const sessionExcludeIds = buildSessionExcludeIds(
    sessionShownIds,
    repeatPenaltyIds,
    excludeMenuId,
  );
  const excludeIds = [
    ...(excludeMenuId ? [excludeMenuId] : []),
    ...sessionExcludeIds,
  ];

  let picked = pickDiverseMealTimeSet(scored, candidates, {
    limit: 4,
    excludeIds,
    seedOffset: refreshGen,
  });

  if (picked.length === 0 && sessionExcludeIds.length > 0) {
    picked = pickDiverseMealTimeSet(scored, candidates, {
      limit: 4,
      excludeIds: excludeMenuId ? [excludeMenuId] : [],
      seedOffset: refreshGen,
    });
  }

  return picked[0]?.menuId ?? '';
}

function simulateSessionCrossSlot(refreshGen = 0): string[] {
  resetSessionHeroIds();
  const heroes: string[] = [];
  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const id = heroForSlot(slot, getSessionHeroIds(), refreshGen);
    assert(Boolean(id), `${slot} hero not null`);
    addSessionHeroId(id);
    heroes.push(id);
  }
  return heroes;
}

function cachedConflictsSession(
  recommendation: HomeRecommendationDTO,
  sessionShownIds: string[],
): boolean {
  const primaryId = recommendation.recipe?.id?.trim();
  if (!primaryId || recommendation.noCandidatesAvailable) return false;
  return sessionShownIds.includes(primaryId);
}

console.log('Sprint 61-B cross-slot hero diversity QA — start\n');

assert(MAX_SESSION_HERO_IDS >= 8, `session hero cap ≥8 (${MAX_SESSION_HERO_IDS})`);

resetSessionHeroIds();
addSessionHeroId('001');
addSessionHeroId('001');
assert(getSessionHeroIds().length === 1, 'session hero ids dedupe');

clearRecommendationSession();
assert(getSessionHeroIds().length === 0, 'clearRecommendationSession resets hero ids');

const sessionHeroes = simulateSessionCrossSlot(0);
const unique = new Set(sessionHeroes);
assert(unique.size >= 3, `Scenario A unique heroes ≥3 (got ${unique.size})`);

const maxSameCount = (() => {
  const counts = new Map<string, number>();
  for (const id of sessionHeroes) counts.set(id, (counts.get(id) ?? 0) + 1);
  return Math.max(...counts.values(), 0);
})();
assert(maxSameCount <= 2, `Scenario A no hero in 3+ slots (max repeat=${maxSameCount})`);

resetSessionHeroIds();
addSessionHeroId('002');
const cachedRec: HomeRecommendationDTO = {
  recommendationId: 'rec_cache',
  mealMode: 'homemade',
  chefMessage: 'test',
  reason: 'test',
  badges: [],
  recipe: {
    id: '002',
    title: '계란볶음밥',
    subtitle: '',
    imageUrl: null,
    cookingTimeMinutes: 10,
    difficulty: 'easy',
  },
};
assert(
  cachedConflictsSession(cachedRec, getSessionHeroIds()),
  'Scenario B cached primary conflicts session',
);
const lunchHero = heroForSlot('lunch', getSessionHeroIds());
assert(lunchHero !== '002', `Scenario B lunch hero avoids session duplicate (got ${lunchHero})`);

resetSessionHeroIds();
const manySessionIds = catalog.slice(0, 50).map((m) => m.id);
for (const id of manySessionIds) addSessionHeroId(id);
const breakfastHero = heroForSlot('breakfast', getSessionHeroIds());
assert(Boolean(breakfastHero), 'Scenario C hero not null under heavy session exclude');

resetSessionHeroIds();
const lunchInitial = heroForSlot('lunch', []);
assert(Boolean(lunchInitial), 'Scenario D initial lunch hero');
const previousIds = [lunchInitial, '999', '998', '997'];
const refreshed = heroForSlot('lunch', getSessionHeroIds(), 1, previousIds, lunchInitial);
assert(refreshed !== lunchInitial, 'Scenario D refresh primary differs from previous hero');

let tripleDupRuns = 0;
let dupRuns = 0;
for (let run = 0; run < 10; run++) {
  const heroes = simulateSessionCrossSlot(run);
  const counts = new Map<string, number>();
  for (const id of heroes) counts.set(id, (counts.get(id) ?? 0) + 1);
  const max = Math.max(...counts.values(), 0);
  if (max >= 3) tripleDupRuns += 1;
  if (max >= 2) dupRuns += 1;
}
assert(tripleDupRuns === 0, `10-run: zero 3-slot same hero (violations=${tripleDupRuns})`);
console.log(`   10-run duplicate runs (2+ slots): ${dupRuns}/10`);

console.log('\nSprint 61-B cross-slot hero diversity QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} scenario(s) failed`);
}
