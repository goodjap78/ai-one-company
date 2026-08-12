import type { GoldMealRecord } from '../../types/goldMeal';
import type { Difficulty } from '../../types/home';
import type { MealPurpose, SituationTag, WeatherTag } from '../../types/mealIntelligence';
import type { MealTimeSlot } from '../../types/mealTime';
import type { MealDNA } from '../../types/mealDna';
import type { RecipeTagId } from '../../recipes/types';
import { getRecipeImageSourceByPath } from './recipeImageMap';
import type { Recipe } from './types';

/** Korean mealType labels → engine slots. */
const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'LATE_NIGHT',
  late_night: 'LATE_NIGHT',
};

const DIFFICULTY_KO_TO_EN: Record<string, Difficulty> = {
  쉬움: 'easy',
  보통: 'normal',
  어려움: 'hard',
  easy: 'easy',
  normal: 'normal',
  hard: 'hard',
};

/** Map free-form HANKKI tags → catalog RecipeTagId (best-effort). */
const TAG_KO_TO_ID: Record<string, RecipeTagId> = {
  매콤한: 'spicy',
  든든한: 'comfort',
  가족식: 'family',
  밥반찬: 'rice_based',
  간단한: 'quick',
  빠른요리: 'quick',
  아이식단: 'family',
  따뜻한: 'comfort',
  집밥: 'comfort',
  국물요리: 'one_pot',
  담백한: 'mild',
  건강한: 'healthy',
  한그릇: 'rice_based',
  달큰한: 'comfort',
  고기요리: 'high_protein',
  바삭한: 'comfort',
  spicy: 'spicy',
  comfort: 'comfort',
  family: 'family',
  quick: 'quick',
  rice_based: 'rice_based',
  one_pot: 'one_pot',
  mild: 'mild',
  healthy: 'healthy',
  high_protein: 'high_protein',
};

const RECIPE_EMOJI: Record<string, string> = {
  '001': '🥩',
  '002': '🍳',
  '003': '🍲',
  '004': '🍲',
  '005': '🍚',
  '006': '🥩',
  '007': '🍚',
  '008': '🍛',
  '009': '🍱',
  '010': '🍗',
  '011': '🍲',
  '012': '🍗',
  '013': '🦑',
  '014': '🥣',
  '015': '🌶️',
  '016': '🌿',
  '017': '🍜',
  '018': '🥔',
  '019': '🥚',
  '020': '🍚',
  '021': '🐟',
  '022': '🥓',
  '023': '🥩',
  '024': '🍲',
  '025': '🥣',
  '026': '🥘',
  '027': '🍜',
  '028': '🫘',
  '029': '🧈',
  '030': '🐟',
  '031': '🍳',
  '032': '🥩',
  '033': '🐟',
  '034': '🌶️',
  '035': '🦴',
  '036': '🍜',
  '037': '🌶️',
  '038': '🧊',
  '039': '🍝',
  '040': '🍙',
  '041': '🍜',
  '042': '🌶️',
  '043': '🧀',
  '044': '🌶️',
  '045': '🍜',
  '046': '🥘',
  '047': '🥣',
  '048': '🍜',
  '049': '🍲',
  '050': '🥞',
  제육볶음: '🥩',
  계란볶음밥: '🍳',
  김치찌개: '🍲',
  된장찌개: '🍲',
  비빔밥: '🍚',
  불고기: '🥩',
  김치볶음밥: '🍚',
  카레라이스: '🍛',
  돈까스: '🍱',
  닭갈비: '🍗',
  순두부찌개: '🍲',
  닭볶음탕: '🍗',
  오징어볶음: '🦑',
  갈비탕: '🥣',
  육개장: '🌶️',
  미역국: '🌿',
  떡국: '🍜',
  감자조림: '🥔',
  계란말이: '🥚',
  소불고기덮밥: '🍚',
};

function mapDifficulty(value: string): Difficulty {
  return DIFFICULTY_KO_TO_EN[value] ?? 'normal';
}

function mapMealTimes(mealType: string[]): MealTimeSlot[] {
  const slots = mealType
    .map((item) => MEAL_TYPE_KO_TO_SLOT[item] ?? MEAL_TYPE_KO_TO_SLOT[item.trim()])
    .filter((slot): slot is MealTimeSlot => Boolean(slot));
  return slots.length > 0 ? [...new Set(slots)] : ['DINNER'];
}

function mapTags(tags: string[], aiTags: string[] = []): RecipeTagId[] {
  const mapped = [...tags, ...aiTags]
    .map((tag) => TAG_KO_TO_ID[tag] ?? (tag as RecipeTagId))
    .filter((tag): tag is RecipeTagId =>
      [
        'quick',
        'comfort',
        'spicy',
        'mild',
        'healthy',
        'budget',
        'family',
        'solo',
        'late_night',
        'meal_prep',
        'one_pot',
        'rice_based',
        'high_protein',
        'vegetarian_option',
      ].includes(tag),
    );
  return mapped.length > 0 ? [...new Set(mapped)] : ['comfort'];
}

function mapSituationTags(situation: string[], tags: string[]): SituationTag[] {
  const result: SituationTag[] = ['home'];
  const blob = [...situation, ...tags].join(' ');
  if (/가족|아이/.test(blob)) result.push('family');
  if (/간단|빠른|혼자|1인/.test(blob)) result.push('alone');
  return [...new Set(result)];
}

