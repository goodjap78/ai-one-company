/**
 * Sprint 49-A — serving scaler QA.
 * Run: npm run test:serving-scaler
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  auditHankkiIngredientAmounts,
  COOKING_CUP_ML,
  formatPracticalAmountNumber,
  scaleIngredientAmount,
  scaleIngredientAmountForDisplay,
} from '../services/recipes/servingScaler';
import { isLiquidCupIngredient } from '../services/recipes/liquidIngredientPolicy';

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

function scale(amount: string, base: number, target: number) {
  return scaleIngredientAmount(amount, base, target);
}

function scaleDisplay(
  amount: string,
  base: number,
  target: number,
  ingredientName: string,
  iconKey?: string,
) {
  return scaleIngredientAmountForDisplay(amount, base, target, {
    ingredientName,
    iconKey,
  });
}

function main(): void {
  console.log('Serving Scaler QA — start\n');

  assert(COOKING_CUP_ML === 200, 'COOKING_CUP_ML = 200');

  assert(scale('400g', 4, 1).scaledAmount === '100g', '4인분 400g → 1인분 100g');
  assert(scale('1개', 4, 1).scaledAmount === '1개', '4인분 1개 → 1인분 정수 반올림 최소 1');
  assert(scale('2개', 4, 1).scaledAmount === '1개', '4인분 2개 → 1인분 1개');
  assert(scale('3개', 4, 1).scaledAmount === '1개', '4인분 3개 → 1인분 1개');
  assert(scale('1/2모', 2, 4).scaledAmount === '1모', '2인분 1/2모 → 4인분 1모');
  assert(scale('100~150g', 4, 2).scaledAmount === '50~80g', '4인분 100~150g → 2인분 50~80g');
  assert(scale('2~3큰술', 2, 4).scaledAmount === '4~6큰술', '2인분 2~3큰술 → 4인분 4~6큰술');
  assert(
    scale('1개(200g)', 4, 2).scaledAmount === '1개(100g)',
    '4인분 1개(200g) → 2인분 1개(100g)',
  );
  assert(scale('약간', 4, 1).status === 'unchanged', '약간 원문 유지');
  assert(scale('적당량', 4, 2).status === 'unchanged', '적당량 원문 유지');
  assert(scale('취향껏', 4, 2).status === 'unchanged', '취향껏 원문 유지');
  assert(scale('1공기', 2, 1).scaledAmount === '1공기', '1공기 → 1공기 (정수 반올림)');
  assert(scale('1큰술', 4, 1).scaledAmount === '1/4큰술', '1큰술 → 1/4큰술');
  assert(scale('2.0개', 2, 1).scaledAmount === '1개', '소수점 .0 개수형 반올림');

  // Practical fraction display (< 1 spoon/cup)
  assert(formatPracticalAmountNumber(0.33, '큰술') === '1/3', '0.33큰술 → 1/3');
  assert(formatPracticalAmountNumber(0.67, '큰술') === '2/3', '0.67큰술 → 2/3');
  assert(formatPracticalAmountNumber(1.33, '큰술') === '1.5', '1.33큰술 → 1.5');
  assert(formatPracticalAmountNumber(2.67, '큰술') === '3', '2.67큰술 → 3');
  assert(formatPracticalAmountNumber(0.33, '컵') === '1/3', '0.33컵 → 1/3');
  assert(formatPracticalAmountNumber(0.67, '컵') === '2/3', '0.67컵 → 2/3');
  assert(formatPracticalAmountNumber(1.33, '컵') === '1.5', '1.33컵 → 1.5');
  assert(formatPracticalAmountNumber(2.67, '컵') === '2.5', '2.67컵 → 2.5');
  assert(formatPracticalAmountNumber(133, 'g') === '130', '133g → 130g');
  assert(formatPracticalAmountNumber(167, 'ml') === '170', '167ml → 170ml');

  // Integer count units
  assert(formatPracticalAmountNumber(2.67, '마리') === '3', '2.67마리 → 3');
  assert(formatPracticalAmountNumber(1.33, '개') === '1', '1.33개 → 1');
  assert(formatPracticalAmountNumber(0.67, '개') === '1', '0.67개 → 1');
  assert(scale('4마리', 3, 2).scaledAmount === '3마리', '3→2인분 4마리 → 3마리');
  assert(scale('1개', 3, 2).scaledAmount === '1개', '3→2인분 1개 → 1개');

  // recipe_0158 꽁치간장조림 (base 3인분) — practical display
  assert(scale('4마리', 3, 2).scaledAmount === '3마리', 'recipe_0158 꽁치 3→2');
  assert(scale('4큰술', 3, 2).scaledAmount === '3큰술', 'recipe_0158 간장 3→2');
  assert(scale('2큰술', 3, 2).scaledAmount === '1.5큰술', 'recipe_0158 설탕 3→2');
  assert(scale('1/2컵', 3, 2).scaledAmount === '1/3컵', 'recipe_0158 물 3→2 (raw scaler)');
  assert(
    scaleDisplay('1/2컵', 3, 2, '물', 'water').scaledAmount === '70ml',
    'recipe_0158 물 3→2 → 70ml',
  );
  assert(scale('150g', 3, 2).scaledAmount === '100g', 'recipe_0158 무 3→2');
  assert(scale('1개', 3, 2).scaledAmount === '1개', 'recipe_0158 고추 3→2');

  const sauryScaled = scale('4마리', 3, 2);
  assert(
    Math.abs(sauryScaled.numericValue! - (4 * 2) / 3) < 0.001,
    'recipe_0158 꽁치 exact numericValue 보존',
  );

  assert(scale('4마리', 3, 1).scaledAmount === '1마리', 'recipe_0158 꽁치 3→1 (1.33→1)');
  assert(scale('2큰술', 3, 1).scaledAmount === '2/3큰술', 'recipe_0158 설탕 3→1');
  assert(scale('4마리', 3, 4).scaledAmount === '5마리', 'recipe_0158 꽁치 3→4 (5.33→5)');
  assert(
    scaleIngredientAmount('4마리', 3, 3).scaledAmount === '4마리',
    'recipe_0158 기본 인분 복원',
  );

  assert(scale('4마리', 3, 2).scaledAmount !== '0마리', '0 표시 금지');
  assert(scale('2큰술', 3, 2).scaledAmount !== '0큰술', '0 큰술 표시 금지');

  const scaledOnce = scale('4마리', 3, 2).scaledAmount;
  const scaledTwice = scale('4마리', 3, 2).scaledAmount;
  assert(scaledOnce === scaledTwice, '원본 기준 반복 스케일 일관');

  // Liquid 컵 → ml display
  assert(
    scaleDisplay('1/4컵', 3, 3, '물', 'water').scaledAmount === '50ml',
    '물 1/4컵 → 50ml',
  );
  assert(
    scaleDisplay('1/3컵', 3, 3, '물', 'water').scaledAmount === '70ml',
    '물 1/3컵 → 70ml',
  );
  assert(
    scaleDisplay('1/2컵', 3, 3, '물', 'water').scaledAmount === '100ml',
    '물 1/2컵 → 100ml',
  );
  assert(
    scaleDisplay('2큰술', 2, 2, '물', 'water').scaledAmount === '30ml',
    '물 2큰술 → 30ml',
  );
  assert(
    scaleDisplay('3큰술', 1, 1, '물', 'water').scaledAmount === '50ml',
    '물 3큰술 → 45ml 반올림 50ml',
  );
  assert(
    scaleDisplay('2큰술', 2, 2, '간장', 'soy_sauce').scaledAmount === '2큰술',
    '간장 2큰술은 큰술 유지',
  );
  assert(
    scaleDisplay('1컵', 3, 3, '물', 'water').scaledAmount === '200ml',
    '물 1컵 → 200ml',
  );
  assert(
    scaleDisplay('1.5컵', 3, 3, '물', 'water').scaledAmount === '300ml',
    '물 1.5컵 → 300ml',
  );
  assert(
    scaleDisplay('2.5컵', 3, 3, '물', 'water').scaledAmount === '500ml',
    '물 2.5컵 → 500ml',
  );
  assert(
    scaleDisplay('1/2컵', 3, 3, '우유', 'milk').scaledAmount === '100ml',
    '우유 컵 → ml',
  );
  assert(
    scaleDisplay('1컵', 3, 3, '육수', 'water').scaledAmount === '200ml',
    '육수 컵 → ml',
  );
  assert(
    scaleDisplay('1컵', 3, 3, '밀가루', 'flour').scaledAmount === '1컵',
    '밀가루 1컵은 ml 변환 안 함',
  );
  assert(
    scaleDisplay('1컵', 3, 3, '쌀', 'rice').scaledAmount === '1컵',
    '쌀 1컵은 ml 변환 안 함',
  );
  assert(
    scaleDisplay('200ml', 3, 3, '우유', 'milk').scaledAmount === '200ml',
    '기존 ml 재료 이중 변환 없음',
  );
  assert(
    !isLiquidCupIngredient('밀가루', 'flour'),
    '밀가루는 액체 판별 false',
  );
  assert(isLiquidCupIngredient('물', 'water'), '물은 액체 판별 true');

  const waterScaled = scaleDisplay('1/2컵', 3, 2, '물', 'water');
  assert(waterScaled.scaledAmount === '70ml', 'recipe_0158 물 display 70ml');
  assert(
    Math.abs(waterScaled.numericValue! - (0.5 * 2) / 3) < 0.001,
    '물 numericValue 컵 단위 유지',
  );

  const waterDisplayOnce = scaleDisplay('1/2컵', 3, 2, '물', 'water').scaledAmount;
  const waterDisplayTwice = scaleDisplay('1/2컵', 3, 2, '물', 'water').scaledAmount;
  assert(waterDisplayOnce === waterDisplayTwice, '액체 ml 표시 반복 일관');


  const bad = scale('not-a-real-amount', 4, 2);
  assert(bad.status === 'needs_review' || bad.status === 'unchanged', '잘못된 amount 안전 처리');

  assert(scale('100g', 0, 2).status === 'unchanged', 'baseServings 0 방어');
  assert(scale('100g', 4, 1).status === 'scaled', 'target 1 허용');
  assert(scale('100g', 4, 8).status === 'scaled', 'target 8 허용');
  assert(
    scaleIngredientAmount('200g', 4, 4).scaledAmount === '200g',
    '기준 인분 복원 unchanged',
  );

  const baseSample = HANKKI_RECIPES[0]!;
  const originalAmount = baseSample.ingredients[0]!.amount;
  scale('100g', 4, 2);
  assert(baseSample.ingredients[0]!.amount === originalAmount, '레시피 원본 데이터 변경 없음');

  const audit = auditHankkiIngredientAmounts(HANKKI_RECIPES);
  assert(audit.recipeCount === 300, '300개 레시피 감사');
  assert(audit.crashCount === 0, '전수 파싱 크래시 0');
  console.log('\n--- Amount format audit ---');
  console.log(JSON.stringify(audit.categories, null, 2));
  console.log(`unique amounts: ${audit.uniqueAmounts}`);
  console.log(`ingredients: ${audit.ingredientCount}`);
  if (audit.unchangedExpressions.length) {
    console.log('unchanged:', audit.unchangedExpressions.join(', '));
  }
  if (audit.unknownSamples.length) {
    console.log('unknown samples:', audit.unknownSamples.slice(0, 15).join(' | '));
  }

  const hankkiSource = fs.readFileSync(
    path.join(__dirname, '../data/recipes/hankkiRecipes.ts'),
    'utf8',
  );
  assert(!hankkiSource.includes('scaledAmount'), 'hankkiRecipes에 scaledAmount 미삽입');

  console.log(`\nServing Scaler QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
}

main();
