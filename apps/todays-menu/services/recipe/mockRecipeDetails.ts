import type { MenuItem } from '../../types/recommendation';
import type { Recipe, RecipeIngredient, RecipeStep } from '../../types/recipe';
import { getDeliveryMealById } from '../../library/delivery-meals';
import { getCoreRecipeDetailById } from '../../data/recipes';
import { getFlagshipGoldMealById } from '../recommendation/goldMealCatalog';
import { goldMealToRecipe } from '../goldMeal/goldMealService';
import { getDeliveryMenuById } from '../recommendation/deliveryMealCatalog';
import { getFlagshipMenuById } from '../recommendation/goldMealCatalog';
import { resolveMealImageAsRecipe } from '../images';
import { resolveRecipeIngredients } from '../ingredient';
import { DELIVERY_MENUS, getAllMenus, HOMEMADE_MENUS } from '../recommendation/menuCatalog';

type RecipeOverride = Partial<
  Pick<Recipe, 'servings' | 'ingredients' | 'steps' | 'tip' | 'image' | 'description'>
>;

const RECIPE_OVERRIDES: Record<string, RecipeOverride> = {
  homemade_001: {
    servings: 2,
    image: { emoji: '🥩', url: null },
    ingredients: [
      { name: '돼지고기 앞다리살', amount: '300g' },
      { name: '양파', amount: '1/2개' },
      { name: '대파', amount: '1대' },
      { name: '고추장', amount: '2큰술' },
      { name: '고춧가루', amount: '1큰술' },
      { name: '간장', amount: '1큰술' },
      { name: '다진 마늘', amount: '1큰술' },
    ],
    steps: [
      {
        order: 1,
        guide: '고기 양념이 맛의 핵심이에요, 같이 해봐요!',
        instruction: '돼지고기는 한입 크기로 썰고 양념에 10분 재워요.',
      },
      {
        order: 2,
        guide: '이제 불을 켜고 본격적으로 시작해요.',
        instruction: '팬에 기름을 두르고 고기를 먼저 볶아요.',
      },
      {
        order: 3,
        guide: '야채를 넣으면 향이 훨씬 좋아져요.',
        instruction: '양파와 대파를 넣고 함께 볶아요.',
      },
      {
        order: 4,
        guide: '마지막이에요! 예쁘게 담아볼까요?',
        instruction: '밥 위에 올려 따뜻하게 드세요.',
      },
    ],
    tip: '고기를 미리 양념에 재워두면 훨씬 빨리 완성돼요.',
  },
  homemade_002: {
    servings: 3,
    image: { emoji: '🍲', url: null },
    ingredients: [
      { name: '된장', amount: '2큰술' },
      { name: '두부', amount: '1/2모' },
      { name: '애호박', amount: '1/4개' },
      { name: '감자', amount: '1개' },
      { name: '대파', amount: '1대' },
      { name: '멸치 육수', amount: '500ml' },
    ],
    steps: [
      {
        order: 1,
        guide: '따뜻한 국물부터 준비해볼까요?',
        instruction: '냄비에 멸치 육수를 넣고 끓여요.',
      },
      {
        order: 2,
        guide: '채소를 넣으면 달콤한 맛이 나요.',
        instruction: '감자와 애호박을 넣고 익을 때까지 끓여요.',
      },
      {
        order: 3,
        guide: '된장은 불을 줄이고 풀어주세요.',
        instruction: '된장을 풀고 두부와 대파를 넣어요.',
      },
      {
        order: 4,
        guide: '거의 다 됐어요, 조금만 더 끓여요!',
        instruction: '한소끔 더 끓이면 완성이에요.',
      },
    ],
    tip: '멸치 육수를 쓰면 국물이 훨씬 깊어져요.',
  },
  homemade_003: {
    servings: 1,
    image: { emoji: '🍚', url: null },
    ingredients: [
      { name: '밥', amount: '1공기' },
      { name: '김치', amount: '1/2컵' },
      { name: '참기름', amount: '1작은술' },
      { name: '김가루', amount: '1큰술' },
      { name: '계란', amount: '1개' },
    ],
    steps: [
      {
        order: 1,
        guide: '김치부터 볶으면 깊은 맛이 나요.',
        instruction: '팬에 참기름을 두르고 김치를 볶아요.',
      },
      {
        order: 2,
        guide: '밥을 넣고 골고루 섞어볼까요?',
        instruction: '밥을 넣고 골고루 볶아요.',
      },
      {
        order: 3,
        guide: '계란을 올리면 더 든든해져요!',
        instruction: '계란 프라이를 올리면 더 든든해요.',
      },
      {
        order: 4,
        guide: '마지막 한 방울이 포인트예요.',
        instruction: '김가루를 뿌려 마무리해요.',
      },
    ],
    tip: '마지막에 참기름 한 방울이 포인트예요.',
  },
};

