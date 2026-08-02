/**
 * Validate HANKKI hero runtime mapping — recipe_0101~0140 must resolve to bundled JPGs.
 * Run: npm run validate:hero-runtime
 *
 * Uses source parsing (no Metro require) so mislabeled PNG-as-JPG assets do not break CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const MEAL_ASSETS_SRC = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');
const RECIPE_MAP_SRC = path.join(APP_ROOT, 'data/recipes/recipeImageMap.ts');

const NEW_RECIPE_RE = /^recipe_01(0[1-9]|1[0-9]|2[0-9]|3[0-9]|40)$/;
const LEGACY_RE = /^(0\d{2}|100)$/;

function parseMealRegistryKeys(): Set<string> {
  const src = fs.readFileSync(MEAL_ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    keys.add(m[1] || m[2]);
  }
  return keys;
}

function parseRecipeImageMapKeys(): Map<string, string> {
  const src = fs.readFileSync(RECIPE_MAP_SRC, 'utf8');
  const map = new Map<string, string>();
  const re = /'([^']+)'\s*:\s*\{\s*kind:\s*'local',\s*key:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function parseMealImageKeyFromAssetPath(
  imagePath: string,
  registry: Set<string>,
): string | null {
  const normalized = imagePath.trim().replace(/^\.\//, '').replace(/^\/+/, '');
  const match = normalized.match(/^assets\/meals\/([a-z0-9_]+)\.(?:jpg|jpeg|png)$/i);
  if (!match) return null;
  const key = match[1];
  return registry.has(key) ? key : null;
}

function resolveMapKey(
  recipeId: string,
  heroImageKey: string,
  imagePath: string,
  explicitMap: Map<string, string>,
  registry: Set<string>,
): string | null {
  const direct = explicitMap.get(recipeId);
  if (direct) return direct;

  const fromPath = parseMealImageKeyFromAssetPath(imagePath, registry);
  if (fromPath) return fromPath;

  if (registry.has(heroImageKey)) return heroImageKey;

  return null;
}

type RowResult = {
  recipeId: string;
  heroImageKey: string;
  ok: boolean;
  issues: string[];
};

function validateRecipe(
  recipeId: string,
  registry: Set<string>,
  explicitMap: Map<string, string>,
): RowResult {
  const recipe = HANKKI_RECIPES.find((r) => r.id === recipeId);
  const issues: string[] = [];
  if (!recipe) {
    return { recipeId, heroImageKey: '', ok: false, issues: ['recipe not in catalog'] };
  }

  const { heroImageKey, image: imagePath } = recipe;
  if (!heroImageKey?.trim()) issues.push('missing heroImageKey');
  if (!imagePath?.trim()) issues.push('missing image path');

  const jpg = path.join(MEALS_DIR, `${heroImageKey}.jpg`);
  if (!fs.existsSync(jpg)) {
    issues.push(`missing production JPG: assets/meals/${heroImageKey}.jpg`);
  }

  if (!registry.has(heroImageKey)) {
    issues.push(`mealImageAssets registry missing key: ${heroImageKey}`);
  }

  const resolvedKey = resolveMapKey(recipeId, heroImageKey, imagePath, explicitMap, registry);
  if (!resolvedKey) {
    issues.push('runtime map resolution failed (path + registry)');
  } else if (resolvedKey !== heroImageKey) {
    issues.push(`resolved key mismatch: ${resolvedKey} !== ${heroImageKey}`);
  }

  const pathKey = parseMealImageKeyFromAssetPath(imagePath, registry);
  if (!pathKey) {
    issues.push('getRecipeImageSourceByPath would return null');
  } else if (pathKey !== heroImageKey) {
    issues.push(`path key mismatch: ${pathKey} !== ${heroImageKey}`);
  }

  return { recipeId, heroImageKey, ok: issues.length === 0, issues };
}

function main(): void {
  const registry = parseMealRegistryKeys();
  const explicitMap = parseRecipeImageMapKeys();
  const newRecipes = HANKKI_RECIPES.filter((r) => NEW_RECIPE_RE.test(r.id));
  const legacySample = HANKKI_RECIPES.filter((r) => LEGACY_RE.test(r.id));

  console.log('========== Hero Runtime Mapping ==========');
  console.log(`meal registry keys: ${registry.size}`);
  console.log(`new recipes (0101–0140): ${newRecipes.length}`);

  const newResults = newRecipes.map((r) => validateRecipe(r.id, registry, explicitMap));
  const newFailed = newResults.filter((r) => !r.ok);
  const legacyResults = legacySample.map((r) => validateRecipe(r.id, registry, explicitMap));
  const legacyFailed = legacyResults.filter((r) => !r.ok);

  for (const row of newFailed) {
    console.log(`FAIL  ${row.recipeId} (${row.heroImageKey})`);
    for (const issue of row.issues) console.log(`      - ${issue}`);
  }

  if (newFailed.length === 0) {
    console.log('PASS  recipe_0101~0140 — registry + path resolve (placeholder 0)');
  }

  console.log(`\nlegacy regression (001–100, n=${legacySample.length}):`);
  if (legacyFailed.length === 0) {
    console.log('PASS  legacy catalog — no mapping regressions');
  } else {
    for (const row of legacyFailed) {
      console.log(`FAIL  ${row.recipeId}: ${row.issues.join('; ')}`);
    }
  }

  console.log('==========================================');
  if (newFailed.length > 0 || legacyFailed.length > 0) {
    process.exitCode = 1;
  }
}

main();
