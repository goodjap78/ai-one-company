import type { FoodMemoryRecord, FoodMemorySnapshot } from '../../types/foodMemory';
import type { MealDNA } from '../../types/mealDna';
import type { MenuItem } from '../../types/recommendation';
import { getMenuById } from '../recipe/mockRecipeDetails';
import { resolveMealDna } from '../recommendation/mealIntelligence/mealDna';
import { classifyMealArchetypes } from '../recommendation/mealIntelligence/mealProfile';
import type {
  HealthMemoryAnalysis,
  HealthMemorySnapshot,
  HealthPatternTag,
  MealHealthTraits,
} from './healthMemoryTypes';
import { isIndulgentHealth, isLightHealth } from './healthMemoryTypes';

export const HEALTH_MEMORY_WINDOW = 5;
const HEAVY_THRESHOLD = 2;

const FRIED_KEYWORDS = ['튀김', '돈까스', '치킨', '탕수육', '깐풍', '튀긴', '프라이'];
const PROTEIN_KEYWORDS = ['고기', '제육', '삼겹', '불고기', '닭', '생선', '계란', '두부'];

function titleMatches(title: string, keywords: string[]): boolean {
  return keywords.some((keyword) => title.includes(keyword));
}

export function resolveMealHealthTraits(menu: MenuItem | null, mealId: string): MealHealthTraits {
  const item = menu ?? getMenuById(mealId);
  if (!item) {
    return inferTraitsFromMealId(mealId);
  }

  const dna: MealDNA = item.mealDna ?? resolveMealDna(item);
  const archetypes = classifyMealArchetypes(item);
  const title = item.title;

  const isMeat =
    dna.category === 'grill' ||
    archetypes.includes('grill') ||
    archetypes.includes('bbq') ||
    titleMatches(title, ['삼겹', '불고기', '제육', '갈비']);

  const isNoodle =
    dna.category === 'noodle' ||
    archetypes.includes('noodle') ||
    archetypes.includes('pasta') ||
    titleMatches(title, ['면', '국수', '짜파', '짜장', '라면']);

  const isSoup =
    dna.category === 'soup' ||
    dna.category === 'stew' ||
    archetypes.includes('soup') ||
    archetypes.includes('stew');

  const isFried =
    isIndulgentHealth(dna.health) &&
    (dna.category === 'instant' ||
      dna.category === 'delivery' ||
      titleMatches(title, FRIED_KEYWORDS));

  const isSpicy = item.tags.includes('spicy') || titleMatches(title, ['매운', '고추', '제육', '김치']);

  const hasVegetable =
    dna.category === 'salad' ||
    archetypes.includes('salad') ||
    isLightHealth(dna.health) ||
    item.tags.includes('healthy') ||
    titleMatches(title, ['비빔', '나물', '샐러드', '채소']);

  const hasProtein =
    isMeat ||
    titleMatches(title, PROTEIN_KEYWORDS) ||
    dna.health === 'hearty';

  const isLight = isLightHealth(dna.health) || archetypes.includes('salad') || archetypes.includes('cold_meal');

  return { isMeat, isNoodle, isSoup, isFried, isSpicy, hasVegetable, hasProtein, isLight };
}

function inferTraitsFromMealId(mealId: string): MealHealthTraits {
  const isNoodle = mealId.includes('jjapaghetti') || mealId.includes('jajang') || mealId.includes('jjamppong');
  const isMeat = mealId.includes('samgyeopsal') || mealId.includes('bulgogi') || mealId.includes('jeyuk');
  const isSoup = mealId.includes('jjigae') || mealId.includes('tang');
  return {
    isMeat,
    isNoodle,
    isSoup,
    isFried: mealId.includes('jjapaghetti') || mealId.startsWith('gold_c_'),
    isSpicy: mealId.includes('jeyuk') || mealId.includes('kimchi') || mealId.includes('jjamppong'),
    hasVegetable: mealId.includes('bibimbap'),
    hasProtein: isMeat,
    isLight: mealId.includes('bibimbap'),
  };
}

function isHeavy(count: number): boolean {
  return count >= HEAVY_THRESHOLD;
}

function analyzeTraits(
  meals: FoodMemoryRecord[],
  windowSize: number,
): HealthMemoryAnalysis {
  const window = meals.slice(0, windowSize);
  const tags = new Set<HealthPatternTag>();

  if (window.length === 0) {
    return { tags: [], windowSize, mealCount: 0 };
  }

  const traitsList = window.map((meal) => {
    const menu = getMenuById(meal.mealId);
    return resolveMealHealthTraits(menu, meal.mealId);
  });

  const countTrait = (key: keyof MealHealthTraits): number =>
    traitsList.filter((traits) => traits[key]).length;

  if (isHeavy(countTrait('isMeat'))) tags.add('recent_meat_heavy');
  if (isHeavy(countTrait('isNoodle'))) tags.add('recent_noodle_heavy');
  if (isHeavy(countTrait('isSoup'))) tags.add('recent_soup_heavy');
  if (isHeavy(countTrait('isFried'))) tags.add('recent_fried_heavy');
  if (isHeavy(countTrait('isSpicy'))) tags.add('recent_spicy_heavy');

  if (window.length >= 3 && countTrait('hasVegetable') <= 1) {
    tags.add('recent_low_vegetable');
  }
  if (window.length >= 3 && countTrait('hasProtein') <= 1) {
    tags.add('recent_low_protein');
  }

  const mealIdCounts = window.reduce<Record<string, number>>((acc, meal) => {
    acc[meal.mealId] = (acc[meal.mealId] ?? 0) + 1;
    return acc;
  }, {});
  if (Object.values(mealIdCounts).some((count) => count >= 2)) {
    tags.add('recent_repetitive_meals');
  }

  const categoryRun = window.every((meal, index) => index === 0 || meal.category === window[0].category);
  if (window.length >= 3 && categoryRun) {
    tags.add('recent_repetitive_meals');
  }

  return { tags: [...tags], windowSize, mealCount: window.length };
}

/** Build Health Memory snapshot from Food Memory accepted meals. */
export function buildHealthMemorySnapshot(
  foodMemory?: FoodMemorySnapshot,
  windowSize = HEALTH_MEMORY_WINDOW,
): HealthMemorySnapshot {
  const meals = foodMemory?.meals ?? [];
  const analysis = analyzeTraits(meals, windowSize);

  return {
    version: 1,
    analysis,
    mealIds: meals.slice(0, windowSize).map((meal) => meal.mealId),
  };
}

export function analyzeHealthMemory(
  foodMemory?: FoodMemorySnapshot,
  windowSize = HEALTH_MEMORY_WINDOW,
): HealthMemoryAnalysis {
  return buildHealthMemorySnapshot(foodMemory, windowSize).analysis;
}