const HOMEMADE_STEP_GUIDES = [
  '먼저 재료부터 깨끗이 준비해볼까요?',
  '이제 본격적으로 만들어 봐요!',
  '거의 다 왔어요, 조금만 더!',
];

const DELIVERY_STEP_GUIDES = [
  '배달 앱을 열어볼까요?',
  '좋아요, 이제 주문만 하면 돼요!',
  '도착하면 같이 맛있게 먹어요!',
];

function getImageEmoji(menu: MenuItem): string {
  return menu.mode === 'delivery' ? '🚚' : '🍳';
}

function buildHomemadeIngredients(menu: MenuItem): RecipeIngredient[] {
  return [
    { name: menu.title, amount: '주재료' },
    { name: '양념', amount: '적당량' },
    { name: '대파', amount: '1대' },
    { name: '마늘', amount: '1큰술' },
  ];
}

function buildHomemadeInstructions(menu: MenuItem): string[] {
  return [
    '필요한 재료를 깨끗이 준비해요.',
    `${menu.title}을(를) 차근차근 만들어요.`,
    '예쁘게 담아 따뜻할 때 드세요.',
  ];
}

function buildDeliveryIngredients(menu: MenuItem): RecipeIngredient[] {
  return [
    { name: menu.title, amount: '1인분' },
    { name: '배달 앱', amount: '1개' },
    { name: '음료', amount: '선택' },
  ];
}

function buildDeliveryInstructions(menu: MenuItem): string[] {
  return [
    '배달 앱에서 메뉴를 검색해요.',
    `${menu.title}을(를) 주문해요.`,
    '도착하면 따뜻할 때 같이 맛있게 드세요!',
  ];
}

function buildRecipeSteps(
  instructions: string[],
  guides: string[],
): RecipeStep[] {
  return instructions.map((instruction, index) => ({
    order: index + 1,
    guide: guides[index] ?? '다음 단계로 넘어가 볼까요?',
    instruction,
  }));
}

function buildHomemadeRecipeSteps(menu: MenuItem): RecipeStep[] {
  return buildRecipeSteps(buildHomemadeInstructions(menu), HOMEMADE_STEP_GUIDES);
}

function buildDeliveryRecipeSteps(menu: MenuItem): RecipeStep[] {
  return buildRecipeSteps(buildDeliveryInstructions(menu), DELIVERY_STEP_GUIDES);
}

function buildFromMenu(menu: MenuItem): Recipe {
  const override = RECIPE_OVERRIDES[menu.id];
  const isDelivery = menu.mode === 'delivery';
  const rawIngredients =
    override?.ingredients ??
    (isDelivery ? buildDeliveryIngredients(menu) : buildHomemadeIngredients(menu));

  return {
    id: menu.id,
    title: menu.title,
    description: override?.description ?? menu.subtitle,
    mode: menu.mode,
    type: menu.type,
    mealTime: menu.mealTime,
    cookTime: menu.cookTime,
    difficulty: menu.difficulty,
    servings: override?.servings ?? (isDelivery ? 1 : 2),
    tags: menu.tags,
    aiReason: menu.aiReason,
    image:
      override?.image ??
      resolveMealImageAsRecipe(menu.id, {
        mealMode: menu.mode,
        emoji: getImageEmoji(menu),
      }),
    ingredients: resolveRecipeIngredients(rawIngredients),
    steps:
      override?.steps ??
      (isDelivery ? buildDeliveryRecipeSteps(menu) : buildHomemadeRecipeSteps(menu)),
    tip: override?.tip ?? menu.honeyTip ?? '천천히 따라 하면 금방 완성돼요!',
    recommendedSides: menu.recommendedSides,
  };
}

export function getMenuById(id: string): MenuItem | null {
  const flagship = getFlagshipMenuById(id);
  if (flagship) return flagship;

  const delivery = getDeliveryMenuById(id);
  if (delivery) return delivery;

  return getAllMenus().find((menu) => menu.id === id) ?? null;
}

export function getRecipeById(id: string): Recipe | null {
  const coreRecipe = getCoreRecipeDetailById(id);
  if (coreRecipe) return coreRecipe;

  const flagshipMeal = getFlagshipGoldMealById(id);
  if (flagshipMeal) return goldMealToRecipe(flagshipMeal);

  const deliveryMeal = getDeliveryMealById(id);
  if (deliveryMeal) return goldMealToRecipe(deliveryMeal);

  const menu = getMenuById(id);
  if (!menu) return null;
  return buildFromMenu(menu);
}

/** @deprecated Use `getRecipeById` */
export const getRecipeDetailById = getRecipeById;
