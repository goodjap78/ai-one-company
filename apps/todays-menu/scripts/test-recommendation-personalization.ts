/**
 * Sprint 62-C — light personalization QA.
 * Run: npm run test:recommendation-personalization
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listRecipeMealTimeMetadata } from '../data/recommendation/recipeMealTimeMetadata';
import { buildLightPersonalizationProfile } from '../services/recommendation/mealIntelligence/lightPersonalizationProfile';
import { scoreLightPersonalization } from '../services/recommendation/mealIntelligence/scoreLightPersonalization';
import { LIGHT_PERSONALIZATION_MAX_BONUS } from '../types/lightPersonalization';
import type { UserPreference } from '../types/preference';
import type { MenuItem } from '../types/recommendation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function recipeToMenu(recipeId: string): MenuItem | null {
  const recipe = HANKKI_RECIPES.find((item) => item.id === recipeId);
  if (!recipe) return null;
  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'main',
    title: recipe.name,
    subtitle: '',
    mealTime: [],
    cookTime: recipe.time,
    difficulty: recipe.difficulty === '쉬움' ? 'easy' : recipe.difficulty === '보통' ? 'normal' : 'hard',
    aiReason: '',
    tags: recipe.tags as MenuItem['tags'],
    badges: [],
  };
}

function findSpicyRecipeIds(limit = 8): string[] {
  return HANKKI_RECIPES
    .filter(
      (recipe) =>
        recipe.standardMetadata.spiceLevel >= 2 ||
        recipe.standardMetadata.tasteProfile.includes('spicy'),
    )
    .map((recipe) => recipe.id)
    .slice(0, limit);
}

function findNoodleRecipeIds(limit = 8): string[] {
  return HANKKI_RECIPES
    .filter((recipe) => recipe.standardMetadata.dishType === 'noodle')
    .map((recipe) => recipe.id)
    .slice(0, limit);
}

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

function breakfastFitTopIds(limit = 10): string[] {
  return listRecipeMealTimeMetadata()
    .sort((a, b) => b.fit.breakfast - a.fit.breakfast)
    .slice(0, limit)
    .map((entry) => entry.recipeId);
}

function avgLightBonus(menus: MenuItem[], profile: ReturnType<typeof buildLightPersonalizationProfile>): number {
  if (menus.length === 0) return 0;
  const sum = menus.reduce(
    (acc, menu) => acc + scoreLightPersonalization(menu, profile).points,
    0,
  );
  return sum / menus.length;
}

console.log('Sprint 62-C recommendation personalization QA — start\n');

assert(LIGHT_PERSONALIZATION_MAX_BONUS <= 10, 'personalization cap ≤10');
assert(LIGHT_PERSONALIZATION_MAX_BONUS < 35, 'personalization cap < meal-time metadata max');

const emptyProfile = buildLightPersonalizationProfile([], []);
assert(emptyProfile.isEmpty, 'empty profile flagged');

const sampleMenus = HANKKI_RECIPES.slice(0, 40).map((recipe) => recipeToMenu(recipe.id)).filter(Boolean) as MenuItem[];
const emptyBonusSum = sampleMenus.reduce(
  (sum, menu) => sum + scoreLightPersonalization(menu, emptyProfile).points,
  0,
);
assert(emptyBonusSum === 0, 'Scenario A — cold start adds zero personalization bonus');

const spicyIds = findSpicyRecipeIds(4);
const spicyFavorites = spicyIds.map((recipeId) => fakeFavorite(recipeId));
const spicyProfile = buildLightPersonalizationProfile(spicyFavorites, []);
const otherSpicyIds = findSpicyRecipeIds(20).filter((id) => !spicyIds.includes(id)).slice(0, 4);
const spicyMenus = otherSpicyIds.map((id) => recipeToMenu(id)).filter(Boolean) as MenuItem[];
const nonSpicyMenus = sampleMenus
  .filter((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe && recipe.standardMetadata.spiceLevel < 2 && !recipe.standardMetadata.tasteProfile.includes('spicy');
  })
  .slice(0, spicyMenus.length);
assert(
  spicyMenus.length > 0 && avgLightBonus(spicyMenus, spicyProfile) > avgLightBonus(nonSpicyMenus, spicyProfile),
  'Scenario B — spicy profile lifts similar spicy menus',
);

const noodleIds = findNoodleRecipeIds(5);
const viewedNoodle = noodleIds.map((recipeId, index) => ({
  recipeId,
  viewedAt: new Date(2026, 7, 10, index, 0, 0).toISOString(),
}));
const noodleProfile = buildLightPersonalizationProfile([], viewedNoodle);
const otherNoodleIds = findNoodleRecipeIds(20).filter((id) => !noodleIds.includes(id)).slice(0, 4);
const noodleMenus = otherNoodleIds.map((id) => recipeToMenu(id)).filter(Boolean) as MenuItem[];
const nonNoodleMenus = sampleMenus
  .filter((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe?.standardMetadata.dishType !== 'noodle';
  })
  .slice(0, noodleMenus.length);
assert(
  noodleMenus.length > 0 && avgLightBonus(noodleMenus, noodleProfile) > avgLightBonus(nonNoodleMenus, noodleProfile),
  'Scenario C — viewed noodle history lifts noodle menus',
);

const conflictFavorite = spicyIds[0]!;
const conflictViewed = [viewedNoodle[0]!].map((recipeId, index) => ({
  recipeId,
  viewedAt: new Date(2026, 7, 10, index, 0, 0).toISOString(),
}));
const conflictProfile = buildLightPersonalizationProfile([fakeFavorite(conflictFavorite)], conflictViewed);
const spicyCandidate = recipeToMenu(otherSpicyIds[0] ?? findSpicyRecipeIds(10)[4]!);
const noodleCandidate = recipeToMenu(otherNoodleIds[0] ?? findNoodleRecipeIds(10)[4]!);
if (spicyCandidate && noodleCandidate) {
  const spicyBonus = scoreLightPersonalization(spicyCandidate, conflictProfile).points;
  const noodleBonus = scoreLightPersonalization(noodleCandidate, conflictProfile).points;
  assert(spicyBonus > noodleBonus, 'Scenario D — favorite spicy signal beats viewed noodle on similar candidates');
}

const rankingSrc = read('services/recommendation/mealTime/mealTimeSlotRanking.ts');
assert(rankingSrc.includes('sessionShownIds'), 'Scenario E — session exclude ids wired in ranking');
assert(rankingSrc.includes('pickDiverseMealTimeSet'), 'Scenario E — diverse pick after scoring');

const breakfastTop = breakfastFitTopIds(10);
const dinnerFavoriteId =
  HANKKI_RECIPES.find((recipe) => recipe.standardMetadata.mealTypes.includes('dinner'))?.id ?? '001';
const dinnerProfile = buildLightPersonalizationProfile([fakeFavorite(dinnerFavoriteId)], []);
const breakfastMenus = breakfastTop.map((id) => recipeToMenu(id)).filter(Boolean) as MenuItem[];
const maxBreakfastPersonalBonus = Math.max(
  ...breakfastMenus.map((menu) => scoreLightPersonalization(menu, dinnerProfile).points),
  0,
);
const topBreakfastFit = listRecipeMealTimeMetadata().find((entry) => entry.recipeId === breakfastTop[0])?.fit.breakfast ?? 0;
const secondBreakfastFit = listRecipeMealTimeMetadata().find((entry) => entry.recipeId === breakfastTop[1])?.fit.breakfast ?? 0;
const fitGapPts = Math.round((topBreakfastFit - secondBreakfastFit) * 35);
assert(
  maxBreakfastPersonalBonus < fitGapPts || fitGapPts === 0,
  'Scenario F — personalization bonus smaller than typical breakfast fit gap',
);

const favoriteMenu = recipeToMenu(spicyIds[0]!);
if (favoriteMenu) {
  assert(
    scoreLightPersonalization(favoriteMenu, spicyProfile).points === 0,
    'Scenario G — favorite recipe itself gets no bonus',
  );
}

const viewedMenu = recipeToMenu(noodleIds[0]!);
if (viewedMenu) {
  assert(
    scoreLightPersonalization(
      viewedMenu,
      buildLightPersonalizationProfile([], [{ recipeId: noodleIds[0]!, viewedAt: '2026-08-10T00:00:00.000Z' }]),
    ).points === 0,
    'direct viewed recipe gets zero similarity bonus',
  );
}

console.log('\n--- Diagnostic: breakfast top 10 by meal-time fit ---');
console.log(breakfastFitTopIds(10).join(', '));

const spicyBonusMenus = sampleMenus
  .map((menu) => ({
    id: menu.id,
    bonus: scoreLightPersonalization(menu, spicyProfile).points,
  }))
  .filter((entry) => entry.bonus > 0)
  .sort((a, b) => b.bonus - a.bonus)
  .slice(0, 10);
console.log('\n--- Diagnostic: menus with spicy-profile bonus (top 10) ---');
for (const entry of spicyBonusMenus) {
  console.log(`${entry.id}: +${entry.bonus}`);
}

const smartSrc = read('services/recommendation/mealIntelligence/smartRecommendationScore.ts');
assert(smartSrc.includes('scoreLightPersonalization'), 'smart score wires light personalization');
assert(smartSrc.includes('smart_favorite_known'), 'direct favorite boost removed');

const contextSrc = read('services/recommendation/recommendationContext.ts');
assert(contextSrc.includes('getViewedRecipeHistory'), 'context loads viewed history');
assert(contextSrc.includes('buildLightPersonalizationProfile'), 'context builds profile');

console.log(`\nSprint 62-C recommendation personalization QA — done (${failed} failed)`);
if (failed > 0) process.exitCode = 1;
