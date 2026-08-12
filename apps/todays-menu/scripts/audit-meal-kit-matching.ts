/**
 * Coupang meal-kit matching audit — 300 HANKKI recipes via production shopping proxy.
 * Run: npx tsx scripts/audit-meal-kit-matching.ts
 * Env: SHOPPING_PROXY_PRODUCTION_BASE_URL or EXPO_PUBLIC_SHOPPING_API_BASE_URL
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import type { ShoppingProduct } from '../types/shoppingProduct';
import {
  buildMealKitSearchKeywords,
  inferFoodCategory,
  mergeSearchResults,
  type FoodCategoryBucket,
  type MealKitMatchQuality,
  type MealKitMatchResult,
} from './mealKitAudit/classifyMealKitMatch';

const APP_ROOT = path.resolve(__dirname, '..');
const SEARCH_PATH = '/api/shopping/coupang/search';
const OUTPUT_JSON = path.join(APP_ROOT, 'docs', 'meal-kit-audit-results.json');
const OUTPUT_MD = path.join(APP_ROOT, 'docs', 'MEAL_KIT_MATCHING_AUDIT_REPORT.md');

const REQUEST_DELAY_MS = 400;
const RATE_LIMIT_COOLDOWN_MS = 8000;

type RecipeAuditRow = {
  recipeId: string;
  recipeName: string;
  foodCategory: FoodCategoryBucket;
  matchQuality: MealKitMatchQuality;
  searchKeyword: string | null;
  products: MealKitMatchResult['products'];
  notes: string[];
};

type AuditStats = {
  totalRecipes: number;
  high: number;
  medium: number;
  low: number;
  none: number;
  apiRequestCount: number;
  rateLimitEvents: number;
};

function loadDotEnv(): void {
  for (const file of ['.env', '.env.local']) {
    const envPath = path.join(APP_ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function resolveProxyBaseUrl(): string {
  const production = process.env.SHOPPING_PROXY_PRODUCTION_BASE_URL?.trim().replace(/\/$/, '');
  if (production) return production;
  const local = process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim().replace(/\/$/, '');
  if (local) return local;
  throw new Error('Set SHOPPING_PROXY_PRODUCTION_BASE_URL or EXPO_PUBLIC_SHOPPING_API_BASE_URL');
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchProducts(
  baseUrl: string,
  keyword: string,
  limit: number,
): Promise<{ products: ShoppingProduct[]; rateLimited: boolean }> {
  const response = await fetch(`${baseUrl}${SEARCH_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword, limit }),
  });

  if (response.status === 429) {
    return { products: [], rateLimited: true };
  }

  const payload = (await response.json()) as {
    products?: ShoppingProduct[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `http_${response.status}`);
  }

  return {
    products: Array.isArray(payload.products) ? payload.products : [],
    rateLimited: false,
  };
}

async function auditRecipe(
  baseUrl: string,
  recipeId: string,
  recipeName: string,
  tags: string[],
  stats: AuditStats,
): Promise<RecipeAuditRow> {
  const keywords = buildMealKitSearchKeywords(recipeName);
  const attempts: Array<{ keyword: string; products: ShoppingProduct[] }> = [];
  const limit = SHOPPING_CONFIG.maxProductsPerIngredient;

  for (const keyword of keywords) {
    let result = await searchProducts(baseUrl, keyword, limit);
    stats.apiRequestCount += 1;

    if (result.rateLimited) {
      stats.rateLimitEvents += 1;
      await sleep(RATE_LIMIT_COOLDOWN_MS);
      result = await searchProducts(baseUrl, keyword, limit);
      stats.apiRequestCount += 1;
      if (result.rateLimited) {
        break;
      }
    }

    attempts.push({ keyword, products: result.products });

    const interim = mergeSearchResults(recipeName, attempts);
    if (interim.matchQuality === 'HIGH') break;

    await sleep(REQUEST_DELAY_MS);
  }

  const merged = mergeSearchResults(recipeName, attempts);

  return {
    recipeId,
    recipeName,
    foodCategory: inferFoodCategory(recipeName, tags),
    matchQuality: merged.matchQuality,
    searchKeyword: merged.searchKeyword,
    products: merged.products,
    notes: merged.notes,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]!, current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function pct(n: number, total: number): string {
  return total === 0 ? '0.0%' : `${((n / total) * 100).toFixed(1)}%`;
}

function buildCategoryStats(rows: RecipeAuditRow[]): Record<FoodCategoryBucket, { high: number; medium: number; total: number }> {
  const buckets: Record<FoodCategoryBucket, { high: number; medium: number; total: number }> = {
    '찌개/전골/국': { high: 0, medium: 0, total: 0 },
    볶음: { high: 0, medium: 0, total: 0 },
    덮밥: { high: 0, medium: 0, total: 0 },
    면: { high: 0, medium: 0, total: 0 },
    샐러드: { high: 0, medium: 0, total: 0 },
    야식: { high: 0, medium: 0, total: 0 },
    간식: { high: 0, medium: 0, total: 0 },
    기타: { high: 0, medium: 0, total: 0 },
  };

  for (const row of rows) {
    const bucket = buckets[row.foodCategory];
    bucket.total += 1;
    if (row.matchQuality === 'HIGH') bucket.high += 1;
    if (row.matchQuality === 'MEDIUM') bucket.medium += 1;
  }

  return buckets;
}

function recommendVerdict(high: number, medium: number, total: number): string {
  const eligible = high + medium;
  const ratio = eligible / total;
  if (high >= 80 && ratio >= 0.35) return 'MEALKIT_V1_GO';
  if (eligible >= 60 && ratio >= 0.2) return 'MEALKIT_V1_LIMITED_GO';
  return 'MEALKIT_V1_HOLD';
}

function formatReport(
  rows: RecipeAuditRow[],
  stats: AuditStats,
  proxyBase: string,
): string {
  const eligible = stats.high + stats.medium;
  const categoryStats = buildCategoryStats(rows);

  const bestCategories = Object.entries(categoryStats)
    .filter(([, v]) => v.total >= 5)
    .map(([name, v]) => ({
      name,
      ratio: (v.high + v.medium) / v.total,
      eligible: v.high + v.medium,
      total: v.total,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const weakCategories = [...bestCategories].reverse();

  const highRows = rows.filter((r) => r.matchQuality === 'HIGH');
  const mediumRows = rows.filter((r) => r.matchQuality === 'MEDIUM');
  const falsePositives = rows.filter((r) => r.matchQuality === 'LOW' && r.notes.includes('weak_or_unrelated'));

  const highList = highRows
    .slice(0, 40)
    .map(
      (r) =>
        `- ${r.recipeId} | ${r.recipeName} | kw: ${r.searchKeyword ?? '-'} | ${r.products
          .map((p) => p.productTitle)
          .slice(0, 2)
          .join(' / ')}`,
    )
    .join('\n');

  const mediumList = mediumRows
    .slice(0, 30)
    .map(
      (r) =>
        `- ${r.recipeId} | ${r.recipeName} | kw: ${r.searchKeyword ?? '-'} | ${r.products
          .map((p) => p.productTitle)
          .slice(0, 1)
          .join('')}`,
    )
    .join('\n');

  const fpList = falsePositives
    .slice(0, 10)
    .map((r) => `- ${r.recipeName}: ${r.products.map((p) => p.productTitle).join(' | ') || r.notes.join(', ')}`)
    .join('\n');

  const verdict = recommendVerdict(stats.high, stats.medium, stats.totalRecipes);

  return `# MEAL_KIT_MATCHING_AUDIT_REPORT

Generated: ${new Date().toISOString()}
Proxy: ${proxyBase.replace(/https?:\/\//, '')}

## Detail Hero (same session)

DETAIL_HERO_ROOT_CAUSE: Recipe detail used \`FocalMealImage\` with full \`focalScale\` (128% height). Home hero uses \`HomeHeroFocalImage\` where \`style={{ height: '100%' }}\` overrides layout zoom — detail showed over-cropped food.

DETAIL_HERO_FIX: \`RecipeHeroImage\` now reuses \`HomeHeroFocalImage\` + \`imageFill\` (100% height override). Container height / mascot / gradient unchanged.

DETAIL_HERO_REGRESSION: Alternative cards still use \`FocalMealImage\` with lower \`focalScale\`. Verify on device: omelette, stew, rice bowl, noodles, salad, stir-fry.

---

## Meal Kit Audit Summary

TOTAL_RECIPES: ${stats.totalRecipes}
HIGH_COUNT: ${stats.high}
MEDIUM_COUNT: ${stats.medium}
LOW_COUNT: ${stats.low}
NONE_COUNT: ${stats.none}
ELIGIBLE_PERCENT: ${pct(eligible, stats.totalRecipes)} (${eligible} / ${stats.totalRecipes})

V1_RECOMMENDED_RECIPE_COUNT: HIGH=${stats.high} (activate), MEDIUM=${stats.medium} (review)

API_REQUEST_COUNT: ${stats.apiRequestCount}
RATE_LIMIT_EVENTS: ${stats.rateLimitEvents}

## Category Analysis (HIGH+MEDIUM / total, min 5 recipes)

BEST_MATCHING_CATEGORIES:
${bestCategories
  .slice(0, 5)
  .map((c) => `- ${c.name}: ${pct(c.eligible, c.total)} (${c.eligible}/${c.total})`)
  .join('\n')}

WEAK_MATCHING_CATEGORIES:
${weakCategories
  .slice(0, 5)
  .map((c) => `- ${c.name}: ${pct(c.eligible, c.total)} (${c.eligible}/${c.total})`)
  .join('\n')}

## HIGH_MATCH_RECIPES (sample)

${highList || '(none)'}

## MEDIUM_MATCH_RECIPES (sample)

${mediumList || '(none)'}

## FALSE_POSITIVE_EXAMPLES

${fpList || '(none flagged)'}

## Verdict

${verdict}

## MODIFIED_FILES

- components/recipe/RecipeHeroImage.tsx
- components/home/HomeHeroFocalImage.tsx
- scripts/test-detail-hero-parity.ts
- scripts/test-android-final-device-qa.ts
- scripts/mealKitAudit/classifyMealKitMatch.ts
- scripts/audit-meal-kit-matching.ts
- scripts/test-meal-kit-match-classifier.ts

## TESTS

- npx tsx scripts/test-detail-hero-parity.ts
- npx tsx scripts/test-meal-kit-match-classifier.ts
`;
}

async function main(): Promise<void> {
  loadDotEnv();
  const baseUrl = resolveProxyBaseUrl();
  const concurrency = Math.max(1, SHOPPING_CONFIG.maxConcurrentSearches);

  console.log(`Meal kit audit — ${HANKKI_RECIPES.length} recipes`);
  console.log(`Proxy: ${baseUrl}`);
  console.log(`Concurrency: ${concurrency}\n`);

  const stats: AuditStats = {
    totalRecipes: HANKKI_RECIPES.length,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
    apiRequestCount: 0,
    rateLimitEvents: 0,
  };

  let completed = 0;
  const rows = await mapWithConcurrency(HANKKI_RECIPES, concurrency, async (recipe) => {
    const row = await auditRecipe(
      baseUrl,
      recipe.id,
      recipe.name,
      [...recipe.tags, ...recipe.category, ...recipe.searchTags],
      stats,
    );
    completed += 1;
    if (completed % 25 === 0 || completed === HANKKI_RECIPES.length) {
      console.log(`  … ${completed}/${HANKKI_RECIPES.length}`);
    }
    return row;
  });

  for (const row of rows) {
    if (row.matchQuality === 'HIGH') stats.high += 1;
    else if (row.matchQuality === 'MEDIUM') stats.medium += 1;
    else if (row.matchQuality === 'LOW') stats.low += 1;
    else stats.none += 1;
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), stats, rows }, null, 2),
    'utf8',
  );
  fs.writeFileSync(OUTPUT_MD, formatReport(rows, stats, baseUrl), 'utf8');

  console.log('\n--- Results ---');
  console.log(`HIGH: ${stats.high} (${pct(stats.high, stats.totalRecipes)})`);
  console.log(`MEDIUM: ${stats.medium} (${pct(stats.medium, stats.totalRecipes)})`);
  console.log(`LOW: ${stats.low}`);
  console.log(`NONE: ${stats.none}`);
  console.log(`Eligible (H+M): ${stats.high + stats.medium} (${pct(stats.high + stats.medium, stats.totalRecipes)})`);
  console.log(`API requests: ${stats.apiRequestCount}, 429 events: ${stats.rateLimitEvents}`);
  console.log(`\nWrote ${OUTPUT_MD}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
