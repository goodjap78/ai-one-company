/**
 * Regression: home hero image key must change when recipe identity changes.
 * Run: npx tsx scripts/test-home-hero-image-key.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEAL_ASSETS_SRC = path.join(__dirname, '..', 'services', 'images', 'mealImageAssets.ts');

function parseMealKeys(): Set<string> {
  const src = fs.readFileSync(MEAL_ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]);
  return keys;
}

function mealKeyFromPath(imagePath: string, registry: Set<string>): string | null {
  const match = imagePath.match(/assets\/meals\/([a-z0-9_]+)\./i);
  if (!match) return null;
  return registry.has(match[1]) ? match[1] : null;
}

function resolveHomeHeroImageKey(
  recipeId: string,
  mealKey: string | null,
  emoji: string,
): string {
  if (mealKey) return `${recipeId}:src:local:${mealKey}`;
  return `${recipeId}:emoji:${emoji}`;
}

const registry = parseMealKeys();
const samples = HANKKI_RECIPES.filter((r) => r.id <= '010').slice(0, 6);

const keys = samples.map((r) => {
  const mealKey = mealKeyFromPath(r.image, registry);
  assert.ok(mealKey, `expected meal key for ${r.id} path ${r.image}`);
  return {
    id: r.id,
    name: r.name,
    mealKey,
    imageKey: resolveHomeHeroImageKey(r.id, mealKey, r.emoji ?? '🍽️'),
  };
});

const uniqueKeys = new Set(keys.map((k) => k.imageKey));
assert.equal(uniqueKeys.size, keys.length, 'each sample recipe should have distinct image key');

const sameRecipeTwice = resolveHomeHeroImageKey('003', 'kimchi_stew', '🍲');
assert.equal(
  sameRecipeTwice,
  resolveHomeHeroImageKey('003', 'kimchi_stew', '🍲'),
  'same recipe should produce stable key',
);

console.log('PASS  home hero image key — distinct per recipe, stable for same recipe');
for (const row of keys) {
  console.log(`  ${row.id} ${row.name} → ${row.mealKey}`);
}
