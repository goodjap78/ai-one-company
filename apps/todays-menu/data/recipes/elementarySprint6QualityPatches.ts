/**
 * Sprint 6 — apply editorial quality patches to selected elementary recipes.
 */
import type { ElementaryRecipeQualityMetadata } from './elementaryRecipeQualityTypes';
import type { Recipe, RecipeStepContent } from './types';

export const SPRINT6_BREAKFAST_RECIPE_IDS = [
  'recipe_0477',
  'recipe_0313',
  'recipe_0312',
  'recipe_0316',
  'recipe_0315',
  'recipe_0305',
  'recipe_0175',
  'recipe_0396',
  'recipe_0472',
  'recipe_0441',
  'recipe_0173',
  'recipe_0478',
  'recipe_0295',
  'recipe_0306',
  'recipe_0308',
] as const;

export const SPRINT6_DINNER_RECIPE_IDS = [
  'recipe_0500',
  'recipe_0482',
  'recipe_0505',
  'recipe_0405',
  'recipe_0406',
  'recipe_0436',
  'recipe_0444',
  'recipe_0476',
  'recipe_0475',
  'recipe_0447',
  'recipe_0442',
  'recipe_0480',
  'recipe_0506',
  'recipe_0507',
  'recipe_0508',
] as const;

export const SPRINT6_REVIEWED_RECIPE_IDS = [
  ...SPRINT6_BREAKFAST_RECIPE_IDS,
  ...SPRINT6_DINNER_RECIPE_IDS,
] as const;

type StepUpdate = Partial<Pick<RecipeStepContent, 'title' | 'instruction' | 'tip'>>;

export type ElementarySprint6Patch = {
  prepTimeMinutes: number;
  time?: number;
  serving?: number;
  ingredientAmounts?: Record<string, string>;
  stepUpdates?: StepUpdate[];
  elementaryQuality: ElementaryRecipeQualityMetadata;
  /** Patch-layer override for school-morning weekly pool eligibility. */
  schoolMorningFriendly?: boolean | null;
  /** Editorial weekly pick priority (e.g. lower oven-dependent dinners). */
  recommendationPriority?: number;
};

function reviewed(
  partial: Omit<ElementaryRecipeQualityMetadata, 'contentVerificationStatus' | 'targetAudience'>,
  recipeQualityGrade?: ElementaryRecipeQualityMetadata['recipeQualityGrade'],
): ElementaryRecipeQualityMetadata {
  return {
    contentVerificationStatus: 'reviewed',
    targetAudience: 'elementary',
    imageRecipeMatch: true,
    ...(recipeQualityGrade ? { recipeQualityGrade } : {}),
    ...partial,
  };
}

const RICE_PREREQ = '밥 1공기(약 200g)는 미리 지은 찬밥·즉석밥 기준입니다. 당일 아침에 밥을 새로 지으면 +20~25분이 더 필요해요.';
const RICE_STORAGE = '냉장 보관 1일. 주먹밥·덮밥은 당일 섭취를 권장해요.';
const RICE_REHEAT = '전자레인지 40~60초, 위에 랩을 살짝 씌우면 마를 때 덜 뻑뻑해요.';
const KID_MILD = '간·설탕·소스는 성인보다 20~30% 줄이고, 맵거나 짠 양념은 따로 두지 마세요.';
const KID_CUT = '아이가 먹기 쉽게 한입 크기(2~3cm)로 잘라 주세요.';
const tipMild = (rest: string) => `${KID_MILD} ${rest}`;
const tipCut = (rest: string) => `${KID_CUT} ${rest}`;
const tipBoth = () => `${KID_MILD} ${KID_CUT}`;

