/**
 * Critical consistency fixes for Batch 07 pipeline recipes (061, 063).
 * Replaces scaffold-generated generic steps with ingredient-accurate instructions.
 */
import type { HankkiRecipeInput } from '../recipeMasterTemplate';

const ROSE_TTEOKBOKKI_STEPS: HankkiRecipeInput['recipe']['steps'] = [
  {
    title: '로제소스 만들기',
    instruction:
      '고추장·토마토소스·우유·설탕·간장을 섞어 부드러운 로제소스를 만들어요.',
    imageKey: 'rose_tteokbokki_step_01',
    tip: '우유는 중불에서 끓일 때 넣으면 덜 뭉개져요.',
  },
  {
    title: '떡 넣고 끓이기',
    instruction: '팬에 로제소스와 물을 넣고 떡을 넣어 5분 정도 끓여요.',
    imageKey: 'rose_tteokbokki_step_02',
    tip: '떡이 서로 달라붙지 않게 저어 주세요.',
  },
  {
    title: '어묵·채소 넣기',
    instruction: '어묵·양배추·대파를 넣고 3분 더 끓여요.',
    imageKey: 'rose_tteokbokki_step_03',
    tip: '양배추는 너무 오래 끓이지 않으면 아삭해요.',
  },
  {
    title: '걸쭉하게 조이기',
    instruction: '중불에서 소스가 걸쭉해질 때까지 졸인 뒤 계란을 넣고 마무리해요.',
    imageKey: 'rose_tteokbokki_step_04',
    tip: '마지막에 불을 줄이고 간을 보면 타지 않아요.',
  },
];

const TUNA_GIMBAP_STEPS: HankkiRecipeInput['recipe']['steps'] = [
  {
    title: '참치 준비',
    instruction: '참치 기름을 빼고 마요네즈와 섞어요.',
    imageKey: 'tuna_gimbap_step_01',
    tip: '기름은 살짝만 남기면 고소해요.',
  },
  {
    title: '속재료 준비',
    instruction: '당근은 채 썰어 볶고, 시금치는 데친 뒤 계란은 지단으로 부쳐 채 썰어요.',
    imageKey: 'tuna_gimbap_step_02',
    tip: '속재료는 물기를 빼 두면 김밥이 잘 말려요.',
  },
  {
    title: '밥 양념',
    instruction: '따뜻한 밥에 참기름과 소금을 넣고 골고루 섞어요.',
    imageKey: 'tuna_gimbap_step_03',
    tip: '밥이 식으면 양념이 잘 배지 않아요.',
  },
  {
    title: '김밥 말기',
    instruction: '김 위에 밥을 펴고 참치·속재료·단무지를 올려 말아 한입 크기로 썰어요.',
    imageKey: 'tuna_gimbap_step_04',
    tip: '칼에 참기름을 바르면 잘 안 뭉개져요.',
  },
];

export function applyBatch07CriticalCorrections(
  recipe: HankkiRecipeInput,
): HankkiRecipeInput {
  if (recipe.id === '061') {
    return { ...recipe, recipe: { steps: ROSE_TTEOKBOKKI_STEPS } };
  }
  if (recipe.id === '063') {
    return { ...recipe, recipe: { steps: TUNA_GIMBAP_STEPS } };
  }
  return recipe;
}
