import { getMasterRecipeById } from '../../recipes';
import { getDeliveryMealById } from '../../library/delivery-meals';
import { getFlagshipGoldMealById as getLibraryFlagshipGoldMealById } from '../../library/gold-meals/flagship';
import { getHankkiRecipeById } from '../../data/recipes';
import { getFlagshipGoldMealById } from '../recommendation/goldMealCatalog';
import { getAllMenus } from '../recommendation/menuCatalog';

export function resolveRecipeTitle(recipeId: string): string {
  const hankki = getHankkiRecipeById(recipeId);
  if (hankki) return hankki.name;

  const catalog = getFlagshipGoldMealById(recipeId);
  if (catalog) return catalog.title;

  const flagship = getLibraryFlagshipGoldMealById(recipeId);
  if (flagship) return flagship.title;

  const delivery = getDeliveryMealById(recipeId);
  if (delivery) return delivery.title;

  const master = getMasterRecipeById(recipeId);
  if (master) return master.title.ko;

  const menu = getAllMenus().find((item) => item.id === recipeId);
  if (menu) return menu.title;

  return '그 메뉴';
}
