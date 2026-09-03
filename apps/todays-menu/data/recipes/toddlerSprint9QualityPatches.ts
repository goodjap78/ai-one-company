/**
 * Sprint 9 — toddler core recipe quality patches (15 breakfast + 15 dinner).
 * Does not invent nutrition numbers. Grades are editorial serviceability only.
 */
import type { ElementaryRecipeQualityMetadata } from './elementaryRecipeQualityTypes';
import type { Recipe, RecipeStepContent } from './types';

export const SPRINT9_TODDLER_BREAKFAST_IDS = [
  'recipe_0320',
  'recipe_0321',
  'recipe_0322',
  'recipe_0323',
  'recipe_0431',
  'recipe_0432',
  'recipe_0433',
  'recipe_0484',
  'recipe_0485',
  'recipe_0486',
  'recipe_0487',
  'recipe_0488',
  'recipe_0489',
  'recipe_0490',
  'recipe_0491',
] as const;

/** Dinner 15 — diversity of form + protein; exposure via priority; home-cook realism. */
export const SPRINT9_TODDLER_DINNER_IDS = [
  'recipe_0425', // 덮밥 · 소고기
  'recipe_0429', // 볶음 · 닭
  'recipe_0394', // 볶음 · 소고기
  'recipe_0393', // 구이 · 두부
  'recipe_0390', // 구이 · 닭
  'recipe_0331', // 조림 · 닭
  'recipe_0426', // 조림 · 두부
  'recipe_0468', // 조림 · 채소
  'recipe_0330', // 국 · 두부/계란
  'recipe_0388', // 국 · 계란
  'recipe_0464', // 국 · 소고기
  'recipe_0466', // 국 · 두부
  'recipe_0328', // 수프 · 채소
  'recipe_0470', // 볶음 · 두부
  'recipe_0428', // 볶음 · 계란
] as const;

export const SPRINT9_TODDLER_CORE_IDS = [
  ...SPRINT9_TODDLER_BREAKFAST_IDS,
  ...SPRINT9_TODDLER_DINNER_IDS,
] as const;

type SaltStrategy = 'optional' | 'omit_soy' | 'omit_cheese' | 'omit_butter' | 'none';

type StepUpdate = Partial<Pick<RecipeStepContent, 'title' | 'instruction' | 'tip'>>;

export type ToddlerSprint9Patch = {
  prepTimeMinutes: number;
  time?: number;
  serving?: number;
  saltStrategy: SaltStrategy;
  ingredientAmounts?: Record<string, string>;
  stepUpdates?: StepUpdate[];
  elementaryQuality: ElementaryRecipeQualityMetadata;
};

function toddlerReviewed(
  partial: Omit<ElementaryRecipeQualityMetadata, 'contentVerificationStatus' | 'targetAudience'>,
  recipeQualityGrade: NonNullable<ElementaryRecipeQualityMetadata['recipeQualityGrade']>,
): ElementaryRecipeQualityMetadata {
  return {
    contentVerificationStatus: 'reviewed',
    targetAudience: 'toddler',
    imageRecipeMatch: true,
    recipeQualityGrade,
    ...partial,
  };
}

const SALT_AMOUNT: Record<Exclude<SaltStrategy, 'none'>, string> = {
  optional: '선택(생략 가능)',
  omit_soy: '생략(간장으로 간)',
  omit_cheese: '생략(치즈로 간)',
  omit_butter: '생략(버터로 간)',
};

const SALT_STEP_REPLACEMENT: Record<Exclude<SaltStrategy, 'none'>, string> = {
  optional: '소금은 생략하거나, 넣을 경우에도 아주 조금만',
  omit_soy: '소금은 넣지 않고(간장으로 간을 맞춤)',
  omit_cheese: '소금은 넣지 않고(치즈로 간을 맞춤)',
  omit_butter: '소금은 넣지 않고(버터로 간을 맞춤)',
};

const KID_CUT =
  '재료는 한입 크기(약 5mm~1cm)로 다지거나 으깨 주세요. 질기거나 큰 덩어리는 내지 않아요.';
const KID_SALT =
  '간은 성인 입맛보다 싱겁게. 아이 반응을 보고 보호자가 따로 간을 더하지 않는 것을 기본으로 해요.';
const STORAGE_DAY = '완성 후 냉장 1일. 유아식은 당일 섭취를 권장해요.';
const REHEAT_SOFT =
  '전자레인지 30~40초 또는 팬 약불 1분. 뜨거우면 2분 식혀 보호자가 확인 후 내요.';
