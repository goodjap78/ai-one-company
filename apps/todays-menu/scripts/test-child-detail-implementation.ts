/**
 * Child detail implementation QA — portion, coupang, image specs, audience sections.
 * Run: npx tsx scripts/test-child-detail-implementation.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHILD_CARD_IMAGE_SPEC,
  CHILD_HERO_IMAGE_SPEC,
  CHILD_STEP_IMAGE_SPEC,
} from '../constants/childRecipeImageSpecs';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  classifyBabyBatchCooking,
  listBabyPortionScalingSummary,
  scaleBabyIngredientAmount,
} from '../data/recipes/babyPortionScaling';
import { BABY_PILOT_IDS } from '../data/recipes/babyPilotOverrides';
import { TODDLER_PILOT_IDS } from '../data/recipes/toddlerPilotOverrides';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('Child detail implementation QA — start\n');

run('catalog audience counts', () => {
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

run('portion + batch cooking metadata', () => {
  const summary = listBabyPortionScalingSummary(HANKKI_RECIPES);
  assert(summary.scalable.length === 61, 'BABY_SCALABLE 61');
  assert(summary.reviewRequired.length === 9, 'BABY_REVIEW_REQUIRED 9');
  assert(summary.notScalable.length === 0, 'not_scalable 0');
  const baby = HANKKI_RECIPES.filter((r) => r.familyAudience.audiences.includes('baby'));
  const friendly = baby.filter((r) => classifyBabyBatchCooking(r) === 'friendly').length;
  assert(friendly === 63, `batchCooking friendly 63 (got ${friendly})`);
  assert(
    scaleBabyIngredientAmount('40g', 3, 'scalable') === '120g',
    'decimal g scales 1→3',
  );
  assert(
    scaleBabyIngredientAmount('1/4작은술', 3, 'scalable') === '0.75작은술',
    'fraction 작은술 scales 1→3',
  );
  assert(
    scaleBabyIngredientAmount('1/4작은술', 6, 'scalable') === '1.5작은술',
    'fraction 작은술 scales 1→6',
  );
  assert(
    scaleBabyIngredientAmount('1/4작은술', 3, 'review_required') === '1/4작은술',
    'review_required does not scale fractions',
  );
});

run('image specs locked', () => {
  assert(CHILD_HERO_IMAGE_SPEC.width === 1344 && CHILD_HERO_IMAGE_SPEC.height === 768, 'hero 1344×768');
  assert(CHILD_HERO_IMAGE_SPEC.format === 'jpg', 'hero jpg');
  assert(CHILD_CARD_IMAGE_SPEC.source === 'hero_reuse', 'card reuses hero');
  assert(CHILD_CARD_IMAGE_SPEC.separateAsset === false, 'no separate thumb');
  assert(CHILD_STEP_IMAGE_SPEC.width === 1024 && CHILD_STEP_IMAGE_SPEC.height === 1024, 'step 1024×1024');
  assert(CHILD_STEP_IMAGE_SPEC.maxSlotsPerRecipe === 3, 'max 3 step slots');
});

run('detail screen wiring', () => {
  const screen = read('components/ingredients/IngredientsScreen.tsx');
  const sections = read('components/recipe/ChildDetailSections.tsx');
  const slots = read('components/recipe/ChildStepImageSlots.tsx');
  assert(screen.includes('ChildDetailAudienceBadge'), 'audience badge');
  assert(screen.includes('BabyPortionPresetSelector'), 'portion UI');
  assert(screen.includes('BabyDetailSafetySections'), 'baby safety');
  assert(screen.includes('ToddlerDetailExtraSections'), 'toddler sections');
  assert(screen.includes('ElementaryDetailExtraSections'), 'elementary sections');
  assert(screen.includes('RecipeStepsList'), 'canonical step list');
  assert(!screen.includes('ChildStepImageSlots'), 'no duplicate step gallery');
  assert(screen.includes('hideCoupang'), 'coupang gate');
  assert(screen.includes('deferShopping'), 'baby shopping order');
  assert(!screen.includes('AdMob'), 'no AdMob detail');
  assert(slots.includes('return null'), 'empty slots omit UI');
  assert(slots.includes('RecipeStepsList as the canonical'), 'slots doc notes canonical path');
  assert(!sections.includes('fully_cooked_required'), 'no safety flag codes');
  assert(sections.includes('childDetailCopy.schoolMorningLabel'), 'elementary user copy mapper');
  assert(sections.includes('childDetailCopy.portionReviewOnly'), 'review-only copy mapper');
  assert(!sections.includes("'review_required'"), 'no portion enum string literal in UI');
  assert(BABY_PILOT_IDS.length === 70, 'baby pilot lock');
  assert(TODDLER_PILOT_IDS.length === 74, 'toddler pilot lock');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — child detail implementation');
