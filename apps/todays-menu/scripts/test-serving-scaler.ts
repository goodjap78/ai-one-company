/**
 * Sprint 49-A — serving scaler QA.
 * Run: npm run test:serving-scaler
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  auditHankkiIngredientAmounts,
  scaleIngredientAmount,
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

function scale(amount: string, base: number, target: number) {
  return scaleIngredientAmount(amount, base, target);
}

function main(): void {
  console.log('Serving Scaler QA — start\n');

  assert(scale('400g', 4, 1).scaledAmount === '100g', '4인분 400g → 1인분 100g');
  assert(scale('1개', 4, 1).scaledAmount === '1/4개', '4인분 1개 → 1인분 1/4개');
  assert(scale('2개', 4, 1).scaledAmount === '1/2개', '4인분 2개 → 1인분 1/2개');
  assert(scale('3개', 4, 1).scaledAmount === '3/4개', '4인분 3개 → 1인분 3/4개');
  assert(scale('1/2모', 2, 4).scaledAmount === '1모', '2인분 1/2모 → 4인분 1모');
  assert(scale('100~150g', 4, 2).scaledAmount === '50~75g', '4인분 100~150g → 2인분 50~75g');
  assert(scale('2~3큰술', 2, 4).scaledAmount === '4~6큰술', '2인분 2~3큰술 → 4인분 4~6큰술');
  assert(
    scale('1개(200g)', 4, 2).scaledAmount === '1/2개(100g)',
    '4인분 1개(200g) → 2인분 1/2개(100g)',
  );
  assert(scale('약간', 4, 1).status === 'unchanged', '약간 원문 유지');
  assert(scale('적당량', 4, 2).status === 'unchanged', '적당량 원문 유지');
  assert(scale('취향껏', 4, 2).status === 'unchanged', '취향껏 원문 유지');
  assert(scale('1공기', 2, 1).scaledAmount === '1/2공기', '1공기 → 1/2공기');
  assert(scale('1큰술', 4, 1).scaledAmount === '1/4큰술', '1큰술 → 1/4큰술');
  assert(scale('2.0개', 2, 1).scaledAmount === '1개', '소수점 .0 제거');

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
  assert(audit.recipeCount === 160, '160개 레시피 감사');
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
