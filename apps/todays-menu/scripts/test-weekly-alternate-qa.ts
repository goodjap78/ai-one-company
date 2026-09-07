/**
 * QA alternate weekly plan control — static + generator smoke.
 * Run: npx tsx scripts/test-weekly-alternate-qa.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { generateToddlerBreakfastWeek } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { generateToddlerDinnerWeek } from '../data/recipes/toddlerDinnerWeeklyPlan';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertUniqueWeek(
  label: string,
  generate: (seed: number) => { ok: boolean; plan?: { slots: { recipeId: string }[]; seed: string } },
): void {
  const a = generate(42);
  const b = generate(43);
  assert(a.ok && Boolean(a.plan), `${label} seed 42 ok`);
  assert(b.ok && Boolean(b.plan), `${label} seed 43 ok`);
  if (!a.ok || !a.plan || !b.ok || !b.plan) return;
  const idsA = a.plan.slots.map((s) => s.recipeId);
  const idsB = b.plan.slots.map((s) => s.recipeId);
  assert(new Set(idsA).size === 7, `${label} 42 unique 7`);
  assert(new Set(idsB).size === 7, `${label} 43 unique 7`);
  assert(idsA.join('|') !== idsB.join('|'), `${label} alternate seed changes week`);
}

console.log('HANKKI Weekly Alternate QA — start\n');

run('QA screen has alternate button + seed debug', () => {
  const qa = read('components/qa/ElementaryWeeklyShareQaScreen.tsx');
  assert(qa.includes('다른 7일 식단 보기'), 'alternate button label');
  assert(qa.includes('handleAlternate') || qa.includes('setSeedsByKey'), 'seed change handler');
  assert(qa.includes('QA seed:'), 'seed shown on QA screen');
  assert(qa.includes('seedsByKey'), 'per audience/meal seeds');
  assert(qa.includes('generateElementaryBreakfastWeek'), 'elem bf');
  assert(qa.includes('generateElementaryDinnerWeek'), 'elem dn');
  assert(qa.includes('generateToddlerBreakfastWeek'), 'tod bf');
  assert(qa.includes('generateToddlerDinnerWeek'), 'tod dn');
});

run('share card still hides seed', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(!card.includes('QA seed'), 'no QA seed on card');
  assert(!card.includes('plan.seed'), 'no plan.seed render');
  assert(!card.includes('SeedMascot'), 'no seed mascot');
});

run('elementary breakfast alternate seeds', () => {
  assertUniqueWeek('elem bf', generateElementaryBreakfastWeek);
});

run('elementary dinner alternate seeds', () => {
  assertUniqueWeek('elem dn', generateElementaryDinnerWeek);
});

run('toddler breakfast alternate seeds', () => {
  assertUniqueWeek('tod bf', generateToddlerBreakfastWeek);
});

run('toddler dinner alternate seeds', () => {
  assertUniqueWeek('tod dn', generateToddlerDinnerWeek);
});

run('production generators unchanged API', () => {
  const bf = generateElementaryBreakfastWeek(42);
  const bf2 = generateElementaryBreakfastWeek(42);
  assert(bf.ok && bf2.ok, 'deterministic ok');
  if (bf.ok && bf2.ok && bf.plan && bf2.plan) {
    assert(
      bf.plan.slots.map((s) => s.recipeId).join('|') ===
        bf2.plan.slots.map((s) => s.recipeId).join('|'),
      'same seed deterministic',
    );
  }
});

console.log(`\nHANKKI Weekly Alternate QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
