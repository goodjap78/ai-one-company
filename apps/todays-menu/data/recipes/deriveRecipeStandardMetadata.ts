/**
 * Sprint 25 — Derive standardized recommendation metadata from existing recipe fields.
 * Does not mutate legacy tags / situation / decisionTags.
 */
import type { RecipeDecisionTags } from './decisionTypes';
import { PIPELINE_DRAFT_SPECS } from './pipeline/draftSpecsPart1';
import { PIPELINE_DRAFT_SPECS_PART2 } from './pipeline/draftSpecsPart2';
import type { PipelineCuisine, RecipeSpec } from './pipeline/types';
import { RECIPE_STANDARD_METADATA_OVERRIDES } from './recipeStandardMetadataOverrides';
import type {
  RecipeStandardMetadata,
  RecipeStandardMetadataOverride,
  StandardAllergyTag,
  StandardCookingMethod,
  StandardCuisine,
  StandardDietaryTag,
  StandardDifficulty,
  StandardDishType,
  StandardMealType,
  StandardSituationTag,
  StandardSpiceLevel,
  StandardTasteProfile,
} from './recipeStandardMetadataTypes';
import type { Recipe, RecipeIngredient, RecipeStepContent } from './types';

const PIPELINE_SPEC_BY_ID = new Map<string, RecipeSpec>(
  [...PIPELINE_DRAFT_SPECS, ...PIPELINE_DRAFT_SPECS_PART2].map((spec) => [spec.id, spec]),
);

const ICON_KEY_ALLERGIES: Record<string, StandardAllergyTag[]> = {
  egg: ['egg'],
  milk: ['milk'],
  cheese: ['milk'],
  butter: ['milk'],
  peanut: ['peanut'],
  flour: ['wheat'],
  bread_crumbs: ['wheat'],
  soy_sauce: ['soy'],
  doenjang: ['soy'],
  tofu: ['soy'],
  fried_tofu: ['soy'],
  gochujang: ['soy'],
  fish: ['fish'],
  fish_generic: ['fish'],
  tuna: ['fish'],
  salmon: ['fish'],
  mackerel: ['fish'],
  anchovy: ['fish'],
  fish_cake: ['fish'],
  squid: ['shellfish'],
  shrimp: ['shellfish'],
  octopus: ['shellfish'],
  pork: ['pork'],
  beef: ['beef'],
  chicken: ['chicken'],
  ham: ['pork'],
};

const MEAT_ICON_KEYS = new Set([
  'pork',
  'beef',
  'chicken',
  'ham',
  'fish',
  'fish_generic',
  'tuna',
  'salmon',
  'mackerel',
  'anchovy',
  'fish_cake',
  'squid',
  'octopus',
]);

