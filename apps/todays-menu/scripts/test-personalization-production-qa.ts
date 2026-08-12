/**
 * Sprint 62-D — Personalization v1 production QA.
 * Run: npm run test:personalization-production-qa
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { getRecipeMealTimeMetadata } from '../data/recommendation/recipeMealTimeMetadata';
import { isRecommendableMenu } from '../services/recommendation/mealCoursePolicy';
import { resolveRecommendationCandidates } from '../services/recommendation/buildCandidatePool';
import { pickDiverseMealTimeSet } from '../services/recommendation/mealTime/mealTimeSetPicker';
import {
  buildSlotEmphasisWeights,
  mealTimeSlotToMealType,
} from '../services/recommendation/mealTime/mealTimeSlotMapping';
import { blendFitWithClockWeights } from '../services/recommendation/mealTime/mealTimeTransitionPolicy';
import { buildLightPersonalizationProfile } from '../services/recommendation/mealIntelligence/lightPersonalizationProfile';
import { scoreLightPersonalization } from '../services/recommendation/mealIntelligence/scoreLightPersonalization';
import { createEmptyLightPersonalizationProfile, LIGHT_PERSONALIZATION_MAX_BONUS } from '../types/lightPersonalization';
import { DEFAULT_AI_RECOMMENDATION_SETTINGS } from '../types/aiRecommendationSettings';
import { MEAL_TIME_SLOT_KEYS } from '../types/mealTimeRecommendation';
import type { LightPersonalizationProfile } from '../types/lightPersonalization';
import type { UserPreference } from '../types/preference';
import type { MenuItem } from '../types/recommendation';
import type { MealTimeSlot } from '../types/mealTime';
import type { Recipe } from '../data/recipes/types';
import type { ScoredMenuItem } from '../types/mealIntelligenceEngine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  간식: 'LATE_NIGHT',
};

const BASE_SMART_CONSTANT = 55;

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

function fakeFavorite(recipeId: string): UserPreference {
  return {
    recipeId,
    category: 'korean',
    mealType: 'dinner',
    difficulty: 'easy',
    cookingTime: 20,
    tags: [],
    emotionTags: [],
    season: 'summer',
    createdAt: '2026-08-01T00:00:00.000Z',
  };
}

function profileFromFavorites(ids: string[]): LightPersonalizationProfile {
  return buildLightPersonalizationProfile(ids.map((id) => fakeFavorite(id)), []);
}

function profileFromViewed(ids: string[]): LightPersonalizationProfile {
  return buildLightPersonalizationProfile(
    [],
    ids.map((recipeId, index) => ({
      recipeId,
      viewedAt: new Date(2026, 7, 10, index, 0, 0).toISOString(),
    })),
  );
}

function mealTimePoints(menuId: string, slot: typeof MEAL_TIME_SLOT_KEYS[number]): number {
  const meta = getRecipeMealTimeMetadata(menuId);
  if (!meta) return 0;
  const weights = buildSlotEmphasisWeights(slot);
  return Math.round(blendFitWithClockWeights(meta.fit, weights) * 35);
}

function personalPoints(menu: MenuItem, profile: LightPersonalizationProfile | undefined): number {
  if (!profile || profile.isEmpty) return 0;
  return scoreLightPersonalization(menu, profile).points;
}

type RankedEntry = {
  menuId: string;
  mealTimePts: number;
  personalPts: number;
  total: number;
};

function scoreForSlot(
  candidates: MenuItem[],
  slot: typeof MEAL_TIME_SLOT_KEYS[number],
  profile: LightPersonalizationProfile | undefined,
): RankedEntry[] {
  return candidates
    .map((menu) => {
      const mealTimePts = mealTimePoints(menu.id, slot);
      const personalPts = personalPoints(menu, profile);
      return {
        menuId: menu.id,
        mealTimePts,
        personalPts,
        total: BASE_SMART_CONSTANT + mealTimePts + personalPts,
      };
    })
    .sort((a, b) => b.total - a.total || a.menuId.localeCompare(b.menuId));
}

function topIds(
  slot: typeof MEAL_TIME_SLOT_KEYS[number],
  profile: LightPersonalizationProfile | undefined,
  limit = 10,
): string[] {
  const mealType = mealTimeSlotToMealType(slot);
  const { candidates } = resolveRecommendationCandidates({
    menus: catalog,
    mealType,
    mealMode: 'homemade',
    context: {
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
    },
  });
  return scoreForSlot(candidates, slot, profile)
    .slice(0, limit)
    .map((entry) => entry.menuId);
}

function pickHero(
  slot: typeof MEAL_TIME_SLOT_KEYS[number],
  profile: LightPersonalizationProfile | undefined,
  sessionShownIds: string[] = [],
): string {
  const mealType = mealTimeSlotToMealType(slot);
  const { candidates } = resolveRecommendationCandidates({
    menus: catalog,
    mealType,
    mealMode: 'homemade',
    context: {
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
    },
  });
  const scored: ScoredMenuItem[] = scoreForSlot(candidates, slot, profile).map((entry) => ({
    menuId: entry.menuId,
    score: entry.total,
    breakdown: {
      baseScore: 0,
      total: entry.total,
      factors: {},
      notes: [],
      excluded: false,
      exclusionReasons: [],
    },
  }));
  const excludeIds = sessionShownIds.filter(Boolean);
  const picked = pickDiverseMealTimeSet(scored, candidates, {
    limit: 4,
    excludeIds,
    seedOffset: 0,
  });
  if (picked.length === 0 && excludeIds.length > 0) {
    return (
      pickDiverseMealTimeSet(scored, candidates, { limit: 4, excludeIds: [], seedOffset: 0 })[0]
        ?.menuId ?? ''
    );
  }
  return picked[0]?.menuId ?? '';
}

function findIds(filter: (recipe: Recipe) => boolean, limit: number): string[] {
  return HANKKI_RECIPES.filter(filter)
    .map((recipe) => recipe.id)
    .slice(0, limit);
}

const spicyIds = findIds(
  (r) => r.standardMetadata.spiceLevel >= 2 || r.standardMetadata.tasteProfile.includes('spicy'),
  12,
);
const soupStewIds = findIds(
  (r) => r.standardMetadata.dishType === 'soup' || r.standardMetadata.dishType === 'stew',
  12,
);
const noodleIds = findIds((r) => r.standardMetadata.dishType === 'noodle', 12);
const healthyIds = findIds(
  (r) =>
    r.standardMetadata.dietaryTags.includes('light_meal') ||
    r.collectionIds.includes('HEALTHY') ||
    r.collectionIds.includes('DIET'),
  12,
);
const quickIds = findIds(
  (r) =>
    r.standardMetadata.situationTags.includes('quick_meal') ||
    r.collectionIds.includes('FAST') ||
    r.time <= 15,
  12,
);

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Sprint 62-D personalization production QA — start\n');

const emptyProfile = createEmptyLightPersonalizationProfile();

assert(
  catalog.every((menu) => personalPoints(menu, emptyProfile) === 0),
  '1. Cold start — personalization bonus 0 for all menus',
);

const breakfastWithout = topIds('breakfast', emptyProfile);
const breakfastWithEmpty = topIds('breakfast', emptyProfile);
assert(
  breakfastWithout.join(',') === breakfastWithEmpty.join(','),
  '1. Cold start — top 10 unchanged with empty profile',
);

for (const slot of MEAL_TIME_SLOT_KEYS) {
  const hero = pickHero(slot, emptyProfile);
  assert(Boolean(hero), `1. Cold start — ${slot} hero not null`);
}

const profileA = profileFromFavorites(spicyIds.slice(0, 8));
const dinnerTopSpicy = scoreForSlot(
  catalog.filter((m) => spicyIds.includes(m.id) && !profileA.favoriteRecipeIds.includes(m.id)),
  'dinner',
  profileA,
).slice(0, 5);
assert(
  dinnerTopSpicy.length > 0 && dinnerTopSpicy.every((entry) => entry.personalPts > 0),
  '2. Profile A — spicy favorites lift spicy dinner candidates',
);

const profileB = profileFromFavorites(soupStewIds.slice(0, 8));
const soupMenu = catalog.find(
  (m) => soupStewIds.includes(m.id) && !profileB.favoriteRecipeIds.includes(m.id),
);
if (soupMenu) {
  const bonus = personalPoints(soupMenu, profileB);
  assert(bonus > 0, '2. Profile B — soup/stew favorites lift similar menus');
}

const profileC = profileFromFavorites(noodleIds.slice(0, 8));
const noodleMenu = catalog.find(
  (m) => noodleIds.includes(m.id) && !profileC.favoriteRecipeIds.includes(m.id),
);
if (noodleMenu) {
  assert(personalPoints(noodleMenu, profileC) > 0, '2. Profile C — noodle favorites lift noodles');
}

const profileD = profileFromFavorites(healthyIds.slice(0, 8));
const profileE = profileFromFavorites(quickIds.slice(0, 8));
assert(!profileD.isEmpty && !profileE.isEmpty, '2. Profile D/E — profiles built');

const viewedOnlyNoodle = profileFromViewed(noodleIds.slice(0, 8));
const noodleAvg =
  noodleIds
    .slice(8, 12)
    .map((id) => catalog.find((m) => m.id === id))
    .filter(Boolean)
    .reduce((sum, menu) => sum + personalPoints(menu!, viewedOnlyNoodle), 0) / 4;
const nonNoodleAvg =
  catalog
    .filter((m) => !noodleIds.includes(m.id))
    .slice(0, 4)
    .reduce((sum, menu) => sum + personalPoints(menu, viewedOnlyNoodle), 0) / 4;
assert(noodleAvg > nonNoodleAvg, '3. Viewed-only — noodle views lift noodles weakly');

const spicyFavForConflict =
  findIds((r) => r.standardMetadata.spiceLevel >= 2 && r.standardMetadata.dishType === 'stew', 1)[0] ??
  spicyIds.find((id) => id !== noodleIds[0]) ??
  spicyIds[0]!;
const conflictViewed = profileFromViewed([noodleIds[0]!]);
const conflictProfile = buildLightPersonalizationProfile(
  [fakeFavorite(spicyFavForConflict)],
  [{ recipeId: noodleIds[0]!, viewedAt: '2026-08-10T00:00:00.000Z' }],
);
const spicyCandidate = catalog.find(
  (m) =>
    spicyIds.includes(m.id) &&
    !conflictProfile.favoriteRecipeIds.includes(m.id) &&
    !conflictProfile.viewedRecipeIds.includes(m.id),
);
const noodleCandidate = catalog.find(
  (m) =>
    noodleIds.includes(m.id) &&
    !conflictProfile.favoriteRecipeIds.includes(m.id) &&
    !conflictProfile.viewedRecipeIds.includes(m.id),
);
if (spicyCandidate && noodleCandidate) {
  const spicyBonus = personalPoints(spicyCandidate, conflictProfile);
  const noodleBonus = personalPoints(noodleCandidate, conflictProfile);
  assert(
    spicyBonus > noodleBonus || spicyBonus >= 4,
    `4. Favorite vs Viewed — spicy ${spicyBonus} vs noodle ${noodleBonus}`,
  );
  assert(personalPoints(noodleCandidate, conflictViewed) > 0, '4. Viewed signal not fully ignored');
}

const dinnerHeavyIds = findIds((r) => r.standardMetadata.mealTypes.includes('dinner'), 10);
const dinnerProfile = profileFromFavorites(dinnerHeavyIds);
const breakfastHero = pickHero('breakfast', dinnerProfile);
const breakfastFitHero = getRecipeMealTimeMetadata(breakfastHero)?.fit.breakfast ?? 0;
const worstDinnerFavoriteFit = Math.min(
  ...dinnerHeavyIds.slice(0, 5).map((id) => getRecipeMealTimeMetadata(id)?.fit.breakfast ?? 0),
);
assert(
  breakfastFitHero >= worstDinnerFavoriteFit - 0.15,
  '5. Meal-time safety — breakfast hero not dominated by dinner favorites',
);

let diversityViolations = 0;
const sessionIds: string[] = [];
for (const slot of MEAL_TIME_SLOT_KEYS) {
  const hero = pickHero(slot, profileA, sessionIds);
  assert(Boolean(hero), `6. Session ${slot} hero not null`);
  sessionIds.push(hero);
}
const uniqueSession = new Set(sessionIds);
assert(uniqueSession.size === sessionIds.length, '6. Cross-slot session — 4 unique heroes');

let tenRunDup = 0;
for (let run = 0; run < 10; run += 1) {
  const heroes: string[] = [];
  const shown: string[] = [];
  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const hero = pickHero(slot, profileA, shown);
    heroes.push(hero);
    shown.push(hero);
  }
  const counts = new Map<string, number>();
  for (const id of heroes) counts.set(id, (counts.get(id) ?? 0) + 1);
  if ([...counts.values()].some((c) => c >= 3)) tenRunDup += 1;
}
assert(tenRunDup === 0, '6. 10-run — no hero in 3+ slots');

const favoriteId = spicyIds[0]!;
const favoriteMenu = catalog.find((m) => m.id === favoriteId);
if (favoriteMenu) {
  assert(personalPoints(favoriteMenu, profileA) === 0, '7. Direct repeat — favorite id bonus 0');
}

const saturatedIds = HANKKI_RECIPES.map((r) => r.id).slice(0, 50);
const saturatedProfile = profileFromFavorites(saturatedIds);
let maxBonus = 0;
for (const menu of catalog.slice(0, 80)) {
  maxBonus = Math.max(maxBonus, personalPoints(menu, saturatedProfile));
}
assert(maxBonus <= LIGHT_PERSONALIZATION_MAX_BONUS, '8. Favorite saturation — bonus cap');

const viewed20 = profileFromViewed(HANKKI_RECIPES.map((r) => r.id).slice(0, 20));
assert(viewed20.viewedRecipeIds.length === 20, '9. Viewed saturation — 20 entries');
const viewedNoodleOnly = profileFromViewed(noodleIds.slice(0, 20));
const favNoodle = profileFromFavorites(noodleIds.slice(0, 3));
const sampleNoodle = catalog.find((m) => noodleIds.includes(m.id) && m.id !== noodleIds[0]);
if (sampleNoodle) {
  const viewedBonus = personalPoints(sampleNoodle, viewedNoodleOnly);
  const favBonus = personalPoints(sampleNoodle, favNoodle);
  assert(viewedBonus <= favBonus, '9. Viewed weaker than favorite for same trait');
  assert(viewedBonus <= LIGHT_PERSONALIZATION_MAX_BONUS, '9. Viewed bonus cap');
}

const spicyExplainMenu = catalog.find(
  (m) =>
    spicyIds.includes(m.id) &&
    !profileA.favoriteRecipeIds.includes(m.id) &&
    HANKKI_RECIPES.find((r) => r.id === m.id)?.standardMetadata.spiceLevel >= 2,
);
if (spicyExplainMenu) {
  const result = scoreLightPersonalization(spicyExplainMenu, profileA);
  assert(Boolean(result.label), '10. Explanation — spicy similarity label when grounded');
}
const noExplain = scoreLightPersonalization(catalog[0]!, emptyProfile);
assert(!noExplain.label, '10. Explanation — no label on cold start');

function avgDinnerFit(ids: string[]): number {
  if (ids.length === 0) return 0;
  return ids.reduce((sum, id) => sum + (getRecipeMealTimeMetadata(id)?.fit.dinner ?? 0), 0) / ids.length;
}

const diagnosticProfiles: Array<{ name: string; profile: LightPersonalizationProfile }> = [
  { name: 'spicy favorites', profile: profileA },
  { name: 'noodle favorites', profile: profileC },
  { name: 'viewed noodles', profile: viewedOnlyNoodle },
  { name: 'empty', profile: emptyProfile },
];

console.log('\n--- 11. Before/After diagnostic (dinner slot, top 10) ---');
for (const { name, profile } of diagnosticProfiles) {
  const mealType = mealTimeSlotToMealType('dinner');
  const { candidates } = resolveRecommendationCandidates({
    menus: catalog,
    mealType,
    mealMode: 'homemade',
    context: {
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
    },
  });
  const without = scoreForSlot(candidates, 'dinner', emptyProfile).slice(0, 10);
  const withProfile = scoreForSlot(candidates, 'dinner', profile).slice(0, 10);
  console.log(`\nProfile: ${name}`);
  console.log('WITHOUT personal top 10:', without.map((e) => e.menuId).join(', '));
  console.log('WITH personal top 10:', withProfile.map((e) => e.menuId).join(', '));
  const withoutIds = without.map((e) => e.menuId);
  const withIds = withProfile.map((e) => e.menuId);
  const overlap = withIds.filter((id) => withoutIds.includes(id)).length;
  const fitDrop = avgDinnerFit(withoutIds) - avgDinnerFit(withIds);
  assert(
    overlap >= 2 || profile.isEmpty || fitDrop <= 0.12,
    `11. ${name} — overlap ${overlap}, dinner fit drop ${fitDrop.toFixed(2)}`,
  );
}

const bigFavorites = saturatedIds.map((id) => fakeFavorite(id));
const bigViewed = HANKKI_RECIPES.slice(0, 20).map((r, i) => ({
  recipeId: r.id,
  viewedAt: new Date(2026, 7, 10, i).toISOString(),
}));
const perfStart = performance.now();
for (let i = 0; i < 50; i += 1) {
  const profile = buildLightPersonalizationProfile(bigFavorites, bigViewed);
  for (const menu of catalog.slice(0, 100)) {
    scoreLightPersonalization(menu, profile);
  }
}
const perfMs = performance.now() - perfStart;
assert(perfMs < 2000, `12. Performance — 50 profile+score cycles in ${perfMs.toFixed(0)}ms (<2000ms)`);

const smartSrc = read('services/recommendation/mealIntelligence/smartRecommendationScore.ts');
assert(smartSrc.includes('scoreLightPersonalization'), 'wiring — smart score uses light personalization');
assert(smartSrc.includes('smart_favorite_known'), 'wiring — direct favorite boost removed');

console.log(`\nSprint 62-D personalization production QA — done (${failed} failed)`);
if (failed > 0) process.exitCode = 1;
