/**
 * Sprint 49-A — Scale ingredient amounts by serving ratio without mutating recipe data.
 */
import {
  cupsToMilliliters,
  COOKING_CUP_ML,
  COOKING_TABLESPOON_ML,
  COOKING_TEASPOON_ML,
  tablespoonsToMilliliters,
  teaspoonsToMilliliters,
} from '../../constants/cookingUnits';
import { isBulkLiquidForMlDisplay } from './liquidIngredientPolicy';
export type ServingScaleStatus = 'scaled' | 'unchanged' | 'needs_review';

export type ServingScaleResult = {
  originalAmount: string;
  /** Practical display amount for cooking (rounded for readability). */
  scaledAmount: string;
  status: ServingScaleStatus;
  /** Exact scaled numeric value before practical rounding. */
  numericValue?: number;
  unit?: string;
};

const UNCHANGED_EXACT = new Set([
  '약간',
  '적당량',
  '취향껏',
  '필요량',
  '한 꼬집',
  '장식용',
  '선택',
  '옵션',
  '충분량',
  '충분히',
]);

const FRACTIONS: Array<{ value: number; text: string }> = [
  { value: 0.25, text: '1/4' },
  { value: 1 / 3, text: '1/3' },
  { value: 0.5, text: '1/2' },
  { value: 2 / 3, text: '2/3' },
  { value: 0.75, text: '3/4' },
];

/** 개수형 — nearest integer, minimum 1 when scaled value > 0. */
const INTEGER_COUNT_UNITS =
  /^(개|마리|장|봉|팩|조각|줄기|알)$/u;

const COUNT_UNITS =
  /^(개|모|장|대|봉|팩|캔|공기|줌|마리|쪽|알|토막|덩이|봉지|포|통|병|박스|인분|줄기|송이|덩어리|조각)$/u;

const MEASURE_UNITS =
  /^(g|kg|ml|l|리터|큰술|작은술|티스푼|스푼|컵|공기|줌)$/iu;

const RANGE_SEP = /[~～\-–—]/u;

function normalizeServings(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(1, Math.round(value)));
}

function unchangedResult(amount: string): ServingScaleResult {
  return {
    originalAmount: amount,
    scaledAmount: amount,
    status: 'unchanged',
  };
}

function scaledResult(
  original: string,
  scaled: string,
  numericValue?: number,
  unit?: string,
): ServingScaleResult {
  return {
    originalAmount: original,
    scaledAmount: scaled,
    status: scaled === original ? 'unchanged' : 'scaled',
    numericValue,
    unit,
  };
}

function needsReview(original: string): ServingScaleResult {
  return {
    originalAmount: original,
    scaledAmount: original,
    status: 'needs_review',
  };
}

function parseFractionToken(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const denom = Number(frac[2]);
    if (denom === 0) return null;
    return Number(frac[1]) / denom;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function formatDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1).replace(/\.0$/, '');
}

function nearestStandardFraction(value: number): string {
  if (value <= 0) return FRACTIONS[0].text;
  let best = FRACTIONS[0];
  let bestDistance = Infinity;
  for (const fraction of FRACTIONS) {
    const distance = Math.abs(value - fraction.value);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = fraction;
    }
  }
  return best.text;
}

const SPOON_UNITS = /^(큰술|작은술|티스푼|스푼)$/u;

function formatPracticalIntegerCount(value: number): string {
  if (value <= 0) return '1';
  const rounded = Math.round(value);
  return String(Math.max(1, rounded));
}

function formatPracticalSpoon(value: number): string {
  if (value <= 0) return nearestStandardFraction(0.25);
  if (value < 0.2) return nearestStandardFraction(value);
  if (value < 1) return nearestStandardFraction(value);
  if (value < 2) {
    const halfStep = Math.round(value * 2) / 2;
    if (halfStep <= 0) return nearestStandardFraction(0.25);
    if (Math.abs(halfStep - 1) < 0.001) return '1';
    return formatDecimal(halfStep);
  }
  return String(Math.round(value));
}

function formatPracticalCup(value: number): string {
  if (value <= 0) return nearestStandardFraction(0.25);
  if (value < 1) return nearestStandardFraction(value);
  const halfStep = Math.round(value * 2) / 2;
  if (halfStep <= 0) return nearestStandardFraction(0.25);
  return formatDecimal(halfStep);
}

