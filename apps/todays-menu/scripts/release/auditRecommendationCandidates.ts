/**
 * Development-only recommendation candidate audit.
 * Run: npx tsx scripts/release/auditRecommendationCandidates.ts
 */
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { menuMatchesMealType } from '../../data/recipes/constants';
import { buildRecommendationCandidatePool } from '../../services/recommendation/buildCandidatePool';
import { menuPassesCookTimeHardFilter } from '../../services/recommendation/cookTimePreference';
import {
  DEFAULT_AI_RECOMMENDATION_SETTINGS,
  type AiRecommendationSettings,
} from '../../types/aiRecommendationSettings';
import type { Recipe } from '../../data/recipes/types';
import type { MealMode, MealType } from '../../types/home';
import type { MealTimeSlot } from '../../types/mealTime';
import type { MenuItem } from '../../types/recommendation';
import type { RecommendationContext } from '../../types/preference';
import { isRecommendableMenu } from '../../services/recommendation/mealCoursePolicy';

const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  간식: 'LATE_NIGHT',
};

type StageRow = {
  stage: string;
  count: number;
  ids: string[];
  removed?: string[];
};

function mapMealTimes(mealType: string[]): MealTimeSlot[] {
  const slots = mealType
    .map((item) => MEAL_TYPE_KO_TO_SLOT[item])
    .filter((slot): slot is MealTimeSlot => Boolean(slot));
  return slots.length > 0 ? [...new Set(slots)] : ['DINNER'];
}

function recipeToMenuItem(recipe: Recipe): MenuItem {
  const mealTime = mapMealTimes(recipe.mealType);
  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: recipe.time <= 15 ? 'instant' : 'recipe',
    title: recipe.name,
    subtitle: recipe.situation[0] ?? recipe.name,
    mealTime,
    cookTime: recipe.time,
    difficulty: recipe.difficulty === '쉬움' ? 'easy' : recipe.difficulty === '어려움' ? 'hard' : 'normal',
    aiReason: recipe.situation[0] ?? recipe.name,
    tags: [],
    badges: [],
  };
}

function getAuditCatalog(): MenuItem[] {
  return HANKKI_RECIPES.map(recipeToMenuItem);
}

function summarize(menus: MenuItem[]): { count: number; ids: string[] } {
  const ids = menus.map((menu) => menu.id).sort();
  return { count: ids.length, ids };
}

function diffIds(before: string[], after: string[]): string[] {
  const afterSet = new Set(after);
  return before.filter((id) => !afterSet.has(id));
}

function filterByMode(menus: MenuItem[], mealMode: MealMode): MenuItem[] {
  return menus.filter((menu) => menu.mode === mealMode);
}

function filterYesterdayRecipes(menus: MenuItem[], yesterdayIds: string[]): MenuItem[] {
  if (yesterdayIds.length === 0) return menus;
  const filtered = menus.filter((menu) => !yesterdayIds.includes(menu.id));
  return filtered.length > 0 ? filtered : menus;
}

function emptyContext(settings?: AiRecommendationSettings): RecommendationContext {
  return {
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
    aiRecommendationSettings: settings,
  };
}

