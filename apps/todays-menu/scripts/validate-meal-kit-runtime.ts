/**
 * HIGH 24 runtime revalidation via production shopping proxy + current guard.
 * Run: npx tsx scripts/validate-meal-kit-runtime.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { MEAL_KIT_HIGH_ELIGIBILITY } from '../data/shopping/mealKitHighEligibility';
import {
  explainMealKitProduct,
  filterMealKitProducts,
  MEAL_KIT_MAX_PRODUCTS,
} from '../services/shopping/mealKit/filterMealKitProducts';
import type { ShoppingProduct } from '../types/shoppingProduct';

const APP_ROOT = path.resolve(__dirname, '..');
const SEARCH_PATH = '/api/shopping/coupang/search';
const OUTPUT_JSON = path.join(APP_ROOT, 'docs', 'meal-kit-runtime-validation.json');

type RuntimeRow = {
  recipeId: string;
  recipeName: string;
  searchKeyword: string;
  rawProductCount: number;
  validProductCount: number;
  finalStatus: 'PASS' | 'FAIL';
  rawTitles: string[];
  validTitles: string[];
  rejected: Array<{ title: string; reason: string }>;
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

async function main(): Promise<void> {
  loadDotEnv();
  const baseUrl = resolveProxyBaseUrl();
  const limit = SHOPPING_CONFIG.maxMealKitSearchResults;
  const rows: RuntimeRow[] = [];

  console.log(`HIGH runtime validation — ${MEAL_KIT_HIGH_ELIGIBILITY.length} recipes`);
  console.log(`Proxy: ${baseUrl}`);
  console.log(`Fetch limit: ${limit} → filter max ${MEAL_KIT_MAX_PRODUCTS}\n`);

  for (const entry of MEAL_KIT_HIGH_ELIGIBILITY) {
    let result = await searchProducts(baseUrl, entry.searchKeyword, limit);
    if (result.rateLimited) {
      console.log(`  429 ${entry.recipeId} ${entry.recipeName} — cooldown`);
      await sleep(8000);
      result = await searchProducts(baseUrl, entry.searchKeyword, limit);
    }

    const rejected = result.products
      .map((product) => ({
        title: product.title,
        reason: explainMealKitProduct(entry.recipeName, entry.searchKeyword, product.title).reason,
      }))
      .filter((row) => row.reason !== 'accepted');

    const valid = filterMealKitProducts(
      entry.recipeName,
      entry.searchKeyword,
      result.products,
    );

    const row: RuntimeRow = {
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      searchKeyword: entry.searchKeyword,
      rawProductCount: result.products.length,
      validProductCount: valid.length,
      finalStatus: valid.length > 0 ? 'PASS' : 'FAIL',
      rawTitles: result.products.map((product) => product.title),
      validTitles: valid.map((product) => product.title),
      rejected,
    };
    rows.push(row);
    console.log(
      `  ${row.finalStatus} ${entry.recipeId} ${entry.recipeName} raw=${row.rawProductCount} valid=${row.validProductCount}`,
    );
    await sleep(400);
  }

  const pass = rows.filter((row) => row.finalStatus === 'PASS');
  const fail = rows.filter((row) => row.finalStatus === 'FAIL');

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        proxy: baseUrl,
        fetchLimit: limit,
        passCount: pass.length,
        failCount: fail.length,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\nPASS ${pass.length} / FAIL ${fail.length}`);
  console.log(`Wrote ${OUTPUT_JSON}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
