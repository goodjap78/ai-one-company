/**
 * Child Content Expansion Batch #2 — elementary +12 (recipe_0436–recipe_0447).
 * Guardian-prepared elementary meals. Not wired into hankkiRecipes yet.
 *
 * Names avoid exact collisions with existing catalog entries
 * (주먹밥·토스트·덮밥·랩·구이 계열 중복명 회피).
 */
import { buildBatch46CRecipes, type Batch46CRecipeSpec } from './batch46CBuilder';
import type { RecipeFamilyAudienceOverride } from '../recipeFamilyAudienceTypes';

const BREAKFAST = ['아침'] as string[];
const BREAKFAST_LUNCH = ['아침', '점심'] as string[];
const LUNCH = ['점심'] as string[];
const LUNCH_DINNER = ['점심', '저녁'] as string[];
const SNACK = ['간식'] as string[];
const SNACK_DINNER = ['간식', '저녁'] as string[];

function elementaryAudience(
  schoolMorningFriendly: boolean | null,
): RecipeFamilyAudienceOverride {
  return {
    audiences: ['general', 'elementary'],
    reviewStatus: 'explicit',
    childMeal: { schoolMorningFriendly, pickyEatingFriendly: null },
  };
}

function unverifiedNutrition(
  calorie: number,
  protein: number,
  carbohydrate: number,
  fat: number,
) {
  return { calorie, protein, carbohydrate, fat, source: 'unverified' as const };
}

const QUICK_MILD = {
  spiceLevel: 'mild' as const,
  situationTags: ['quick_meal', 'solo_meal', 'comfort_food'] as const,
  reviewNeeded: false,
  reviewNotes: [] as string[],
};