function auditPipeline(input: {
  mealType: MealType;
  mealMode: MealMode;
  settings: AiRecommendationSettings;
  yesterdayIds?: string[];
}): { stages: StageRow[]; finalIds: string[] } {
  const context = emptyContext(input.settings);
  const stages: StageRow[] = [];

  const catalog = getAuditCatalog().filter((menu) => menu.mode === input.mealMode);
  const catalogSummary = summarize(catalog);
  stages.push({ stage: '1. full catalog (homemade)', ...catalogSummary });

  const afterCourse = catalog.filter(isRecommendableMenu);
  const courseSummary = summarize(afterCourse);
  stages.push({
    stage: '2. recommendable MAIN only',
    ...courseSummary,
    removed: diffIds(catalogSummary.ids, courseSummary.ids),
  });

  const afterYesterday = filterYesterdayRecipes(afterCourse, input.yesterdayIds ?? []);
  const yesterdaySummary = summarize(afterYesterday);
  stages.push({
    stage: '3. after yesterday soft-filter',
    ...yesterdaySummary,
    removed: diffIds(courseSummary.ids, yesterdaySummary.ids),
  });

  const afterMode = filterByMode(afterYesterday, input.mealMode);
  const modeSummary = summarize(afterMode);
  stages.push({
    stage: '4. meal mode filter',
    ...modeSummary,
    removed: diffIds(yesterdaySummary.ids, modeSummary.ids),
  });

  const afterMealType = afterMode.filter((menu) =>
    menuMatchesMealType(menu.mealTime, input.mealType),
  );
  const mealTypeSummary = summarize(afterMealType);
  stages.push({
    stage: `5. meal type filter (${input.mealType})`,
    ...mealTypeSummary,
    removed: diffIds(modeSummary.ids, mealTypeSummary.ids),
  });

  const afterCookTime = afterMealType.filter((menu) =>
    menuPassesCookTimeHardFilter(menu, context),
  );
  const cookSummary = summarize(afterCookTime);
  stages.push({
    stage: '6. cooking-time hard filter (<=10)',
    ...cookSummary,
    removed: diffIds(mealTypeSummary.ids, cookSummary.ids),
  });

  const { candidates } = buildRecommendationCandidatePool({
    menus: afterYesterday,
    mealType: input.mealType,
    mealMode: input.mealMode,
    context,
  });
  const poolSummary = summarize(candidates);
  stages.push({
    stage: '7. candidate pool (meal-type fallback + exclusions)',
    ...poolSummary,
    removed: diffIds(cookSummary.ids, poolSummary.ids),
  });

  return {
    stages,
    finalIds: poolSummary.ids,
  };
}

function printScenario(settings: AiRecommendationSettings, result: ReturnType<typeof auditPipeline>) {
  console.log('Settings:', JSON.stringify(settings, null, 2));
  for (const row of result.stages) {
    const removed = row.removed?.length ? ` | removed: ${row.removed.join(', ')}` : '';
    console.log(`${row.stage}: ${row.count} [${row.ids.join(', ')}]${removed}`);
  }
  console.log(`Final eligible IDs: ${result.finalIds.join(', ') || '(none)'}`);
}

async function main(): Promise<void> {
  const quickRecipes = HANKKI_RECIPES.filter((recipe) => recipe.time <= 10);
  console.log('Quick recipes in catalog (time <= 10):', quickRecipes.length);
  for (const recipe of quickRecipes) {
    const meal = recipeToMenuItem(recipe);
    console.log(`  ${recipe.id} ${recipe.name} | slots=${meal.mealTime.join(',')} | ${recipe.time}m`);
  }

  const mealType: MealType = 'dinner';
  const mealMode: MealMode = 'homemade';

  // Scenario A mirrors QA: maxCookTime=10 plus any saved optional prefs.
  // Optional prefs are soft-scored only and do not shrink the candidate pool.
  const scenarioASettings: AiRecommendationSettings = {
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    maxCookTime: '10',
    updatedAt: new Date().toISOString(),
  };

  console.log('\n########## Scenario A: saved-style settings + maxCookTime=10 ##########');
  printScenario(scenarioASettings, auditPipeline({ mealType, mealMode, settings: scenarioASettings }));

  console.log('\n########## Scenario B: only maxCookTime=10, others cleared ##########');
  const scenarioBSettings: AiRecommendationSettings = {
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    maxCookTime: '10',
    updatedAt: new Date().toISOString(),
  };
  printScenario(scenarioBSettings, auditPipeline({ mealType, mealMode, settings: scenarioBSettings }));

  console.log('\n########## Scenario C: no optional recommendation settings ##########');
  printScenario(
    DEFAULT_AI_RECOMMENDATION_SETTINGS,
    auditPipeline({ mealType, mealMode, settings: DEFAULT_AI_RECOMMENDATION_SETTINGS }),
  );

  console.log('\n########## Meal-type sweep (maxCookTime=10 only) ##########');
  for (const type of ['breakfast', 'lunch', 'dinner', 'late_night'] as MealType[]) {
    const sweep = auditPipeline({ mealType: type, mealMode, settings: scenarioBSettings });
    console.log(`${type}: ${sweep.finalIds.length} eligible -> ${sweep.finalIds.join(', ') || '(none)'}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
