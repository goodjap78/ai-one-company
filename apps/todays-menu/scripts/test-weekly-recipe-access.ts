/**
 * Weekly recipe access UX — static QA.
 * Run: npm run test:weekly-recipe-access
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEEKLY_RECIPES_HREF } from '../constants/appRoutes';
import { weeklyRecipeAccessCopy } from '../constants/weeklyRecipeAccessCopy';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { generateToddlerBreakfastWeek } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { generateToddlerDinnerWeek } from '../data/recipes/toddlerDinnerWeeklyPlan';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import {
  parseWeeklyRecipeIndexSource,
  recipeIdsFromWeeklyPlan,
} from '../services/weeklyPlan/weeklyRecipeIndex';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    return;
  }
  console.log(`✅ ${msg}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI weekly recipe access QA — start\n');

const card = read('components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx');
assert(card.includes('<Pressable'), 'card is Pressable');
assert(card.includes('weeklyRecipeAccessCopy.recipeViewCta'), 'explicit recipe CTA');
assert(weeklyRecipeAccessCopy.recipeViewCta === '레시피 보기 ›', 'CTA copy');

const screens: Array<[string, string, string]> = [
  [
    'elementary breakfast',
    'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
    'elementary-breakfast',
  ],
  [
    'elementary dinner',
    'components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx',
    'elementary-dinner',
  ],
  [
    'toddler breakfast/dinner',
    'components/toddlerWeekly/ToddlerBfDnWeeklyPlanScreen.tsx',
    'toddler-breakfast',
  ],
];

for (const [label, rel] of screens) {
  const src = read(rel);
  assert(src.includes('router.push(`/recipe/${slot.recipeId}`)'), `${label} → /recipe/{id}`);
  assert(src.includes('WeeklyRecipeIndexLink'), `${label} index CTA`);
  assert(src.includes('HankkiHomeBrandLink'), `${label} logo home`);
  assert(!src.includes('recipeQualityGrade'), `${label} no grade`);
  assert(!src.includes('contentVerificationStatus'), `${label} no verification status`);
}

const toddlerScreen = read('components/toddlerWeekly/ToddlerBfDnWeeklyPlanScreen.tsx');
assert(toddlerScreen.includes("'toddler-breakfast'"), 'toddler bf index source');
assert(toddlerScreen.includes("'toddler-dinner'"), 'toddler dn index source');
assert(
  read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx').includes(
    "weeklyRecipesHref('elementary-breakfast')",
  ),
  'elem bf index source',
);
assert(
  read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx').includes(
    "weeklyRecipesHref('elementary-dinner')",
  ),
  'elem dn index source',
);

assert(WEEKLY_RECIPES_HREF === '/weekly-recipes', 'index href');
assert(fs.existsSync(path.join(ROOT, 'app/weekly-recipes.tsx')), 'index route file');
assert(read('app/_layout.tsx').includes('weekly-recipes'), 'layout registers index');

const index = read('components/weeklyRecipes/WeeklyRecipeIndexScreen.tsx');
assert(index.includes('loadCurrentWeeklyPlanForIndex'), 'index loads live stored plan');
assert(index.includes('useFocusEffect'), 'index reloads on focus (regenerate sync)');
assert(index.includes('router.push(`/recipe/${slot.recipeId}`)'), 'index → recipe detail');
assert(index.includes('HankkiHomeBrandLink'), 'index logo home');
assert(index.includes('ScreenBackButton'), 'index back');
assert(index.includes('plan.slots.map'), 'index uses current slots');
assert(!index.includes('recipeQualityGrade'), 'index no grade');

assert(parseWeeklyRecipeIndexSource('elementary-breakfast') === 'elementary-breakfast', 'parse bf');
assert(parseWeeklyRecipeIndexSource('nope') === null, 'parse reject');

const bfA = generateElementaryBreakfastWeek(12);
const bfB = generateElementaryBreakfastWeek(99);
assert(bfA.ok && bfB.ok, 'elem bf generate');
if (bfA.ok && bfB.ok) {
  const idsA = recipeIdsFromWeeklyPlan(bfA.plan);
  const idsB = recipeIdsFromWeeklyPlan(bfB.plan);
  assert(idsA.length === 7 && new Set(idsA).size === 7, 'elem bf 7 unique');
  assert(idsA.join(',') !== idsB.join(','), 'regenerate yields new recipeIds');
  assert(idsA.every((id) => Boolean(getHankkiRecipeById(id))), 'elem bf recipeIds exist');
}

const dn = generateElementaryDinnerWeek(12);
assert(dn.ok, 'elem dn generate');
if (dn.ok) {
  const ids = recipeIdsFromWeeklyPlan(dn.plan);
  assert(ids.length === 7 && new Set(ids).size === 7, 'elem dn 7 unique');
}

const tbf = generateToddlerBreakfastWeek(12);
const tdn = generateToddlerDinnerWeek(12);
const tbfAlt = generateToddlerBreakfastWeek(99);
assert(tbf.ok && tdn.ok && tbfAlt.ok, 'toddler generate');
if (tbf.ok && tbfAlt.ok) {
  assert(
    recipeIdsFromWeeklyPlan(tbf.plan).join(',') !== recipeIdsFromWeeklyPlan(tbfAlt.plan).join(','),
    'toddler regenerate new recipeIds',
  );
}

const detail = read('components/ingredients/IngredientsScreen.tsx');
assert(detail.includes('recipe.title'), 'detail name');
assert(detail.includes('RecipeHeroImage'), 'detail image');
assert(detail.includes('RecipeInfoMeta'), 'detail servings/cook time');
assert(detail.includes('RecipeIngredientsList'), 'detail ingredients');
assert(detail.includes('RecipeStepsList'), 'detail steps');
assert(detail.includes('ElementaryDetailExtraSections'), 'elem extras');
assert(detail.includes('ToddlerDetailExtraSections'), 'toddler extras');
assert(!detail.includes('recipeQualityGrade'), 'detail no grade');

const extras = read('components/recipe/ChildDetailSections.tsx');
assert(extras.includes('elementaryKidTipTitle'), 'kid tip connected');
assert(extras.includes('elementarySubstituteTitle'), 'substitutes connected');
assert(extras.includes('elementaryStorageTitle'), 'storage connected');
assert(extras.includes('elementaryReheatTitle'), 'reheat connected');
assert(extras.includes('elementaryPrepTitle'), 'prep time connected');
assert(extras.includes('function ToddlerDetailExtraSections'), 'toddler extras fn');
assert(
  extras.indexOf('elementaryKidTipTitle') < extras.indexOf('function ElementaryDetailExtraSections'),
  'toddler extras include kid tip',
);
assert(!extras.includes('recipeQualityGrade'), 'quality grade hidden');
assert(!extras.includes("'unverified'"), 'unverified label hidden');

const share = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
assert(share.includes('shareCardRecipeHint'), 'share recipe hint field');
assert(!share.includes('Pressable'), 'share card not pressable');
assert(!share.includes('QR'), 'no QR');
assert(
  weeklyRecipeAccessCopy.shareCardRecipeHint === '레시피는 한끼 앱에서 확인하세요',
  'share hint copy',
);
assert(
  read('constants/elementaryBreakfastWeeklyPlanCopy.ts').includes('shareCardRecipeHint'),
  'elem bf share hint',
);
assert(
  read('constants/toddlerDinnerWeeklyPlanCopy.ts').includes('shareCardRecipeHint'),
  'toddler dn share hint',
);

assert(!card.includes('AdMob'), 'day card no ads');
assert(!index.includes('Coupang'), 'index no coupang');
assert(!index.includes('generateElementary'), 'index does not call generators');

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — weekly recipe access');
