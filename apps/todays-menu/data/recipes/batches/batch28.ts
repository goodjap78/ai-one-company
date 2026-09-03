/**
 * Sprint v1.1 baby expansion-stage top-up — recipe_0354–0357.
 * Baby-only. Does not rewrite the existing 335 catalog bodies, toddler, or elementary.
 * Does not add 전환기. Does not generate hero images.
 */
import { buildBatch46CRecipes, type Batch46CRecipeSpec } from './batch46CBuilder';
import { BABY_PILOT_OVERRIDES } from '../babyPilotOverrides';

const LUNCH = ['점심'];

function unverifiedNutrition() {
  return { calorie: 100, protein: 1, carbohydrate: 1, fat: 1, source: 'unverified' as const };
}

const BABY_MILD = {
  spiceLevel: 'mild' as const,
  situationTags: ['quick_meal', 'solo_meal', 'comfort_food'] as const,
  reviewNeeded: false,
  reviewNotes: [] as string[],
};

const BATCH_28_SPECS: Batch46CRecipeSpec[] = [
  {
    id: 'recipe_0354',
    name: '닭고기무른밥',
    category: ['집밥', '밥'],
    mealType: LUNCH,
    time: 30,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'baby_chicken_soft_rice',
    tags: ['간단한', '집밥', '밥'],
    situation: ['닭고기가 있을 때', '쌀이 있을 때', '무른 밥이 필요할 때'],
    aiTags: ['quick', 'comfort', 'mild', 'rice_based', 'one_pot'],
    mains: [
      { name: '쌀', amount: '40g', iconKey: 'rice' },
      { name: '닭고기', amount: '30g', iconKey: 'chicken' },
    ],
    subs: [{ name: '불리기 물', amount: '50ml', iconKey: 'water' }],
    seasonings: [{ name: '끓일 물', amount: '160ml', iconKey: 'water' }],
    nutrition: unverifiedNutrition(),
    steps: [
      {
        title: '쌀 불리기',
        instruction: '쌀 40g을 헹군 뒤 불리기 물 50ml에 담가 20분 불려요.',
        tip: '불리는 동안 닭고기를 손질해요.',
      },
      {
        title: '닭고기 완전히 익히기',
        instruction: '뼈와 껍질을 뺀 닭고기 30g을 속까지 하얗게 8분 삶아 5mm 이하로 곱게 다져요.',
        tip: '뼈 조각이 남지 않게 만져 확인해요.',
      },
      {
        title: '무르게 밥 짓기',
        instruction: '불린 쌀 40g에 끓일 물 160ml를 넣고 뚜껑을 덮어 15분 약한 불로 지어 성긴 밥보다 무르게 만들어요.',
        tip: '물이 부족하면 2큰술을 더 넣고 3분 더 쪄요.',
      },
      {
        title: '고기 섞기',
        instruction: '다진 닭고기를 밥에 넣고 주걱으로 섞어 밥알이 서로 붙을 정도로 무르게 만들어요.',
        tip: '큰 고기 조각이 있으면 더 다져요.',
      },
      {
        title: '작게 나눠 내기',
        instruction: '한입보다 작게 눌러 담고 식혀 내요. 간장, 참기름, 대파는 넣지 않아요.',
        tip: '뜨거우면 밥알이 서로 붙을 때까지 식혀요.',
      },
    ],
    recommendationMessages: [
      '닭고기를 다져 넣은 무른밥이에요.',
      '30분이면 냄비에서 완성돼요.',
      '고기는 완전히 익혀 작게 다져요.',
      '밥은 성기게 두지 않고 무르게 지어요.',
      '양념 없이 내요.',
    ],
    recommendationReasons: [
      '닭고기를 다져 무른밥에 넣어요.',
      '30분이면 완성돼요.',
      '뼈와 껍질은 빼고 만들어요.',
    ],
    searchTags: ['닭고기무른밥', '무른밥', '닭고기', '쌀', '이유식'],
    recommendationPriority: 77,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...BABY_MILD,
      allergyTags: ['chicken'],
      cookingMethods: ['boiling'],
    },
    familyAudience: BABY_PILOT_OVERRIDES.recipe_0354,
  },
  {
    id: 'recipe_0355',
    name: '애호박진밥',
    category: ['집밥', '밥'],
    mealType: LUNCH,
    time: 30,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'baby_zucchini_thick_rice',
    tags: ['간단한', '집밥', '밥'],
    situation: ['애호박이 있을 때', '쌀이 있을 때', '진밥이 필요할 때'],
    aiTags: ['quick', 'comfort', 'mild', 'rice_based', 'one_pot'],
    mains: [
      { name: '쌀', amount: '40g', iconKey: 'rice' },
      { name: '애호박', amount: '50g', iconKey: 'zucchini' },
    ],
    subs: [{ name: '불리기 물', amount: '50ml', iconKey: 'water' }],
    seasonings: [{ name: '끓일 물', amount: '190ml', iconKey: 'water' }],
    nutrition: unverifiedNutrition(),
    steps: [
      {
        title: '쌀 불리기',
        instruction: '쌀 40g을 헹군 뒤 불리기 물 50ml에 담가 20분 불려요.',
        tip: '불리는 동안 애호박을 손질해요.',
      },
      {
        title: '애호박 손질',
        instruction: '애호박 50g의 껍질과 씨를 제거하고 무르게 쪄 포크로 으깨요.',
        tip: '단단한 껍질과 씨는 넣지 않아요.',
      },
      {
        title: '진밥 짓기',
        instruction: '불린 쌀 40g에 끓일 물 190ml를 넣고 15분 약한 불로 지어 국물이 거의 없고 밥알이 서로 붙는 진밥으로 만들어요.',
        tip: '성긴 밥이면 물 1큰술을 더 넣고 3분 더 쪄요.',
      },
      {
        title: '애호박 섞기',
        instruction: '으깬 애호박을 진밥에 넣고 주걱으로 눌러 섞어요.',
        tip: '큰 조각이 보이면 더 으깨요.',
      },
      {
        title: '식혀 내기',
        instruction: '한입보다 작게 눌러 담고 식혀 내요. 소금, 간장, 참기름은 넣지 않아요.',
        tip: '뜨거우면 2분 식혀요.',
      },
    ],
    recommendationMessages: [
      '애호박을 으깨어 넣은 진밥이에요.',
      '30분이면 냄비에서 완성돼요.',
      '껍질과 씨는 빼고 만들어요.',
      '국물이 거의 없게 되직하게 지어요.',
      '양념 없이 내요.',
    ],
    recommendationReasons: [
      '애호박을 으깨어 진밥에 넣어요.',
      '30분이면 완성돼요.',
      '껍질과 씨를 빼고 만들어요.',
    ],
    searchTags: ['애호박진밥', '진밥', '애호박', '쌀', '이유식'],
    recommendationPriority: 76,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...BABY_MILD,
      allergyTags: [],
      cookingMethods: ['boiling'],
    },
    familyAudience: BABY_PILOT_OVERRIDES.recipe_0355,
  },
  {
    id: 'recipe_0356',
    name: '브로콜리진밥',
    category: ['집밥', '밥'],
    mealType: LUNCH,
    time: 30,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'baby_broccoli_thick_rice',
    tags: ['간단한', '집밥', '밥'],
    situation: ['브로콜리가 있을 때', '쌀이 있을 때', '진밥이 필요할 때'],
    aiTags: ['quick', 'comfort', 'mild', 'rice_based', 'one_pot'],
    mains: [
      { name: '쌀', amount: '40g', iconKey: 'rice' },
      { name: '브로콜리', amount: '40g', iconKey: 'broccoli' },
    ],
    subs: [{ name: '불리기 물', amount: '50ml', iconKey: 'water' }],
    seasonings: [{ name: '끓일 물', amount: '190ml', iconKey: 'water' }],
    nutrition: unverifiedNutrition(),
    steps: [
      {
        title: '쌀 불리기',
        instruction: '쌀 40g을 헹군 뒤 불리기 물 50ml에 담가 20분 불려요.',
        tip: '불리는 동안 브로콜리를 손질해요.',
      },
      {
        title: '브로콜리 무르게 익히기',
        instruction: '브로콜리 40g은 단단한 줄기를 버리고 꽃 부분만 포크로 으깨질 때까지 8분 삶아요.',
        tip: '줄기의 질긴 심은 넣지 않아요.',
      },
      {
        title: '진밥 짓기',
        instruction: '불린 쌀 40g에 끓일 물 190ml를 넣고 15분 약한 불로 지어 국물이 거의 없고 밥알이 서로 붙는 진밥으로 만들어요.',
        tip: '성긴 밥이면 물 1큰술을 더 넣고 3분 더 쪄요.',
      },
      {
        title: '브로콜리 섞기',
        instruction: '삶은 꽃 부분을 포크로 으깨 진밥에 넣고 주걱으로 눌러 섞어요.',
        tip: '덩어리가 보이면 더 으깨요.',
      },
      {
        title: '식혀 내기',
        instruction: '한입보다 작게 눌러 담고 식혀 내요. 소금, 간장, 참기름은 넣지 않아요.',
        tip: '뜨거우면 2분 식혀요.',
      },
    ],
    recommendationMessages: [
      '브로콜리 꽃 부분을 으깨어 넣은 진밥이에요.',
      '30분이면 냄비에서 완성돼요.',
      '단단한 줄기는 버리고 만들어요.',
      '국물이 거의 없게 되직하게 지어요.',
      '양념 없이 내요.',
    ],
    recommendationReasons: [
      '브로콜리를 으깨어 진밥에 넣어요.',
      '30분이면 완성돼요.',
      '줄기는 빼고 꽃 부분만 사용해요.',
    ],
    searchTags: ['브로콜리진밥', '진밥', '브로콜리', '쌀', '이유식'],
    recommendationPriority: 76,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...BABY_MILD,
      allergyTags: [],
      cookingMethods: ['boiling'],
    },
    familyAudience: BABY_PILOT_OVERRIDES.recipe_0356,
  },
  {
    id: 'recipe_0357',
    name: '찐사과배',
    category: ['집밥', '과일'],
    mealType: LUNCH,
    time: 25,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'baby_apple_pear_soft_pieces',
    tags: ['간단한', '집밥', '과일'],
    situation: ['사과가 있을 때', '배가 있을 때', '손으로 집을 때'],
    aiTags: ['quick', 'comfort', 'mild'],
    mains: [
      { name: '사과', amount: '40g', iconKey: 'pear' },
      { name: '배', amount: '40g', iconKey: 'pear' },
    ],
    subs: [{ name: '찜기 물', amount: '300ml', iconKey: 'water' }],
    seasonings: [{ name: '식용유', amount: '2방울', iconKey: 'cooking_oil' }],
    nutrition: unverifiedNutrition(),
    steps: [
      {
        title: '껍질·씨 제거',
        instruction: '사과 40g과 배 40g의 껍질을 벗기고 씨와 심을 모두 빼요.',
        tip: '씨와 단단한 심은 남기지 않아요.',
      },
      {
        title: '무르게 찌기',
        instruction: '찜기 물 300ml로 12분 쪄 포크로 가운데까지 으깨질 때까지 익혀요.',
        tip: '가운데가 단단하면 3분 더 쪄요.',
      },
      {
        title: '가늘고 길게 자르기',
        instruction: '길이 4~5cm, 굵기 1cm보다 얇은 막대로 잘라요. 동그란 조각이나 큰 덩어리는 만들지 않아요.',
        tip: '손가락보다 굵으면 한 번 더 갈라요.',
      },
      {
        title: '식혀 내기',
        instruction: '접시에 식용유 2방울을 아주 얇게 바른 뒤 붙지 않게 담고, 만져도 뜨겁지 않을 때까지 식혀 내요.',
        tip: '꿀과 설탕은 넣지 않아요.',
      },
    ],
    recommendationMessages: [
      '사과와 배를 무르게 쪄 얇은 조각으로 잘라 내요.',
      '25분이면 찜기에서 준비할 수 있어요.',
      '껍질과 씨는 빼고 만들어요.',
      '동그란 조각으로는 내지 않아요.',
      '꿀은 넣지 않아요.',
    ],
    recommendationReasons: [
      '사과와 배를 무르게 쪄 얇게 잘라요.',
      '25분이면 완성돼요.',
      '껍질과 씨를 빼고 만들어요.',
    ],
    searchTags: ['찐사과배', '사과', '배', '이유식'],
    recommendationPriority: 76,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'steamed',
      ...BABY_MILD,
      allergyTags: [],
      cookingMethods: ['steaming'],
    },
    familyAudience: BABY_PILOT_OVERRIDES.recipe_0357,
  },
];

export const BATCH_28_INPUTS = buildBatch46CRecipes(BATCH_28_SPECS);
export const BATCH_28_IDS = BATCH_28_SPECS.map((spec) => spec.id);
