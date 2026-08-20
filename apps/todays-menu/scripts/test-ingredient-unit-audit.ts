/**
 * Sprint 55.1 — ingredient unit consistency audit + display rules.
 * Run: npm run test:ingredient-unit-audit
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import {
  scaleIngredientAmount,
  scaleIngredientAmountForDisplay,
} from '../services/recipes/servingScaler';

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

function main(): void {
  console.log('Ingredient Unit Audit QA — start\n');

  const report = auditRecipeIngredientUnits(HANKKI_RECIPES);
  assert(report.recipeCount === 304, '304개 레시피 감사');
  assert(report.ingredientCount >= 1302, `재료 감사 >= 1302 (got ${report.ingredientCount})`);
  assert(report.invalid === 0, `INVALID 단위 조합 0건 (현재 ${report.invalid})`);

  if (report.invalidEntries.length > 0) {
    console.error('INVALID entries:', report.invalidEntries);
  }

  const eggRoll = HANKKI_RECIPES.find((recipe) => recipe.id === '019');
  assert(Boolean(eggRoll), 'recipe 019 계란말이 존재');
  const carrot = eggRoll!.ingredients.find((ing) => ing.name === '당근');
  assert(carrot?.amount === '1/3개', '당근 원본 unit 개수형 보존');

  const carrotDisplay = scaleIngredientAmountForDisplay(
    carrot!.amount,
    eggRoll!.serving,
    eggRoll!.serving,
    { ingredientName: '당근', iconKey: carrot!.iconKey },
  );
  assert(carrotDisplay.scaledAmount === '1/3개', '당근이 큰술로 표시되지 않음');

  const water = eggRoll!.ingredients.find((ing) => ing.name === '물');
  const waterDisplay = scaleIngredientAmountForDisplay(
    water!.amount,
    eggRoll!.serving,
    eggRoll!.serving,
    { ingredientName: '물', iconKey: water!.iconKey },
  );
  assert(waterDisplay.scaledAmount === '30ml', '물 2큰술 → 30ml');

  const soyDisplay = scaleIngredientAmountForDisplay(
    '2큰술',
    2,
    2,
    { ingredientName: '간장', iconKey: 'soy_sauce' },
  );
  assert(soyDisplay.scaledAmount === '2큰술', '간장 2큰술은 큰술 유지');

  const flourDisplay = scaleIngredientAmountForDisplay(
    '1컵',
    3,
    3,
    { ingredientName: '밀가루', iconKey: 'flour' },
  );
  assert(flourDisplay.scaledAmount === '1컵', '밀가루 1컵 ml 변환 안 함');

  const riceDisplay = scaleIngredientAmountForDisplay(
    '1컵',
    3,
    3,
    { ingredientName: '쌀', iconKey: 'rice' },
  );
  assert(riceDisplay.scaledAmount === '1컵', '쌀 1컵 ml 변환 안 함');

  const milkMl = scaleIngredientAmountForDisplay(
    '200ml',
    2,
    2,
    { ingredientName: '우유', iconKey: 'milk' },
  );
  assert(milkMl.scaledAmount === '200ml', '기존 ml 이중 변환 없음');

  const scaledWater = scaleIngredientAmount('2큰술', 2, 1);
  const waterHalf = scaleIngredientAmountForDisplay(
    '2큰술',
    2,
    1,
    { ingredientName: '물', iconKey: 'water' },
  );
  assert(Math.abs(scaledWater.numericValue! - 1) < 0.001, '물 인분 감소 numericValue 컵/큰술 기준');
  assert(waterHalf.scaledAmount.includes('ml'), '인분 감소 후 물 ml 표시');

  console.log('\n--- Audit summary ---');
  console.log(`VALID: ${report.valid}`);
  console.log(`SUSPICIOUS: ${report.suspicious}`);
  console.log(`INVALID: ${report.invalid}`);
  console.log(`NEEDS_REVIEW: ${report.needsReview}`);

  console.log(`\nIngredient Unit Audit QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
}

main();
