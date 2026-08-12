import type { RecipeTagId } from '../../recipes/types';
import type { MenuItem } from '../../types/recommendation';

export function inferDefaultMenuTags(
  menu: Pick<MenuItem, 'cookTime' | 'mode' | 'mealTime' | 'type' | 'badges'>,
): RecipeTagId[] {
  const tags: RecipeTagId[] = [];

  if (menu.cookTime <= 20) tags.push('quick');
  if (menu.mode === 'delivery') tags.push('budget');
  if (menu.mealTime.includes('LATE_NIGHT')) tags.push('late_night');
  if (menu.type === 'MAIN') tags.push('family');

  for (const badge of menu.badges) {
    if (badge.type === 'family') tags.push('family');
  }

  return [...new Set(tags)];
}

export function attachMenuTags<T extends Omit<MenuItem, 'tags'>>(menu: T): MenuItem {
  return {
    ...menu,
    tags: inferDefaultMenuTags(menu),
  };
}
