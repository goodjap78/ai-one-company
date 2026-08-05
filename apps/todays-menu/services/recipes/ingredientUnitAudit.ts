/**
 * Sprint 55.1 — ingredient name × unit consistency audit.
 */
import { parseIngredientAmount } from './servingScaler';

export type IngredientUnitClassification = 'VALID' | 'SUSPICIOUS' | 'INVALID' | 'NEEDS_REVIEW';

export type IngredientUnitAuditEntry = {
  recipeId: string;
  recipeTitle: string;
  ingredientName: string;
  amount: string;
  iconKey?: string;
  parsedValue?: number;
  parsedUnit?: string;
  classification: IngredientUnitClassification;
  reason: string;
};

const MINCED_OR_PREP_MARKERS = ['다진', '다져', '채', '즙', '페이스트', '가루'] as const;

const SOLID_VEGETABLE_MARKERS = [
  '당근',
  '양파',
  '감자',
  '애호박',
  '무',
  '오이',
  '브로콜리',
  '시금치',
  '두부',
  '콩나물',
  '버섯',
  '양배추',
  '호박',
  '피망',
  '파프리카',
  '청양고추',
  '대파',
  '쪽파',
  '깻잎',
  '상추',
] as const;

const PASTE_SEASONING_MARKERS = ['새우젓', '멸치액젓', '액젓', '젓갈', '고추장', '된장'] as const;

const MEAT_MARKERS = [
  '돼지',
  '소고기',
  '채돌',
  '닭',
  '닭고기',
  '햄',
  '베이컨',
  '소시지',
  '삼겹',
  '목살',
  '등심',
  '안심',
  '오징어',
] as const;

const SPOON_UNITS = /^(큰술|작은술|티스푼|스푼)$/u;
const COUNT_UNITS = /^(개|마리|장|봉|팩|조각|줄기|알|토막)$/u;

function hasMincedOrPrepMarker(name: string): boolean {
  return MINCED_OR_PREP_MARKERS.some((marker) => name.includes(marker));
}

function matchesSolidVegetable(name: string): boolean {
  return SOLID_VEGETABLE_MARKERS.some((marker) => name.includes(marker));
}

function matchesMeat(name: string): boolean {
  return MEAT_MARKERS.some((marker) => name.includes(marker));
}

function isSpoonUnit(unit: string): boolean {
  return SPOON_UNITS.test(unit.trim());
}

function classifyParsedIngredient(
  name: string,
  amount: string,
  iconKey?: string,
): IngredientUnitAuditEntry['classification'] | null {
  const parsed = parseIngredientAmount(amount);
  if (!parsed) return null;

  const unit = parsed.unit.trim();
  const normalizedName = name.trim();

  if (normalizedName.includes('물') && COUNT_UNITS.test(unit)) {
    return 'INVALID';
  }
  if ((normalizedName.includes('간장') || normalizedName === '설탕') && unit === '마리') {
    return 'INVALID';
  }
  if (normalizedName.includes('설탕') && unit === '개') {
    return 'SUSPICIOUS';
  }

  if (isSpoonUnit(unit) && !hasMincedOrPrepMarker(normalizedName)) {
    if (PASTE_SEASONING_MARKERS.some((marker) => normalizedName.includes(marker))) {
      return 'VALID';
    }
    if (matchesSolidVegetable(normalizedName)) {
      return 'INVALID';
    }
    if (matchesMeat(normalizedName)) {
      return 'INVALID';
    }
  }

  if (normalizedName.includes('다진') && isSpoonUnit(unit)) {
    return 'VALID';
  }

  return 'VALID';
}

export function classifyIngredientUnitEntry(
  recipeId: string,
  recipeTitle: string,
  ingredientName: string,
  amount: string,
  iconKey?: string,
): IngredientUnitAuditEntry {
  const parsed = parseIngredientAmount(amount);
  const classification =
    classifyParsedIngredient(ingredientName, amount, iconKey) ?? 'NEEDS_REVIEW';

  let reason = '허용 단위 조합';
  if (classification === 'INVALID') {
    if (ingredientName.includes('당근') && parsed && isSpoonUnit(parsed.unit)) {
      reason = '고형 채소에 큰술·작은술 단위 (다진/채 표기 없음)';
    } else if (ingredientName.includes('물') && parsed && COUNT_UNITS.test(parsed.unit)) {
      reason = '물에 개수 단위';
    } else if (isSpoonUnit(parsed?.unit ?? '')) {
      reason = '고형 재료에 스푼 단위';
    } else {
      reason = '재료·단위 조합 비정상';
    }
  } else if (classification === 'SUSPICIOUS') {
    reason = '맥락 확인 필요';
  } else if (classification === 'NEEDS_REVIEW') {
    reason = 'amount 파싱 불가 또는 분류 보류';
  }

  return {
    recipeId,
    recipeTitle,
    ingredientName,
    amount,
    iconKey,
    parsedValue: parsed?.value,
    parsedUnit: parsed?.unit,
    classification,
    reason,
  };
}

export type IngredientUnitAuditReport = {
  recipeCount: number;
  ingredientCount: number;
  valid: number;
  suspicious: number;
  invalid: number;
  needsReview: number;
  invalidEntries: IngredientUnitAuditEntry[];
  suspiciousEntries: IngredientUnitAuditEntry[];
};

export function auditRecipeIngredientUnits(
  recipes: Array<{
    id: string;
    name: string;
    ingredients: Array<{ name: string; amount: string; iconKey?: string }>;
  }>,
): IngredientUnitAuditReport {
  const entries: IngredientUnitAuditEntry[] = [];

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      entries.push(
        classifyIngredientUnitEntry(
          recipe.id,
          recipe.name,
          ingredient.name,
          ingredient.amount,
          ingredient.iconKey,
        ),
      );
    }
  }

  const invalidEntries = entries.filter((entry) => entry.classification === 'INVALID');
  const suspiciousEntries = entries.filter((entry) => entry.classification === 'SUSPICIOUS');

  return {
    recipeCount: recipes.length,
    ingredientCount: entries.length,
    valid: entries.filter((entry) => entry.classification === 'VALID').length,
    suspicious: suspiciousEntries.length,
    invalid: invalidEntries.length,
    needsReview: entries.filter((entry) => entry.classification === 'NEEDS_REVIEW').length,
    invalidEntries,
    suspiciousEntries,
  };
}