export const ELEMENTARY_SPRINT6_PATCHES: Record<string, ElementarySprint6Patch> = {
  recipe_0477: {
    prepTimeMinutes: 3,
    elementaryQuality: reviewed(
      {
        prerequisites: '또띠아·계란·치즈는 미리 꺼내 두면 팬 예열과 함께 10분 안에 완성돼요.',
        kidAdjustmentTip: tipMild('또띠아는 잘게 잘라 주면 한 손에 먹기 좋아요.'),
        substituteIngredients: '치즈 → 모짜렐라·슬라이스치즈 / 버터 → 식용유 1작은술',
        storageInfo: '완성 후 냉장 1일. 등교용이면 당일 아침에 만들어 주세요.',
        reheatingMethod: '팬 약불 1~2분 또는 전자레인지 30초. 치즈가 다시 녹을 때까지.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        instruction:
          '약불로 예열된 팬에 버터 1작은술을 녹이고, 또띠아 1장을 올린 뒤 계란물을 고르게 부어요. 뚜껑을 덮고 3~4분 동안 중약불에서 노른자까지 완전히 익혀요.',
        tip: '뚜껑을 덮으면 위쪽 계란도 고르게 익어요.',
      },
      undefined,
      {
        instruction: '불을 끄고 반으로 접은 뒤 30초 식혀 한입 크기(3cm)로 잘라 접시에 담아요.',
        tip: '30초 식히면 치즈가 덜 흘러요.',
      },
    ],
  },
  recipe_0313: {
    prepTimeMinutes: 5,
    elementaryQuality: reviewed(
      {
        prerequisites:
          '① 전날 찐 고구마(150~200g): 전자레인지 40초 데운 뒤 버터·바나나 올리면 아침 5분. ② 생고구마: 아래 1~2단계(전자레인지 8분) 후 3~4단계 진행.',
        kidAdjustmentTip: '버터·설탕은 아이 입맛에 맞게 반만 넣고, 껍질은 얇게 벗겨 주세요.',
        substituteIngredients: '버터 → 올리브오일 1작은술',
        storageInfo: '냉장 2일. 등교 전에는 당일 아침에 만드는 것을 권장해요.',
        reheatingMethod: '전자레인지 40초 또는 찜기 3분.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        instruction:
          '【생고구마】 키친타월로 감싸 600W에서 5분 돌리고 뒤집어 3분 더 돌려요. 【전날 찐 고구마】 이 단계는 건너뛰고 전자레인지 40초만 데워요.',
        tip: '젓가락이 가운데까지 들어가면(생) 또는 따뜻해지면(찐) 다음 단계로.',
      },
    ],
  },
  recipe_0312: {
    prepTimeMinutes: 3,
    elementaryQuality: reviewed(
      {
        prerequisites: '우유·시리얼·바나나만 준비하면 별도 가열 없이 5분 안에 완성돼요.',
        kidAdjustmentTip: '시리얼은 아이가 씹기 쉬운 작은 알갱이로, 우유는 미지근하게 드세요.',
        substituteIngredients: '우유 → 두유 200ml / 바나나 → 딸기 5알',
        storageInfo: '완성 후 바로 드세요. 우유가 불어나면 식감이 떨어져요.',
        reheatingMethod: '가열하지 않고 바로 섭취해요.',
      },
      'A',
    ),
  },
  recipe_0316: {
    prepTimeMinutes: 4,
    ingredientAmounts: { 소금: '1/16작은술' },
    elementaryQuality: reviewed(
      {
        prerequisites: '오트밀·우유·바나나만 준비. 팬 1개면 8분 안에 완성돼요.',
        kidAdjustmentTip: '설탕·꿀 대신 익은 바나나로 단맛을 내고, 우유는 미지근하게.',
        substituteIngredients: '우유 → 두유 200ml / 바나나 → 사과 반 개',
        storageInfo: '완성 후 2시간 이내 섭취. 냉장 시 뭉칠 수 있어요.',
        reheatingMethod: '약불에 우유 1~2큰술 넣고 2분 저어가며 데워요.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        instruction:
          '냄비에 우유 200ml, 오트밀 40g, 소금 1/16작은술을 넣고 중약불에서 4분 저으며 끓여요.',
        tip: '눌어붙지 않게 바닥을 긁어 저어요.',
      },
    ],
  },
  recipe_0315: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites:
          '감자 1개(150g)는 미리 깨끗이 씻어 두세요. prep 8분 + cook 15분 ≈ 23분 — 주말·여유 아침 권장(등교 전 빠른 pool 아님).',
        kidAdjustmentTip: '소금은 1/8작은술부터 시작하고, 건더기는 잘게 으깨 주세요.',
        substituteIngredients: '우유 → 두유 100ml',
        storageInfo: '냉장 2일. 유아·초등은 당일 섭취 권장.',
        reheatingMethod: '약불에 우유 2큰술 넣고 3분 저어가며 데워요.',
      },
      'A',
    ),
  },
  recipe_0305: {
    prepTimeMinutes: 5,
    time: 12,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipMild('계란은 노른자까지 완전히 익혀 주세요.'),
        substituteIngredients: '간장 → 저염간장 / 대파 → 양파 1/8개',
        storageInfo: '덮밥은 냉장 1일. 계란 덮밥은 당일 섭취 권장.',
        reheatingMethod: '전자레인지 50초. 계란은 다시 익히지 않도록 약하게.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      {
        instruction:
          '팬에 식용유 1작은술을 두르고 중약불로 예열한 뒤, 계란물을 넣고 주걱으로 30초씩 저으며 노른자까지 완전히 익혀요.',
        tip: '아이용은 반숙 대신 완숙으로 익히는 것이 안전해요.',
      },
    ],
  },
  recipe_0175: {
    prepTimeMinutes: 5,
    elementaryQuality: reviewed(
      {
        prerequisites: '식빵·사과·치즈는 미리 썰어 두면 토스트 8분 안에 완성.',
        kidAdjustmentTip: tipCut('사과는 얇게 썰어 치즈와 함께 올려 주세요.'),
        substituteIngredients: '사과 → 배 / 치즈 → 모짜렐라',
        storageInfo: '완성 후 2시간 이내. 토스트는 당일 섭취.',
        reheatingMethod: '토스터 1분 또는 팬 약불 1분.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        instruction:
          '식빵 1장에 버터 1작은술을 바르고 치즈 1장과 사과 슬라이스, 설탕 1작은술을 올려요.',
        tip: '설탕은 1/4작은술부터 아이 입맛에 맞게.',
      },
      {
        instruction:
          '팬에 올리고 중불에서 2~3분씩 앞뒤로 노릇하게 구워 치즈가 녹으면 접시에 옮겨요.',
        tip: '치즈가 녹을 때까지 뚜껑을 덮어도 좋아요.',
      },
    ],
  },
  recipe_0396: {
    prepTimeMinutes: 6,
    ingredientAmounts: { 마요네즈: '1큰술' },
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: '마요네즈·참치 기름은 1큰술 이하로, 짠맛이 강하면 물 1큰술 섞어요.',
        substituteIngredients: '참치 → 닭가슴살 삶은 것 40g',
        storageInfo: RICE_STORAGE,
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0472: {
    prepTimeMinutes: 8,
    schoolMorningFriendly: false,
    elementaryQuality: reviewed(
      {
        prerequisites: `${RICE_PREREQ} 소고기 볶기·주먹밥까지 prep 8분 + cook 15분 ≈ 23분 — 주말·여유 아침 또는 전날 밤 주먹밥 완성 후 아침 포장(10분) 권장.`,
        kidAdjustmentTip: tipCut('소고기는 힘줄을 제거하고 잘게 다져 주세요.'),
        substituteIngredients: '소고기 → 돼지고기 다짐 50g',
        storageInfo: RICE_STORAGE,
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0441: {
    prepTimeMinutes: 5,
    elementaryQuality: reviewed(
      {
        prerequisites: '식빵 2장·사과·시나몬은 미리 준비. 토스트 10분.',
        kidAdjustmentTip: '시나몬·설탕은 1/4작은술부터, 아이 입맛에 맞게 조절.',
        substituteIngredients: '사과 → 배 / 시나몬 → 꿀 1/2작은술(1세 이상)',
        storageInfo: '완성 후 2시간 이내 섭취.',
        reheatingMethod: '토스터 1분.',
      },
      'A',
    ),
  },
  recipe_0173: {
    prepTimeMinutes: 5,
    ingredientAmounts: { 소금: '1/16작은술' },
    elementaryQuality: reviewed(
      {
        prerequisites: '식빵·햄·치즈는 미리 꺼내 두면 8분 안에 완성.',
        kidAdjustmentTip: tipCut('햄 2장·치즈 2장은 저염 제품으로, 소금은 생략해도 돼요.'),
        substituteIngredients: '햄 → 닭가슴살 슬라이스 2장',
        storageInfo: '완성 후 2시간 이내. 도시락은 당일.',
        reheatingMethod: '토스터 1분.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        instruction: '팬에 버터 1작은술을 두르고 빵을 중불에서 2~3분씩 노릇하게 구워요.',
        tip: '버터가 타지 않게 중불을 유지해요.',
      },
      {
        instruction:
          '빵을 뒤집어 치즈가 녹도록 2분 더 구우고, 필요하면 소금 1/16작은술을 살짝 뿌려요.',
        tip: '햄·치즈가 짜면 소금은 빼도 돼요.',
      },
    ],
  },
  recipe_0478: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites:
          '감자 1개(100g)는 전날 삶거나 전자레인지 4분 찜으로 미리 익혀 두면 active 10분. 당일 생감자면 +4분.',
        kidAdjustmentTip: tipCut('감자·햄을 얇게 썰어 토스트에 고르게. 햄은 저염 2장.'),
        substituteIngredients: '햄 → 닭가슴살 40g',
        storageInfo: '완성 후 2시간 이내.',
        reheatingMethod: '토스터 1~2분.',
      },
      'A',
    ),
  },
  recipe_0295: {
    prepTimeMinutes: 4,
    ingredientAmounts: { 소금: '1/16작은술', 후추: '1/16작은술' },
    elementaryQuality: reviewed(
      {
        prerequisites: '식빵·계란·버터 준비. 계란은 미리 풀어 두면 8분.',
        kidAdjustmentTip: tipMild('후추·소금은 각 1/16작은술 이하로.'),
        substituteIngredients: '버터 → 식용유 1작은술',
        storageInfo: '완성 후 2시간 이내.',
        reheatingMethod: '토스터 1분.',
      },
      'A',
    ),
    stepUpdates: [
      {
        instruction:
          '볼에 계란 1개, 우유 1큰술, 소금 1/16작은술, 후추 1/16작은술을 넣고 풀어요.',
        tip: '소금·후추는 아주 조금만 넣어요.',
      },
    ],
  },
  recipe_0306: {
    prepTimeMinutes: 6,
    schoolMorningFriendly: false,
    elementaryQuality: reviewed(
      {
        prerequisites: `${RICE_PREREQ} 계란 스크램블·참치 섞기·주먹밥까지 prep 6분 + cook 15분 ≈ 21분 — 등교 전 빠른 pool 제외, 주말·전날 준비 아침 권장.`,
        kidAdjustmentTip: '참치 기름은 1작은술만 넣고, 주먹밥은 손보다 작게 뭉쳐 주세요.',
        substituteIngredients: '참치 → 닭가슴살 40g',
        storageInfo: RICE_STORAGE,
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0308: {
    prepTimeMinutes: 10,
    schoolMorningFriendly: false,
    elementaryQuality: reviewed(
      {
        prerequisites: `${RICE_PREREQ} 계란 지단·햄·김밥 말기까지 prep 10분 + cook 15분 ≈ 25분 — 등교 전 빠른 pool 제외. 전날 밤 김밥 완성 후 아침 썰기(5분)는 가능.`,
        kidAdjustmentTip: tipCut('김밥은 지름 2cm로 잘라 한입 크기로. 햄은 저염 2장.'),
        substituteIngredients: '햄 → 닭가슴살 / 단무지 → 당근 채 20g',
        storageInfo: '냉장 1일. 등교용은 당일 아침 제조.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      {
        instruction: '햄 2장을 길게 썰어 같은 팬에서 30초 데워요.',
        tip: '저염 햄을 쓰고, 너무 오래 구우면 딱딱해져요.',
      },
    ],
  },
  recipe_0500: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipBoth(),
        substituteIngredients: '닭가슴살 → 두부 80g',
        storageInfo: '냉장 1일. 덮밥은 당일 섭취 권장.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0482: {
    prepTimeMinutes: 6,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: '치즈 1장·참치 1/2캔·마요네즈 1큰술로, 짠맛이 강하면 물 1큰술 섞어요.',
        substituteIngredients: '참치 → 닭가슴살 60g',
        storageInfo: '냉장 1일.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0505: {
    prepTimeMinutes: 6,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipMild('햄 3장은 저염 제품, 간장은 1/2큰술부터 맛보며 조절.'),
        substituteIngredients: '햄 → 닭가슴살 50g',
        storageInfo: '냉장 1일.',
        reheatingMethod: '팬 약불 2분 또는 전자레인지 50초.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      {
        instruction: '밥 1공기를 넣고 간장 1/2큰술, 소금 1/8작은술, 대파를 넣어 3분 볶아요.',
        tip: '햄이 짜면 간장은 1/2큰술만 넣어요.',
      },
    ],
  },
  recipe_0405: {
    prepTimeMinutes: 8,
    ingredientAmounts: { 소금: '1/4작은술' },
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip:
          '국물은 1/4작은술 소금부터 시작하고, 먹기 전 보호자가 간을 맞춰 주세요.',
        substituteIngredients: '애호박 → 주키니 1/4개',
        storageInfo: '냉장 1일. 국밥은 당일 섭취 권장.',
        reheatingMethod: '뚜껑 있는 그릇에 전자레인지 1분 30초.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      {
        instruction:
          '소금 1/4작은술로 간하고 대파를 넣어 30초 더 끓인 뒤 참기름 1/2작은술을 둘러요.',
        tip: '짠맛이 부족하면 보호자가 그릇에 소금 1/8작은술씩 더 넣어 주세요.',
      },
    ],
  },
  recipe_0406: {
    prepTimeMinutes: 10,
    ingredientAmounts: { 우동면: '1봉(200g)' },
    elementaryQuality: reviewed(
      {
        prerequisites: '우동면·야채는 미리 손질. 끓는 물 500ml 준비.',
        kidAdjustmentTip: '야채는 2cm로, 간장·설탕은 성인보다 적게.',
        substituteIngredients: '우동면 → 스파게티면 80g',
        storageInfo: '냉장 1일. 면은 당일 섭취 권장.',
        reheatingMethod: '팬에 물 2큰술 넣고 2분 볶듯 데워요.',
      },
      'A',
    ),
    stepUpdates: [
      {
        instruction: '끓는 물에 우동면 200g(1봉)을 2분 데쳐 건진 뒤 찬물에 헹궈 물기를 빼요.',
        tip: '찬물에 헹궈야 면이 붙지 않아요.',
      },
    ],
  },
  recipe_0436: {
    prepTimeMinutes: 10,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipCut('떡갈비는 힘줄 제거 후 잘게. 가공육은 80g 이하로.'),
        substituteIngredients: '돼지고기 → 소고기 다짐 50g',
        storageInfo: RICE_STORAGE,
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0444: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites: '또띠아·닭고기·야채 미리 손질. 12분.',
        kidAdjustmentTip: tipCut('또띠아는 3cm 폭으로 잘라.'),
        substituteIngredients: '닭고기 → 두부 60g',
        storageInfo: '냉장 1일. 랩은 당일.',
        reheatingMethod: '팬 약불 1분 또는 전자레인지 30초.',
      },
      'A',
    ),
  },
  recipe_0476: {
    prepTimeMinutes: 10,
    elementaryQuality: reviewed(
      {
        prerequisites: '또띠아·소고기·양파 미리 손질. 15분.',
        kidAdjustmentTip: tipBoth(),
        substituteIngredients: '소고기 → 돼지고기 60g',
        storageInfo: '냉장 1일.',
        reheatingMethod: '팬 약불 1~2분.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        tip: '고기 표면이 갈색이고 가운데까지 분홍기가 없을 때까지 3분 볶아요.',
      },
    ],
  },
  recipe_0475: {
    prepTimeMinutes: 12,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipCut('김밥 지름 2cm. 햄 3장은 저염 제품으로.'),
        substituteIngredients: '햄 → 닭가슴살',
        storageInfo: RICE_STORAGE,
        reheatingMethod: '실온 섭취 권장.',
      },
      'A',
    ),
  },
  recipe_0447: {
    prepTimeMinutes: 5,
    recommendationPriority: 62,
    ingredientAmounts: { 소금: '1/8작은술' },
    elementaryQuality: reviewed(
      {
        prerequisites:
          '고구마 1개(150g)는 전자레인지 5분 찜으로 미리 익혀 두면 15분. 오븐·에어프라이어 없으면 팬·전자레인지 방법(5단계)을 쓰세요.',
        kidAdjustmentTip: '치즈·설탕은 반량부터, 고구마는 포크로 으깨기 쉽게.',
        substituteIngredients: '치즈 → 모짜렐라 30g',
        storageInfo: '냉장 2일.',
        reheatingMethod: '전자레인지 40초.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      {
        instruction: '파낸 고구마에 버터 1작은술과 소금 1/8작은술을 넣고 포크로 으깨 섞어요.',
        tip: '소금은 아주 조금만 넣어야 단맛이 살아요.',
      },
      undefined,
      {
        title: '치즈 녹이기',
        instruction:
          '고구마 껍질에 속을 다시 담고 치즈 2장을 올린 뒤, 【팬】 뚜껑 덮고 중약불 3분 또는 【전자레인지】 1분 30초 돌려 치즈가 녹으면 내요. 오븐·에어프라이어가 있으면 180°C에서 5분도 가능해요.',
        tip: '팬·전자레인지가 없는 가정은 전자레인지만으로도 충분해요.',
      },
    ],
  },
  recipe_0442: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipBoth(),
        substituteIngredients: '소고기 → 돼지고기 60g',
        storageInfo: '냉장 1일.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
  },
  recipe_0480: {
    prepTimeMinutes: 10,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipCut('야채는 2cm, 소고기는 잘게.'),
        substituteIngredients: '소고기 → 닭가슴살 70g',
        storageInfo: '냉장 1일.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      {
        tip: '고기 표면이 갈색이고 가운데까지 분홍기가 없을 때까지 3분 볶아요.',
      },
      {
        tip: '채소가 아삭하지 않게 2분 볶되, 너무 무르지 않게.',
      },
    ],
  },
  recipe_0506: {
    prepTimeMinutes: 8,
    elementaryQuality: reviewed(
      {
        prerequisites: '닭가슴살(메뉴명: 닭안심) 120g·밥·야채 준비. 밥은 찬밥 기준 +15분.',
        kidAdjustmentTip: tipCut('닭가슴살은 섬유 반대로 얇게 잘라 한입 크기로.'),
        substituteIngredients: '닭가슴살 → 두부 80g',
        storageInfo: '냉장 1일.',
        reheatingMethod: '전자레인지 50초.',
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      undefined,
      {
        instruction: '접시에 밥 1공기와 구운 닭가슴살, 브로콜리를 담고 소스를 뿌려 내요.',
        tip: '닭고기를 1분 식혀 한입 크기로 잘라 주세요.',
      },
    ],
  },
  recipe_0507: {
    prepTimeMinutes: 8,
    ingredientAmounts: { 물: '120ml' },
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: '두부·계란은 부드럽게, 간은 약하게.',
        substituteIngredients: '두부 → 닭가슴살 60g',
        storageInfo: '냉장 1일.',
        reheatingMethod: RICE_REHEAT,
      },
      'A',
    ),
    stepUpdates: [
      undefined,
      undefined,
      {
        instruction: '물 120ml, 간장 1큰술을 넣고 3분 끓여 두부에 양념이 배게 해요.',
        tip: '뚜껑을 덮으면 두부가 부드럽게 익어요.',
      },
    ],
  },
  recipe_0508: {
    prepTimeMinutes: 10,
    elementaryQuality: reviewed(
      {
        prerequisites: RICE_PREREQ,
        kidAdjustmentTip: tipCut('감자·소고기 한입 크기.'),
        substituteIngredients: '소고기 → 돼지고기 70g',
        storageInfo: '냉장 1일.',
        reheatingMethod: '전자레인지 1분, 중간에 한 번 저어 주세요.',
      },
      'A',
    ),
  },
};