const REHEAT_SOUP =
  '냄비 약불 1~2분 또는 전자레인지 40~50초. 한입씩 떠서 온도를 확인해요.';

function rewriteSaltInText(text: string, strategy: SaltStrategy): string {
  if (strategy === 'none') return text;
  const replacement = SALT_STEP_REPLACEMENT[strategy];
  return text
    .replace(/소금\s*1꼬집(으로|으로\s*간해|으로\s*간하|을|을\s*넣고|으로)?/g, (_, suffix) => {
      if (suffix?.includes('넣고')) return `${replacement} 넣고`;
      if (suffix?.includes('간')) return `${replacement}`;
      return replacement;
    })
    .replace(/소금\s*1꼬집/g, replacement);
}

function applyStepUpdates(
  steps: RecipeStepContent[],
  updates: StepUpdate[] | undefined,
  saltStrategy: SaltStrategy,
): RecipeStepContent[] {
  return steps.map((step, index) => {
    const patch = updates?.[index];
    const merged: RecipeStepContent = {
      ...step,
      title: patch?.title ?? step.title,
      instruction: patch?.instruction ?? step.instruction,
      tip: patch?.tip ?? step.tip,
    };
    return {
      ...merged,
      instruction: rewriteSaltInText(merged.instruction, saltStrategy),
      tip: rewriteSaltInText(merged.tip ?? '', saltStrategy),
    };
  });
}

/** Shared editorial fields by meal family. */
function breakfastQuality(
  nameHint: string,
  extras: Partial<ElementaryRecipeQualityMetadata> = {},
): ElementaryRecipeQualityMetadata {
  return toddlerReviewed(
    {
      prerequisites:
        extras.prerequisites ??
        `${nameHint} 재료를 미리 꺼내 두면 팬·냄비 예열과 함께 아침 시간에 맞출 수 있어요. 밥이 들어가는 메뉴는 찬밥·즉석밥 기준입니다.`,
      kidAdjustmentTip: extras.kidAdjustmentTip ?? `${KID_SALT} ${KID_CUT}`,
      substituteIngredients:
        extras.substituteIngredients ?? '우유 → 두유(알레르기 확인) / 버터 → 식용유 소량',
      storageInfo: extras.storageInfo ?? STORAGE_DAY,
      reheatingMethod: extras.reheatingMethod ?? REHEAT_SOFT,
      imageRecipeMatch: true,
    },
    'A',
  );
}

function dinnerQuality(
  nameHint: string,
  extras: Partial<ElementaryRecipeQualityMetadata> = {},
): ElementaryRecipeQualityMetadata {
  return toddlerReviewed(
    {
      prerequisites:
        extras.prerequisites ??
        `${nameHint} 고기·채소는 미리 5mm 이하로 썰어 두면 본 조리가 빨라요. 밥 메뉴는 찬밥·즉석밥 기준입니다.`,
      kidAdjustmentTip: extras.kidAdjustmentTip ?? `${KID_SALT} ${KID_CUT}`,
      substituteIngredients:
        extras.substituteIngredients ?? '소고기 ↔ 닭안심 / 두부 ↔ 부드러운 닭안심(알레르기 확인)',
      storageInfo: extras.storageInfo ?? STORAGE_DAY,
      reheatingMethod: extras.reheatingMethod ?? REHEAT_SOFT,
      imageRecipeMatch: true,
    },
    'A',
  );
}

/**
 * Per-recipe patches. Salt is never blindly converted 1꼬집→1/16작은술.
 * Prefer omit when soy/cheese/butter already seasons; otherwise mark optional.
 */
