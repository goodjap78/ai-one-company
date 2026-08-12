import type { ContextMood, DiningSituation, MealGoal } from '../types/contextMemory';

export type ContextChipOption<T extends string> = {
  value: T;
  label: string;
  emoji: string;
};

export const DINING_SITUATION_CHIPS: ContextChipOption<DiningSituation>[] = [
  { value: 'alone', label: '혼자', emoji: '🙋' },
  { value: 'family', label: '가족', emoji: '👨‍👩‍👧' },
  { value: 'partner', label: '둘이', emoji: '💑' },
  { value: 'friends', label: '친구', emoji: '👥' },
  { value: 'work', label: '직장', emoji: '💼' },
];

export const MEAL_GOAL_CHIPS: ContextChipOption<MealGoal>[] = [
  { value: 'light', label: '가볍게', emoji: '🥗' },
  { value: 'filling', label: '든든하게', emoji: '🍚' },
  { value: 'quick', label: '빠르게', emoji: '⚡' },
  { value: 'warm', label: '따뜻하게', emoji: '🍲' },
  { value: 'refreshing', label: '산뜻하게', emoji: '🌿' },
];

/** Future HCME phase — mood chips (not in MVP UI). */
export const CONTEXT_MOOD_CHIPS: ContextChipOption<ContextMood>[] = [
  { value: 'good', label: '좋아요', emoji: '😊' },
  { value: 'tired', label: '피곤', emoji: '😴' },
  { value: 'stressed', label: '바쁨', emoji: '😮‍💨' },
  { value: 'sick', label: '몸살', emoji: '🤒' },
  { value: 'special', label: '특별한 날', emoji: '✨' },
];

export const CONTEXT_MEMORY_SECTION_LABELS = {
  dining: '누구와',
  goal: '오늘은',
  mood: '기분',
} as const;
