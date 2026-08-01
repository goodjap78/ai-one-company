/**
 * Sprint 46-C — unified content catalog (recipes + combos).
 */
import { HANKKI_RECIPES } from '../recipes/hankkiRecipes';
import { CONVENIENCE_COMBOS } from './combos';
import { buildContentCatalogIndex } from './index/buildContentCatalogIndex';

export const HANKKI_CONTENT_ITEMS = [...HANKKI_RECIPES, ...CONVENIENCE_COMBOS];

export const HANKKI_CONTENT_CATALOG = buildContentCatalogIndex(HANKKI_CONTENT_ITEMS);