function formatPracticalGramMl(value: number): string {
  if (value <= 0) return '1';
  if (value < 10) return String(Math.max(1, Math.round(value)));
  return String(Math.round(value / 10) * 10);
}

function formatPracticalOtherCount(value: number): string {
  if (value <= 0) return '1';
  const rounded = Math.round(value);
  return String(Math.max(1, rounded));
}

/** Format scaled numeric value for practical cooking display. */
export function formatPracticalAmountNumber(value: number, unit: string): string {
  const normalizedUnit = unit.trim();
  if (INTEGER_COUNT_UNITS.test(normalizedUnit)) {
    return formatPracticalIntegerCount(value);
  }
  if (SPOON_UNITS.test(normalizedUnit)) {
    return formatPracticalSpoon(value);
  }
  if (normalizedUnit === '컵') {
    return formatPracticalCup(value);
  }
  if (/^(g|ml)$/iu.test(normalizedUnit)) {
    return formatPracticalGramMl(value);
  }
  if (COUNT_UNITS.test(normalizedUnit)) {
    return formatPracticalOtherCount(value);
  }
  return formatDecimal(value);
}

function formatPracticalScaledNumber(value: number, unit: string): string {
  const normalizedUnit = unit.trim();
  const numText = formatPracticalAmountNumber(value, normalizedUnit);
  return `${numText}${normalizedUnit}`;
}

function formatRangeAmount(
  left: number,
  right: number,
  unit: string,
  sep: string,
): string {
  const normalizedUnit = unit.trim();
  const leftText = formatPracticalAmountNumber(left, normalizedUnit);
  const rightText = formatPracticalAmountNumber(right, normalizedUnit);
  return `${leftText}${sep}${rightText}${normalizedUnit}`;
}

function parseSimpleAmount(amount: string): {
  value: number;
  unit: string;
  prefix: string;
} | null {
  const trimmed = amount.trim();
  const match = trimmed.match(/^([\d./]+)\s*(.*)$/u);
  if (!match) return null;
  const value = parseFractionToken(match[1]);
  if (value === null) return null;
  const unit = match[2].trim();
  if (!unit) return null;
  return { value, unit, prefix: '' };
}

function scaleSimpleAmount(
  amount: string,
  ratio: number,
): ServingScaleResult | null {
  const parsed = parseSimpleAmount(amount);
  if (!parsed) return null;
  const scaledValue = parsed.value * ratio;
  if (!Number.isFinite(scaledValue)) return null;
  const scaledAmount = formatPracticalScaledNumber(scaledValue, parsed.unit);
  return scaledResult(amount, scaledAmount, scaledValue, parsed.unit);
}

function scaleRangeAmount(amount: string, ratio: number): ServingScaleResult | null {
  const trimmed = amount.trim();
  const sepIndex = [...trimmed].findIndex((ch) => RANGE_SEP.test(ch));
  if (sepIndex <= 0) return null;

  const leftPart = trimmed.slice(0, sepIndex);
  const rightPart = trimmed.slice(sepIndex + 1);
  const rightMatch = rightPart.match(/^([\d./]+)\s*(.*)$/u);
  const leftMatch = leftPart.match(/^([\d./]+)\s*(.*)$/u);
  if (!leftMatch || !rightMatch) return null;

  const leftValue = parseFractionToken(leftMatch[1]);
  const rightValue = parseFractionToken(rightMatch[1]);
  const unit = rightMatch[2].trim() || leftMatch[2].trim();
  if (leftValue === null || rightValue === null || !unit) return null;

  const scaledLeft = leftValue * ratio;
  const scaledRight = rightValue * ratio;
  const sep = trimmed[sepIndex];
  const scaledAmount = formatRangeAmount(scaledLeft, scaledRight, unit, sep);
  return scaledResult(amount, scaledAmount, scaledLeft, unit);
}

