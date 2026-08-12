import type { ShoppingProduct } from '../../types/shoppingProduct';

export type MealKitMatchQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type MealKitProductSample = {
  productTitle: string;
  price: number | null;
  hasProductUrl: boolean;
  hasAffiliateUrl: boolean;
};

export type MealKitMatchResult = {
  matchQuality: MealKitMatchQuality;
  searchKeyword: string | null;
  products: MealKitProductSample[];
  /** Why LOW/NONE — for false-positive audit trail. */
  notes: string[];
};

const MEAL_KIT_TERMS = ['밀키트', 'meal kit', 'mealkit'];
const READY_MEAL_TERMS = [
  '간편식',
  '간편',
  '즉석',
  '조리완제품',
  '완제품',
  'HMR',
  'hmr',
  '레토르트',
  '냉동',
  '손질',
];
const TOOL_TERMS = [
  '팬',
  '프라이팬',
  '냄비',
  '주걱',
  '도마',
  '칼',
  '그릇',
  '용기',
  '조리도구',
  '키친',
  'kitchen',
];
const INGREDIENT_ONLY_TERMS = [
  '계란',
  '달걀',
  '양파',
  '대파',
  '고추',
  '소스만',
  '양념만',
  '재료',
  '세트 재료',
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').trim();
}

/** Strip common prefixes/suffixes for fallback search. */
export function normalizeRecipeSearchName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/[\s·]/g, '')
    .trim();
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function recipeNameInTitle(recipeName: string, title: string): boolean {
  const recipeNorm = normalizeText(recipeName);
  const titleNorm = normalizeText(title);
  if (recipeNorm.length >= 2 && titleNorm.includes(recipeNorm)) return true;

  const core = normalizeRecipeSearchName(recipeName);
  if (core.length >= 2 && titleNorm.includes(normalizeText(core))) return true;

  return false;
}

function isToolOrIngredientFalsePositive(recipeName: string, title: string): boolean {
  const titleNorm = normalizeText(title);

  if (includesAny(title, TOOL_TERMS) && !includesAny(title, [...MEAL_KIT_TERMS, ...READY_MEAL_TERMS])) {
    return true;
  }

  const hasRecipeName = recipeNameInTitle(recipeName, title);
  if (!hasRecipeName && includesAny(title, INGREDIENT_ONLY_TERMS)) {
    if (!includesAny(title, [...MEAL_KIT_TERMS, ...READY_MEAL_TERMS])) {
      return true;
    }
  }

  if (!hasRecipeName && !includesAny(title, [...MEAL_KIT_TERMS, ...READY_MEAL_TERMS])) {
    return true;
  }

  return false;
}

function scoreProduct(recipeName: string, title: string): MealKitMatchQuality {
  if (isToolOrIngredientFalsePositive(recipeName, title)) return 'NONE';

  const hasMealKit = includesAny(title, MEAL_KIT_TERMS);
  const hasReadyMeal = includesAny(title, READY_MEAL_TERMS);
  const hasRecipe = recipeNameInTitle(recipeName, title);

  if (hasRecipe && hasMealKit) return 'HIGH';
  if (hasRecipe && hasReadyMeal) return 'MEDIUM';
  if (hasRecipe && (hasMealKit || hasReadyMeal)) return 'HIGH';

  if (hasRecipe) return 'LOW';
  return 'LOW';
}

function toSample(product: ShoppingProduct): MealKitProductSample {
  return {
    productTitle: product.title,
    price: product.price ?? null,
    hasProductUrl: Boolean(product.productUrl?.trim()),
    hasAffiliateUrl: Boolean(product.affiliateUrl?.trim()),
  };
}

const QUALITY_RANK: Record<MealKitMatchQuality, number> = {
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  NONE: 1,
};

function maxQuality(a: MealKitMatchQuality, b: MealKitMatchQuality): MealKitMatchQuality {
  return QUALITY_RANK[a] >= QUALITY_RANK[b] ? a : b;
}

