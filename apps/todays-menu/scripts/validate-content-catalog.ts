/**
 * Sprint 46-B — validate content catalog index over production recipes.
 * Run: npm run validate:content-catalog
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listRegisteredCollectionIds } from '../data/content/collections/collectionRegistry';
import { isCollectionId } from '../data/content/types/contentBase';
import {
  buildContentCatalogIndex,
  getContentIdsByCollection,
  getContentIdsByType,
} from '../data/content/index/buildContentCatalogIndex';
import type { ContentBase } from '../data/content/types/contentBase';

const REGISTERED_COLLECTION_IDS = new Set(listRegisteredCollectionIds());
const RECIPE_COUNT = HANKKI_RECIPES.length;

type CheckResult = { ok: boolean; message: string };

function check(ok: boolean, message: string): CheckResult {
  return { ok, message };
}

function runChecks(): CheckResult[] {
  const results: CheckResult[] = [];
  const ids = new Set<string>();

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
  }

  const index = buildContentCatalogIndex(HANKKI_RECIPES);

  results.push(
    check(index.byId.size === RECIPE_COUNT, `byId size === ${RECIPE_COUNT} (got ${index.byId.size})`),
  );
  results.push(
    check(
      getContentIdsByCollection(index, 'HOME').size === RECIPE_COUNT,
      `HOME collection size === ${RECIPE_COUNT} (got ${getContentIdsByCollection(index, 'HOME').size})`,
    ),
  );
  results.push(
    check(
      getContentIdsByType(index, 'recipe').size === RECIPE_COUNT,
      `recipe type size === ${RECIPE_COUNT} (got ${getContentIdsByType(index, 'recipe').size})`,
    ),
  );

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

console.log('========== Content Catalog (Sprint 46-B) ==========');
console.log(`recipes: ${RECIPE_COUNT}`);

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