type DeriveSource = {
  id: string;
  name: string;
  category: string[];
  mealType: string[];
  time: number;
  difficulty: string;
  serving: number;
  ingredients: RecipeIngredient[];
  nutrition: { calorie: number; protein: number };
  tags: string[];
  situation: string[];
  aiTags: string[];
  recipe: { steps: RecipeStepContent[] };
  decisionTags: RecipeDecisionTags;
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function blob(source: DeriveSource): string {
  return [
    source.name,
    ...source.category,
    ...source.mealType,
    ...source.tags,
    ...source.situation,
    ...source.aiTags,
  ]
    .join(' ')
    .toLowerCase();
}

function mapDifficulty(difficulty: string): StandardDifficulty {
  const d = difficulty.trim().toLowerCase();
  if (d === '쉬움' || d === 'easy') return 'easy';
  if (d === '어려움' || d === 'hard') return 'hard';
  return 'medium';
}

function mapSpiceLevel(decisionTags: RecipeDecisionTags): StandardSpiceLevel {
  if (decisionTags.spicyLevel >= 2) return 'spicy';
  if (decisionTags.spicyLevel === 1) return 'medium';
  return 'mild';
}

function mapMealTypes(source: DeriveSource): StandardMealType[] {
  const out: StandardMealType[] = [];
  for (const raw of source.mealType) {
    const t = raw.trim();
    if (t === '아침') out.push('breakfast');
    else if (t === '점심') out.push('lunch');
    else if (t === '저녁') out.push('dinner');
    else if (t === '야식') out.push('late_night');
    else if (t === '간식') out.push('snack');
  }
  if (out.length === 0) {
    if (source.decisionTags.mealTime.includes('breakfast')) out.push('breakfast');
    if (source.decisionTags.mealTime.includes('lunch')) out.push('lunch');
    if (source.decisionTags.mealTime.includes('dinner')) out.push('dinner');
    if (source.decisionTags.mealTime.includes('late_night')) out.push('late_night');
  }
  return unique(out.length > 0 ? out : (['dinner'] as StandardMealType[]));
}

function mapPipelineCuisine(
  pipelineCuisine: PipelineCuisine | undefined,
  source: DeriveSource,
): { cuisine: StandardCuisine; ambiguous: boolean } {
  const text = blob(source);

  if (pipelineCuisine === 'korean') return { cuisine: 'korean', ambiguous: false };
  if (pipelineCuisine === 'chinese') return { cuisine: 'chinese', ambiguous: false };
  if (pipelineCuisine === 'japanese') return { cuisine: 'japanese', ambiguous: false };
  if (pipelineCuisine === 'western') return { cuisine: 'western', ambiguous: false };
  if (pipelineCuisine === 'snack') return { cuisine: 'snack', ambiguous: false };

  if (pipelineCuisine === 'healthy' || pipelineCuisine === 'quick') {
    if (/일식|초밥|우동|돈까스|라멘|규동/.test(text)) {
      return { cuisine: 'japanese', ambiguous: false };
    }
    if (/양식|파스타|샐러드|버거|스테이크|그라탕|토스트/.test(text)) {
      return { cuisine: 'western', ambiguous: false };
    }
    if (/중식|짜장|짬뽕/.test(text)) return { cuisine: 'chinese', ambiguous: false };
    if (/분식|떡볶이|김밥|핫도그/.test(text)) {
      return { cuisine: 'snack', ambiguous: false };
    }
    if (/한식|국물|찌개|밥|볶음/.test(text)) {
      return { cuisine: 'korean', ambiguous: false };
    }
    return { cuisine: 'korean', ambiguous: true };
  }

  if (/일식|돈까스|우동|라멘|규동|초밥|유부/.test(text)) {
    return { cuisine: 'japanese', ambiguous: false };
  }
  if (/중식|짜장|짬뽕|탕수/.test(text)) return { cuisine: 'chinese', ambiguous: false };
  if (/양식|파스타|샌드|버거|스테이크|그라탕|프렌치|오믈렛/.test(text)) {
    return { cuisine: 'western', ambiguous: false };
  }
  if (/분식|떡볶이|김밥|핫도그|순대/.test(text) && !/한식/.test(text)) {
    return { cuisine: 'snack', ambiguous: false };
  }
  if (/퓨전|fusion/.test(text)) return { cuisine: 'fusion', ambiguous: false };
  if (/베트남|태국|쌀국수|팟타이/.test(text)) return { cuisine: 'asian', ambiguous: false };

  if (/한식|집밥|국물|찌개|반찬/.test(text) || source.category.some((c) => c.includes('한식'))) {
    return { cuisine: 'korean', ambiguous: false };
  }

  return { cuisine: 'korean', ambiguous: true };
}

function mapDishType(source: DeriveSource): { dishType: StandardDishType; ambiguous: boolean } {
  const name = source.name;
  const text = blob(source);

  if (/덮밥|규동|돈부리/.test(name)) return { dishType: 'rice_bowl', ambiguous: false };
  if (/닭갈비|갈비볶음|제육볶음|불고기(?!덮)/.test(name)) {
    return { dishType: 'stir_fry', ambiguous: false };
  }
  if (/계란말이|계란찜|계란후라이/.test(name)) {
    return { dishType: 'other', ambiguous: false };
  }
  if (/떡갈비/.test(name)) return { dishType: 'grilled', ambiguous: false };
  if (/미트볼/.test(name)) return { dishType: 'other', ambiguous: false };
  if (/샌드|버거|클럽/.test(name)) return { dishType: 'sandwich', ambiguous: false };
  if (/샐러드/.test(name)) return { dishType: 'salad', ambiguous: false };
  if (/파스타|스파게티|면|라면|우동|국수|냉면|비빔국수|잡채/.test(name)) {
    return { dishType: 'noodle', ambiguous: false };
  }
  if (/찌개|전골|조림/.test(name) || /찌개/.test(text)) {
    return { dishType: 'stew', ambiguous: false };
  }
  if (/국|탕|곰탕|설렁탕|미역국|된장국|콩나물국/.test(name)) {
    return { dishType: 'soup', ambiguous: false };
  }
  if (/볶음밥|비빔밥|밥|주먹밥|김밥/.test(name)) {
    return { dishType: /덮밥/.test(name) ? 'rice_bowl' : 'rice', ambiguous: false };
  }
  if (/볶음|볶이/.test(name)) return { dishType: 'stir_fry', ambiguous: false };
  if (/구이|스테이크/.test(name)) return { dishType: 'grilled', ambiguous: false };
  if (/튀김|돈까스|치킨|가라아게|핫도크|치즈볼/.test(name)) {
    return { dishType: 'fried', ambiguous: false };
  }
  if (/찜/.test(name)) return { dishType: 'steamed', ambiguous: false };
  if (/떡볶이|분식|핫도그|어묵|순대|호떡|토스트/.test(name)) {
    return { dishType: 'snack', ambiguous: false };
  }
  if (/호떡|맛탕|디저트/.test(name)) return { dishType: 'dessert', ambiguous: false };

  if (/전$|전 /.test(name) || source.category.some((c) => c.includes('전'))) {
    return { dishType: 'fried', ambiguous: false };
  }
  if (source.category.some((c) => /국물/.test(c))) {
    return { dishType: /찌개/.test(text) ? 'stew' : 'soup', ambiguous: false };
  }
  if (source.aiTags.includes('soup') || source.aiTags.includes('one_pot')) {
    return { dishType: /찌개/.test(text) ? 'stew' : 'soup', ambiguous: false };
  }
  if (source.aiTags.includes('rice_based')) return { dishType: 'rice', ambiguous: false };

  return { dishType: 'other', ambiguous: true };
}

function mapTasteProfile(source: DeriveSource): StandardTasteProfile[] {
  const text = blob(source);
  const out: StandardTasteProfile[] = [];

  if (/mild|담백|순한/.test(text)) out.push('mild');
  if (/spicy|매콤|매운|칼칼|고추/.test(text)) out.push('spicy');
  if (/달콤|달큰|sweet/.test(text)) out.push('sweet');
  if (/새콤|상큼|vinegar|식초/.test(text)) out.push('sour');
  if (/고소|nutty|참기름|버터|크림/.test(text)) out.push('nutty');
  if (/시원|냉|refreshing|가벼운/.test(text)) out.push('refreshing');
  if (/크림|치즈|든든|rich|comfort/.test(text)) out.push('rich');
  if (/가벼운|light|다이어트|저칼로리|healthy/.test(text)) out.push('light');
  if (/짭|salty/.test(text)) out.push('salty');
  if (/구수|집밥|든든|savory|umami/.test(text)) out.push('savory');

  return unique(out.length > 0 ? out : (['savory'] as StandardTasteProfile[]));
}

function mapSituationTags(source: DeriveSource): StandardSituationTag[] {
  const text = blob(source);
  const out: StandardSituationTag[] = [];
  const { decisionTags } = source;

  if (/solo|혼밥|혼자|alone/.test(text) || source.serving === 1) out.push('solo_meal');
  if (/family|가족/.test(text) || source.serving >= 3 || decisionTags.situation.includes('family')) {
    out.push('family_meal');
  }
  if (
    /kids|아이|어린이/.test(text) ||
    decisionTags.situation.includes('kids') ||
    decisionTags.kidFriendly
  ) {
    out.push('kids_meal');
  }
  if (/quick|빠른|간단|초간단|20분/.test(text) || source.time <= 15) {
    out.push('quick_meal');
  }
  if (/guest|손님|초대|파티/.test(text) || decisionTags.situation.includes('guest')) {
    out.push('guest_meal');
  }
  if (/해장|숙취|속이/.test(text)) out.push('hangover');
  if (/안주|술|drinking/.test(text) || source.mealType.includes('야식')) {
    out.push('drinking_snack');
  }
  if (/다이어트|healthy|저칼로리|가벼운/.test(text)) out.push('diet_meal');
  if (/comfort|든든|집밥|구수/.test(text) || decisionTags.mood.includes('comfort')) {
    out.push('comfort_food');
  }
  if (/비 오는|추운|따뜻한|국물|찌개|rain|cold/.test(text)) out.push('cold_day');
  if (/여름|더운|냉면|시원|hot_day/.test(text)) out.push('hot_day');

  return unique(out);
}

function mapCookingMethods(source: DeriveSource): StandardCookingMethod[] {
  const stepText = source.recipe.steps
    .map((s) => `${s.title} ${s.instruction}`)
    .join(' ')
    .toLowerCase();
  const out: StandardCookingMethod[] = [];

  if (/전자레인지|렌지|microwave/.test(stepText)) out.push('microwave');
  if (/에어프라이어|air.?fryer/.test(stepText)) out.push('air_fryer');
  if (/팬|프라이팬|볶|부치|굽기/.test(stepText)) out.push('frying_pan');
  if (/냄비|찌개|탕|국|끓|우동|라면/.test(stepText)) out.push('pot');
  if (/오븐|굽기|베이킹|그라탕/.test(stepText)) out.push('oven');
  if (/삶|데치|끓여/.test(stepText)) out.push('boiling');
  if (/굽|그릴|스테이크/.test(stepText)) out.push('grilling');
  if (/찜|쪄|steaming/.test(stepText)) out.push('steaming');

  if (out.length === 0) {
    if (/볶|부치|지져/.test(stepText)) out.push('frying_pan');
    else if (/끓|넣고/.test(stepText)) out.push('pot');
  }

  return unique(out);
}

function mapDietaryTags(source: DeriveSource): StandardDietaryTag[] {
  const text = blob(source);
  const out: StandardDietaryTag[] = [];
  const hasMeat = source.ingredients.some((i) => MEAT_ICON_KEYS.has(i.iconKey));

  if (/high_protein|단백질/.test(text) || source.nutrition.protein >= 25) {
    out.push('high_protein');
  }
  if (source.nutrition.carbohydrate > 0 && source.nutrition.carbohydrate <= 30) {
    out.push('low_carb');
  }
  if (
    (/vegetarian_option|채식/.test(text) || source.aiTags.includes('vegetarian_option')) &&
    !hasMeat
  ) {
    out.push('vegetarian');
  }
  if (/가벼운|light|다이어트|healthy|담백/.test(text) || source.nutrition.calorie < 400) {
    out.push('light_meal');
  }
  if (/든든|comfort|hearty|배부/.test(text) || source.nutrition.calorie >= 550) {
    out.push('filling_meal');
  }

  return unique(out);
}

function mainIngredients(source: DeriveSource): string[] {
  return unique(
    source.ingredients.filter((i) => i.group === 'main').map((i) => i.iconKey.trim()),
  );
}

function deriveAllergyTags(source: DeriveSource): StandardAllergyTag[] {
  const out: StandardAllergyTag[] = [];
  for (const ing of source.ingredients) {
    const mapped = ICON_KEY_ALLERGIES[ing.iconKey];
    if (mapped) out.push(...mapped);

    const name = ing.name.toLowerCase();
    if (/새우|게|조개|홍합/.test(name)) out.push('shellfish');
    if (/견과|아몬드|호두/.test(name)) out.push('nuts');
    if (/밀가루|빵|면/.test(name) && !mapped?.includes('wheat')) out.push('wheat');
    if (/두부|된장|간장/.test(name) && !mapped?.includes('soy')) out.push('soy');
  }
  return unique(out);
}

function isScaffoldTemplate(source: DeriveSource): boolean {
  return source.recipe.steps.some((step) =>
    /손질하고.*준비를 해요/.test(step.instruction),
  );
}

type IconMismatch = { ingredientName: string; iconKey: string; note: string };

function detectIconKeyMismatches(source: DeriveSource): IconMismatch[] {
  const mismatches: IconMismatch[] = [];
  for (const ing of source.ingredients) {
    const name = ing.name;
    if (/스파게티|파스타면|면/.test(name) && ing.iconKey === 'rice_cake') {
      mismatches.push({
        ingredientName: name,
        iconKey: ing.iconKey,
        note: 'Noodle ingredient uses rice_cake iconKey',
      });
    }
    if (/당면|냉면|우동|라면면/.test(name) && ing.iconKey === 'rice_cake') {
      mismatches.push({
        ingredientName: name,
        iconKey: ing.iconKey,
        note: 'Noodle ingredient uses rice_cake iconKey',
      });
    }
    if (/순대/.test(name) && ing.iconKey === 'rice_cake') {
      mismatches.push({
        ingredientName: name,
        iconKey: ing.iconKey,
        note: 'Sundae ingredient uses rice_cake iconKey',
      });
    }
  }
  return mismatches;
}

function detectNameDishTypeConflict(
  name: string,
  dishType: StandardDishType,
): string | null {
  if (/파스타|라면|우동|면|국수/.test(name) && !['noodle', 'soup', 'stew'].includes(dishType)) {
    return `Name suggests noodle dish but dishType is ${dishType}`;
  }
  if (/샐러드/.test(name) && dishType !== 'salad') {
    return `Name suggests salad but dishType is ${dishType}`;
  }
  if (/찌개|전골/.test(name) && dishType !== 'stew') {
    return `Name suggests stew but dishType is ${dishType}`;
  }
  if (
    /국|탕/.test(name) &&
    !/찌개|전골|볶음|국수|냉면|우동|라면|면/.test(name) &&
    dishType !== 'soup'
  ) {
    return `Name suggests soup but dishType is ${dishType}`;
  }
  return null;
}

function detectNameCuisineConflict(name: string, cuisine: StandardCuisine): string | null {
  if (/돈까스|우동|라멘|초밥|유부|규동/.test(name) && cuisine !== 'japanese') {
    return `Name suggests Japanese but cuisine is ${cuisine}`;
  }
  if (/파스타|버거|스테이크|그라탕|오믈렛/.test(name) && cuisine !== 'western') {
    return `Name suggests Western but cuisine is ${cuisine}`;
  }
  if (/짜장|짬뽕|탕수/.test(name) && cuisine !== 'chinese') {
    return `Name suggests Chinese but cuisine is ${cuisine}`;
  }
  return null;
}

function mergeMetadata(
  base: RecipeStandardMetadata,
  override?: RecipeStandardMetadataOverride,
): RecipeStandardMetadata {
  if (!override) return base;

  const reviewNotes = override.appendReviewNotes
    ? unique([...base.reviewNotes, ...(override.reviewNotes ?? [])])
    : (override.reviewNotes ?? base.reviewNotes);

  return {
    cuisine: override.cuisine ?? base.cuisine,
    dishType: override.dishType ?? base.dishType,
    tasteProfile: override.tasteProfile ?? base.tasteProfile,
    mealTypes: override.mealTypes ?? base.mealTypes,
    situationTags: override.situationTags ?? base.situationTags,
    cookingMethods: override.cookingMethods ?? base.cookingMethods,
    dietaryTags: override.dietaryTags ?? base.dietaryTags,
    mainIngredients: override.mainIngredients ?? base.mainIngredients,
    allergyTags: override.allergyTags ?? base.allergyTags,
    spiceLevel: override.spiceLevel ?? base.spiceLevel,
    cookingTime: override.cookingTime ?? base.cookingTime,
    servings: override.servings ?? base.servings,
    difficulty: override.difficulty ?? base.difficulty,
    reviewNeeded: override.reviewNeeded ?? base.reviewNeeded,
    reviewNotes,
  };
}

/** Build standardized metadata for one recipe. */
export function deriveRecipeStandardMetadata(
  source: DeriveSource,
  inputOverride?: RecipeStandardMetadataOverride,
): RecipeStandardMetadata {
  const reviewNotes: string[] = [];
  let reviewNeeded = false;

  const pipelineSpec = PIPELINE_SPEC_BY_ID.get(source.id);
  const cuisineResult = mapPipelineCuisine(pipelineSpec?.cuisine, source);
  const dishResult = mapDishType(source);

  if (cuisineResult.ambiguous) {
    reviewNotes.push('Cuisine inferred with limited category evidence');
    reviewNeeded = true;
  }
  if (dishResult.ambiguous) {
    reviewNotes.push('Dish type could not be determined confidently');
    reviewNeeded = true;
  }

  if (isScaffoldTemplate(source)) {
    reviewNotes.push('Pipeline scaffold step template detected (051–100 batch)');
    reviewNeeded = true;
  }

  const iconMismatches = detectIconKeyMismatches(source);
  for (const mismatch of iconMismatches) {
    reviewNotes.push(
      `iconKey mismatch: ${mismatch.ingredientName} → ${mismatch.iconKey} (${mismatch.note})`,
    );
    reviewNeeded = true;
  }

  if (source.decisionTags.kidFriendly && source.decisionTags.spicyLevel >= 2) {
    reviewNotes.push('kidFriendly true with spicyLevel >= 2');
    reviewNeeded = true;
  }

  const nameDishConflict = detectNameDishTypeConflict(source.name, dishResult.dishType);
  if (nameDishConflict) {
    reviewNotes.push(nameDishConflict);
    reviewNeeded = true;
  }

  const nameCuisineConflict = detectNameCuisineConflict(source.name, cuisineResult.cuisine);
  if (nameCuisineConflict) {
    reviewNotes.push(nameCuisineConflict);
    reviewNeeded = true;
  }

  const base: RecipeStandardMetadata = {
    cuisine: cuisineResult.cuisine,
    dishType: dishResult.dishType,
    tasteProfile: mapTasteProfile(source),
    mealTypes: mapMealTypes(source),
    situationTags: mapSituationTags(source),
    cookingMethods: mapCookingMethods(source),
    dietaryTags: mapDietaryTags(source),
    mainIngredients: mainIngredients(source),
    allergyTags: deriveAllergyTags(source),
    spiceLevel: mapSpiceLevel(source.decisionTags),
    cookingTime: source.time,
    servings: source.serving,
    difficulty: mapDifficulty(source.difficulty),
    reviewNeeded,
    reviewNotes: unique(reviewNotes),
  };

  const idOverride = RECIPE_STANDARD_METADATA_OVERRIDES[source.id];
  const merged = mergeMetadata(base, idOverride);
  const finalMerged = mergeMetadata(merged, inputOverride);

  if (finalMerged.reviewNotes.length > 0 && !inputOverride?.reviewNeeded) {
    finalMerged.reviewNeeded = finalMerged.reviewNeeded || finalMerged.reviewNotes.length > 0;
  }

  return {
    ...finalMerged,
    tasteProfile: unique(finalMerged.tasteProfile),
    mealTypes: unique(finalMerged.mealTypes),
    situationTags: unique(finalMerged.situationTags),
    cookingMethods: unique(finalMerged.cookingMethods),
    dietaryTags: unique(finalMerged.dietaryTags),
    mainIngredients: unique(finalMerged.mainIngredients),
    allergyTags: unique(finalMerged.allergyTags),
    reviewNotes: unique(finalMerged.reviewNotes),
  };
}

/** Convenience wrapper for a full Recipe record. */
export function deriveRecipeStandardMetadataFromRecipe(
  recipe: Recipe,
  override?: RecipeStandardMetadataOverride,
): RecipeStandardMetadata {
  return deriveRecipeStandardMetadata(
    {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      mealType: recipe.mealType,
      time: recipe.time,
      difficulty: recipe.difficulty,
      serving: recipe.serving,
      ingredients: recipe.ingredients,
      nutrition: recipe.nutrition,
      tags: recipe.tags,
      situation: recipe.situation,
      aiTags: recipe.aiTags,
      recipe: recipe.recipe,
      decisionTags: recipe.decisionTags,
    },
    override,
  );
}