/**
 * Classify Coupang search results for meal-kit / ready-meal eligibility.
 */
export function classifyMealKitMatch(
  recipeName: string,
  searchKeyword: string,
  products: ShoppingProduct[],
): MealKitMatchResult {
  const notes: string[] = [];
  if (products.length === 0) {
    return { matchQuality: 'NONE', searchKeyword, products: [], notes: ['empty_results'] };
  }

  const scored = products.map((product) => ({
    product,
    quality: scoreProduct(recipeName, product.title),
  }));

  const falsePositives = scored.filter(
    (row) => row.quality === 'NONE' && products.length > 0,
  );
  if (falsePositives.length > 0) {
    notes.push(
      `filtered_${falsePositives.length}`,
      ...falsePositives.slice(0, 2).map((row) => row.product.title),
    );
  }

  const eligible = scored.filter((row) => row.quality !== 'NONE');
  if (eligible.length === 0) {
    return {
      matchQuality: 'LOW',
      searchKeyword,
      products: products.slice(0, 3).map(toSample),
      notes: [...notes, 'weak_or_unrelated'],
    };
  }

  let best: MealKitMatchQuality = 'NONE';
  for (const row of eligible) {
    best = maxQuality(best, row.quality);
  }

  const ranked = eligible
    .filter((row) => row.quality === best || (best === 'MEDIUM' && row.quality === 'HIGH'))
    .sort((a, b) => QUALITY_RANK[b.quality] - QUALITY_RANK[a.quality]);

  const samples = ranked.slice(0, 3).map((row) => toSample(row.product));

  return {
    matchQuality: best,
    searchKeyword,
    products: samples,
    notes,
  };
}

export function buildMealKitSearchKeywords(recipeName: string): string[] {
  const trimmed = recipeName.trim();
  const normalized = normalizeRecipeSearchName(trimmed);
  const keywords = [`${trimmed} 밀키트`, `${trimmed} 간편식`];
  if (normalized !== trimmed.replace(/\s+/g, '')) {
    keywords.push(normalized);
  }
  return keywords;
}

export type FoodCategoryBucket =
  | '찌개/전골/국'
  | '볶음'
  | '덮밥'
  | '면'
  | '샐러드'
  | '야식'
  | '간식'
  | '기타';

export function inferFoodCategory(recipeName: string, tags: string[]): FoodCategoryBucket {
  const blob = `${recipeName} ${tags.join(' ')}`;

  if (/찌개|전골|탕|국|스oup/i.test(blob)) return '찌개/전골/국';
  if (/덮밥|비빔밥|볶음밥|주먹밥/.test(blob)) return '덮밥';
  if (/면|라면|국수|파스타|우동|소바|냉면/.test(blob)) return '면';
  if (/샐러드/.test(blob)) return '샐러드';
  if (/볶음|제육|불고기| stir/i.test(blob)) return '볶음';
  if (/야식|치킨|튀김|야밤|라면/.test(blob)) return '야식';
  if (/간식|디저트|케이크|과자|브런치/.test(blob)) return '간식';
  return '기타';
}

export function mergeSearchResults(
  recipeName: string,
  attempts: Array<{ keyword: string; products: ShoppingProduct[] }>,
): MealKitMatchResult {
  let best: MealKitMatchResult = {
    matchQuality: 'NONE',
    searchKeyword: null,
    products: [],
    notes: [],
  };

  for (const attempt of attempts) {
    const result = classifyMealKitMatch(recipeName, attempt.keyword, attempt.products);
    if (QUALITY_RANK[result.matchQuality] > QUALITY_RANK[best.matchQuality]) {
      best = result;
    } else if (
      result.matchQuality === best.matchQuality &&
      result.products.length > best.products.length
    ) {
      best = result;
    }

    if (best.matchQuality === 'HIGH') break;
  }

  return best;
}