function applyStepUpdates(
  steps: RecipeStepContent[],
  updates: StepUpdate[] | undefined,
): RecipeStepContent[] {
  if (!updates?.length) return steps;
  return steps.map((step, index) => {
    const patch = updates[index];
    if (!patch) return step;
    return {
      ...step,
      title: patch.title ?? step.title,
      instruction: patch.instruction ?? step.instruction,
      tip: patch.tip ?? step.tip,
    };
  });
}

export function applyElementarySprint6QualityPatch(recipe: Recipe): Recipe {
  const patch = ELEMENTARY_SPRINT6_PATCHES[recipe.id];
  if (!patch) return recipe;

  let ingredients = recipe.ingredients;
  if (patch.ingredientAmounts) {
    ingredients = ingredients.map((item) => {
      const nextAmount = patch.ingredientAmounts![item.name];
      return nextAmount ? { ...item, amount: nextAmount } : item;
    });
  }

  const steps = applyStepUpdates(recipe.recipe.steps, patch.stepUpdates);

  let familyAudience = recipe.familyAudience;
  if (patch.schoolMorningFriendly !== undefined) {
    familyAudience = {
      ...familyAudience,
      childMeal: {
        schoolMorningFriendly: patch.schoolMorningFriendly,
        pickyEatingFriendly: familyAudience.childMeal?.pickyEatingFriendly ?? null,
      },
    };
  }

  return {
    ...recipe,
    time: patch.time ?? recipe.time,
    serving: patch.serving ?? recipe.serving,
    prepTimeMinutes: patch.prepTimeMinutes,
    recommendationPriority: patch.recommendationPriority ?? recipe.recommendationPriority,
    ingredients,
    nutrition: { ...recipe.nutrition, source: 'unverified' },
    recipe: { steps },
    elementaryQuality: patch.elementaryQuality,
    familyAudience,
  };
}

export function isElementarySprint6Reviewed(recipeId: string): boolean {
  return (SPRINT6_REVIEWED_RECIPE_IDS as readonly string[]).includes(recipeId);
}
