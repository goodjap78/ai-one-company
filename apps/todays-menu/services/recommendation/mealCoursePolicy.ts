import type { MenuItem } from '../../types/recommendation';
import { RECOMMENDABLE_MEAL_COURSE_TYPES } from '../../types/mealCourse';

export function isRecommendableMenu(menu: MenuItem): boolean {
  return RECOMMENDABLE_MEAL_COURSE_TYPES.includes(menu.type);
}

/** Product Decision #002 — today's recommendation is always type = MAIN. */
export function filterRecommendableMenus(menus: MenuItem[]): MenuItem[] {
  return menus.filter(isRecommendableMenu);
}
