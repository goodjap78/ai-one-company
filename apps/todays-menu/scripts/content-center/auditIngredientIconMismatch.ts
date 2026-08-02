/**
 * Text-only audit of ingredient iconKey mismatches (no PNG require()).
 * npx tsx scripts/content-center/auditIngredientIconMismatch.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { listHankkiRecipes } from '../../data/recipes/hankkiRecipes';
import { lookupIngredientAlias } from '../../data/ingredients/ingredientAliases';

function expectedIconKey(name: string): string | null {
  const n = name.replace(/\s+/g, '');
  if (/어묵|오뎅/.test(n)) return 'fish_cake';
  if (/고등어/.test(n)) return 'mackerel';
  if (/참치/.test(n)) return 'tuna';
  if (/게맛살|맛살/.test(n)) return 'imitation_crab';
  if (n.includes('멸치') && !n.includes('육수')) return 'anchovy';
  if (/유부/.test(n)) return 'fried_tofu';
  if (/^생선$|생선살|생선회/.test(n)) return 'fish_generic';
  if (/오징어/.test(n)) return 'squid';
  if (/낙지/.test(n)) return 'octopus';
  if (/해파리/.test(n)) return 'jellyfish';
  if (/새우젓/.test(n)) return 'salt';
  if (/새우/.test(n)) return 'shrimp';
  if (/연근/.test(n)) return 'lotus_root';
  if (/우엉/.test(n)) return 'burdock';
  if (/햄|^스팸$|스팸/.test(n)) return 'ham';
  if (/소시지/.test(n)) return 'sausage';
  if (/순두부|연두부|^두부$/.test(n) || n === '두부') return 'tofu';
  if (/갈치|북어|조기|삼치|꽁치/.test(n)) return 'fish_generic';
  if (/슬라이스치즈|^치즈$/.test(n)) return 'cheese';
  return null;
}

type Row = {
  recipeId: string;
  recipeName: string;
  ingredient: string;
  currentIconKey: string;
  finalDisplayed: string;
  expected: string;
};

const mismatches: Row[] = [];
let focusOk = 0;

for (const r of listHankkiRecipes()) {
  for (const ing of r.ingredients) {
    const expected = expectedIconKey(ing.name);
    if (!expected) continue;
    const current = (ing.iconKey || '').trim();
    const alias = lookupIngredientAlias(ing.name);
    const finalDisplayed = current || alias || '(none)';
    if (current !== expected) {
      mismatches.push({
        recipeId: r.id,
        recipeName: r.name,
        ingredient: ing.name,
        currentIconKey: current || '(none)',
        finalDisplayed,
        expected,
      });
    } else {
      focusOk += 1;
    }
  }
}

console.log(
  'Recipe ID | Recipe Name | Ingredient | Current iconKey | Final displayed icon | Expected icon',
);
for (const m of mismatches) {
  console.log(
    `${m.recipeId} | ${m.recipeName} | ${m.ingredient} | ${m.currentIconKey} | ${m.finalDisplayed} | ${m.expected}`,
  );
}
console.log('\nMismatch count:', mismatches.length);
console.log('Focus OK count:', focusOk);

const outDir = path.join(
  process.cwd(),
  'generated/ingredient-factory',
);
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'ICON_MISMATCH_AUDIT.json');
fs.writeFileSync(
  out,
  JSON.stringify({ mismatchCount: mismatches.length, focusOk, mismatches }, null, 2),
  'utf8',
);
console.log('Wrote', out);
