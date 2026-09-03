/**
 * Child image registry + hero runtime QA.
 * Run: npx tsx scripts/test-child-image-registry.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  CHILD_HERO_IMAGE_SPEC,
  CHILD_STEP_IMAGE_SPEC,
} from '../constants/childRecipeImageSpecs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const STEPS_DIR = path.join(APP_ROOT, 'assets', 'recipe-steps');
const MEAL_ASSETS_SRC = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');
const STEP_ASSETS_SRC = path.join(APP_ROOT, 'services/images/recipeStepImageAssets.ts');
const PILOT_QUEUE = path.join(APP_ROOT, 'scripts/reports/child-step-pilot-queue.json');
const BATCH3_PILOT_QUEUE = path.join(APP_ROOT, 'scripts/reports/child-step-pilot-queue-batch3.json');
const BATCH4_PILOT_QUEUE = path.join(APP_ROOT, 'scripts/reports/child-step-pilot-queue-batch4.json');

/** Batch4 step pilot keys pending Gemini credits (regen blocked). */
const BATCH4_STEP_DEFERRED = new Set([
  'toddler_egg_cheese_rice_breakfast_step_02',
  'toddler_egg_bread_snack_step_04',
]);

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
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

function parseRequireKeys(src: string): Set<string> {
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]!);
  return keys;
}

function childAudience(audiences: readonly string[]): boolean {
  return (
    audiences.includes('baby') ||
    audiences.includes('toddler') ||
    audiences.includes('elementary')
  );
}

console.log('Child image registry QA — start\n');

run('child hero runtime — 222/222 registered', () => {
  const registry = parseRequireKeys(fs.readFileSync(MEAL_ASSETS_SRC, 'utf8'));
  const child = HANKKI_RECIPES.filter((r) => childAudience(r.familyAudience.audiences));
  assert(child.length === 222, `child 222 (got ${child.length})`);
  const missing: string[] = [];
  for (const r of child) {
    const key = r.heroImageKey;
    const jpg = path.join(MEALS_DIR, `${key}.jpg`);
    if (!fs.existsSync(jpg) || !registry.has(key)) {
      missing.push(`${r.id}:${key}`);
    }
  }
  assert(missing.length === 0, `child hero runtime missing 0 (got ${missing.length})`);
  const batch4 = child.filter((r) => Number(r.id.replace('recipe_', '')) >= 484);
  assert(batch4.length === 34, `batch4 child heroes 34 (got ${batch4.length})`);
  assert(
    batch4.every((r) => registry.has(r.heroImageKey)),
    'batch4 heroes registered',
  );
});

run('batch4 step pilot registry matches on-disk files', () => {
  const pilot = JSON.parse(fs.readFileSync(BATCH4_PILOT_QUEUE, 'utf8')) as {
    summary: { recipeIds: string[] };
    recipes: Array<{
      recipeId: string;
      stepSlots: { prep: { imageKey: string }; cook: { imageKey: string }; finish: { imageKey: string } };
    }>;
  };
  assert(pilot.summary.recipeIds.length === 16, 'batch4 pilot 16 recipes');
  const stepRegistry = parseRequireKeys(fs.readFileSync(STEP_ASSETS_SRC, 'utf8'));
  const pilotKeys = new Set<string>();
  for (const recipe of pilot.recipes) {
    pilotKeys.add(recipe.stepSlots.prep.imageKey);
    pilotKeys.add(recipe.stepSlots.cook.imageKey);
    pilotKeys.add(recipe.stepSlots.finish.imageKey);
  }
  assert(pilotKeys.size === 48, `batch4 pilot step keys 48 (got ${pilotKeys.size})`);
  const missingKeys: string[] = [];
  for (const key of pilotKeys) {
    if (BATCH4_STEP_DEFERRED.has(key)) continue;
    const jpg = path.join(STEPS_DIR, `${key}.jpg`);
    if (!fs.existsSync(jpg) || !stepRegistry.has(key)) {
      missingKeys.push(key);
    }
  }
  assert(
    missingKeys.length === 0,
    `batch4 pilot registered 46/48 (deferred ${BATCH4_STEP_DEFERRED.size}) missing ${missingKeys.length}`,
  );
  for (const recipe of pilot.recipes) {
    const hankki = HANKKI_RECIPES.find((r) => r.id === recipe.recipeId);
    assert(Boolean(hankki), `${recipe.recipeId} exists`);
    const keys = hankki!.recipe.steps
      .map((s) => s.imageKey)
      .filter((k) => stepRegistry.has(k));
    assert(keys.length >= 2, `${recipe.recipeId} has >=2 registered step images (got ${keys.length})`);
  }
});

