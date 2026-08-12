import type { Ingredient } from '../../types/ingredient';

function ing(
  id: string,
  canonicalName: string,
  aliases: string[],
  category: Ingredient['category'],
  nutritionGroup: Ingredient['nutritionGroup'],
  mealTags: Ingredient['mealTags'],
): Ingredient {
  const searchableTokens = [
    canonicalName,
    ...aliases,
    category,
    nutritionGroup,
    ...mealTags,
  ].map((token) => token.toLowerCase());

  return {
    id,
    canonicalName,
    aliases,
    category,
    nutritionGroup,
    searchableTokens: [...new Set(searchableTokens)],
    mealTags,
  };
}

/** Canonical ingredient registry — IIE source of truth. */
export const INGREDIENT_REGISTRY: Ingredient[] = [
  ing('ing_egg', '계란', ['달걀', '유정란', 'Egg', 'Eggs', 'egg', 'eggs'], 'eggs', 'protein', [
    'breakfast',
    'protein_main',
    'pantry_staple',
  ]),
  ing(
    'ing_pork',
    '돼지고기',
    ['삼겹살', '목살', '앞다리살', '돼지고기 앞다리살', '돼지고기 목살', '돼지', '삼겹'],
    'meat',
    'protein',
    ['dinner', 'protein_main'],
  ),
  ing('ing_onion', '양파', ['Onion', 'onion'], 'vegetables', 'fiber', ['pantry_staple', 'side']),
  ing('ing_kimchi', '김치', ['Kimchi', 'kimchi', '배추김치'], 'vegetables', 'fiber', [
    'fermented',
    'pantry_staple',
    'side',
  ]),
  ing('ing_tofu', '두부', ['Tofu', 'tofu', '순두부', '연두부'], 'vegetables', 'protein', [
    'protein_main',
    'side',
  ]),
  ing('ing_beef', '소고기', ['소고기 불고기용', '불고기', '우삼겹', '안심', '등심', '사태', '차돌'], 'meat', 'protein', [
    'dinner',
    'protein_main',
  ]),
  ing('ing_chicken', '닭고기', ['닭', '닭가슴살', '닭다리', '닭날개'], 'meat', 'protein', ['protein_main']),
  ing('ing_garlic', '마늘', ['다진 마늘', '마늘가루'], 'vegetables', 'fiber', ['pantry_staple', 'side']),
  ing('ing_green_onion', '대파', ['파', '쪽파', '실파'], 'vegetables', 'fiber', ['side', 'pantry_staple']),
  ing('ing_carrot', '당근', [], 'vegetables', 'vitamin', ['side']),
  ing('ing_potato', '감자', [], 'vegetables', 'carbohydrate', ['side', 'staple']),
  ing('ing_zucchini', '애호박', ['호박', '단호박'], 'vegetables', 'fiber', ['side']),
  ing('ing_soy_sauce', '간장', ['국간장', '진간장', '양조간장'], 'seasonings', 'mineral', [
    'pantry_staple',
    'soup_base',
  ]),
  ing('ing_doenjang', '된장', [], 'seasonings', 'protein', ['fermented', 'soup_base', 'pantry_staple']),
  ing('ing_gochujang', '고추장', [], 'seasonings', 'carbohydrate', ['fermented', 'pantry_staple']),
  ing('ing_gochugaru', '고춧가루', [], 'seasonings', 'fiber', ['pantry_staple']),
  ing('ing_salt', '소금', [], 'seasonings', 'mineral', ['pantry_staple']),
  ing('ing_sugar', '설탕', [], 'seasonings', 'carbohydrate', ['pantry_staple']),
  ing('ing_sesame_oil', '참기름', ['들기름'], 'seasonings', 'fat', ['pantry_staple']),
  ing('ing_rice', '쌀', ['밥', '현미', '잡곡'], 'grains', 'carbohydrate', ['staple', 'pantry_staple']),
  ing('ing_noodle', '면', ['국수', '라면', '파스타', '스파게티', '당면', '쫄면'], 'grains', 'carbohydrate', [
    'staple',
  ]),
  ing('ing_shrimp', '새우', [], 'seafood', 'protein', ['protein_main']),
  ing('ing_squid', '오징어', [], 'seafood', 'protein', ['protein_main']),
  ing('ing_milk', '우유', [], 'dairy', 'protein', ['breakfast', 'pantry_staple']),
  ing('ing_cheese', '치즈', ['모짜렐라'], 'dairy', 'protein', ['side']),
  ing('ing_butter', '버터', [], 'dairy', 'fat', ['pantry_staple']),
  ing('ing_flour', '밀가루', [], 'grains', 'carbohydrate', ['pantry_staple']),
  ing('ing_pepper', '후추', ['흑후추'], 'seasonings', 'mineral', ['pantry_staple']),
  ing('ing_mirin', '미림', [], 'seasonings', 'carbohydrate', ['pantry_staple']),
  ing('ing_cooking_oil', '식용유', ['올리브유'], 'seasonings', 'fat', ['pantry_staple']),
];

export const INGREDIENT_REGISTRY_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_REGISTRY.map((item) => [item.id, item]),
);

export const INGREDIENT_REGISTRY_BY_CANONICAL: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_REGISTRY.map((item) => [item.canonicalName, item]),
);
