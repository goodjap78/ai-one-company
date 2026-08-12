/**
 * Sprint R7 — Expand RecipeSpec → HankkiRecipeInput (master-template compatible).
 */
import type { HankkiRecipeInput } from '../recipeMasterTemplate';
import type { RecipeIngredient } from '../types';
import type { RecipeSpec } from './types';

function ing(
  item: { name: string; amount: string; iconKey: string },
  group: RecipeIngredient['group'],
  tags: string[],
): RecipeIngredient {
  return {
    name: item.name,
    amount: item.amount,
    iconKey: item.iconKey,
    group,
    tags,
  };
}

function defaultMessages(spec: RecipeSpec): string[] {
  const name = spec.name;
  return [
    `오늘은 ${name} 어때요?`,
    `${name}으로 든든하게 챙겨 보세요.`,
    `${spec.time}분이면 충분히 만들 수 있어요.`,
    `${spec.tags[0] ?? '집밥'} 느낌으로 잘 어울려요.`,
    `한끼가 ${name}을 추천해요.`,
  ];
}

function stepInstruction(
  title: string,
  order: number,
  mains: string[],
  subs: string[],
): string {
  const mainLabel = mains.slice(0, 2).join('·') || '주재료';
  const subLabel = subs.slice(0, 2).join('·') || '부재료';
  switch (order) {
    case 1:
      return `${mainLabel}을(를) 손질하고 ${title} 준비를 해요.`;
    case 2:
      return `${subLabel}을(를) 준비하고 ${title}을(를) 진행해요.`;
    case 3:
      return `양념과 함께 ${title}을(를) 해요. 중불에서 골고루 익혀요.`;
    case 4:
      return `${title}으로 마무리하고 접시에 담아요.`;
    default:
      return `${title}을(를) 진행한 뒤 간을 보고 마무리해요.`;
  }
}

function stepTip(order: number): string {
  const tips = [
    '재료를 비슷한 크기로 썰면 익힘이 고르게 돼요.',
    '미리 준비해 두면 조리 흐름이 매끄러워요.',
    '센 불보다 중불이 타지 않고 맛있어요.',
    '마지막에 불을 끄고 간을 보면 실패가 줄어요.',
    '바로 먹지 않을 땐 살짝 덜 짜게 맞춰 두세요.',
  ];
  return tips[Math.min(order - 1, tips.length - 1)]!;
}

/** Build one factory-ready input from a compact pipeline spec. */
export function scaffoldRecipe(spec: RecipeSpec): HankkiRecipeInput {
  const ingredients: RecipeIngredient[] = [
    ...spec.mains.map((m) => ing(m, 'main', ['주재료'])),
    ...spec.subs.map((s) => ing(s, 'sub', ['부재료'])),
    ...spec.seasonings.map((s) => ing(s, 'seasoning', ['양념'])),
  ];

  const mainNames = spec.mains.map((m) => m.name);
  const subNames = spec.subs.map((s) => s.name);
  const messages =
    spec.recommendationMessages?.filter(Boolean) ?? defaultMessages(spec);
  const recommendationMessages = (
    messages.length >= 5 ? messages.slice(0, 5) : [...messages, ...defaultMessages(spec)]
  ).slice(0, 5);

  const steps = spec.stepTitles.map((title, index) => {
    const order = index + 1;
    return {
      title,
      instruction: stepInstruction(title, order, mainNames, subNames),
      imageKey: `${spec.heroImageKey}_step_${String(order).padStart(2, '0')}`,
      tip: stepTip(order),
    };
  });

  const protein = spec.protein ?? Math.round(spec.calories * 0.08);
  const carbohydrate = spec.carbohydrate ?? Math.round(spec.calories * 0.1);
  const fat = spec.fat ?? Math.round(spec.calories * 0.04);

  return {
    id: spec.id,
    name: spec.name,
    category: [...spec.category],
    mealType: [...spec.mealType],
    time: spec.time,
    difficulty: spec.difficulty,
    serving: spec.serving,
    ingredients,
    nutrition: {
      calorie: spec.calories,
      protein,
      carbohydrate,
      fat,
    },
    tags: [...spec.tags],
    situation: [...spec.situation],
    aiTags: [...spec.aiTags],
    heroImageKey: spec.heroImageKey,
    recommendationMessages,
    decisionTags: spec.decisionTags,
    recommendationReasons: spec.recommendationReasons,
    searchTags: spec.searchTags,
    recommendationPriority: spec.recommendationPriority,
    recipe: { steps },
  };
}

export function scaffoldRecipeBatch(specs: RecipeSpec[]): HankkiRecipeInput[] {
  return specs.map(scaffoldRecipe);
}
