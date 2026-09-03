/**
 * Parent-facing copy for child recipe detail extensions.
 * Never expose internal enums (texture, review flags, schoolMorningFriendly).
 */
import type { BabyFoodStage, BabyFoodTexture } from '../data/recipes/recipeFamilyAudienceTypes';
import { BABY_FOOD_FEED_ALLERGY_LABELS, BABY_FOOD_FEED_STAGE_LABELS } from './babyFoodFeedCopy';

export type ChildDetailContext = 'baby' | 'toddler' | 'elementary' | 'general';

export const childDetailCopy = {
  babyBadgePrefix: '이유식',
  toddlerBadge: '유아식',
  elementaryBadge: '아이 식사',

  portionTitle: '몇 회분으로 준비할까요?',
  portionPresetLabel: (n: number) => `${n}회분`,
  portionReviewOnly: '이 메뉴는 1회분 기준으로 안내해요.',
  portionBaseHint: '기본 1회분 재료량이에요.',

  textureTitle: '완성 질감',
  allergyTitle: '알레르기',
  safetyTitle: '안전 안내',
  safetyCommon: [
    '새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.',
    '1세 미만에는 꿀을 주지 마세요.',
  ] as const,
  safetySource: '질병관리청 이유식 안내를 참고했어요.',

  toddlerBiteTitle: '한입 크기 안내',
  toddlerBiteLines: [
    '보호자가 한입에 넣기 좋은 크기로 잘라 주세요.',
    '너무 단단하면 더 부드럽게 익히거나 으깨 주세요.',
  ] as const,

  elementaryUseTitle: '활용 팁',
  elementaryPrepTitle: '준비 시간',
  elementaryPrereqTitle: '미리 준비해 두면',
  elementaryKidTipTitle: '아이용 조절 팁',
  elementarySubstituteTitle: '대체 재료',
  elementaryStorageTitle: '보관',
  elementaryReheatTitle: '재가열',
  elementaryTimeTotal: (prep: number, cook: number) => `준비 ${prep}분 · 조리 ${cook}분 (총 ${prep + cook}분)`,
  schoolMorningLabel: '등교 전 아침',
  lunchboxLabel: '간단 도시락',
  snackLabel: '간식',
  breakfastLabel: '아침 식사',
  lunchLabel: '점심 식사',
  dinnerLabel: '저녁 식사',
} as const;

const TEXTURE_LABELS: Record<BabyFoodTexture, string> = {
  liquid: '묽은 액체',
  thin_puree: '묽게 내린 미음',
  thick_puree: '되직한 퓌레',
  mashed: '부드럽게 으깬 상태',
  soft_chunks: '무른 알갱이',
  finger_food: '손으로 집는 형태',
  family_transition: '가족 식사에 가까운 질감',
};

export function babyStageUserLabel(stage: BabyFoodStage): string {
  if (stage in BABY_FOOD_FEED_STAGE_LABELS) {
    return BABY_FOOD_FEED_STAGE_LABELS[stage as keyof typeof BABY_FOOD_FEED_STAGE_LABELS];
  }
  return '이유식';
}

export function babyTextureUserLabel(texture: BabyFoodTexture): string {
  return TEXTURE_LABELS[texture] ?? '부드러운 질감';
}

export function allergyUserLabels(tags: readonly string[]): string[] {
  return tags
    .map((tag) => BABY_FOOD_FEED_ALLERGY_LABELS[tag as keyof typeof BABY_FOOD_FEED_ALLERGY_LABELS] ?? null)
    .filter((label): label is string => Boolean(label));
}

export function resolveChildDetailContext(
  audiences: readonly string[],
): ChildDetailContext {
  if (audiences.includes('baby')) return 'baby';
  if (audiences.includes('toddler')) return 'toddler';
  if (audiences.includes('elementary')) return 'elementary';
  return 'general';
}
