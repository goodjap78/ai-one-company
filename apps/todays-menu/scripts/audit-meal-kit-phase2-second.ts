/**
 * Phase 2 second Coupang validation — 4 READY_TO_ADD menus only.
 * Run: npx tsx scripts/audit-meal-kit-phase2-second.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { isAcceptableMealKitProduct } from '../services/shopping/mealKit/filterMealKitProducts';
import {
  createProxySearchClient,
  loadDotEnv,
  resolveProxyBaseUrl,
} from './mealKitAudit/proxySearchCache';
import { PHASE2_MEAL_KIT_SEARCH_KEYWORDS } from '../data/recipes/batches/batch24MealKitPhase2Draft';

const APP_ROOT = path.resolve(__dirname, '..');

const MENUS = [
  { id: 'recipe_0301', name: '밀푀유나베' },
  { id: 'recipe_0302', name: '불고기전골' },
  { id: 'recipe_0303', name: '쭈꾸미볶음' },
  { id: 'recipe_0304', name: '해물탕' },
] as const;

const KNOWN_BRANDS = [
  'MYCHEF',
  '프레시지',
  '프레시밀',
  '고기가좋다',
  '채선당',
  '우본',
  '우주',
  '바다자리',
  '탕선생',
  '간편한수인',
  '쿠킹박스',
];

function inferBrand(title: string): string {
  for (const brand of KNOWN_BRANDS) {
    if (title.includes(brand)) return brand;
  }
  const cleaned = title.replace(/\[.*?\]/g, '').trim();
  return cleaned.slice(0, 10);
}

function finalQuality(
  validCount: number,
  clearCount: number,
  brandCount: number,
): 'STRONG' | 'VALID' | 'WEAK' | 'NONE' {
  if (validCount <= 0) return 'NONE';
  if (validCount === 1) return 'WEAK';
  if (brandCount < 2) return 'VALID';
  if (validCount >= 2 && clearCount >= 2) return 'STRONG';
  return 'VALID';
}

async function main(): Promise<void> {
  loadDotEnv(APP_ROOT);
  const client = createProxySearchClient({ delayMs: 500, cooldownMs: 10000 });
  console.log(`Phase2 second validation — proxy ${resolveProxyBaseUrl()}\n`);

  const rows = [];
  for (const menu of MENUS) {
    const keyword =
      PHASE2_MEAL_KIT_SEARCH_KEYWORDS[menu.id as keyof typeof PHASE2_MEAL_KIT_SEARCH_KEYWORDS];
    const products = await client.search(keyword, 8);
    const valid = products.filter((product) =>
      isAcceptableMealKitProduct(menu.name, keyword, product.title),
    );
    const clear = valid.filter((product) => /밀키트|mealkit/i.test(product.title));
    const brands = [...new Set(valid.map((product) => inferBrand(product.title)))];
    const quality = finalQuality(valid.length, clear.length, brands.length);
    const pass = valid.length >= 2 || quality === 'STRONG';
    rows.push({
      id: menu.id,
      name: menu.name,
      searchKeyword: keyword,
      rawCount: products.length,
      validCount: valid.length,
      clearMealKitCount: clear.length,
      brandDiversity: brands.length,
      brands,
      finalQuality: quality,
      secondValidationPass: pass,
      validTitles: valid.map((product) => product.title),
      rawTitles: products.map((product) => product.title),
    });
    console.log(
      `${menu.name}: raw=${products.length} valid=${valid.length} brands=${brands.length} ${quality} ${pass ? 'PASS' : 'FAIL'}`,
    );
    valid.forEach((product) => console.log(`  + ${product.title}`));
  }

  const out = path.join(APP_ROOT, 'docs', 'meal-kit-phase2-second-validation.json');
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats: client.stats(),
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\nWrote ${out}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
