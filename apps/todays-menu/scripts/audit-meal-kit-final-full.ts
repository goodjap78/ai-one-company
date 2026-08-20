/**
 * Final 300-recipe meal-kit re-audit + Coupang reverse discovery.
 * Does NOT modify catalog, eligibility, or UI.
 * Run: npx tsx scripts/audit-meal-kit-final-full.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { MEAL_KIT_VALIDATED_ELIGIBILITY } from '../data/shopping/mealKitValidatedEligibility';
import { isAcceptableMealKitProduct } from '../services/shopping/mealKit/filterMealKitProducts';
import type { ShoppingProduct } from '../types/shoppingProduct';
import { findCatalogDuplicate, normalizeMenuName } from './mealKitAudit/catalogNameMatch';
import { countDistinctBrands, extractDishNameFromTitle } from './mealKitAudit/extractDishFromTitle';
import {
  createProxySearchClient,
  loadDotEnv,
  resolveProxyBaseUrl,
} from './mealKitAudit/proxySearchCache';

const APP_ROOT = path.resolve(__dirname, '..');
const FETCH_LIMIT = 8;
const PREVIOUS_ELIGIBLE = new Set(MEAL_KIT_VALIDATED_ELIGIBILITY.map((row) => row.recipeId));

const DISCOVERY_QUERIES = [
  '찌개 밀키트',
  '전골 밀키트',
  '국 밀키트',
  '탕 밀키트',
  '볶음 밀키트',
  '면 밀키트',
  '분식 밀키트',
  '캠핑 밀키트',
  '한식 밀키트',
  '해산물 밀키트',
  '야식 밀키트',
  '홈파티 밀키트',
  '밀키트 2인분',
  '나베 밀키트',
  '샤브 밀키트',
  '구이 밀키트',
  '찜 밀키트',
  '조림 밀키트',
  '덮밥 밀키트',
  '불고기 전골 밀키트',
] as const;

export type FinalAuditStatus = 'STRONG' | 'VALID' | 'WEAK' | 'NONE';

type CatalogAuditRow = {
  recipeId: string;
  recipeName: string;
  category: string[];
  searchQueries: string[];
  productsChecked: number;
  validProductCount: number;
  clearMealKitCount: number;
  validProductTitles: string[];
  status: FinalAuditStatus;
  vsPrevious: 'KEEP' | 'ADD' | 'REMOVE' | 'STAY_OUT';
};

type ExpansionCandidate = {
  menu: string;
  suggestedCategory: string;
  validProductCount: number;
  clearMealKitCount: number;
  validTitles: string[];
  mealKitAvailability: number;
  productDiversity: number;
  hankkiFit: number;
  cookability: number;
  distinctiveness: number;
  score: number;
  duplicateCheck: string;
  matchedRecipeName?: string;
  decision: 'STRONG_ADD_CANDIDATE' | 'ADD_CANDIDATE' | 'REVIEW' | 'DROP';
  reason: string;
};

function hasMealKitTerm(title: string): boolean {
  return /밀키트|mealkit|meal\s*kit/i.test(title);
}

function classifyStatus(validTitles: string[]): FinalAuditStatus {
  const clear = validTitles.filter(hasMealKitTerm);
  if (clear.length >= 2 && new Set(clear).size >= 2) return 'STRONG';
  if (clear.length >= 1) return 'VALID';
  if (validTitles.length >= 1) return 'WEAK';
  return 'NONE';
}

function vsPrevious(recipeId: string, status: FinalAuditStatus): CatalogAuditRow['vsPrevious'] {
  const wasEligible = PREVIOUS_ELIGIBLE.has(recipeId);
  const nowEligible = status === 'STRONG' || status === 'VALID';
  if (wasEligible && nowEligible) return 'KEEP';
  if (!wasEligible && nowEligible) return 'ADD';
  if (wasEligible && !nowEligible) return 'REMOVE';
  return 'STAY_OUT';
}

function buildQueries(recipeName: string): string[] {
  const queries = [`${recipeName} 밀키트`];
  const compact = recipeName.replace(/\s+/g, '');
  if (compact !== recipeName) queries.push(`${compact} 밀키트`);
  return queries;
}

function suggestCategory(menu: string): string {
  if (/찌개|전골|탕|국/.test(menu)) return '찌개/전골/국';
  if (/면|국수|파스타|우동|냉면|라면/.test(menu)) return '면';
  if (/볶음|제육|불고기|닭갈비/.test(menu)) return '볶음';
  if (/덮밥|볶음밥|비빔밥/.test(menu)) return '덮밥';
  if (/떡볶이|순대|튀김|핫도그/.test(menu)) return '분식/야식';
  if (/나베|샤브|감바스|파스타/.test(menu)) return '홈파티/캠핑';
  return '기타';
}

function scoreCandidate(
  menu: string,
  validTitles: string[],
  duplicate: ReturnType<typeof findCatalogDuplicate>,
): Omit<ExpansionCandidate, 'menu' | 'suggestedCategory' | 'validTitles' | 'reason'> {
  const clear = validTitles.filter(hasMealKitTerm);
  const mealKitAvailability = Math.min(5, clear.length >= 3 ? 5 : clear.length === 2 ? 4 : clear.length === 1 ? 2 : 0);
  const productDiversity = Math.min(5, countDistinctBrands(validTitles));
  const category = suggestCategory(menu);
  const hankkiFit = category === '기타' ? 2 : category.includes('홈파티') ? 3 : 5;
  const cookability = /치즈볼|감자튀김|핫도그/.test(menu) ? 2 : 5;
  const distinctiveness = duplicate.status === 'NEW' ? 5 : 1;
  const score =
    mealKitAvailability + productDiversity + hankkiFit + cookability + distinctiveness;
  let decision: ExpansionCandidate['decision'] = 'DROP';
  if (score >= 20) decision = 'STRONG_ADD_CANDIDATE';
  else if (score >= 16) decision = 'ADD_CANDIDATE';
  else if (score >= 12) decision = 'REVIEW';
  return {
    validProductCount: validTitles.length,
    clearMealKitCount: clear.length,
    mealKitAvailability,
    productDiversity,
    hankkiFit,
    cookability,
    distinctiveness,
    score,
    duplicateCheck: duplicate.status,
    matchedRecipeName: duplicate.matchedRecipeName,
    decision,
  };
}

function guessMainIngredients(menu: string): string {
  if (menu.includes('김치찌개')) return '김치, 돼지고기, 두부, 대파';
  if (menu.includes('된장찌개')) return '된장, 두부, 호박, 양파';
  if (menu.includes('부대찌개')) return '햄, 소시지, 김치, 라면사리';
  if (menu.includes('전골') || menu.includes('나베') || menu.includes('샤브')) {
    return '소고기 또는 해산물, 모둠채소, 육수';
  }
  if (menu.includes('볶음')) return '주단백질, 양파, 대파, 양념';
  if (menu.includes('탕') || menu.includes('국')) return '주재료, 육수, 대파';
  if (menu.includes('면') || menu.includes('국수') || menu.includes('칼국수')) {
    return '면, 육수 또는 소스, 채소';
  }
  return '주재료, 양념, 기본 채소';
}

function guessDifficulty(menu: string): string {
  if (/전골|나베|찜/.test(menu)) return '보통';
  if (/찌개|볶음|국/.test(menu)) return '쉬움';
  return '보통';
}

async function auditRecipe(
  search: (keyword: string, limit: number) => Promise<ShoppingProduct[]>,
  recipeId: string,
  recipeName: string,
  category: string[],
): Promise<CatalogAuditRow> {
  const queries = buildQueries(recipeName);
  const used: string[] = [];
  let products: ShoppingProduct[] = [];

  for (const query of queries) {
    used.push(query);
    products = await search(query, FETCH_LIMIT);
    const validProbe = products.filter((product) =>
      isAcceptableMealKitProduct(recipeName, query, product.title),
    );
    if (validProbe.length > 0) break;
  }

  if (products.every((product) => !isAcceptableMealKitProduct(recipeName, used[used.length - 1]!, product.title))) {
    const fallback = `${recipeName} 간편식`;
    if (!used.includes(fallback)) {
      used.push(fallback);
      const extra = await search(fallback, FETCH_LIMIT);
      if (extra.length > 0) products = extra;
    }
  }

  const lastQuery = used[used.length - 1] ?? `${recipeName} 밀키트`;
  const validTitles = products
    .filter((product) => isAcceptableMealKitProduct(recipeName, lastQuery, product.title))
    .map((product) => product.title);
  const status = classifyStatus(validTitles);

  return {
    recipeId,
    recipeName,
    category,
    searchQueries: used,
    productsChecked: products.length,
    validProductCount: validTitles.length,
    clearMealKitCount: validTitles.filter(hasMealKitTerm).length,
    validProductTitles: validTitles.slice(0, 5),
    status,
    vsPrevious: vsPrevious(recipeId, status),
  };
}

function writeCatalogReport(rows: CatalogAuditRow[], stats: { apiRequestCount: number; rateLimitEvents: number }): string {
  const strong = rows.filter((row) => row.status === 'STRONG');
  const valid = rows.filter((row) => row.status === 'VALID');
  const weak = rows.filter((row) => row.status === 'WEAK');
  const none = rows.filter((row) => row.status === 'NONE');
  const keep = rows.filter((row) => row.vsPrevious === 'KEEP');
  const add = rows.filter((row) => row.vsPrevious === 'ADD');
  const remove = rows.filter((row) => row.vsPrevious === 'REMOVE');
  const recommended = [...strong, ...valid];

  const changeLines = rows
    .filter((row) => row.vsPrevious !== 'STAY_OUT')
    .map(
      (row) =>
        `| ${row.recipeId} | ${row.recipeName} | ${PREVIOUS_ELIGIBLE.has(row.recipeId) ? 'Y' : 'N'} | ${row.status} | ${row.vsPrevious} | ${row.validProductCount} |`,
    );

  return `# MEAL_KIT_FINAL_FULL_AUDIT

Generated: ${new Date().toISOString()}

TOTAL_RECIPES: ${rows.length}
PREVIOUS_ELIGIBLE: 23

FINAL_STRONG: ${strong.length}
FINAL_VALID: ${valid.length}
FINAL_WEAK: ${weak.length}
FINAL_NONE: ${none.length}

KEEP: ${keep.length}
ADD: ${add.length}
REMOVE: ${remove.length}

FINAL_RECOMMENDED_ELIGIBLE: ${recommended.length} (STRONG + VALID)

## Change vs previous 23

| recipeId | recipeName | previous | status | action | validCount |
|----------|------------|----------|--------|--------|------------|
${changeLines.join('\n')}

## ADD (false negatives / newly eligible)

${add.map((row) => `- ${row.recipeId} ${row.recipeName} [${row.status}] valid=${row.validProductCount} — ${row.validProductTitles[0] ?? ''}`).join('\n') || '(none)'}

## REMOVE (previous 23, now WEAK/NONE)

${remove.map((row) => `- ${row.recipeId} ${row.recipeName} [${row.status}] valid=${row.validProductCount}`).join('\n') || '(none)'}

## FALSE_NEGATIVES_FOUND

Previous audit/eligibility missed these catalog menus that now have STRONG/VALID meal kits:

${add.map((row) => `- ${row.recipeName} (${row.recipeId})`).join('\n') || '(none)'}

## FALSE_POSITIVES_FOUND

Previous eligible menus that no longer have a clear meal-kit hit:

${remove.map((row) => `- ${row.recipeName} (${row.recipeId})`).join('\n') || '(none)'}

## STRONG sample

${strong.slice(0, 30).map((row) => `- ${row.recipeId} ${row.recipeName} (${row.validProductCount})`).join('\n')}

API_REQUEST_COUNT: ${stats.apiRequestCount}
RATE_LIMIT_EVENTS: ${stats.rateLimitEvents}

Note: production eligibility file was NOT updated. This report is discovery-only.
`;
}

function writeExpansionReport(candidates: ExpansionCandidate[]): string {
  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  const strong = ranked.filter((row) => row.decision === 'STRONG_ADD_CANDIDATE');
  const add = ranked.filter((row) => row.decision === 'ADD_CANDIDATE');
  const review = ranked.filter((row) => row.decision === 'REVIEW');
  const drop = ranked.filter((row) => row.decision === 'DROP');
  const fresh = ranked.filter((row) => row.duplicateCheck === 'NEW' && row.decision !== 'DROP');

  const table = ranked
    .map(
      (row, index) =>
        `| ${index + 1} | ${row.menu} | ${row.suggestedCategory} | ${row.validProductCount} | ${row.productDiversity} | ${row.mealKitAvailability} | ${row.hankkiFit} | ${row.cookability} | ${row.distinctiveness} | ${row.score}/25 | ${row.duplicateCheck}${row.matchedRecipeName ? ` (${row.matchedRecipeName})` : ''} | ${row.decision} | ${row.reason} |`,
    )
    .join('\n');

  const top10 = fresh.slice(0, 10);
  const next20 = fresh.slice(10, 30);

  return `# MEAL_KIT_CATALOG_EXPANSION_CANDIDATES

Generated: ${new Date().toISOString()}

Discovery used category Coupang queries, then extracted dish names from live product titles.
No example dish list was used as the result set.

STRONG_ADD_CANDIDATE: ${strong.length}
ADD_CANDIDATE: ${add.length}
REVIEW: ${review.length}
DROP: ${drop.length}

## Table

| Rank | Menu | Suggested Category | Valid Product Count | Product Diversity | Meal Kit Availability | HANKKI Fit | Cookability | Distinctiveness | Score /25 | Duplicate Check | Decision | Reason |
|------|------|--------------------|---------------------|-------------------|-----------------------|------------|-------------|-----------------|-----------|-----------------|----------|--------|
${table}

## TOP_10_NEW_MENU_RECOMMENDATIONS

${top10
  .map(
    (row, index) => `### ${index + 1}. ${row.menu}

- 추천 이유: ${row.reason}
- Coupang 유효 밀키트 수: ${row.clearMealKitCount} (guard-valid ${row.validProductCount})
- 기존 HANKKI 중복 여부: ${row.duplicateCheck}
- 추천 category: ${row.suggestedCategory}
- 예상 main ingredients: ${guessMainIngredients(row.menu)}
- 예상 cooking difficulty: ${guessDifficulty(row.menu)}
- 왜 추가 가치가 있는지: 실제 밀키트 유통이 확인됐고, 집에서 한 끼로 자연스러우며 catalog와 구분됩니다.
- 대표 상품: ${row.validTitles.slice(0, 2).join(' / ') || '-'}
`,
  )
  .join('\n')}

## NEXT_20_CANDIDATES

${next20.map((row, index) => `${index + 11}. ${row.menu} — ${row.decision} ${row.score}/25 (${row.suggestedCategory})`).join('\n') || '(fewer than 10 fresh candidates)'}
`;
}

async function main(): Promise<void> {
  loadDotEnv(APP_ROOT);
  const proxy = resolveProxyBaseUrl();
  const client = createProxySearchClient({ delayMs: 450, cooldownMs: 10000 });
  console.log(`Final meal-kit audit — ${HANKKI_RECIPES.length} recipes`);
  console.log(`Proxy: ${proxy}\n`);

  const catalogRows: CatalogAuditRow[] = [];
  let index = 0;
  for (const recipe of HANKKI_RECIPES) {
    index += 1;
    const row = await auditRecipe(client.search, recipe.id, recipe.name, recipe.category);
    catalogRows.push(row);
    if (index % 25 === 0 || index === HANKKI_RECIPES.length) {
      console.log(`  catalog ${index}/${HANKKI_RECIPES.length} (api=${client.stats().apiRequestCount}, 429=${client.stats().rateLimitEvents})`);
    }
  }

  console.log('\nDiscovery category searches…');
  const extracted = new Map<string, string[]>();
  for (const query of DISCOVERY_QUERIES) {
    const products = await client.search(query, FETCH_LIMIT);
    for (const product of products) {
      const dish = extractDishNameFromTitle(product.title);
      if (!dish) continue;
      const key = normalizeMenuName(dish);
      if (!key) continue;
      const titles = extracted.get(key) ?? [];
      titles.push(product.title);
      extracted.set(key, titles);
    }
  }

  const catalogMenus = HANKKI_RECIPES.map((recipe) => ({
    recipeId: recipe.id,
    recipeName: recipe.name,
  }));

  const uniqueDishes = [...extracted.entries()]
    .map(([key, titles]) => {
      const sampleTitle = titles[0] ?? '';
      const menu = extractDishNameFromTitle(sampleTitle) ?? key;
      return { menu, titles: [...new Set(titles)] };
    })
    .filter((row) => row.menu.length >= 2);

  console.log(`  extracted ${uniqueDishes.length} dish-like names — verifying NEW ones`);

  const candidates: ExpansionCandidate[] = [];
  for (const dish of uniqueDishes) {
    const duplicate = findCatalogDuplicate(dish.menu, catalogMenus);
    if (duplicate.status === 'POSSIBLE_DUPLICATE') {
      candidates.push({
        menu: dish.menu,
        suggestedCategory: suggestCategory(dish.menu),
        validTitles: dish.titles.slice(0, 3),
        reason: `catalog duplicate of ${duplicate.matchedRecipeName ?? 'existing'}`,
        ...scoreCandidate(dish.menu, dish.titles, duplicate),
        decision: 'DROP',
        distinctiveness: 1,
        score: Math.min(11, scoreCandidate(dish.menu, dish.titles, duplicate).score),
      });
      continue;
    }

    const verify = await client.search(`${dish.menu} 밀키트`, FETCH_LIMIT);
    const validTitles = verify
      .filter((product) => isAcceptableMealKitProduct(dish.menu, `${dish.menu} 밀키트`, product.title))
      .map((product) => product.title);
    const scored = scoreCandidate(dish.menu, validTitles, duplicate);
    candidates.push({
      menu: dish.menu,
      suggestedCategory: suggestCategory(dish.menu),
      validTitles: validTitles.slice(0, 5),
      reason:
        scored.decision === 'DROP'
          ? '검증 검색에서 안정적 밀키트가 부족하거나 HANKKI 적합도가 낮음'
          : `${scored.clearMealKitCount}개 밀키트 확인, ${scored.productDiversity}개 브랜드 추정, catalog 미중복`,
      ...scored,
    });
  }

  const stats = client.stats();
  const catalogJson = {
    generatedAt: new Date().toISOString(),
    proxy,
    fetchLimit: FETCH_LIMIT,
    stats,
    previousEligible: [...PREVIOUS_ELIGIBLE],
    rows: catalogRows,
  };
  const expansionJson = {
    generatedAt: new Date().toISOString(),
    proxy,
    discoveryQueries: DISCOVERY_QUERIES,
    stats,
    candidates,
  };

  fs.mkdirSync(path.join(APP_ROOT, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(APP_ROOT, 'docs', 'meal-kit-final-audit-results.json'),
    JSON.stringify(catalogJson, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(APP_ROOT, 'docs', 'meal-kit-catalog-expansion-candidates.json'),
    JSON.stringify(expansionJson, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(APP_ROOT, 'docs', 'MEAL_KIT_FINAL_FULL_AUDIT.md'),
    writeCatalogReport(catalogRows, stats),
    'utf8',
  );
  fs.writeFileSync(
    path.join(APP_ROOT, 'docs', 'MEAL_KIT_CATALOG_EXPANSION_CANDIDATES.md'),
    writeExpansionReport(candidates),
    'utf8',
  );

  const recommended = catalogRows.filter((row) => row.status === 'STRONG' || row.status === 'VALID');
  const freshStrong = candidates.filter(
    (row) => row.decision === 'STRONG_ADD_CANDIDATE' && row.duplicateCheck === 'NEW',
  );
  const freshAdd = candidates.filter(
    (row) => row.decision === 'ADD_CANDIDATE' && row.duplicateCheck === 'NEW',
  );

  console.log('\n--- FINAL ---');
  console.log(`EXISTING_300_AUDIT: ${catalogRows.length}`);
  console.log(`FINAL_ELIGIBLE: ${recommended.length}`);
  console.log(`NEW_STRONG_CANDIDATES: ${freshStrong.length}`);
  console.log(`NEW_ADD_CANDIDATES: ${freshAdd.length}`);
  console.log(`API_REQUEST_COUNT: ${stats.apiRequestCount}`);
  console.log(`RATE_LIMIT_EVENTS: ${stats.rateLimitEvents}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
