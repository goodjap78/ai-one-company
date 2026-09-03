/**
 * Sprint 6.1 — dump reviewed recipes for reality QA (read-only).
 * Run: npx tsx scripts/dump-sprint6-recipes-for-qa.ts
 */
import {
  SPRINT6_BREAKFAST_RECIPE_IDS,
  SPRINT6_DINNER_RECIPE_IDS,
} from '../data/recipes/elementarySprint6QualityPatches';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const VAGUE = /^(적당량|조금|약간|한 줌|1꼬집)$/;

for (const id of [...SPRINT6_BREAKFAST_RECIPE_IDS, ...SPRINT6_DINNER_RECIPE_IDS]) {
  const r = getHankkiRecipeById(id);
  if (!r) {
    console.log(`MISSING ${id}`);
    continue;
  }
  const q = r.elementaryQuality;
  const vague = r.ingredients.filter((i) => VAGUE.test(i.amount.trim()) || /꼬집/.test(i.amount));
  console.log('\n' + '='.repeat(60));
  console.log(`${id} | ${r.name} | cook ${r.time}m prep ${r.prepTimeMinutes ?? '?'}m | serving ${r.serving}`);
  console.log(`schoolMorning: ${r.familyAudience.childMeal?.schoolMorningFriendly}`);
  console.log(`allergy: ${r.standardMetadata.allergyTags.join(',')}`);
  console.log(`hero: ${r.heroImageKey}`);
  if (q?.prerequisites) console.log(`prereq: ${q.prerequisites}`);
  console.log('ingredients:', r.ingredients.map((i) => `${i.name} ${i.amount}`).join(' | '));
  if (vague.length) console.log('VAGUE:', vague.map((i) => `${i.name}=${i.amount}`).join(', '));
  console.log('steps:', r.recipe.steps.length);
  r.recipe.steps.forEach((s, i) => {
    const fire = /불|약불|중불|강불|뚜껑|익|분홍|노릇/.test(s.instruction) ? '✓heat' : '-';
    console.log(`  ${i + 1}. [${fire}] ${s.title}: ${s.instruction.slice(0, 90)}`);
  });
  if (q) {
    console.log(`kid: ${q.kidAdjustmentTip?.slice(0, 80)}`);
    console.log(`sub: ${q.substituteIngredients}`);
    console.log(`store: ${q.storageInfo}`);
    console.log(`reheat: ${q.reheatingMethod}`);
  }
}
