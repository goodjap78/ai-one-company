import type { PantryItem, PantrySnapshot, RegisterPantryInput } from '../../types/pantry';
import type { RecommendationContext } from '../../types/preference';
import type { MenuItem } from '../../types/recommendation';
import { regenerateGroceryList } from '../grocery';
import { resolveIngredient } from '../ingredient';
import { buildPantryMatchIndex } from './buildPantryMatchIndex';
import { buildPantrySnapshotFromStore } from './buildPantrySnapshot';
import {
  clearPantryStore,
  PANTRY_STORAGE_KEY,
  readPantryStore,
  removePantryItem,
  upsertPantryItem,
} from './pantryStorage';

export { PANTRY_STORAGE_KEY } from './pantryStorage';

export async function getPantry(): Promise<PantrySnapshot> {
  const store = await readPantryStore();
  return buildPantrySnapshotFromStore(store);
}

export async function registerPantryIngredient(
  input: RegisterPantryInput,
): Promise<PantryItem> {
  const store = await upsertPantryItem(input.name, input.iconKey);
  await regenerateGroceryList();

  const { canonicalName } = resolveIngredient(input.name);
  return (
    store.items.find((item) => item.normalizedName === canonicalName) ??
    store.items[store.items.length - 1]
  );
}

export async function removePantryIngredient(id: string): Promise<void> {
  await removePantryItem(id);
  await regenerateGroceryList();
}

export async function clearPantry(): Promise<PantrySnapshot> {
  const store = await clearPantryStore();
  await regenerateGroceryList();
  return buildPantrySnapshotFromStore(store);
}

export async function enrichRecommendationContextWithPantry(
  context: RecommendationContext,
  menus: MenuItem[],
): Promise<RecommendationContext> {
  if (!context.pantry || context.pantry.items.length === 0) {
    return context;
  }

  return {
    ...context,
    pantryMatchByMenuId: buildPantryMatchIndex(menus, context.pantry),
  };
}