run('batch3 step pilot registry matches on-disk files', () => {
  const pilot = JSON.parse(fs.readFileSync(BATCH3_PILOT_QUEUE, 'utf8')) as {
    summary: { recipeIds: string[] };
    recipes: Array<{
      recipeId: string;
      stepSlots: { prep: { imageKey: string }; cook: { imageKey: string }; finish: { imageKey: string } };
    }>;
  };
  assert(pilot.summary.recipeIds.length === 18, 'batch3 pilot 18 recipes');
  const stepRegistry = parseRequireKeys(fs.readFileSync(STEP_ASSETS_SRC, 'utf8'));
  const pilotKeys = new Set<string>();
  for (const recipe of pilot.recipes) {
    pilotKeys.add(recipe.stepSlots.prep.imageKey);
    pilotKeys.add(recipe.stepSlots.cook.imageKey);
    pilotKeys.add(recipe.stepSlots.finish.imageKey);
  }
  assert(pilotKeys.size === 54, `batch3 pilot step keys 54 (got ${pilotKeys.size})`);
  for (const key of pilotKeys) {
    const jpg = path.join(STEPS_DIR, `${key}.jpg`);
    assert(fs.existsSync(jpg), `on disk ${key}`);
    assert(stepRegistry.has(key), `registry has ${key}`);
  }
  for (const recipe of pilot.recipes) {
    const hankki = HANKKI_RECIPES.find((r) => r.id === recipe.recipeId);
    assert(Boolean(hankki), `${recipe.recipeId} exists`);
    const keys = hankki!.recipe.steps
      .map((s) => s.imageKey)
      .filter((k) => stepRegistry.has(k));
    assert(keys.length >= 2, `${recipe.recipeId} has >=2 registered step images (got ${keys.length})`);
  }
});

run('legacy step pilot registry still valid', () => {
  const pilot = JSON.parse(fs.readFileSync(PILOT_QUEUE, 'utf8')) as {
    summary: { recipeIds: string[] };
    recipes: Array<{
      recipeId: string;
      stepSlots: { prep: { imageKey: string }; cook: { imageKey: string }; finish: { imageKey: string } };
    }>;
  };
  assert(pilot.summary.recipeIds.length === 12, 'pilot 12 recipes');
  const stepRegistry = parseRequireKeys(fs.readFileSync(STEP_ASSETS_SRC, 'utf8'));
  const onDisk = fs
    .readdirSync(STEPS_DIR)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => f.replace(/\.jpg$/i, ''));
  assert(onDisk.length >= 35, `step files >= 35 (got ${onDisk.length})`);
  for (const key of onDisk) {
    assert(stepRegistry.has(key), `registry has ${key}`);
  }
  // Prefer distinct prep/cook/finish keys where recipe has them
  for (const recipe of pilot.recipes) {
    const hankki = HANKKI_RECIPES.find((r) => r.id === recipe.recipeId);
    assert(Boolean(hankki), `${recipe.recipeId} exists`);
    const keys = hankki!.recipe.steps
      .map((s) => s.imageKey)
      .filter((k) => stepRegistry.has(k));
    assert(keys.length >= 2, `${recipe.recipeId} has >=2 registered step images (got ${keys.length})`);
  }
});

run('image specs remain locked', () => {
  assert(CHILD_HERO_IMAGE_SPEC.width === 1344, 'hero width');
  assert(CHILD_HERO_IMAGE_SPEC.height === 768, 'hero height');
  assert(CHILD_STEP_IMAGE_SPEC.width === 1024, 'step width');
  assert(CHILD_STEP_IMAGE_SPEC.maxSlotsPerRecipe === 3, 'max 3');
});

run('audience counts', () => {
  assert(HANKKI_RECIPES.length === 517, 'catalog 517');
  assert(
    HANKKI_RECIPES.filter((r) => r.familyAudience.audiences.includes('baby')).length === 70,
    'baby 70',
  );
  assert(
    HANKKI_RECIPES.filter((r) => r.familyAudience.audiences.includes('toddler')).length === 74,
    'toddler 74',
  );
  assert(
    HANKKI_RECIPES.filter((r) => r.familyAudience.audiences.includes('elementary')).length === 78,
    'elementary 78',
  );
});

run('detail UI keeps crash-safe missing step behavior', () => {
  const slots = fs.readFileSync(
    path.join(APP_ROOT, 'components/recipe/ChildStepImageSlots.tsx'),
    'utf8',
  );
  assert(slots.includes('return null'), 'empty slots return null');
  assert(slots.includes('resolveStepImageSource'), 'uses step resolver');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — child image registry');