function scaleCompositeAmount(amount: string, ratio: number): ServingScaleResult | null {
  const trimmed = amount.trim();
  const match = trimmed.match(/^(.+?)\((.+)\)$/u);
  if (!match) return null;

  const outer = match[1].trim();
  const inner = match[2].trim();
  const scaledOuter = scaleAmountString(outer, ratio);
  const scaledInner = scaleAmountString(inner, ratio);

  if (
    scaledOuter.status === 'needs_review' ||
    scaledInner.status === 'needs_review'
  ) {
    return needsReview(amount);
  }

  if (scaledOuter.status === 'unchanged' && scaledInner.status === 'unchanged') {
    return unchangedResult(amount);
  }

  const scaledAmount = `${scaledOuter.scaledAmount}(${scaledInner.scaledAmount})`;
  return scaledResult(amount, scaledAmount);
}

function scaleAmountString(amount: string, ratio: number): ServingScaleResult {
  const trimmed = amount.trim();
  if (!trimmed) return unchangedResult(trimmed);
  if (ratio === 1) return unchangedResult(trimmed);
  if (UNCHANGED_EXACT.has(trimmed)) return unchangedResult(trimmed);

  const range = scaleRangeAmount(trimmed, ratio);
  if (range) return range;

  const composite = scaleCompositeAmount(trimmed, ratio);
  if (composite) return composite;

  const simple = scaleSimpleAmount(trimmed, ratio);
  if (simple) return simple;

  return needsReview(trimmed);
}

export type ScaleIngredientDisplayOptions = {
  ingredientName?: string;
  iconKey?: string | null;
};

function resolveScaledNumericForUnit(
  originalAmount: string,
  baseServings: number,
  targetServings: number,
  result: ServingScaleResult,
  expectedUnit: string,
): number | null {
  if (result.numericValue !== undefined && result.unit === expectedUnit) {
    return result.numericValue;
  }

  const parsed = parseSimpleAmount(originalAmount.trim());
  if (!parsed || parsed.unit !== expectedUnit) return null;

  const base = normalizeServings(baseServings);
  const target = normalizeServings(targetServings);
  return parsed.value * (target / base);
}

function measureBulkLiquidToMl(value: number, unit: string): number | null {
  const normalizedUnit = unit.trim();
  if (normalizedUnit === '컵') return cupsToMilliliters(value);
  if (normalizedUnit === '큰술' || normalizedUnit === '스푼') {
    return tablespoonsToMilliliters(value);
  }
  if (normalizedUnit === '작은술' || normalizedUnit === '티스푼') {
    return teaspoonsToMilliliters(value);
  }
  return null;
}

function formatBulkLiquidMlDisplay(value: number, unit: string): string | null {
  const ml = measureBulkLiquidToMl(value, unit);
  if (ml === null) return null;
  return `${formatPracticalGramMl(ml)}ml`;
}

function applyBulkLiquidMlDisplay(
  originalAmount: string,
  baseServings: number,
  targetServings: number,
  result: ServingScaleResult,
  options?: ScaleIngredientDisplayOptions,
): ServingScaleResult {
  const name = options?.ingredientName ?? '';
  if (!isBulkLiquidForMlDisplay(name, options?.iconKey)) {
    return result;
  }

  const parsed = parseSimpleAmount(originalAmount.trim());
  const unit = result.unit ?? parsed?.unit;
  if (!unit || unit === 'ml') return result;

  const bulkUnits = ['컵', '큰술', '작은술', '티스푼', '스푼'];
  if (!bulkUnits.includes(unit)) return result;

  const numericValue = resolveScaledNumericForUnit(
    originalAmount,
    baseServings,
    targetServings,
    result,
    unit,
  );
  if (numericValue === null) return result;

  const mlDisplay = formatBulkLiquidMlDisplay(numericValue, unit);
  if (!mlDisplay) return result;

  return {
    ...result,
    scaledAmount: mlDisplay,
    numericValue: numericValue,
    unit,
  };
}

/**
 * Scale ingredient amount and format for UI (practical units + liquid 컵 → ml).
 */
export function scaleIngredientAmountForDisplay(
  amount: string,
  baseServings: number,
  targetServings: number,
  options?: ScaleIngredientDisplayOptions,
): ServingScaleResult {
  const result = scaleIngredientAmount(amount, baseServings, targetServings);
  return applyBulkLiquidMlDisplay(amount, baseServings, targetServings, result, options);
}

/** Parse ingredient amount string into numeric value and unit (audit / display). */
export function parseIngredientAmount(amount: string): { value: number; unit: string } | null {
  const parsed = parseSimpleAmount(amount.trim());
  if (!parsed) return null;
  return { value: parsed.value, unit: parsed.unit };
}

