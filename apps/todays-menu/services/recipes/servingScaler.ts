/**
 * Sprint 49-A — Scale ingredient amounts by serving ratio without mutating recipe data.
 */
export type ServingScaleStatus = 'scaled' | 'unchanged' | 'needs_review';

export type ServingScaleResult = {
  originalAmount: string;
  scaledAmount: string;
  status: ServingScaleStatus;
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

const COUNT_UNITS =
  /^(개|모|장|대|봉|팩|캔|공기|컵|줌|마리|쪽|알|토막|덩이|봉지|포|통|병|박스|인분|줄기|송이|덩어리|조각)$/u;

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

function formatCountNumber(value: number): string {
  if (value <= 0) return '0';
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac < 0.08) return String(whole);

  for (const f of FRACTIONS) {
    if (Math.abs(frac - f.value) < 0.08) {
      return whole > 0 ? `${whole}${f.text}` : f.text;
    }
  }

  return formatDecimal(value);
}

const SPOON_UNITS = /^(큰술|작은술|티스푼|스푼)$/u;

function usesFractionNumberFormat(unit: string): boolean {
  const normalizedUnit = unit.trim();
  return COUNT_UNITS.test(normalizedUnit) || SPOON_UNITS.test(normalizedUnit);
}

function formatScaledNumber(value: number, unit: string): string {
  const normalizedUnit = unit.trim();
  const numText = usesFractionNumberFormat(normalizedUnit)
    ? formatCountNumber(value)
    : formatDecimal(value);
  return `${numText}${normalizedUnit}`;
}

function formatRangeAmount(
  left: number,
  right: number,
  unit: string,
  sep: string,
): string {
  const normalizedUnit = unit.trim();
  const useFraction = usesFractionNumberFormat(normalizedUnit);
  const leftText = useFraction ? formatCountNumber(left) : formatDecimal(left);
  const rightText = useFraction ? formatCountNumber(right) : formatDecimal(right);
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
  const scaledAmount = formatScaledNumber(scaledValue, parsed.unit);
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
