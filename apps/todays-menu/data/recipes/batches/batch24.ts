/**
 * Sprint 66-C / Phase 3 — meal-kit catalog expansion (recipe_0301–recipe_0304).
 * Production batch. Schema: createHankkiRecipe / Batch46C only. No new fields.
 */
import { createHankkiRecipeBatch } from '../recipeMasterTemplate';
import { buildBatch46CRecipes, type Batch46CRecipeSpec } from './batch46CBuilder';
import type { Recipe } from '../types';

const DINNER_ONLY = ['저녁'] as string[];
const LUNCH_DINNER = ['점심', '저녁'] as string[];

const BATCH_24_SPECS: Batch46CRecipeSpec[] = [
  {
    id: 'recipe_0301',
    name: '밀푀유나베',
    category: ['한식', '국물요리', '전골'],
    mealType: DINNER_ONLY,
    time: 30,
    difficulty: '보통',
    serving: 3,
    heroImageKey: 'millefeuille_nabe',
    tags: ['담백한', '든든한', '전골', '가족식'],
    situation: ['손님 초대할 때', '전골이 당길 때', '가족과 나눠 먹기'],
    aiTags: ['comfort', 'family', 'one_pot', 'mild'],
    mains: [
      { name: '소고기', amount: '300g', iconKey: 'beef' },
      { name: '배추', amount: '6장', iconKey: 'cabbage' },
      { name: '버섯', amount: '200g', iconKey: 'mushroom' },
    ],
    subs: [
      { name: '양파', amount: '1/2개', iconKey: 'onion' },
      { name: '대파', amount: '1대', iconKey: 'green_onion' },
    ],
    seasonings: [
      { name: '물', amount: '1.2L', iconKey: 'water' },
      { name: '간장', amount: '2큰술', iconKey: 'soy_sauce' },
      { name: '다진마늘', amount: '1큰술', iconKey: 'garlic' },
    ],
    nutrition: { calorie: 420, protein: 28, carbohydrate: 16, fat: 26 },
    steps: [
      {
        title: '재료 손질',
        instruction: '배추는 넓게 뜯고 버섯·양파·대파는 먹기 좋게 썰어요. 소고기는 얇게 펴요.',
        tip: '배추는 심지를 얇게 저며 두면 더 부드럽게 익어요.',
      },
      {
        title: '층층이 담기',
        instruction: '냄비에 배추·소고기·버섯을 번갈아 층층이 담아요.',
        tip: '가장자리에 양파를 넣으면 단맛이 올라와요.',
      },
      {
        title: '육수 붓기',
        instruction: '물·간장·다진마늘을 섞어 냄비에 붓고 중불에서 끓여요.',
        tip: '재료가 잠길 정도만 부어도 충분해요.',
      },
      {
        title: '대파 마무리',
        instruction: '끓어오르면 10분 더 익힌 뒤 대파를 올려 완성해요.',
        tip: '마지막에 참기름을 둘러도 고소해요.',
      },
    ],
    recommendationMessages: [
      '밀푀유나베로 따뜻한 저녁 한 끼 어때요?',
      '층층이 담긴 전골이라 보기에도 좋아요.',
      '30분이면 손님상에도 올려요.',
      '배추와 소고기가 국물에 잘 어울려요.',
      '가족과 함께 나눠 먹기 좋아요.',
    ],
    recommendationReasons: [
      '가족과 나눠 먹기 좋은 전골이에요.',
      '손님 초대에도 부담 없는 한 냄비예요.',
      '따뜻한 국물이 저녁에 잘 맞아요.',
    ],
    searchTags: ['밀푀유나베', '전골', '소고기', '배추', '저녁', '집밥'],
    recommendationPriority: 82,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'stew',
      situationTags: ['family_meal', 'guest_meal', 'comfort_food', 'cold_day'],
      dietaryTags: ['filling_meal'],
      reviewNeeded: false,
      reviewNotes: [],
    },
  },
  {
    id: 'recipe_0302',
    name: '불고기전골',
    category: ['한식', '국물요리', '전골'],
    mealType: LUNCH_DINNER,
    time: 35,
    difficulty: '보통',
    serving: 3,
    heroImageKey: 'bulgogi_jeongol',
    tags: ['달콤한', '든든한', '전골', '가족식'],
    situation: ['고기 국물이 당길 때', '가족 저녁', '따뜻한 점심'],
    aiTags: ['comfort', 'family', 'one_pot', 'high_protein'],
    mains: [
      { name: '소고기', amount: '400g', iconKey: 'beef' },
      { name: '버섯', amount: '150g', iconKey: 'mushroom' },
    ],
    subs: [
      { name: '양파', amount: '1개', iconKey: 'onion' },
      { name: '대파', amount: '1대', iconKey: 'green_onion' },
      { name: '당근', amount: '1/4개', iconKey: 'carrot' },
      { name: '두부', amount: '1/2모', iconKey: 'tofu' },
    ],
    seasonings: [
      { name: '간장', amount: '3큰술', iconKey: 'soy_sauce' },
      { name: '설탕', amount: '1큰술', iconKey: 'sugar' },
      { name: '다진마늘', amount: '1큰술', iconKey: 'garlic' },
      { name: '참기름', amount: '1작은술', iconKey: 'sesame_oil' },
      { name: '물', amount: '800ml', iconKey: 'water' },
    ],
    nutrition: { calorie: 480, protein: 32, carbohydrate: 22, fat: 28 },
    steps: [
      {
        title: '불고기 양념',
        instruction: '소고기에 간장·설탕·다진마늘·참기름을 넣어 버무려요.',
        tip: '10분만 재워도 간이 잘 배요.',
      },
      {
        title: '채소 담기',
        instruction: '냄비에 양파·버섯·당근·두부를 둘러 담아요.',
        tip: '두부는 으깨지지 않게 큼직하게 썰어요.',
      },
      {
        title: '고기 올리고 끓이기',
        instruction: '양념한 소고기를 올리고 물을 부어 중불에서 끓여요.',
        tip: '거품이 오르면 걷어 국물을 맑게 해요.',
      },
      {
        title: '대파 마무리',
        instruction: '고기가 익으면 대파를 넣고 한소끔 더 끓여 완성해요.',
        tip: '밥과 함께 국물까지 곁들이면 든든해요.',
      },
    ],
    recommendationMessages: [
      '불고기전골로 달콤한 국물 한 끼 어때요?',
      '볶음 불고기와 다른 전골 스타일이에요.',
      '35분이면 가족 냄비가 완성돼요.',
      '점심에도 저녁에도 잘 맞아요.',
      '버섯과 두부가 국물을 깊게 해요.',
    ],
    recommendationReasons: [
      '달콤한 소고기 국물이 든든해요.',
      '가족과 나눠 먹기 좋아요.',
      '점심·저녁 모두 잘 어울려요.',
    ],
    searchTags: ['불고기전골', '전골', '소고기', '불고기', '집밥'],
    recommendationPriority: 83,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'stew',
      situationTags: ['family_meal', 'comfort_food', 'cold_day'],
      dietaryTags: ['filling_meal', 'high_protein'],
      reviewNeeded: false,
      reviewNotes: [],
    },
  },
  {
    id: 'recipe_0303',
    name: '쭈꾸미볶음',
    category: ['한식', '볶음', '집밥'],
    mealType: DINNER_ONLY,
    time: 20,
    difficulty: '보통',
    serving: 2,
    heroImageKey: 'jjuggumi_bokkeum',
    tags: ['매콤한', '해산물', '밥반찬'],
    situation: ['매콤한 반찬이 당길 때', '술안주로도 좋아요', '저녁 집밥'],
    aiTags: ['spicy', 'high_protein', 'quick', 'family'],
    mains: [{ name: '쭈꾸미', amount: '400g', iconKey: 'octopus' }],
    subs: [
      { name: '양파', amount: '1/2개', iconKey: 'onion' },
      { name: '양배추', amount: '3장', iconKey: 'cabbage' },
      { name: '대파', amount: '1대', iconKey: 'green_onion' },
      { name: '당근', amount: '1/4개', iconKey: 'carrot' },
    ],
    seasonings: [
      { name: '고추장', amount: '1.5큰술', iconKey: 'gochujang' },
      { name: '고춧가루', amount: '1큰술', iconKey: 'gochugaru' },
      { name: '간장', amount: '1큰술', iconKey: 'soy_sauce' },
      { name: '설탕', amount: '1작은술', iconKey: 'sugar' },
      { name: '다진마늘', amount: '1큰술', iconKey: 'garlic' },
      { name: '참기름', amount: '1작은술', iconKey: 'sesame_oil' },
      { name: '식용유', amount: '1큰술', iconKey: 'cooking_oil' },
    ],
    nutrition: { calorie: 360, protein: 34, carbohydrate: 22, fat: 14 },
    steps: [
      {
        title: '쭈꾸미 손질',
        instruction: '쭈꾸미는 내장을 정리하고 한입 크기로 잘라 물기를 빼요.',
        tip: '너무 오래 두면 질겨지니 바로 볶아요.',
      },
      {
        title: '양념 만들기',
        instruction: '고추장·고춧가루·간장·설탕·다진마늘을 섞어 양념을 만들어요.',
        tip: '설탕을 조금 넣으면 매운맛이 부드러워져요.',
      },
      {
        title: '채소·쭈꾸미 볶기',
        instruction: '팬에 식용유를 두르고 양파·양배추·당근을 볶다 쭈꾸미와 양념을 넣어 센 불에서 빠르게 볶아요.',
        tip: '쭈꾸미는 오래 볶으면 질겨요.',
      },
      {
        title: '참기름 마무리',
        instruction: '불을 끄고 참기름과 대파를 넣어 섞어 완성해요.',
        tip: '밥반찬이나 술안주로 좋아요.',
      },
    ],
    recommendationMessages: [
      '매콤한 쭈꾸미볶음으로 입맛 돋워 보세요.',
      '20분이면 충분히 완성돼요.',
      '오징어볶음과는 다른 식감이에요.',
      '밥반찬으로 제격인 메뉴예요.',
      '술안주로도 좋아요.',
    ],
    recommendationReasons: [
      '매콤한 해산물 볶음으로 저녁이 살아나요.',
      '20분이면 빠르게 완성돼요.',
      '밥과 함께 먹기 좋아요.',
    ],
    searchTags: ['쭈꾸미볶음', '볶음', '해산물', '매운음식', '저녁'],
    recommendationPriority: 81,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'stir_fry',
      situationTags: ['family_meal', 'drinking_snack', 'quick_meal'],
      dietaryTags: ['high_protein'],
      reviewNeeded: false,
      reviewNotes: [],
    },
  },
  {
    id: 'recipe_0304',
    name: '해물탕',
    category: ['한식', '국물요리', '탕'],
    mealType: LUNCH_DINNER,
    time: 40,
    difficulty: '보통',
    serving: 3,
    heroImageKey: 'haemul_tang',
    tags: ['매콤한', '국물요리', '해산물'],
    situation: ['칼칼한 국물이 당길 때', '손님과 나눠 먹기', '비 오는 날'],
    aiTags: ['spicy', 'soup', 'family', 'one_pot', 'comfort'],
    mains: [
      { name: '오징어', amount: '200g', iconKey: 'squid' },
      { name: '새우', amount: '200g', iconKey: 'shrimp' },
      { name: '무', amount: '200g', iconKey: 'radish' },
    ],
    subs: [
      { name: '양파', amount: '1/2개', iconKey: 'onion' },
      { name: '대파', amount: '1대', iconKey: 'green_onion' },
      { name: '청양고추', amount: '1개', iconKey: 'green_chili' },
    ],
    seasonings: [
      { name: '고춧가루', amount: '2큰술', iconKey: 'gochugaru' },
      { name: '다진마늘', amount: '1큰술', iconKey: 'garlic' },
      { name: '국간장', amount: '1큰술', iconKey: 'soy_sauce' },
      { name: '물', amount: '1.2L', iconKey: 'water' },
    ],
    nutrition: { calorie: 310, protein: 36, carbohydrate: 14, fat: 10 },
    steps: [
      {
        title: '해물 손질',
        instruction: '오징어는 링으로 썰고 새우는 등껍질을 정리해요. 무는 납작하게 썰어요.',
        tip: '해물은 찬물에 한 번 헹궈 잡내를 줄여요.',
      },
      {
        title: '육수 끓이기',
        instruction: '냄비에 물·무·양파를 넣고 끓인 뒤 고춧가루·다진마늘·국간장을 풀어요.',
        tip: '무가 반쯤 익으면 양념을 넣어요.',
      },
      {
        title: '해물 넣기',
        instruction: '오징어와 새우를 넣고 중불에서 5~7분 끓여요.',
        tip: '오래 끓이면 오징어가 질겨져요.',
      },
      {
        title: '대파·고추 마무리',
        instruction: '대파와 청양고추를 넣고 한소끔 더 끓여 완성해요.',
        tip: '밥 말아 먹으면 칼칼하고 든든해요.',
      },
    ],
    recommendationMessages: [
      '해물탕으로 칼칼한 국물 한 끼 어때요?',
      '오징어와 새우가 국물에 잘 우러나요.',
      '점심에도 저녁에도 어울려요.',
      '손님과 나눠 먹기 좋아요.',
      '비 오는 날 생각나는 메뉴예요.',
    ],
    recommendationReasons: [
      '칼칼한 해물 국물이 속을 풀어줘요.',
      '가족과 함께 먹기 좋아요.',
      '점심·저녁 모두 잘 맞아요.',
    ],
    searchTags: ['해물탕', '탕', '해산물', '국물요리', '매운음식'],
    recommendationPriority: 82,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'soup',
      situationTags: ['family_meal', 'guest_meal', 'comfort_food', 'cold_day'],
      dietaryTags: ['high_protein', 'filling_meal'],
      reviewNeeded: false,
      reviewNotes: [],
    },
  },
];

export const BATCH_24_INPUTS = buildBatch46CRecipes(BATCH_24_SPECS);

export const BATCH_24_RECIPES: Recipe[] = createHankkiRecipeBatch(BATCH_24_INPUTS);

export const BATCH_24_MEAL_KIT_SEARCH_KEYWORDS = {
  recipe_0301: '밀푀유나베 밀키트',
  recipe_0302: '불고기전골 밀키트',
  recipe_0303: '쭈꾸미볶음 밀키트',
  recipe_0304: '해물탕 밀키트',
} as const;
