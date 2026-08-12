import {
  getHankkiPersonalGreeting,
  getHankkiTimeGreeting,
} from '../constants/HankkiMessages';
import type { MealType } from '../types/home';
import { buildHankkiGreeting } from '../services/greeting';

export type { HankkiGreeting } from '../services/greeting';

export function getTimeGreeting(mealType: MealType): string {
  return getHankkiTimeGreeting(mealType);
}

/** Sync fallback before memory loads. */
export function getChefGreeting(nickname: string, mealType: MealType): string {
  return getHankkiPersonalGreeting(nickname, mealType);
}

export { buildHankkiGreeting };
