import type { MenuItem } from '../../../types/recommendation';
import type { MealExperiencePairing } from '../../../types/mealExperience';
import { getMenuById } from '../../recipe/mockRecipeDetails';

const PAIRING_NAME_OVERRIDES: Partial<Record<string, string[]>> = {
  delivery_001: ['콜라', '치즈볼'],
  delivery_002: ['콜라', '치즈볼'],
  homemade_012: ['계란', '파김치', '우유'],
};

export function buildSuggestedPairings(menu: MenuItem): MealExperiencePairing[] {
  const fromCatalog: MealExperiencePairing[] = [];

  for (const menuId of menu.recommendedSides ?? []) {
    const side = getMenuById(menuId);
    if (side) {
      fromCatalog.push({ name: side.title, menuId: side.id });
    }
  }

  const extraNames = menu.suggestedPairingNames ?? PAIRING_NAME_OVERRIDES[menu.id] ?? [];
  const fromNames: MealExperiencePairing[] = extraNames.map((name: string) => ({ name }));

  const merged = [...fromCatalog, ...fromNames];
  const seen = new Set<string>();

  return merged.filter((pairing) => {
    const key = pairing.menuId ?? pairing.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