export const TODDLER_SPRINT9_PATCHES: Record<string, ToddlerSprint9Patch> = {
  // —— Breakfast 15 ——
  recipe_0320: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('순두부·계란', {
      prerequisites: '두부 물기를 미리 짜 두면 스크램블이 더 부드럽게 나와요. 총 약 10분.',
      substituteIngredients: '두부 → 부드러운 순두부 / 대파 생략 가능',
    }),
    stepUpdates: [
      undefined,
      {
        instruction:
          '으깬 두부에 푼 계란 2개를 넣고 섞어요. 소금은 생략하거나, 넣을 경우에도 아주 조금만 넣어요.',
        tip: '대파는 아주 잘게 다져 1작은술만 넣어요.',
      },
      {
        tip: '약불에서 저으며 익히고, 센 불이면 두부가 딱딱해져요. 겉이 보슬보슬하면 불을 끄세요.',
      },
    ],
  },
  recipe_0321: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('계란찜·밥', {
      prerequisites: '내열 그릇·전자레인지(또는 찜기) 준비. 밥은 찬밥·즉석밥 기준. 총 약 12분.',
      reheatingMethod: '전자레인지 30초. 계란찜이 뜨거우면 가운데를 찔러 온도를 확인해요.',
    }),
    stepUpdates: [
      {
        instruction:
          '계란 2개에 물 80ml를 넣고 거품이 일지 않게 저어요. 소금은 생략하거나, 넣을 경우에도 아주 조금만 넣어요.',
      },
      {
        tip: '가운데가 살짝 흔들리면 익은 상태예요. 완전히 굳을 때까지 돌리면 퍽퍽해져요.',
      },
    ],
  },
  recipe_0322: {
    prepTimeMinutes: 2,
    saltStrategy: 'none',
    elementaryQuality: breakfastQuality('바나나·오트밀', {
      prerequisites: '바나나를 미리 으깨 두면 8분 안에 완성돼요. 소금·설탕·꿀은 넣지 않아요.',
      kidAdjustmentTip: `${KID_CUT} 꿀·설탕은 넣지 않아요.`,
      substituteIngredients: '우유 → 두유(알레르기 확인) / 오트밀 → 아기용 쌀 플레이크',
    }),
  },
  recipe_0323: {
    prepTimeMinutes: 8,
    saltStrategy: 'none',
    elementaryQuality: breakfastQuality('고구마·바나나', {
      prerequisites:
        '고구마는 전날 쪄 두면 아침에는 으깨+버무리만 4~5분이면 돼요. 생고구마를 찌면 +15~20분.',
      kidAdjustmentTip: `${KID_CUT} 고구마·바나나는 덩어리 없이 완전히 으깨요.`,
      substituteIngredients: '바나나 → 찐 사과(껍질·씨 제거) / 고구마 → 단호박',
    }),
    stepUpdates: [
      {
        tip: '포크로 완전히 으깨 콩알보다 큰 덩어리가 남지 않게 해요.',
      },
    ],
  },
  recipe_0431: {
    prepTimeMinutes: 4,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('애호박·계란국', {
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      undefined,
      {
        tip: '약불~중약불. 애호박이 투명해지고 부드러워질 때까지.',
      },
    ],
  },
  recipe_0432: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('연두부 맑은국', {
      reheatingMethod: REHEAT_SOUP,
      substituteIngredients: '연두부 → 부드러운 순두부 / 대파 생략 가능',
    }),
  },
  recipe_0433: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('감자·계란국', {
      prerequisites: '감자는 1cm 이하로 미리 썰어 두면 국 끓이는 시간이 줄어요. 총 약 15분.',
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      {
        tip: '감자가 포크로 쉽게 으스러질 때까지 끓여요.',
      },
    ],
  },
  recipe_0484: {
    prepTimeMinutes: 3,
    saltStrategy: 'omit_cheese',
    elementaryQuality: breakfastQuality('계란·치즈밥', {
      kidAdjustmentTip: `${KID_SALT} 치즈가 있으면 소금을 따로 넣지 않아요. ${KID_CUT}`,
      substituteIngredients: '슬라이스치즈 → 모짜렐라 소량 / 치즈 알레르기면 생략하고 계란만',
    }),
    stepUpdates: [
      undefined,
      {
        tip: '약불에서 저으며 부드럽게 익히고, 센 불에 굳히지 않아요.',
      },
      {
        instruction:
          '잘게 썬 치즈를 넣고 1분 더 저어 녹인 뒤, 소금은 넣지 않아요(치즈로 간을 맞춤).',
        tip: '치즈가 길게 늘어지면 가위로 잘라 한입 크기로 내요.',
      },
    ],
  },
  recipe_0485: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('소고기·계란밥', {
      prerequisites: '소고기는 5mm 이하로 미리 썰어 두면 아침 15분에 맞춰요. 찬밥·즉석밥 기준.',
    }),
    stepUpdates: [
      undefined,
      {
        tip: '중약불. 가운데를 잘라 분홍기가 없는지 확인해요.',
      },
      {
        tip: '약불에서 부드럽게. 큰 계란 덩어리는 주걱으로 갈라요.',
      },
    ],
  },
  recipe_0486: {
    prepTimeMinutes: 4,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('두부·계란밥', {
      substituteIngredients: '두부 → 순두부(물기 제거) / 대파 생략 가능',
    }),
  },
  recipe_0487: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('닭고기 주먹밥', {
      prerequisites: '닭고기·당근을 5mm 이하로 미리 썰어 두면 주먹밥까지 약 15분. 찬밥 기준.',
      kidAdjustmentTip: `${KID_SALT} 주먹밥은 엄지 한마디 크기. 한 입에 넣기 큰 덩어리는 보호자가 잘라 줘요. ${KID_CUT}`,
    }),
    stepUpdates: [
      undefined,
      {
        tip: '중약불. 가운데를 잘라 분홍기가 없는지 확인해요.',
      },
    ],
  },
  recipe_0488: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('애호박·계란밥'),
  },
  recipe_0489: {
    prepTimeMinutes: 4,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('당근·계란밥'),
  },
  recipe_0490: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('브로콜리·계란밥', {
      kidAdjustmentTip: `${KID_SALT} 브로콜리 줄기는 껍질을 벗기고 아주 잘게. 꽃송이도 한입 크기로. ${KID_CUT}`,
    }),
  },
  recipe_0491: {
    prepTimeMinutes: 5,
    time: 18,
    saltStrategy: 'optional',
    elementaryQuality: breakfastQuality('계란·채소죽', {
      prerequisites:
        '채소는 미리 잘게 다져 두면 죽이 빨리 무른 상태가 돼요. 아침 여유 있을 때(약 18분) 추천.',
      reheatingMethod: REHEAT_SOUP,
    }),
  },

  // —— Dinner 15 ——
  recipe_0425: {
    prepTimeMinutes: 5,
    saltStrategy: 'omit_soy',
    elementaryQuality: dinnerQuality('소고기·표고 덮밥', {
      kidAdjustmentTip: `${KID_SALT} 간장이 있으면 소금을 넣지 않아요. 표고는 결 따라 잘게. ${KID_CUT}`,
    }),
    stepUpdates: [
      undefined,
      { tip: '중약불. 가운데를 잘라 분홍기가 없는지 확인해요.' },
      { tip: '뚜껑을 덮어 표고가 무를 때까지. 질기면 2분 더.' },
      {
        instruction:
          '간장 1/2작은술, 참기름 1/4작은술로 30초 더 볶아요. 소금은 넣지 않아요(간장으로 간을 맞춤).',
        tip: '설탕·고춧가루는 넣지 않아요.',
      },
    ],
  },
  recipe_0429: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('닭안심·채소 볶음'),
    stepUpdates: [
      undefined,
      { tip: '중약불. 닭 가운데를 잘라 분홍기가 없는지 확인해요.' },
    ],
  },
  recipe_0394: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('소고기·버섯 볶음'),
    stepUpdates: [
      undefined,
      { tip: '중약불. 소고기 분홍기가 없어질 때까지.' },
    ],
  },
  recipe_0393: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('두부 구이', {
      substituteIngredients: '두부 → 연두부(물기 제거 후 약불) / 간장 살짝(선택)',
    }),
    stepUpdates: [
      {
        tip: '약불~중약불. 겉만 노릇하고 속은 부드럽게. 센 불에 바싹 굽지 않아요.',
      },
    ],
  },
  recipe_0390: {
    prepTimeMinutes: 5,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('닭안심 구이'),
    stepUpdates: [
      undefined,
      {
        tip: '약불. 물을 조금 넣고 뚜껑을 덮어 속까지 익혀요. 가운데를 잘라 분홍기 확인.',
      },
    ],
  },
  recipe_0331: {
    prepTimeMinutes: 6,
    saltStrategy: 'omit_butter',
    elementaryQuality: dinnerQuality('감자·닭안심 조림', {
      kidAdjustmentTip: `${KID_SALT} 버터가 있으면 소금을 생략해요. 감자는 완전히 으깨요. ${KID_CUT}`,
      reheatingMethod: REHEAT_SOFT,
    }),
    stepUpdates: [
      { tip: '감자가 포크로 쉽게 으스러질 때까지. 덩어리 없이 으깨요.' },
      undefined,
      { tip: '닭 속을 잘라 완전히 익었는지 확인해요.' },
      {
        instruction:
          '버터 3g을 넣고 으깬 감자와 섞은 뒤 한입씩 떠 내요. 소금은 넣지 않아요(버터로 간을 맞춤).',
      },
    ],
  },
  recipe_0426: {
    prepTimeMinutes: 4,
    saltStrategy: 'omit_soy',
    elementaryQuality: dinnerQuality('두부·채소 조림', {
      kidAdjustmentTip: `${KID_SALT} 간장이 있으면 소금을 넣지 않아요. ${KID_CUT}`,
    }),
  },
  recipe_0468: {
    prepTimeMinutes: 4,
    saltStrategy: 'omit_soy',
    elementaryQuality: dinnerQuality('애호박 조림', {
      kidAdjustmentTip: `${KID_SALT} 간장이 있으면 소금을 넣지 않아요. 애호박은 무르게. ${KID_CUT}`,
    }),
  },
  recipe_0330: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('순두부·계란국', {
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      {
        tip: '약불. 계란이 부드럽게 익고 두부가 뜨거울 때까지. 팔팔 끓여 굳히지 않아요.',
      },
    ],
  },
  recipe_0388: {
    prepTimeMinutes: 3,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('부드러운 계란국', {
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      {
        tip: '약불에서 저으며. 계란이 꽃처럼 풀리면 불을 끄세요.',
      },
    ],
  },
  recipe_0464: {
    prepTimeMinutes: 6,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('소고기·배추국', {
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      undefined,
      { tip: '중약불. 소고기 분홍기가 없어질 때까지.' },
    ],
  },
  recipe_0466: {
    prepTimeMinutes: 4,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('애호박·두부국', {
      reheatingMethod: REHEAT_SOUP,
    }),
  },
  recipe_0328: {
    prepTimeMinutes: 6,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('감자·당근 수프', {
      prerequisites: '감자·당근을 1cm 이하로 미리 썰어 두면 수프가 빨리 무르고 으깨기 좋아요.',
      kidAdjustmentTip: `${KID_SALT} 수프는 포크로 으깨 알갱이가 거의 없게. ${KID_CUT}`,
      reheatingMethod: REHEAT_SOUP,
    }),
    stepUpdates: [
      {
        tip: '채소가 포크로 쉽게 으스러질 때까지 끓인 뒤 으깨요.',
      },
    ],
  },
  recipe_0470: {
    prepTimeMinutes: 4,
    saltStrategy: 'omit_soy',
    elementaryQuality: dinnerQuality('두부·버섯 볶음', {
      kidAdjustmentTip: `${KID_SALT} 간장이 있으면 소금을 넣지 않아요. ${KID_CUT}`,
    }),
  },
  recipe_0428: {
    prepTimeMinutes: 4,
    saltStrategy: 'optional',
    elementaryQuality: dinnerQuality('브로콜리·계란 볶음', {
      kidAdjustmentTip: `${KID_SALT} 브로콜리는 줄기 껍질 제거 후 아주 잘게. ${KID_CUT}`,
    }),
    stepUpdates: [
      undefined,
      {
        tip: '약불. 계란은 부드럽게, 브로콜리는 무르게.',
      },
    ],
  },
};

function resolveSaltAmount(strategy: SaltStrategy): string | null {
  if (strategy === 'none') return null;
  return SALT_AMOUNT[strategy];
}

export function applyToddlerSprint9QualityPatch(recipe: Recipe): Recipe {
  const patch = TODDLER_SPRINT9_PATCHES[recipe.id];
  if (!patch) return recipe;

  const saltAmount = resolveSaltAmount(patch.saltStrategy);
  const amountMap: Record<string, string> = {
    ...(saltAmount ? { 소금: saltAmount } : {}),
    ...patch.ingredientAmounts,
  };

  const ingredients = recipe.ingredients.map((item) => {
    const nextAmount = amountMap[item.name];
    return nextAmount ? { ...item, amount: nextAmount } : item;
  });

  const steps = applyStepUpdates(recipe.recipe.steps, patch.stepUpdates, patch.saltStrategy);

  return {
    ...recipe,
    time: patch.time ?? recipe.time,
    serving: patch.serving ?? recipe.serving,
    prepTimeMinutes: patch.prepTimeMinutes,
    ingredients,
    // Keep nutrition unverified — grade ≠ nutrition verification
    nutrition: { ...recipe.nutrition, source: 'unverified' },
    recipe: { steps },
    elementaryQuality: patch.elementaryQuality,
  };
}

export function isToddlerSprint9Core(recipeId: string): boolean {
  return (SPRINT9_TODDLER_CORE_IDS as readonly string[]).includes(recipeId);
}