function mapMealPurpose(tags: string[], category: string[]): MealPurpose[] {
  const purposes: MealPurpose[] = [];
  const blob = [...tags, ...category].join(' ');
  if (/간단|빠른|간편/.test(blob)) purposes.push('quick');
  if (/가족|아이/.test(blob)) purposes.push('family');
  if (/든든|따뜻한|집밥|매콤/.test(blob)) purposes.push('comfort');
  if (purposes.length === 0) purposes.push('comfort');
  return [...new Set(purposes)];
}

function inferWeatherTags(name: string, tags: string[]): WeatherTag[] {
  if (/찌개|국|탕/.test(name) || tags.some((tag) => /따뜻한|국물/.test(tag))) {
    return ['rain', 'cold'];
  }
  return ['hot', 'cold'];
}

function resolveEmoji(recipe: Recipe): string {
  return RECIPE_EMOJI[recipe.id] ?? RECIPE_EMOJI[recipe.name] ?? '🍽️';
}

function buildMealDna(recipe: Recipe, mealTime: MealTimeSlot[], situationTags: SituationTag[]): MealDNA {
  const minutes = recipe.time;
  const cookingTime = minutes <= 20 ? 'quick' : minutes <= 35 ? 'moderate' : 'slow';
  const calorie = recipe.nutrition.calorie;
  const health =
    calorie <= 380 ? 'light' : calorie >= 650 ? 'hearty' : minutes <= 15 ? 'indulgent' : 'balanced';

  let category: MealDNA['category'] = 'korean';
  if (/찌개|탕|국/.test(recipe.name)) category = /찌개|탕/.test(recipe.name) ? 'stew' : 'soup';
  else if (/밥|볶음밥|비빔/.test(recipe.name)) category = 'rice';
  else if (/면|라면|우동/.test(recipe.name)) category = 'noodle';

  return {
    weather: inferWeatherTags(recipe.name, recipe.tags),
    season: ['spring', 'summer', 'autumn', 'winter'],
    time: mealTime,
    situation: situationTags,
    cookingTime,
    health,
    category,
    canonicalIngredients: recipe.ingredients.map((item) => item.name),
  };
}

function inferCuisine(recipe: Recipe): GoldMealRecord['cuisine'] {
  const blob = [...recipe.category, recipe.name].join(' ');
  if (/일식|돈까스|우동|규동/.test(blob)) return 'Japanese';
  if (/양식|카레|파스타/.test(blob)) return 'Western';
  if (/중식|짜장|짬뽕/.test(blob)) return 'Chinese';
  return 'Korean';
}

/**
 * Sprint H3-5 — adapt HANKKI content schema → GoldMealRecord for recommendation catalog.
 * Does not mutate CORE_RECIPES.
 */
export function hankkiRecipeToGoldMeal(recipe: Recipe): GoldMealRecord {
  const mealTime = mapMealTimes(recipe.mealType);
  const tags = mapTags(recipe.tags, recipe.aiTags);
  const situationTags = mapSituationTags(recipe.situation, recipe.tags);
  const subtitle = recipe.situation[0] ?? `오늘은 ${recipe.name} 어때요?`;
  const steps = recipe.recipe.steps.map((step, index) => {
    const instruction = step.instruction.trim();
    const title = (step.title?.trim() || step.guide?.trim() || instruction).slice(0, 24);
    return {
      order: index + 1,
      guide: title,
      instruction,
      imageKey: step.imageKey,
      tip: step.tip,
    };
  });
  const cuisine = inferCuisine(recipe);

  return {
    id: recipe.id,
    title: recipe.name,
    subtitle,
    description: recipe.situation.join(' ') || subtitle,
    type: 'MAIN',
    mealStyle: recipe.time <= 15 ? 'instant' : 'recipe',
    mealPurpose: mapMealPurpose(recipe.tags, recipe.category),
    mealTime,
    weatherTags: inferWeatherTags(recipe.name, recipe.tags),
    situationTags,
    cuisine,
    mode: 'homemade',
    cookTime: recipe.time,
    difficulty: mapDifficulty(recipe.difficulty),
    servings: recipe.serving,
    aiReason: subtitle,
    experienceLabel: recipe.category.includes('간편식')
      ? '금방 만드는 한 끼'
      : recipe.category.includes('국물요리')
        ? '따뜻한 국물 한 끼'
        : cuisine === 'Japanese'
          ? '담백한 일식 한 끼'
          : cuisine === 'Western'
            ? '부드러운 양식 한 끼'
            : '든든한 한식 한 끼',
    suggestedPairings: [],
    ingredients: recipe.ingredients.map((item) => ({
      name: item.name,
      amount: item.amount,
      tags: item.tags,
      iconKey: item.iconKey,
      group: item.group,
    })),
    cookingSupport:
      steps.length > 0
        ? {
            kind: 'steps',
            tip: recipe.situation[1] ?? `${recipe.name}, 오늘 한 끼로 좋아요.`,
            steps,
          }
        : undefined,
    tags,
    heroImage: {
      emoji: resolveEmoji(recipe),
      accessibilityLabel: recipe.name,
      // Sprint H3-5.1 — driven by HANKKI `recipe.image` (bundled stand-in until file ships).
      source: getRecipeImageSourceByPath(recipe.image) ?? undefined,
      url: null,
    },
    mealDna: buildMealDna(recipe, mealTime, situationTags),
    recommendationMessages: recipe.recommendationMessages,
    heroMascotMessage: recipe.heroMascotMessage,
  };
}