const BATCH_35_SPECS: Batch46CRecipeSpec[] = [
  {
    id: 'recipe_0436',
    name: '떡갈비주먹밥',
    category: ['아침', '주먹밥', '집밥'],
    mealType: BREAKFAST_LUNCH,
    time: 15,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_tteokgalbi_rice_ball',
    tags: ['간단한', '아침', '휴대', '한끼'],
    situation: ['등교 전', '떡갈비가 있을 때', '들고 나가기 좋을 때'],
    aiTags: ['quick', 'comfort', 'rice_based', 'solo'],
    mains: [
      { name: '밥', amount: '1공기', iconKey: 'rice' },
      { name: '떡갈비', amount: '1장(80g)', iconKey: 'beef' },
    ],
    subs: [{ name: '김가루', amount: '2큰술', iconKey: 'seaweed' }],
    seasonings: [
      { name: '참기름', amount: '1/2작은술', iconKey: 'sesame_oil' },
      { name: '소금', amount: '1/8작은술', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(470, 18, 58, 16),
    steps: [
      {
        title: '떡갈비 굽기',
        instruction: '팬에 떡갈비 1장을 올리고 중불에서 앞뒤 2분씩 노릇하게 구워요.',
        tip: '겉면만 익히지 말고 가운데까지 익혀요.',
      },
      {
        title: '떡갈비 썰기',
        instruction: '구운 떡갈비를 1분 식힌 뒤 잘게 다져 준비해요.',
        tip: '식혀야 썰 때 부스러기가 덜 나요.',
      },
      {
        title: '밥 밑간',
        instruction: '밥 1공기에 참기름 1/2작은술, 소금 1/8작은술을 넣고 고르게 섞어요.',
        tip: '밥이 뜨거우면 장갑을 끼고 섞어요.',
      },
      {
        title: '떡갈비 섞기',
        instruction: '다진 떡갈비를 밥에 넣고 가볍게 섞어 2등분해요.',
        tip: '세게 주무르면 밥이 질겨져요.',
      },
      {
        title: '주먹밥 쥐기',
        instruction: '밥을 동그랗게 쥐고 김가루 2큰술을 겉면에 묻혀 내요.',
        tip: '손에 물을 묻히면 밥이 덜 붙어요.',
      },
    ],
    recommendationMessages: [
      '떡갈비주먹밥으로 든든한 아침이에요.',
      '15분이면 두 개를 쥘 수 있어요.',
      '구운 떡갈비를 다져 밥에 넣어요.',
      '등교 전에 싸 주기 좋아요.',
      '남은 밥으로 준비할 수 있어요.',
    ],
    recommendationReasons: [
      '15분이면 주먹밥을 쥘 수 있어요.',
      '떡갈비로 속이 든든해요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['떡갈비주먹밥', '주먹밥', '떡갈비', '아침', '도시락'],
    recommendationPriority: 83,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...QUICK_MILD,
      allergyTags: ['beef'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0437',
    name: '닭고기김가루주먹밥',
    category: ['아침', '주먹밥', '집밥'],
    mealType: BREAKFAST_LUNCH,
    time: 15,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_chicken_seaweed_rice_ball',
    tags: ['간단한', '아침', '휴대', '한끼'],
    situation: ['등교 전', '닭고기가 있을 때', '김가루가 있을 때'],
    aiTags: ['quick', 'comfort', 'rice_based', 'solo'],
    mains: [
      { name: '밥', amount: '1공기', iconKey: 'rice' },
      { name: '닭가슴살', amount: '80g', iconKey: 'chicken' },
    ],
    subs: [
      { name: '김가루', amount: '3큰술', iconKey: 'seaweed' },
      { name: '대파', amount: '1/4대', iconKey: 'green_onion' },
    ],
    seasonings: [
      { name: '식용유', amount: '1작은술', iconKey: 'cooking_oil' },
      { name: '참기름', amount: '1/2작은술', iconKey: 'sesame_oil' },
      { name: '소금', amount: '1/4작은술', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(430, 22, 55, 10),
    steps: [
      {
        title: '닭고기 썰기',
        instruction: '닭가슴살 80g을 0.5cm 두께로 잘게 썰고 대파 1/4대는 송송 썰어요.',
        tip: '작게 썰어야 주먹밥에 고루 섞여요.',
      },
      {
        title: '닭고기 볶기',
        instruction: '팬에 식용유 1작은술을 두르고 닭고기를 중불에서 4분 볶아 소금 1/8작은술로 간해요.',
        tip: '분홍기가 없어질 때까지 익혀요.',
      },
      {
        title: '밥 밑간',
        instruction: '밥 1공기에 참기름 1/2작은술, 소금 1/8작은술을 넣고 섞어요.',
        tip: '간은 밥이 따뜻할 때 배어요.',
      },
      {
        title: '김가루 섞기',
        instruction: '밥에 닭고기, 대파, 김가루 2큰술을 넣고 가볍게 섞어요.',
        tip: '김가루는 마지막에 넣어야 눅눅해지지 않아요.',
      },
      {
        title: '주먹밥 쥐기',
        instruction: '밥을 2등분해 동그랗게 쥐고 남은 김가루 1큰술을 겉에 묻혀 내요.',
        tip: '겉에 김가루를 묻히면 손에 덜 묻어요.',
      },
    ],
    recommendationMessages: [
      '닭고기김가루주먹밥으로 고소한 아침이에요.',
      '15분이면 두 개를 쥘 수 있어요.',
      '닭고기와 김가루로 속을 채워요.',
      '등교 전에 싸 주기 좋아요.',
      '맵지 않게 소금만으로 간해요.',
    ],
    recommendationReasons: [
      '15분이면 주먹밥을 쥘 수 있어요.',
      '닭고기와 김가루로 고소해요.',
      '들고 나가기 좋은 아침이에요.',
    ],
    searchTags: ['닭고기김가루주먹밥', '주먹밥', '닭고기', '김가루', '아침'],
    recommendationPriority: 82,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...QUICK_MILD,
      allergyTags: ['chicken'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0438',
    name: '치즈참치주먹밥',
    category: ['아침', '주먹밥', '집밥'],
    mealType: BREAKFAST_LUNCH,
    time: 12,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_cheese_tuna_rice_ball',
    tags: ['간단한', '아침', '휴대', '한끼'],
    situation: ['등교 전', '참치캔이 있을 때', '치즈가 있을 때'],
    aiTags: ['quick', 'comfort', 'rice_based', 'solo'],
    mains: [
      { name: '밥', amount: '1공기', iconKey: 'rice' },
      { name: '참치캔', amount: '1/2캔', iconKey: 'tuna' },
      { name: '치즈', amount: '1장', iconKey: 'cheese' },
    ],
    subs: [{ name: '김가루', amount: '2큰술', iconKey: 'seaweed' }],
    seasonings: [
      { name: '마요네즈', amount: '1큰술', iconKey: 'mayo' },
      { name: '참기름', amount: '1/2작은술', iconKey: 'sesame_oil' },
      { name: '소금', amount: '1/8작은술', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(460, 20, 54, 17),
    steps: [
      {
        title: '참치 기름 빼기',
        instruction: '참치 1/2캔을 체에 밭쳐 숟가락으로 눌러 기름을 빼요.',
        tip: '기름을 빼야 주먹밥이 눅눅해지지 않아요.',
      },
      {
        title: '참치치즈 속 만들기',
        instruction: '볼에 참치, 잘게 썬 치즈 1장, 마요네즈 1큰술을 넣고 섞어요.',
        tip: '치즈는 잘게 썰어야 밥에 고루 섞여요.',
      },
      {
        title: '밥 밑간',
        instruction: '밥 1공기에 참기름 1/2작은술, 소금 1/8작은술을 넣고 섞어요.',
        tip: '밥이 뜨거우면 장갑을 끼고 섞어요.',
      },
      {
        title: '속 넣어 쥐기',
        instruction: '밥을 2등분해 가운데에 참치치즈를 넣고 감싸 동그랗게 쥐어요.',
        tip: '손에 물을 묻히면 밥이 덜 붙어요.',
      },
      {
        title: '김가루 묻히기',
        instruction: '김가루 2큰술을 접시에 펴고 주먹밥 겉면에 고루 묻혀 내요.',
        tip: '김가루는 먹기 직전에 묻혀야 눅눅해지지 않아요.',
      },
    ],
    recommendationMessages: [
      '치즈참치주먹밥으로 들고 나가는 한 끼예요.',
      '12분이면 두 개를 쥘 수 있어요.',
      '참치와 치즈로 속을 바로 만들어요.',
      '등교 전에 싸 주기 좋아요.',
      '남은 밥으로 준비할 수 있어요.',
    ],
    recommendationReasons: [
      '12분이면 주먹밥을 쥘 수 있어요.',
      '참치와 치즈로 속이 고소해요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['치즈참치주먹밥', '주먹밥', '참치', '치즈', '아침'],
    recommendationPriority: 83,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice',
      ...QUICK_MILD,
      allergyTags: ['fish', 'milk', 'egg'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0439',
    name: '감자계란토스트',
    category: ['아침', '토스트', '집밥'],
    mealType: BREAKFAST,
    time: 15,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_potato_egg_toast',
    tags: ['간단한', '아침', '토스트', '계란'],
    situation: ['등교 전', '감자가 있을 때', '식빵이 있을 때'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '식빵', amount: '2장', iconKey: 'bread_crumbs' },
      { name: '감자', amount: '1개(120g)', iconKey: 'potato' },
      { name: '계란', amount: '1개', iconKey: 'egg' },
    ],
    subs: [{ name: '버터', amount: '1작은술', iconKey: 'butter' }],
    seasonings: [
      { name: '식용유', amount: '2작은술', iconKey: 'cooking_oil' },
      { name: '소금', amount: '1/4작은술', iconKey: 'salt' },
      { name: '후추', amount: '1꼬집', iconKey: 'pepper' },
    ],
    nutrition: unverifiedNutrition(420, 14, 52, 16),
    steps: [
      {
        title: '감자 찌기',
        instruction: '감자 1개를 씻어 포크로 구멍을 내고 전자레인지에 4분 돌려 부드럽게 익혀요.',
        tip: '젓가락이 쉽게 들어가면 다 익은 거예요.',
      },
      {
        title: '감자 으깨기',
        instruction: '껍질을 벗기고 포크로 으깬 뒤 소금 1/8작은술과 후추 1꼬집을 넣어 섞어요.',
        tip: '덩어리가 조금 남아도 괜찮아요.',
      },
      {
        title: '계란 부치기',
        instruction: '팬에 식용유 1작은술을 두르고 계란 1개를 3~4분 부쳐 노른자까지 완전히 익힌 뒤 소금 1/8작은술로 간해요.',
        tip: '노른자가 흐르지 않게 속까지 익혀요.',
      },
      {
        title: '식빵 굽기',
        instruction: '식빵 2장에 버터 1작은술을 바르고 남은 식용유로 앞뒤 1분씩 노릇하게 구워요.',
        tip: '식빵을 구워야 감자가 올려도 눅눅해지지 않아요.',
      },
      {
        title: '조립하기',
        instruction: '식빵 1장에 으깬 감자를 펴고 계란을 올린 뒤 나머지 식빵으로 덮어 반으로 잘라요.',
        tip: '감자는 가운데만 두툼하게 올려요.',
      },
    ],
    recommendationMessages: [
      '감자계란토스트로 든든한 아침이에요.',
      '15분이면 한 장이 완성돼요.',
      '감자와 계란을 식빵에 올려요.',
      '전자레인지로 감자를 빨리 익혀요.',
      '매운 양념 없이 만들어요.',
    ],
    recommendationReasons: [
      '15분이면 토스트가 완성돼요.',
      '감자와 계란으로 든든해요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['감자계란토스트', '토스트', '감자', '계란', '아침'],
    recommendationPriority: 81,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['egg', 'wheat', 'milk'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0440',
    name: '옥수수치즈토스트',
    category: ['아침', '토스트', '집밥'],
    mealType: BREAKFAST,
    time: 10,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_corn_cheese_toast',
    tags: ['간단한', '아침', '토스트', '치즈'],
    situation: ['등교 전', '캔옥수수가 있을 때', '치즈가 있을 때'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '식빵', amount: '2장', iconKey: 'bread_crumbs' },
      { name: '캔옥수수', amount: '3큰술', iconKey: 'seed' },
      { name: '치즈', amount: '2장', iconKey: 'cheese' },
    ],
    subs: [{ name: '버터', amount: '1작은술', iconKey: 'butter' }],
    seasonings: [
      { name: '마요네즈', amount: '1작은술', iconKey: 'mayo' },
      { name: '소금', amount: '1꼬집', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(390, 13, 44, 17),
    steps: [
      {
        title: '옥수수 물기 빼기',
        instruction: '캔옥수수 3큰술을 체에 밭쳐 물기를 꼭 짜요.',
        tip: '물기가 남으면 식빵이 눅눅해져요.',
      },
      {
        title: '옥수수 섞기',
        instruction: '볼에 옥수수, 마요네즈 1작은술, 소금 1꼬집을 넣고 섞어요.',
        tip: '마요네즈는 조금만 넣어야 흘러내리지 않아요.',
      },
      {
        title: '토스트 올리기',
        instruction: '식빵 1장에 옥수수를 펴고 치즈 2장을 올린 뒤 나머지 식빵으로 덮어요.',
        tip: '치즈가 가장자리에 닿게 올려야 잘 붙어요.',
      },
      {
        title: '굽기',
        instruction: '팬에 버터 1작은술을 녹이고 토스트를 앞뒤 2분씩 중약불에서 노릇하게 구워요.',
        tip: '뚜껑을 덮으면 치즈가 더 잘 녹아요.',
      },
      {
        title: '잘라 내기',
        instruction: '불을 끄고 1분 식힌 뒤 반으로 잘라 내요.',
        tip: '바로 자르면 치즈가 흘러내려요.',
      },
    ],
    recommendationMessages: [
      '옥수수치즈토스트로 고소한 아침이에요.',
      '10분이면 토스트 한 장이 나와요.',
      '캔옥수수와 치즈만 있으면 돼요.',
      '팬 하나로 구울 수 있어요.',
      '아이가 좋아하는 달콤한 맛이에요.',
    ],
    recommendationReasons: [
      '10분이면 토스트가 나와요.',
      '옥수수와 치즈로 고소해요.',
      '팬 하나로 구울 수 있어요.',
    ],
    searchTags: ['옥수수치즈토스트', '토스트', '옥수수', '치즈', '아침'],
    recommendationPriority: 82,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['milk', 'wheat', 'egg'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0441',
    name: '사과시나몬토스트',
    category: ['아침', '토스트', '집밥'],
    mealType: BREAKFAST,
    time: 12,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_apple_cinnamon_toast',
    tags: ['간단한', '아침', '토스트', '달콤한'],
    situation: ['등교 전', '사과가 있을 때', '달콤한 아침이 필요할 때'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '식빵', amount: '2장', iconKey: 'bread_crumbs' },
      // No `apple` icon asset yet; reuse pear (same fallback as batch30 사과퓌레).
      { name: '사과', amount: '1/2개', iconKey: 'pear' },
    ],
    subs: [{ name: '버터', amount: '1작은술', iconKey: 'butter' }],
    seasonings: [
      { name: '설탕', amount: '1작은술', iconKey: 'sugar' },
      { name: '계피', amount: '1/4작은술', iconKey: 'sugar' },
    ],
    nutrition: unverifiedNutrition(360, 7, 52, 13),
    steps: [
      {
        title: '사과 썰기',
        instruction: '사과 1/2개는 껍질을 벗기고 씨를 뺀 뒤 3mm 두께로 얇게 썰어요.',
        tip: '얇게 썰어야 팬에서 빨리 익어요.',
      },
      {
        title: '사과 볶기',
        instruction: '팬에 버터 1/2작은술을 녹이고 사과에 설탕 1작은술과 계피 1/4작은술을 넣어 3분 볶아요.',
        tip: '약불에서 볶아야 설탕이 타지 않아요.',
      },
      {
        title: '식빵 굽기',
        instruction: '같은 팬에 남은 버터 1/2작은술을 두르고 식빵 2장을 앞뒤 1분씩 노릇하게 구워요.',
        tip: '식빵을 먼저 구워야 사과 물이 덜 배요.',
      },
      {
        title: '올리기',
        instruction: '식빵 위에 볶은 사과를 고르게 올려 1분만 더 데워요.',
        tip: '사과를 가운데에 모아 올려야 흘러내리지 않아요.',
      },
      {
        title: '반으로 자르기',
        instruction: '불을 끄고 30초 식힌 뒤 반으로 잘라 내요.',
        tip: '따뜻할 때 계피 향이 더 잘 나요.',
      },
    ],
    recommendationMessages: [
      '사과시나몬토스트로 달콤한 아침이에요.',
      '12분이면 토스트가 나와요.',
      '사과와 계피로 향을 내요.',
      '매운 양념 없이 만들어요.',
      '아이가 좋아하는 달콤한 맛이에요.',
    ],
    recommendationReasons: [
      '12분이면 토스트가 나와요.',
      '사과와 계피로 달콤해요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['사과시나몬토스트', '토스트', '사과', '계피', '아침'],
    recommendationPriority: 80,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['wheat', 'milk'],
    },
    familyAudience: elementaryAudience(true),
  },
  {
    id: 'recipe_0442',
    name: '소고기계란덮밥',
    category: ['점심', '덮밥', '집밥'],
    mealType: LUNCH_DINNER,
    time: 15,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_beef_egg_donburi',
    tags: ['간단한', '덮밥', '한그릇', '계란'],
    situation: ['소고기가 있을 때', '남은 밥이 있을 때', '15분이 필요할 때'],
    aiTags: ['quick', 'comfort', 'rice_based', 'solo'],
    mains: [
      { name: '밥', amount: '1공기', iconKey: 'rice' },
      { name: '소고기', amount: '80g', iconKey: 'beef' },
      { name: '계란', amount: '1개', iconKey: 'egg' },
    ],
    subs: [
      { name: '양파', amount: '1/4개', iconKey: 'onion' },
      { name: '대파', amount: '1/4대', iconKey: 'green_onion' },
    ],
    seasonings: [
      { name: '식용유', amount: '1작은술', iconKey: 'cooking_oil' },
      { name: '간장', amount: '1큰술', iconKey: 'soy_sauce' },
      { name: '설탕', amount: '1/2작은술', iconKey: 'sugar' },
      { name: '참기름', amount: '1/2작은술', iconKey: 'sesame_oil' },
    ],
    nutrition: unverifiedNutrition(520, 26, 58, 18),
    steps: [
      {
        title: '재료 썰기',
        instruction: '소고기 80g은 한입 크기로 썰고 양파 1/4개는 얇게 채 썰며 대파는 송송 썰어요.',
        tip: '고기를 얇게 썰어야 빨리 익어요.',
      },
      {
        title: '소고기 볶기',
        instruction: '팬에 식용유 1작은술을 두르고 양파와 소고기를 중불에서 3분 볶아요.',
        tip: '고기가 갈색이 될 때까지 볶아요.',
      },
      {
        title: '양념하기',
        instruction: '간장 1큰술과 설탕 1/2작은술을 넣고 1분 더 볶아 양념을 배게 해요.',
        tip: '설탕은 고기 잡내를 줄여 줘요.',
      },
      {
        title: '계란 올리기',
        instruction: '한쪽으로 밀고 푼 계란 1개를 둘러 1분 저어 스크램블로 완전히 익힌 뒤 대파와 참기름을 넣어요.',
        tip: '계란이 촉촉하되 흐르지 않게 익혀요.',
      },
      {
        title: '밥 위에 올리기',
        instruction: '그릇에 밥 1공기를 담고 소고기계란을 올려 바로 내요.',
        tip: '밥이 따뜻해야 더 부드럽게 먹혀요.',
      },
    ],
    recommendationMessages: [
      '소고기계란덮밥으로 한 그릇 점심이에요.',
      '15분이면 팬에서 볶아 올려요.',
      '소고기와 계란으로 든든하게 만들어요.',
      '남은 밥으로 준비할 수 있어요.',
      '맵지 않은 간장 양념이에요.',
    ],
    recommendationReasons: [
      '15분이면 덮밥이 완성돼요.',
      '소고기와 계란으로 든든해요.',
      '남은 밥으로 바로 만들어요.',
    ],
    searchTags: ['소고기계란덮밥', '덮밥', '소고기', '계란', '점심'],
    recommendationPriority: 80,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice_bowl',
      ...QUICK_MILD,
      allergyTags: ['beef', 'egg', 'soy'],
    },
    familyAudience: elementaryAudience(null),
  },
  {
    id: 'recipe_0443',
    name: '햄계란덮밥',
    category: ['점심', '덮밥', '집밥'],
    mealType: LUNCH_DINNER,
    time: 12,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_ham_egg_donburi',
    tags: ['간단한', '덮밥', '한그릇', '계란'],
    situation: ['햄이 있을 때', '남은 밥이 있을 때', '12분이 필요할 때'],
    aiTags: ['quick', 'comfort', 'rice_based', 'solo'],
    mains: [
      { name: '밥', amount: '1공기', iconKey: 'rice' },
      { name: '햄', amount: '3장', iconKey: 'ham' },
      { name: '계란', amount: '2개', iconKey: 'egg' },
    ],
    subs: [
      { name: '양파', amount: '2큰술', iconKey: 'onion' },
      { name: '대파', amount: '1/4대', iconKey: 'green_onion' },
    ],
    seasonings: [
      { name: '식용유', amount: '1작은술', iconKey: 'cooking_oil' },
      { name: '간장', amount: '1작은술', iconKey: 'soy_sauce' },
      { name: '참기름', amount: '1/2작은술', iconKey: 'sesame_oil' },
      { name: '소금', amount: '1/8작은술', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(480, 20, 56, 18),
    steps: [
      {
        title: '햄 썰기',
        instruction: '햄 3장을 1cm 폭으로 썰고 양파 2큰술과 대파 1/4대를 송송 썰어요.',
        tip: '햄은 너무 잘게 썰지 않아도 돼요.',
      },
      {
        title: '햄 볶기',
        instruction: '팬에 식용유 1작은술을 두르고 햄과 양파를 중불에서 2분 볶아요.',
        tip: '햄에서 기름이 나오면 키친타월로 살짝 닦아요.',
      },
      {
        title: '스크램블 만들기',
        instruction: '푼 계란 2개에 소금 1/8작은술을 넣어 팬에 붓고 1~2분 저으며 스크램블로 완전히 익혀요.',
        tip: '계란이 촉촉하되 흐르지 않게 익혀요.',
      },
      {
        title: '양념 마무리',
        instruction: '간장 1작은술과 대파, 참기름 1/2작은술을 넣고 가볍게 섞어요.',
        tip: '간장은 마지막에 넣어야 색이 예뻐요.',
      },
      {
        title: '밥 위에 올리기',
        instruction: '그릇에 밥 1공기를 담고 햄계란을 올려 바로 내요.',
        tip: '밥이 따뜻해야 더 잘 어울려요.',
      },
    ],
    recommendationMessages: [
      '햄계란덮밥으로 한 그릇 점심이에요.',
      '12분이면 팬에서 볶아 올려요.',
      '햄과 계란으로 빠르게 만들어요.',
      '남은 밥으로 준비할 수 있어요.',
      '아이가 좋아하는 익숙한 맛이에요.',
    ],
    recommendationReasons: [
      '12분이면 덮밥이 완성돼요.',
      '햄과 계란으로 빠르게 만들어요.',
      '남은 밥으로 바로 만들어요.',
    ],
    searchTags: ['햄계란덮밥', '덮밥', '햄', '계란', '점심'],
    recommendationPriority: 79,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'rice_bowl',
      ...QUICK_MILD,
      allergyTags: ['egg', 'pork', 'soy'],
    },
    familyAudience: elementaryAudience(null),
  },
  {
    id: 'recipe_0444',
    name: '닭고기또띠아랩',
    category: ['점심', '랩', '집밥'],
    mealType: LUNCH,
    time: 15,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_chicken_tortilla_wrap',
    tags: ['간단한', '랩', '휴대', '한끼'],
    situation: ['또띠아가 있을 때', '닭고기가 있을 때', '방과 후 간편식'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '또띠아', amount: '1장', iconKey: 'bread_crumbs' },
      { name: '닭가슴살', amount: '100g', iconKey: 'chicken' },
    ],
    subs: [
      { name: '양배추', amount: '2장', iconKey: 'cabbage' },
      { name: '당근', amount: '2큰술', iconKey: 'carrot' },
    ],
    seasonings: [
      { name: '식용유', amount: '1작은술', iconKey: 'cooking_oil' },
      { name: '마요네즈', amount: '1큰술', iconKey: 'mayo' },
      { name: '소금', amount: '1/4작은술', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(440, 28, 38, 16),
    steps: [
      {
        title: '닭고기 썰기',
        instruction: '닭가슴살 100g을 얇게 채 썰고 양배추 2장과 당근 2큰술도 가늘게 채 썰어요.',
        tip: '고기를 얇게 썰어야 또띠아에 잘 말려요.',
      },
      {
        title: '닭고기 볶기',
        instruction: '팬에 식용유 1작은술을 두르고 닭고기를 중불에서 4분 볶아 소금 1/4작은술로 간해요.',
        tip: '분홍기가 없어질 때까지 익혀요.',
      },
      {
        title: '또띠아 데우기',
        instruction: '또띠아 1장을 팬에서 20초씩 앞뒤로 데워 부드럽게 해요.',
        tip: '데우지 않으면 말 때 갈라져요.',
      },
      {
        title: '속 올리기',
        instruction: '또띠아에 마요네즈 1큰술을 바르고 양배추, 당근, 닭고기를 가운데에 올려요.',
        tip: '재료는 가운데 1/3만 올려야 잘 말려요.',
      },
      {
        title: '말아 자르기',
        instruction: '양쪽을 접어 단단히 말고 반으로 잘라 내요.',
        tip: '이음새를 아래로 두면 풀리지 않아요.',
      },
    ],
    recommendationMessages: [
      '닭고기또띠아랩으로 한 손 점심이에요.',
      '15분이면 랩 하나가 나와요.',
      '닭고기와 채소를 또띠아에 말아요.',
      '방과 후에 바로 먹기 좋아요.',
      '맵지 않게 소금과 마요네즈로만 간해요.',
    ],
    recommendationReasons: [
      '15분이면 랩이 완성돼요.',
      '닭고기와 채소로 든든해요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['닭고기또띠아랩', '또띠아', '닭고기', '랩', '점심'],
    recommendationPriority: 78,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['chicken', 'wheat', 'egg'],
    },
    familyAudience: elementaryAudience(null),
  },
  {
    id: 'recipe_0445',
    name: '참치또띠아랩',
    category: ['점심', '랩', '집밥'],
    mealType: LUNCH,
    time: 12,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_tuna_tortilla_wrap',
    tags: ['간단한', '랩', '휴대', '한끼'],
    situation: ['또띠아가 있을 때', '참치캔이 있을 때', '방과 후 간편식'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '또띠아', amount: '1장', iconKey: 'bread_crumbs' },
      { name: '참치캔', amount: '1/2캔', iconKey: 'tuna' },
    ],
    subs: [
      { name: '양배추', amount: '2장', iconKey: 'cabbage' },
      { name: '오이', amount: '1/4개', iconKey: 'zucchini' },
    ],
    seasonings: [
      { name: '마요네즈', amount: '1큰술', iconKey: 'mayo' },
      { name: '소금', amount: '1꼬집', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(410, 18, 36, 18),
    steps: [
      {
        title: '참치 기름 빼기',
        instruction: '참치 1/2캔을 체에 밭쳐 숟가락으로 눌러 기름을 빼요.',
        tip: '기름을 빼야 랩이 눅눅해지지 않아요.',
      },
      {
        title: '참치 섞기',
        instruction: '볼에 참치, 마요네즈 1큰술, 소금 1꼬집을 넣고 섞어요.',
        tip: '마요네즈는 1큰술만 넣어야 흘러내리지 않아요.',
      },
      {
        title: '채소 썰기',
        instruction: '양배추 2장과 오이 1/4개를 가늘게 채 썰어요.',
        tip: '오이는 물기를 키친타월로 닦아요.',
      },
      {
        title: '또띠아 데워 올리기',
        instruction: '또띠아 1장을 팬에서 20초씩 데운 뒤 참치, 양배추, 오이를 가운데에 올려요.',
        tip: '재료는 가운데 1/3만 올려야 잘 말려요.',
      },
      {
        title: '말아 자르기',
        instruction: '양쪽을 접어 단단히 말고 반으로 잘라 내요.',
        tip: '이음새를 아래로 두면 풀리지 않아요.',
      },
    ],
    recommendationMessages: [
      '참치또띠아랩으로 한 손 점심이에요.',
      '12분이면 랩 하나가 나와요.',
      '참치캔으로 속을 바로 만들어요.',
      '방과 후에 바로 먹기 좋아요.',
      '불 없이 속만 섞어도 돼요.',
    ],
    recommendationReasons: [
      '12분이면 랩이 완성돼요.',
      '참치캔으로 속을 바로 만들어요.',
      '손으로 들고 먹기 좋아요.',
    ],
    searchTags: ['참치또띠아랩', '또띠아', '참치', '랩', '점심'],
    recommendationPriority: 78,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['fish', 'wheat', 'egg'],
    },
    familyAudience: elementaryAudience(null),
  },
  {
    id: 'recipe_0446',
    name: '감자치즈구이',
    category: ['간식', '구이', '집밥'],
    mealType: SNACK_DINNER,
    time: 20,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_potato_cheese_bake',
    tags: ['간단한', '간식', '치즈', '구이'],
    situation: ['감자가 있을 때', '치즈가 있을 때', '따뜻한 간식이 필요할 때'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '감자', amount: '1개(150g)', iconKey: 'potato' },
      { name: '치즈', amount: '2장', iconKey: 'cheese' },
    ],
    subs: [{ name: '버터', amount: '1작은술', iconKey: 'butter' }],
    seasonings: [
      { name: '소금', amount: '1/8작은술', iconKey: 'salt' },
      { name: '후추', amount: '1꼬집', iconKey: 'pepper' },
    ],
    nutrition: unverifiedNutrition(320, 11, 34, 15),
    steps: [
      {
        title: '감자 찌기',
        instruction: '감자 1개를 씻어 포크로 구멍을 내고 전자레인지에 5분 돌려 부드럽게 익혀요.',
        tip: '젓가락이 쉽게 들어가면 다 익은 거예요.',
      },
      {
        title: '반 가르기',
        instruction: '감자를 세로로 반 가르고 숟가락으로 속을 살짝 파내 그릇에 담아요.',
        tip: '껍질은 남기고 속만 파내요.',
      },
      {
        title: '속 섞기',
        instruction: '파낸 감자에 버터 1작은술, 소금 1/8작은술, 후추 1꼬집을 넣고 포크로 으깨 섞어요.',
        tip: '버터가 녹을 정도로만 섞어요.',
      },
      {
        title: '치즈 올리기',
        instruction: '감자 껍질에 속을 다시 담고 치즈 2장을 올려 덮어요.',
        tip: '치즈가 가장자리를 덮어야 잘 녹아요.',
      },
      {
        title: '오븐·에어프라이어 굽기',
        instruction: '180도에서 5분 구워 치즈가 녹고 가장자리가 노릇해지면 내요.',
        tip: '팬에 뚜껑을 덮고 중약불로 3분 녹여도 돼요.',
      },
    ],
    recommendationMessages: [
      '감자치즈구이로 따뜻한 간식이에요.',
      '20분이면 치즈가 녹아 나와요.',
      '감자와 치즈만 있으면 돼요.',
      '저녁에도 가볍게 곁들이기 좋아요.',
      '맵지 않은 고소한 맛이에요.',
    ],
    recommendationReasons: [
      '20분이면 감자치즈구이가 나와요.',
      '감자와 치즈로 고소해요.',
      '간식·저녁에 가볍게 내기 좋아요.',
    ],
    searchTags: ['감자치즈구이', '감자', '치즈', '간식', '구이'],
    recommendationPriority: 77,
    standardMetadata: {
      cuisine: 'western',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['milk'],
      cookingMethods: ['oven'],
    },
    familyAudience: elementaryAudience(null),
  },
  {
    id: 'recipe_0447',
    name: '고구마치즈구이',
    category: ['간식', '구이', '집밥'],
    mealType: SNACK,
    time: 20,
    difficulty: '쉬움',
    serving: 1,
    heroImageKey: 'elementary_sweet_potato_cheese_bake',
    tags: ['간단한', '간식', '치즈', '고구마'],
    situation: ['고구마가 있을 때', '치즈가 있을 때', '달콤한 간식이 필요할 때'],
    aiTags: ['quick', 'comfort', 'solo'],
    mains: [
      { name: '고구마', amount: '1개(180g)', iconKey: 'sweet_potato' },
      { name: '치즈', amount: '2장', iconKey: 'cheese' },
    ],
    subs: [{ name: '버터', amount: '1작은술', iconKey: 'butter' }],
    seasonings: [
      { name: '소금', amount: '1꼬집', iconKey: 'salt' },
    ],
    nutrition: unverifiedNutrition(340, 10, 48, 12),
    steps: [
      {
        title: '고구마 찌기',
        instruction: '고구마 1개를 씻어 포크로 구멍을 내고 전자레인지에 5분 돌려 부드럽게 익혀요.',
        tip: '두꺼우면 1분 더 돌려요.',
      },
      {
        title: '반 가르기',
        instruction: '고구마를 세로로 반 가르고 숟가락으로 속을 살짝 파내 그릇에 담아요.',
        tip: '껍질은 남기고 속만 파내요.',
      },
      {
        title: '속 섞기',
        instruction: '파낸 고구마에 버터 1작은술과 소금 1꼬집을 넣고 포크로 으깨 섞어요.',
        tip: '소금은 아주 조금만 넣어야 단맛이 살아요.',
      },
      {
        title: '치즈 올리기',
        instruction: '고구마 껍질에 속을 다시 담고 치즈 2장을 올려 덮어요.',
        tip: '치즈가 가장자리를 덮어야 잘 녹아요.',
      },
      {
        title: '오븐·에어프라이어 굽기',
        instruction: '180도에서 5분 구워 치즈가 녹고 가장자리가 노릇해지면 내요.',
        tip: '팬에 뚜껑을 덮고 중약불로 3분 녹여도 돼요.',
      },
    ],
    recommendationMessages: [
      '고구마치즈구이로 달콤한 간식이에요.',
      '20분이면 치즈가 녹아 나와요.',
      '고구마와 치즈만 있으면 돼요.',
      '방과 후 간식으로 내기 좋아요.',
      '맵지 않은 달콤한 맛이에요.',
    ],
    recommendationReasons: [
      '20분이면 고구마치즈구이가 나와요.',
      '고구마와 치즈로 달콤해요.',
      '방과 후 간식으로 내기 좋아요.',
    ],
    searchTags: ['고구마치즈구이', '고구마', '치즈', '간식', '구이'],
    recommendationPriority: 77,
    standardMetadata: {
      cuisine: 'korean',
      dishType: 'snack',
      ...QUICK_MILD,
      allergyTags: ['milk'],
      cookingMethods: ['oven'],
    },
    familyAudience: elementaryAudience(null),
  },
];

export const BATCH_35_INPUTS = buildBatch46CRecipes(BATCH_35_SPECS);
export const BATCH_35_IDS = BATCH_35_SPECS.map((spec) => spec.id);
