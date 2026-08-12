import type { MenuItem } from '../../types/recommendation';
import { getMenuById } from '../recipe/mockRecipeDetails';

/**
 * Product Decision #002 — future 반찬 pairing after MAIN is accepted.
 * Not wired to UI in MVP.
 */
export function getRecommendedSides(mainMenuId: string): MenuItem[] {
  const main = getMenuById(mainMenuId);
  if (!main?.recommendedSides?.length) return [];

  return main.recommendedSides
    .map((id) => getMenuById(id))
    .filter((menu): menu is MenuItem => menu !== null && menu.type === 'SIDE');
}

/** @deprecated Use `getRecommendedSides` */
export const getRelatedSideDishes = getRecommendedSides;