/**
 * Scale a single ingredient amount from base servings to target servings.
 */
export function scaleIngredientAmount(
  amount: string,
  baseServings: number,
  targetServings: number,
): ServingScaleResult {
  const originalAmount = amount ?? '';
  const trimmed = originalAmount.trim();

  if (!trimmed) return unchangedResult(trimmed);

  if (!Number.isFinite(baseServings) || baseServings <= 0) {
    return unchangedResult(trimmed);
  }
  if (!Number.isFinite(targetServings) || targetServings <= 0) {
    return unchangedResult(trimmed);
  }

  const base = normalizeServings(baseServings);
  const target = normalizeServings(targetServings);
  if (target === base) return unchangedResult(trimmed);

  const ratio = target / base;
  return scaleAmountString(trimmed, ratio);
}

export {
  COOKING_CUP_ML,
  COOKING_TABLESPOON_ML,
  COOKING_TEASPOON_ML,
} from '../../constants/cookingUnits';

export type AmountAuditCategory =
  | 'A_simple'
  | 'B_fraction'
  | 'C_range'
  | 'D_descriptive'
  | 'E_unchanged'
  | 'F_composite'
  | 'unknown';

export function classifyIngredientAmount(amount: string): AmountAuditCategory {
  const trimmed = amount.trim();
  if (!trimmed) return 'unknown';
  if (UNCHANGED_EXACT.has(trimmed)) return 'E_unchanged';

  if (/^\d+\/\d+/u.test(trimmed) && !trimmed.includes('(')) {
    if (RANGE_SEP.test(trimmed)) return 'C_range';
    return 'B_fraction';
  }

  if (trimmed.includes('(') && trimmed.endsWith(')')) return 'F_composite';

  if (RANGE_SEP.test(trimmed)) return 'C_range';

  const simple = parseSimpleAmount(trimmed);
  if (simple) {
    if (/^\d+\/\d+/u.test(trimmed.split(/\s/u)[0] ?? '')) return 'B_fraction';
    if (COUNT_UNITS.test(simple.unit) || MEASURE_UNITS.test(simple.unit)) {
      return 'A_simple';
    }
    return 'D_descriptive';
  }

  if (/^(약간|적당량|취향|필요|꼬집|장식|선택|옵션)/u.test(trimmed)) {
    return 'E_unchanged';
  }

  return 'unknown';
}

export type AmountAuditReport = {
  recipeCount: number;
  ingredientCount: number;
  uniqueAmounts: number;
  categories: Record<AmountAuditCategory, number>;
  unchangedExpressions: string[];
  unknownSamples: string[];
  crashCount: number;
};

/** Audit all HANKKI recipe ingredient amounts — no data mutation. */
export function auditHankkiIngredientAmounts(
  recipes: Array<{ serving: number; ingredients: Array<{ amount: string }> }>,
): AmountAuditReport {
  const categories: Record<AmountAuditCategory, number> = {
    A_simple: 0,
    B_fraction: 0,
    C_range: 0,
    D_descriptive: 0,
    E_unchanged: 0,
    F_composite: 0,
    unknown: 0,
  };
  const amountSet = new Set<string>();
  const unchangedSet = new Set<string>();
  const unknownSamples: string[] = [];
  let crashCount = 0;
  let ingredientCount = 0;

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      ingredientCount += 1;
      const amount = ing.amount.trim();
      amountSet.add(amount);
      try {
        const cat = classifyIngredientAmount(amount);
        categories[cat] += 1;
        if (cat === 'E_unchanged') unchangedSet.add(amount);
        if (cat === 'unknown' && unknownSamples.length < 30) {
          unknownSamples.push(amount);
        }
        scaleIngredientAmount(amount, recipe.serving, 1);
      } catch {
        crashCount += 1;
      }
    }
  }

  return {
    recipeCount: recipes.length,
    ingredientCount,
    uniqueAmounts: amountSet.size,
    categories,
    unchangedExpressions: [...unchangedSet].sort(),
    unknownSamples,
    crashCount,
  };
}

export function isFuzzyAmount(amount: string): boolean {
  return UNCHANGED_EXACT.has(amount.trim());
}
