/**
 * Sprint 46-C — validate unified content catalog (recipes + combos).
 * Run: npm run validate:content-catalog
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { HANKKI_CONTENT_CATALOG } from '../data/content/hankkiContentCatalog';
import { CONVENIENCE_COMBOS } from '../data/content/combos';
import { listRegisteredCollectionIds } from '../data/content/collections/collectionRegistry';
import { isCollectionId } from '../data/content/types/contentBase';
import { STORE_SCOPES } from '../data/content/types/convenienceCombo';
import {
  buildContentCatalogIndex,
  getContentIdsByCollection,
  getContentIdsByType,
} from '../data/content/index/buildContentCatalogIndex';
import type { ConvenienceCombo } from '../data/content/types/convenienceCombo';
import type { ContentBase } from '../data/content/types/contentBase';

const REGISTERED_COLLECTION_IDS = new Set(listRegisteredCollectionIds());
const EXPECTED_RECIPES = 140;
const EXPECTED_COMBOS = 50;
const EXPECTED_TOTAL = 190;
const SOLO_BATCH_IDS = new Set(
  Array.from({ length: 20 }, (_, i) => `recipe_${String(101 + i).padStart(4, '0')}`),
);
const GENERAL_BATCH_IDS = new Set(
  Array.from({ length: 20 }, (_, i) => `recipe_${String(121 + i).padStart(4, '0')}`),
);

type CheckResult = { ok: boolean; message: string };

function check(ok: boolean, message: string): CheckResult {
  return { ok, message };
}

function validateCombos(combos: ConvenienceCombo[]): CheckResult[] {
  const results: CheckResult[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();

  for (const combo of combos) {
    if (!combo.collectionIds.includes('CONVENIENCE')) {
      results.push(check(false, `[${combo.id}] missing CONVENIENCE collection`));
    }

    if (!STORE_SCOPES.includes(combo.storeScope)) {
      results.push(check(false, `[${combo.id}] invalid storeScope: ${combo.storeScope}`));
    }

    if (!combo.items.length) {
      results.push(check(false, `[${combo.id}] empty items`));
    }

    if (!combo.assemblyGuide.length) {
      results.push(check(false, `[${combo.id}] empty assemblyGuide`));
    }

    if (combo.estimatedPriceRange.min < 0 || combo.estimatedPriceRange.max < 0) {
      results.push(check(false, `[${combo.id}] negative price range`));
    }

    if (combo.estimatedPriceRange.min > combo.estimatedPriceRange.max) {
      results.push(check(false, `[${combo.id}] min price > max price`));
    }

    if (combo.calories !== null && combo.calories < 0) {
      results.push(check(false, `[${combo.id}] negative calories`));
    }

    if (ids.has(combo.id)) {
      results.push(check(false, `duplicate combo id: ${combo.id}`));
    }
    ids.add(combo.id);

    const titleKey = combo.title.trim();
    if (titleKey && titles.has(titleKey)) {
      results.push(check(false, `duplicate combo title: ${combo.title}`));
    }
    if (titleKey) titles.add(titleKey);
  }

  return results;
}

function runChecks(): CheckResult[] {
  const results: CheckResult[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();

  for (const recipe of HANKKI_RECIPES) {
    if (recipe.contentType !== 'recipe') {
      results.push(check(false, `[${recipe.id}] contentType is not recipe`));
    }

    if (!recipe.collectionIds.includes('HOME')) {
      results.push(check(false, `[${recipe.id}] missing HOME collection`));
    }

    const uniqueCollections = new Set(recipe.collectionIds);
    if (uniqueCollections.size !== recipe.collectionIds.length) {
      results.push(check(false, `[${recipe.id}] duplicate collectionIds`));
    }

    for (const collectionId of recipe.collectionIds) {
      if (!isCollectionId(collectionId)) {
        results.push(check(false, `[${recipe.id}] unknown collectionId: ${collectionId}`));
      } else if (!REGISTERED_COLLECTION_IDS.has(collectionId)) {
        results.push(check(false, `[${recipe.id}] unregistered collectionId: ${collectionId}`));
      }
    }

    if (ids.has(recipe.id)) {
      results.push(check(false, `duplicate recipe id: ${recipe.id}`));
    }
    ids.add(recipe.id);

    const titleKey = recipe.name.trim();
    if (titleKey && titles.has(titleKey)) {
      results.push(check(false, `duplicate recipe title: ${recipe.name}`));
    }
    if (titleKey) titles.add(titleKey);

    if (SOLO_BATCH_IDS.has(recipe.id) && !recipe.collectionIds.includes('SOLO')) {
      results.push(check(false, `[${recipe.id}] solo batch recipe missing SOLO collection`));
    }

    if (GENERAL_BATCH_IDS.has(recipe.id) && recipe.collectionIds.includes('SOLO')) {
      results.push(check(false, `[${recipe.id}] general batch recipe should not be SOLO`));
    }
  }

  results.push(
    check(HANKKI_RECIPES.length === EXPECTED_RECIPES, `recipe count === ${EXPECTED_RECIPES} (got ${HANKKI_RECIPES.length})`),
  );
  results.push(
    check(CONVENIENCE_COMBOS.length === EXPECTED_COMBOS, `combo count === ${EXPECTED_COMBOS} (got ${CONVENIENCE_COMBOS.length})`),
  );

  const index = HANKKI_CONTENT_CATALOG;

  results.push(
    check(index.byId.size === EXPECTED_TOTAL, `catalog byId size === ${EXPECTED_TOTAL} (got ${index.byId.size})`),
  );
  results.push(
    check(
      getContentIdsByCollection(index, 'HOME').size === EXPECTED_RECIPES,
      `HOME collection size === ${EXPECTED_RECIPES} (got ${getContentIdsByCollection(index, 'HOME').size})`,
    ),
  );
  results.push(
    check(
      getContentIdsByCollection(index, 'CONVENIENCE').size === EXPECTED_COMBOS,
      `CONVENIENCE collection size === ${EXPECTED_COMBOS} (got ${getContentIdsByCollection(index, 'CONVENIENCE').size})`,
    ),
  );
  results.push(
    check(
      getContentIdsByType(index, 'recipe').size === EXPECTED_RECIPES,
      `recipe type size === ${EXPECTED_RECIPES} (got ${getContentIdsByType(index, 'recipe').size})`,
    ),
  );
  results.push(
    check(
      getContentIdsByType(index, 'combo').size === EXPECTED_COMBOS,
      `combo type size === ${EXPECTED_COMBOS} (got ${getContentIdsByType(index, 'combo').size})`,
    ),
  );

  const soloNew = [...SOLO_BATCH_IDS].filter((id) => {
    const item = index.byId.get(id);
    return item?.collectionIds.includes('SOLO');
  });
  results.push(
    check(soloNew.length === 20, `new solo recipes in SOLO: ${soloNew.length}/20`),
  );

  results.push(...validateCombos(CONVENIENCE_COMBOS));

  return results;
}

function runPerformanceCheck(): CheckResult {
  const virtualCount = 1000;
  const virtual: ContentBase[] = Array.from({ length: virtualCount }, (_, index) => ({
    id: `perf_${index}`,
    contentType: 'recipe',
    collectionIds: ['HOME', index % 2 === 0 ? 'SOLO' : 'FAST'],
    title: `Perf Item ${index}`,
    tags: ['perf'],
    status: 'published',
  }));

  const start = performance.now();
  const index = buildContentCatalogIndex(virtual);
  const elapsed = performance.now() - start;

  const ok =
    index.byId.size === virtualCount &&
    getContentIdsByCollection(index, 'HOME').size === virtualCount &&
    elapsed < 50;

  return check(
    ok,
    `1000-item index build in ${elapsed.toFixed(2)}ms (byId=${index.byId.size})`,
  );
}

console.log('========== Content Catalog (Sprint 46-C) ==========');
console.log(`recipes: ${HANKKI_RECIPES.length}`);
console.log(`combos: ${CONVENIENCE_COMBOS.length}`);
console.log(`catalog items: ${HANKKI_CONTENT_CATALOG.byId.size}`);

const checks = runChecks();
const perf = runPerformanceCheck();
const failures = [...checks, perf].filter((item) => !item.ok);

for (const item of checks) {
  console.log(item.ok ? `PASS  ${item.message}` : `FAIL  ${item.message}`);
}
console.log(perf.ok ? `PASS  ${perf.message}` : `FAIL  ${perf.message}`);

console.log('===================================================');
console.log(failures.length === 0 ? 'validation: PASS' : `validation: FAIL (${failures.length})`);

process.exitCode = failures.length === 0 ? 0 : 1;
