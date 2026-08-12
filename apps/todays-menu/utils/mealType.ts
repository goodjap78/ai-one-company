import type { MealType } from '../types/home';

export function getCurrentMealType(date = new Date()): MealType {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'late_night';
}

export function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    late_night: '야식',
  };
  return labels[mealType];
}
