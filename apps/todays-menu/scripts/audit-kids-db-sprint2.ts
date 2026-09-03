/**
 * HANKKI v1.1 Sprint 2 — Kids DB Audit (read-only).
 * Run: npx tsx scripts/audit-kids-db-sprint2.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listBabyFoodFeedRecipes } from '../data/recipes/babyFoodFeed';
import { listToddlerMealFeedRecipes, TODDLER_FEED_MEAL_TYPES } from '../data/recipes/toddlerMealFeed';
import { listElementaryBrowseRecipes } from '../data/recipes/elementaryBrowseFeed';
import {
  generateElementaryBreakfastWeek,
  listElementaryBreakfastWeekCandidates,
} from '../data/recipes/elementaryBreakfastWeeklyPlan';
import {
  generateElementaryDinnerWeek,
  listElementaryDinnerWeekCandidates,
} from '../data/recipes/elementaryDinnerWeeklyPlan';
import type { Recipe } from '../data/recipes/types';
import type { StandardMealType } from '../data/recipes/recipeStandardMetadataTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const MEAL_ASSETS_SRC = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');

type MealBucket = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
type ImageStatus = 'ok' | 'missing' | 'mapping_error' | 'review_required';

type RecipeAudit = {
  id: string;
  name: string;
  mealBuckets: MealBucket[];
  complete: boolean;
  incompleteReasons: string[];
  imageStatus: ImageStatus;
  heroImageKey: string;
  qualityIssues: string[];
};

function parseRegistryKeys(): Set<string> {
  const src = fs.readFileSync(MEAL_ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]!);
  return keys;
}

function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[·\-_/]/g, '')
    .toLowerCase();
}

function classifyMealBuckets(recipe: Recipe): MealBucket[] {
  const types = recipe.standardMetadata?.mealTypes ?? [];
  const buckets = new Set<MealBucket>();
  for (const t of types) {
    if (t === 'breakfast' || t === 'lunch' || t === 'dinner' || t === 'snack') {
      buckets.add(t);
    } else if (t === 'late_night') {
      buckets.add('other');
    }
  }
  if (buckets.size === 0) buckets.add('other');
  return [...buckets];
}

function countByMealBucket(recipes: Recipe[]): Record<MealBucket, number> {
  const counts: Record<MealBucket, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
    other: 0,
  };
  for (const recipe of recipes) {
    for (const bucket of classifyMealBuckets(recipe)) {
      counts[bucket] += 1;
    }
  }
  return counts;
}

function auditImage(recipe: Recipe, registry: Set<string>): ImageStatus {
  const key = (recipe.heroImageKey || '').trim();
  const imagePath = (recipe.image || '').trim();
  if (!key) return 'missing';
  const jpg = path.join(MEALS_DIR, `${key}.jpg`);
  const png = path.join(MEALS_DIR, `${key}.png`);
  const fileExists = fs.existsSync(jpg) || fs.existsSync(png);
  if (!fileExists) return 'missing';
  const inRegistry = registry.has(key);
  const pathKeyMatch = /^assets\/meals\/([a-z0-9_]+)\.(?:jpg|jpeg|png)$/i.exec(imagePath);
  const pathKey = pathKeyMatch?.[1] ?? null;
  const pathOk = pathKey === key && inRegistry;
  if (!inRegistry || !pathOk) return 'mapping_error';
  if (fs.existsSync(png) && !fs.existsSync(jpg)) return 'review_required';
  return 'ok';
}

function auditRecipeCompleteness(recipe: Recipe): { complete: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!recipe.ingredients?.length) reasons.push('no_ingredients');
  else {
    const missingAmount = recipe.ingredients.filter(
      (i) => !i.amount?.trim() || i.amount.trim() === '0' || i.amount.trim() === '-',
    );
    if (missingAmount.length > 0) reasons.push(`ingredient_amount_missing:${missingAmount.length}`);
  }
  const steps = recipe.recipe?.steps ?? [];
  if (steps.length < 2) reasons.push(`steps_short:${steps.length}`);
  else {
    const emptySteps = steps.filter((s) => !s.instruction?.trim() || s.instruction.trim().length < 8);
    if (emptySteps.length > 0) reasons.push(`steps_too_short:${emptySteps.length}`);
  }
  if (!recipe.time || recipe.time <= 0) reasons.push('cook_time_missing');
  if (!recipe.serving || recipe.serving <= 0) reasons.push('servings_missing');
  if (!recipe.standardMetadata?.mainIngredients?.length) reasons.push('main_ingredients_missing');
  return { complete: reasons.length === 0, reasons };
}

function auditQualityIssues(recipe: Recipe, audience: 'baby' | 'toddler' | 'elementary'): string[] {
  const issues: string[] = [];
  const { reasons } = auditRecipeCompleteness(recipe);
  for (const r of reasons) issues.push(r);

  if (recipe.time > 120) issues.push('cook_time_unrealistic_high');
  if (recipe.time > 0 && recipe.time < 3 && audience !== 'baby') issues.push('cook_time_unrealistic_low');

  const allergyMeta = recipe.standardMetadata?.allergyTags ?? [];
  const babyAllergy = recipe.familyAudience.babySafetyReview?.allergyTagsNoted ?? [];
  if (audience === 'baby' && allergyMeta.length > 0 && babyAllergy.length === 0) {
    issues.push('allergy_meta_vs_baby_review_mismatch');
  }

  if (audience === 'baby') {
    const bf = recipe.familyAudience.babyFood;
    const br = recipe.familyAudience.babySafetyReview;
    if (!bf?.stage) issues.push('baby_stage_missing');
    if (!bf?.texture) issues.push('baby_texture_missing');
    if (!bf?.monthRange || bf.monthRange.bound === 'unspecified') issues.push('baby_age_range_unspecified');
    if (br && bf && br.texture !== bf.texture && bf.texture !== null) {
      issues.push('baby_texture_review_mismatch');
    }
  }

  if (recipe.nutrition?.source === 'unverified' && recipe.nutrition.calorie > 0) {
    issues.push('nutrition_unverified_shown');
  }

  return issues;
}

function auditRecipes(recipes: Recipe[], audience: 'baby' | 'toddler' | 'elementary', registry: Set<string>): RecipeAudit[] {
  return recipes.map((recipe) => {
    const { complete, reasons } = auditRecipeCompleteness(recipe);
    const qualityIssues = auditQualityIssues(recipe, audience);
    return {
      id: recipe.id,
      name: recipe.name,
      mealBuckets: classifyMealBuckets(recipe),
      complete,
      incompleteReasons: reasons,
      imageStatus: auditImage(recipe, registry),
      heroImageKey: recipe.heroImageKey,
      qualityIssues,
    };
  });
}

function findNameDuplicates(recipes: Recipe[]): { exact: string[][]; similar: string[][] } {
  const byExact = new Map<string, string[]>();
  const byNorm = new Map<string, string[]>();
  for (const r of recipes) {
    const exact = r.name.trim();
    const norm = normalizeName(exact);
    byExact.set(exact, [...(byExact.get(exact) ?? []), r.id]);
    byNorm.set(norm, [...(byNorm.get(norm) ?? []), r.id]);
  }
  return {
    exact: [...byExact.values()].filter((ids) => ids.length > 1),
    similar: [...byNorm.values()].filter((ids) => ids.length > 1),
  };
}

function ingredientSignature(recipe: Recipe): string {
  return recipe.ingredients
    .map((i) => `${i.name.trim()}|${i.amount.trim()}`)
    .sort()
    .join(';;');
}

function findDuplicateRecipes(recipes: Recipe[]): string[][] {
  const bySig = new Map<string, string[]>();
  for (const r of recipes) {
    const sig = ingredientSignature(r);
    bySig.set(sig, [...(bySig.get(sig) ?? []), r.id]);
  }
  return [...bySig.values()].filter((ids) => ids.length > 1);
}

function findDuplicateImages(recipes: Recipe[]): { key: string; ids: string[] }[] {
  const byKey = new Map<string, string[]>();
  for (const r of recipes) {
    const key = r.heroImageKey?.trim();
    if (!key) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), r.id]);
  }
  return [...byKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, ids }));
}

function countBabyByStage(recipes: Recipe[]): Record<string, number> {
  const counts: Record<string, number> = { early: 0, middle: 0, late: 0, completion: 0, missing: 0 };
  for (const r of recipes) {
    const stage = r.familyAudience.babyFood?.stage ?? r.familyAudience.babySafetyReview?.stage;
    if (stage && stage in counts) counts[stage] += 1;
    else counts.missing += 1;
  }
  return counts;
}

function babyFieldGaps(recipes: Recipe[]) {
  let stageMissing = 0;
  let ageRangeMissing = 0;
  let textureMissing = 0;
  let allergyIssues = 0;
  for (const r of recipes) {
    const bf = r.familyAudience.babyFood;
    const br = r.familyAudience.babySafetyReview;
    if (!bf?.stage || !br?.stage) stageMissing += 1;
    if (!bf?.monthRange || bf.monthRange.bound === 'unspecified') ageRangeMissing += 1;
    if (!bf?.texture || !br?.texture) textureMissing += 1;
    const metaAllergy = r.standardMetadata.allergyTags.length;
    const noted = br?.allergyTagsNoted?.length ?? 0;
    if (metaAllergy > 0 && noted === 0) allergyIssues += 1;
  }
  return { stageMissing, ageRangeMissing, textureMissing, allergyIssues };
}

function toddlerGaps(recipes: Recipe[]) {
  let noAgeStage = 0;
  let noAllergy = 0;
  let noDifficulty = 0;
  for (const r of recipes) {
    const review = r.familyAudience.toddlerSafetyReview;
    if (!review) noAgeStage += 1;
    if ((r.standardMetadata.allergyTags?.length ?? 0) === 0 && (review?.allergyTagsNoted?.length ?? 0) === 0) {
      noAllergy += 1;
    }
    if (!r.standardMetadata.difficulty) noDifficulty += 1;
  }
  const breakfastCount = listToddlerMealFeedRecipes('breakfast').length;
  return { noAgeStage, noAllergy, noDifficulty, breakfastCount, breakfastSufficient: breakfastCount >= 7 };
}

function testWeeklyGeneration(
  generate: (seed?: string) => { ok: boolean; plan?: { slots: { recipeId: string }[] } },
  seedCount: number,
): { success: number; fail: number; rate: number } {
  let success = 0;
  let fail = 0;
  for (let i = 0; i < seedCount; i += 1) {
    const result = generate(`audit-seed-${i}`);
    if (result.ok) success += 1;
    else fail += 1;
  }
  return { success, fail, rate: success / seedCount };
}

function test14DayNoRepeat(
  generate: (seed?: string) => { ok: boolean; plan?: { slots: { recipeId: string }[] } },
  attempts: number,
): { success: number; rate: number } {
  let success = 0;
  for (let i = 0; i < attempts; i += 1) {
    const w1 = generate(`14d-a-${i}`);
    const w2 = generate(`14d-b-${i}`);
    if (!w1.ok || !w2.ok || !w1.plan || !w2.plan) continue;
    const ids = [...w1.plan.slots, ...w2.plan.slots].map((s) => s.recipeId);
    if (new Set(ids).size === 14) success += 1;
  }
  return { success, rate: success / attempts };
}

function countByStandardMealType(recipes: Recipe[], mealType: StandardMealType): number {
  return recipes.filter((r) => r.standardMetadata.mealTypes.includes(mealType)).length;
}

function topQualityIssues(allAudits: RecipeAudit[], limit: number): string[] {
  const freq = new Map<string, number>();
  for (const a of allAudits) {
    for (const issue of a.qualityIssues) {
      freq.set(issue, (freq.get(issue) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([issue, count]) => `${issue} (${count})`);
}

function main(): void {
  const registry = parseRegistryKeys();
  const baby = listBabyFoodFeedRecipes();
  const toddler = listToddlerMealFeedRecipes();
  const elementary = listElementaryBrowseRecipes();
  const breakfastPool = listElementaryBreakfastWeekCandidates();
  const dinnerPool = listElementaryDinnerWeekCandidates();

  const babyAudits = auditRecipes(baby, 'baby', registry);
  const toddlerAudits = auditRecipes(toddler, 'toddler', registry);
  const elementaryAudits = auditRecipes(elementary, 'elementary', registry);
  const allAudits = [...babyAudits, ...toddlerAudits, ...elementaryAudits];

  const babyByStage = countBabyByStage(baby);
  const toddlerByMeal = countByMealBucket(toddler);
  const elementaryByMeal = countByMealBucket(elementary);

  const babyGaps = babyFieldGaps(baby);
  const toddlerGapInfo = toddlerGaps(toddler);

  const complete = allAudits.filter((a) => a.complete).length;
  const incomplete = allAudits.length - complete;
  const imageMissing = allAudits.filter((a) => a.imageStatus === 'missing').length;
  const imageDupes = findDuplicateImages([...baby, ...toddler, ...elementary]);

  const allChild = [...baby, ...toddler, ...elementary];
  const nameDupes = findNameDuplicates(allChild);
  const recipeDupes = findDuplicateRecipes(allChild);

  const breakfastGen = testWeeklyGeneration((seed) => generateElementaryBreakfastWeek(seed), 200);
  const dinnerGen = testWeeklyGeneration((seed) => generateElementaryDinnerWeek(seed), 200);
  const breakfast14 = test14DayNoRepeat((seed) => generateElementaryBreakfastWeek(seed), 50);
  const dinner14 = test14DayNoRepeat((seed) => generateElementaryDinnerWeek(seed), 50);

  const schemaPresent = {
    calories: allChild.every((r) => typeof r.nutrition?.calorie === 'number'),
    protein: allChild.every((r) => typeof r.nutrition?.protein === 'number'),
    carbs: allChild.every((r) => typeof r.nutrition?.carbohydrate === 'number'),
    fat: allChild.every((r) => typeof r.nutrition?.fat === 'number'),
    sugar: false,
    sodium: false,
    fiber: false,
    cost: false,
    storage: false,
    mealType: allChild.every((r) => Array.isArray(r.standardMetadata?.mealTypes)),
    ageGroup: allChild.every((r) => Array.isArray(r.familyAudience?.audiences)),
    allergy: allChild.every((r) => Array.isArray(r.standardMetadata?.allergyTags)),
    prepTime: false,
    cookTime: allChild.every((r) => typeof r.time === 'number' && r.standardMetadata?.cookingTime === r.time),
  };

  const schemaMissing = [
    'sugar',
    'sodium',
    'fiber',
    'cost',
    'storage',
    'prepTime (only cookTime/time exists)',
    'explicit ageGroup enum (audiences[] used instead)',
    'particleSize (baby uses texture enum only)',
    'forbiddenIngredients list (honeyListed flag only)',
  ];

  const report = {
    BABY_FOOD_COUNT: baby.length,
    TODDLER_MEAL_COUNT: toddler.length,
    ELEMENTARY_COUNT: elementary.length,
    BABY_BY_STAGE: {
      early: babyByStage.early,
      middle: babyByStage.middle,
      late: babyByStage.late,
      completion: babyByStage.completion,
    },
    TODDLER_BY_MEAL_TYPE: {
      breakfast: toddlerByMeal.breakfast,
      lunch: toddlerByMeal.lunch,
      dinner: toddlerByMeal.dinner,
      snack: toddlerByMeal.snack,
      other: toddlerByMeal.other,
    },
    ELEMENTARY_BY_MEAL_TYPE: {
      breakfast: elementaryByMeal.breakfast,
      lunch: elementaryByMeal.lunch,
      dinner: elementaryByMeal.dinner,
      snack: elementaryByMeal.snack,
      other: elementaryByMeal.other,
    },
    BREAKFAST_ELEMENTARY_COUNT: countByStandardMealType(elementary, 'breakfast'),
    DINNER_ELEMENTARY_COUNT: countByStandardMealType(elementary, 'dinner'),
    RECIPES_COMPLETE: complete,
    RECIPES_INCOMPLETE: incomplete,
    IMAGE_MISSING: imageMissing,
    IMAGE_DUPLICATES: imageDupes.length,
    IMAGE_DUPLICATE_GROUPS: imageDupes.slice(0, 10),
    NAME_DUPLICATES: {
      exactGroups: nameDupes.exact.length,
      similarGroups: nameDupes.similar.length,
      exact: nameDupes.exact,
      similar: nameDupes.similar.filter((g) => !nameDupes.exact.some((e) => e.join() === g.join())).slice(0, 10),
    },
    RECIPE_DUPLICATE_GROUPS: recipeDupes.length,
    RECIPE_DUPLICATE_DETAILS: recipeDupes.map((ids) =>
      ids.map((id) => {
        const r = allChild.find((item) => item.id === id);
        return `${id}:${r?.name ?? '?'}`;
      }),
    ),
    BABY_AGE_RANGE_UNSPECIFIED_IDS: baby
      .filter((r) => !r.familyAudience.babyFood?.monthRange || r.familyAudience.babyFood.monthRange.bound === 'unspecified')
      .map((r) => ({ id: r.id, name: r.name, stage: r.familyAudience.babyFood?.stage })),
    BABY_STAGE_MISSING: babyGaps.stageMissing,
    BABY_AGE_RANGE_MISSING: babyGaps.ageRangeMissing,
    BABY_TEXTURE_MISSING: babyGaps.textureMissing,
    BABY_ALLERGY_ISSUES: babyGaps.allergyIssues,
    TODDLER_BREAKFAST_COUNT: toddlerGapInfo.breakfastCount,
    TODDLER_BREAKFAST_SUFFICIENT: toddlerGapInfo.breakfastSufficient,
    WEEKLY_BREAKFAST_POOL: breakfastPool.length,
    WEEKLY_DINNER_POOL: dinnerPool.length,
    WEEKLY_BREAKFAST_GEN_SUCCESS_RATE: breakfastGen.rate,
    WEEKLY_DINNER_GEN_SUCCESS_RATE: dinnerGen.rate,
    CAN_CREATE_7_DAY_WITHOUT_REPEAT: breakfastGen.rate >= 0.99 && dinnerGen.rate >= 0.99,
    CAN_CREATE_14_DAY_WITHOUT_REPEAT:
      breakfastPool.length >= 14 &&
      dinnerPool.length >= 14 &&
      breakfast14.rate > 0 &&
      dinner14.rate > 0,
    CAN_CREATE_14_DAY_POOL_CAPACITY: breakfastPool.length >= 14 && dinnerPool.length >= 14,
    CAN_CREATE_14_DAY_INDEPENDENT_SEEDS: breakfast14.rate > 0 || dinner14.rate > 0,
    BREAKFAST_14_DAY_SUCCESS_RATE: breakfast14.rate,
    DINNER_14_DAY_SUCCESS_RATE: dinner14.rate,
    DATA_SCHEMA_CURRENT: schemaPresent,
    DATA_SCHEMA_MISSING_FOR_FUTURE: schemaMissing,
    TOP_20_DATA_QUALITY_ISSUES: topQualityIssues(allAudits, 20),
    WEEKLY_PLAN_LOGIC: {
      breakfastPoolSource: 'elementary + explicit + mealTypes includes breakfast + collision gate',
      dinnerPoolSource: 'elementary + explicit + mealTypes includes dinner + collision gate',
      breakfastSeed: 'normalizeWeeklyPlanSeed → mulberry32 shuffle → backtracking with hard/soft diversity',
      dinnerSeed: 'hashWeeklyPlanSeed → mulberry32 shuffle → backtracking with protein/form streak rules',
      duplicatePrevention: 'Within-week only (no consecutive same form/protein; streak caps). No cross-week avoid list.',
      fallbackOnInsufficient: 'Returns INSUFFICIENT_CANDIDATES when pool < 7; soft diversity phases relax before hard rules relax',
    },
    BLOCKERS: [] as string[],
    WARNINGS: [] as string[],
    INCOMPLETE_SAMPLES: allAudits.filter((a) => !a.complete).slice(0, 15),
    IMAGE_MISSING_SAMPLES: allAudits.filter((a) => a.imageStatus === 'missing').slice(0, 15),
  };

  const blockers = report.BLOCKERS;
  const warnings = report.WARNINGS;

  if (dinnerPool.length < 7) blockers.push(`Dinner weekly pool ${dinnerPool.length} < 7 minimum`);
  if (breakfastGen.rate < 0.95) warnings.push(`Breakfast week generation success ${(breakfastGen.rate * 100).toFixed(1)}%`);
  if (dinnerGen.rate < 0.95) warnings.push(`Dinner week generation success ${(dinnerGen.rate * 100).toFixed(1)}%`);
  if (!report.CAN_CREATE_14_DAY_INDEPENDENT_SEEDS) {
    warnings.push('Independent weekly seeds always overlap — 2-week no-repeat not achievable without avoidRecipeIds');
  }
  if (dinnerPool.length < 14) {
    warnings.push(`Dinner pool ${dinnerPool.length} barely supports 14 unique menus (3 spare)`);
  }
  if (imageMissing > 0) warnings.push(`${imageMissing} child recipes missing hero images`);
  if (babyGaps.allergyIssues > 0) warnings.push(`${babyGaps.allergyIssues} baby recipes: standard allergyTags but empty babySafetyReview.allergyTagsNoted`);
  if (babyGaps.ageRangeMissing > 0) warnings.push(`${babyGaps.ageRangeMissing} baby recipes with unspecified monthRange (all early/시작기)`);
  if (nameDupes.exact.length > 0) warnings.push(`${nameDupes.exact.length} exact duplicate name groups across child catalog`);
  if (recipeDupes.length > 0) warnings.push(`${recipeDupes.length} ingredient-identical recipe groups`);
  if (imageDupes.length > 0) warnings.push(`${imageDupes.length} shared heroImageKey groups (image reuse)`);

  const finalReport = {
    ...report,
    BLOCKERS: blockers,
    WARNINGS: warnings,
  };

  const outJson = path.join(APP_ROOT, 'scripts', 'reports', 'kids-db-audit-sprint2.json');
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(finalReport, null, 2), 'utf8');

  console.log(JSON.stringify(finalReport, null, 2));
  console.log(`\nWrote ${outJson}`);
}

main();
