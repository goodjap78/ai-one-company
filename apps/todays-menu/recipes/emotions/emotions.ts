import type { LocalizedText, RecipeEmotionId } from '../types';

export type RecipeEmotion = {
  id: RecipeEmotionId;
  label: LocalizedText;
  description: LocalizedText;
};

/**
 * Emotion tags describe how a recipe should feel to the user,
 * not nutritional facts. Used for Hankki personality and future matching.
 */
export const RECIPE_EMOTIONS: Record<RecipeEmotionId, RecipeEmotion> = {
  warm: {
    id: 'warm',
    label: { ko: '따뜻함', en: 'Warm' },
    description: { ko: '몸과 마음이 따뜻해지는 느낌이에요.', en: 'Feels warm and soothing.' },
  },
  cozy: {
    id: 'cozy',
    label: { ko: '포근함', en: 'Cozy' },
    description: { ko: '집에서 쉬는 듯한 편안함이에요.', en: 'Soft and homey.' },
  },
  happy: {
    id: 'happy',
    label: { ko: '기쁨', en: 'Happy' },
    description: { ko: '먹고 나면 기분이 좋아져요.', en: 'Lifts your mood.' },
  },
  energetic: {
    id: 'energetic',
    label: { ko: '활력', en: 'Energetic' },
    description: { ko: '가볍게 힘을 내고 싶을 때 좋아요.', en: 'Light energy boost.' },
  },
  relaxed: {
    id: 'relaxed',
    label: { ko: '여유', en: 'Relaxed' },
    description: { ko: '천천히 즐기기 좋은 느낌이에요.', en: 'Easygoing and calm.' },
  },
  nostalgic: {
    id: 'nostalgic',
    label: { ko: '그리움', en: 'Nostalgic' },
    description: { ko: '익숙한 맛이 그리울 때 좋아요.', en: 'Reminds you of familiar flavors.' },
  },
  refreshing: {
    id: 'refreshing',
    label: { ko: '산뜻함', en: 'Refreshing' },
    description: { ko: '담백하고 깔끔한 기분이에요.', en: 'Clean and refreshing.' },
  },
  indulgent: {
    id: 'indulgent',
    label: { ko: '특별함', en: 'Indulgent' },
    description: { ko: '오늘은 나를 위한 한 끼예요.', en: 'A little treat for yourself.' },
  },
};

export function getRecipeEmotion(id: RecipeEmotionId): RecipeEmotion {
  return RECIPE_EMOTIONS[id];
}

export function getRecipeEmotionLabel(id: RecipeEmotionId, locale: 'ko' | 'en' = 'ko'): string {
  const emotion = RECIPE_EMOTIONS[id];
  return locale === 'en' && emotion.label.en ? emotion.label.en : emotion.label.ko;
}
