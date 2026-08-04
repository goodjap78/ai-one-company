/**
 * Sprint 50 — audit recipe_0141–0160 hero production readiness.
 * Run: npx tsx scripts/audit-side-dish-heroes.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const MEAL_ASSETS_SRC = path.join(APP_ROOT, 'services', 'images', 'mealImageAssets.ts');

const TARGET_IDS = HANKKI_RECIPES
  .filter((r) => /^recipe_01(4[1-9]|5[0-9]|60)$/.test(r.id))
  .map((r) => r.id)
  .sort();

function parseRegistryKeys(): Set<string> {
  const src = fs.readFileSync(MEAL_ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]);
  return keys;
}

const registry = parseRegistryKeys();
const keyCounts = new Map<string, string[]>();

type Row = {
  recipeId: string;
  name: string;
  heroImageKey: string;
  mains: string;
  cookingStyle: string;
  productionJpg: boolean;
  registryKey: boolean;
  duplicateKey: boolean;
};

const rows: Row[] = [];

for (const id of TARGET_IDS) {
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  if (!recipe) continue;
  const key = recipe.heroImageKey;
  const dupList = keyCounts.get(key) ?? [];
  dupList.push(id);
  keyCounts.set(key, dupList);

  const jpgPath = path.join(MEALS_DIR, `${key}.jpg`);
  rows.push({
    recipeId: id,
    name: recipe.name,
    heroImageKey: key,
    mains: recipe.ingredients.filter((i) => i.group === 'main').map((i) => i.name).join(', '),
    cookingStyle: recipe.category.join('/'),
    productionJpg: fs.existsSync(jpgPath),
    registryKey: registry.has(key),
    duplicateKey: false,
  });
}

for (const row of rows) {
  const ids = keyCounts.get(row.heroImageKey) ?? [];
  row.duplicateKey = ids.length > 1;
}

const missing = rows.filter((r) => !r.productionJpg);
const dupes = rows.filter((r) => r.duplicateKey);

console.log('========== Sprint 50 Side Dish Hero Audit (0141–0160) ==========');
console.log(`recipes: ${rows.length}`);
console.log(`production JPG: ${rows.filter((r) => r.productionJpg).length}/${rows.length}`);
console.log(`registry keys: ${rows.filter((r) => r.registryKey).length}/${rows.length}`);
console.log(`duplicate heroImageKey: ${dupes.length}`);
if (dupes.length) {
  for (const d of dupes) console.log(`  DUP ${d.heroImageKey}: ${keyCounts.get(d.heroImageKey)?.join(', ')}`);
}
console.log('---');
for (const r of rows) {
  console.log(
    `${r.recipeId} | ${r.name} | ${r.heroImageKey} | jpg:${r.productionJpg ? 'Y' : 'N'} reg:${r.registryKey ? 'Y' : 'N'} | ${r.mains}`,
  );
}
console.log('================================================================');
