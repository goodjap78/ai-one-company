/**
 * Child Content Expansion Batch #1 — consistency gate for new recipes recipe_0372–0407.
 * Run: npx tsx scripts/test-child-content-expansion-batch1.ts
 */
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const NEW_IDS = Array.from({ length: 36 }, (_, i) => `recipe_${String(372 + i).padStart(4, '0')}`);

let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

type Finding = { id: string; name: string; code: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'; issue: string };
const findings: Finding[] = [];

function push(f: Finding): void {
  findings.push(f);
}

const CORE: Array<{ re: RegExp; keys: RegExp }> = [
  { re: /참치/, keys: /참치|tuna/i },
  { re: /멸치/, keys: /멸치|anchovy/i },
  { re: /계란|에그|스크램블|오믈렛/, keys: /계란|egg/i },
  { re: /소고기|불고기/, keys: /소고기|beef/i },
  { re: /닭|치킨/, keys: /닭|chicken/i },
  { re: /두부/, keys: /두부|tofu/i },
  { re: /김가루|김밥|^김/, keys: /김|seaweed/i },
  { re: /치즈/, keys: /치즈|cheese/i },
  { re: /햄/, keys: /햄|ham/i },
  { re: /바나나/, keys: /바나나|banana/i },
  { re: /사과/, keys: /사과|apple|pear/i },
  { re: /배(?!추)/, keys: /배|pear/i },
  { re: /단호박/, keys: /단호박|pumpkin|sweet_potato/i },
  { re: /브로콜리/, keys: /브로콜리|broccoli/i },
  { re: /애호박/, keys: /애호박|zucchini/i },
  { re: /양배추/, keys: /양배추|cabbage/i },
  { re: /청경채/, keys: /청경채|spinach|cabbage/i },
  { re: /당근/, keys: /당근|carrot/i },
  { re: /감자/, keys: /감자|potato/i },
  { re: /버섯/, keys: /버섯|mushroom/i },
  { re: /콩나물/, keys: /콩나물|bean_sprout|sprout/i },
  { re: /흰살생선|생선/, keys: /흰살생선|생선|fish/i },
  { re: /요거트|요구르트/, keys: /요거트|요구르트|yogurt|milk/i },
  { re: /마요/, keys: /마요|mayo/i },
  { re: /토마토|피자/, keys: /토마토|tomato/i },
  { re: /우동/, keys: /우동|udon|rice_cake/i },
  { re: /토스트|식빵/, keys: /식빵|bread/i },
];

console.log('Child Content Expansion Batch #1 consistency gate — start\n');

assert(HANKKI_RECIPES.length === 447, `catalog 447 (got ${HANKKI_RECIPES.length})`);
assert(NEW_IDS.every((id) => Boolean(getHankkiRecipeById(id))), 'all 36 new recipe ids exist');

const names = HANKKI_RECIPES.map((r) => r.name);
assert(new Set(names).size === names.length, 'no duplicate recipe names in catalog');

for (const id of NEW_IDS) {
  const r = getHankkiRecipeById(id)!;
  const ingBlob = r.ingredients.map((i) => `${i.name} ${i.iconKey}`).join(' ');
  const stepBlob = r.recipe.steps.map((s) => `${s.title} ${s.instruction}`).join(' ');

  for (const rule of CORE) {
    if (!rule.re.test(r.name)) continue;
    if (!rule.keys.test(ingBlob)) {
      push({
        id,
        name: r.name,
        code: 'NAME_CORE_INGREDIENT_MISSING',
        severity: 'CRITICAL',
        issue: `name matches ${rule.re} but ingredients lack match`,
      });
    } else if (!rule.keys.test(stepBlob)) {
      push({
        id,
        name: r.name,
        code: 'NAME_CORE_INGREDIENT_NOT_USED_IN_STEPS',
        severity: 'HIGH',
        issue: `core ingredient for ${rule.re} not used in steps`,
      });
    }
  }

  if (/로제/.test(r.name) && !/토마토|우유|크림|치즈/.test(ingBlob)) {
    push({ id, name: r.name, code: 'STYLE_MISMATCH', severity: 'CRITICAL', issue: 'rose style missing' });
  }
  if (/마요/.test(r.name) && !/마요/.test(ingBlob)) {
    push({ id, name: r.name, code: 'STYLE_MISMATCH', severity: 'HIGH', issue: 'mayo missing' });
  }
  if (/피자/.test(r.name) && !/토마토|치즈/.test(ingBlob)) {
    push({ id, name: r.name, code: 'STYLE_MISMATCH', severity: 'HIGH', issue: 'pizza sauce/cheese missing' });
  }

  if (r.nutrition.source !== 'unverified') {
    push({ id, name: r.name, code: 'NUTRITION_SOURCE', severity: 'MEDIUM', issue: 'nutrition.source not unverified' });
  }

  if (!r.heroImageKey || r.heroImageKey.length < 4) {
    push({ id, name: r.name, code: 'HERO_KEY', severity: 'MEDIUM', issue: 'missing heroImageKey' });
  }

  const allergy = r.standardMetadata.allergyTags ?? [];
  if (/참치|멸치|흰살생선|생선/.test(r.name) && !allergy.includes('fish')) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'fish allergy missing' });
  }
  if (/계란|스크램블|오믈렛/.test(r.name) && !allergy.includes('egg')) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'egg allergy missing' });
  }
  if (/소고기/.test(r.name) && !allergy.includes('beef')) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'beef allergy missing' });
  }
  if (/닭/.test(r.name) && !allergy.includes('chicken')) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'chicken allergy missing' });
  }
  if (/두부/.test(r.name) && !allergy.includes('soy')) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'soy allergy missing' });
  }
  if (/요거트|요구르트|치즈|버터|우유/.test(r.name) && !allergy.includes('milk') && /요거트|요구르트|치즈/.test(r.name)) {
    push({ id, name: r.name, code: 'ALLERGY_MISMATCH', severity: 'HIGH', issue: 'milk allergy missing' });
  }

  if (r.recipe.steps.length < 4 || r.recipe.steps.length > 6) {
    push({ id, name: r.name, code: 'STEP_COUNT', severity: 'MEDIUM', issue: `steps ${r.recipe.steps.length}` });
  }
}

const critical = findings.filter((f) => f.severity === 'CRITICAL');
const high = findings.filter((f) => f.severity === 'HIGH');
const medium = findings.filter((f) => f.severity === 'MEDIUM');

console.log('\nCRITICAL:', critical.length);
for (const f of critical) console.log(`  ${f.id} ${f.name} — ${f.code}: ${f.issue}`);
console.log('HIGH:', high.length);
for (const f of high) console.log(`  ${f.id} ${f.name} — ${f.code}: ${f.issue}`);
console.log('MEDIUM:', medium.length);
for (const f of medium) console.log(`  ${f.id} ${f.name} — ${f.code}: ${f.issue}`);

assert(critical.length === 0, 'CRITICAL_COUNT 0');
assert(high.length === 0, 'HIGH_COUNT 0');

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}
console.log('\nChild Content Expansion Batch #1 consistency gate — pass');
console.log('READY_FOR_BATCH=YES');
