/**
 * Local convenience combo favorites — separate from recipe favorites.
 * Structured for future account sync without changing storage shape.
 */
export type ConvenienceFavoriteRecord = {
  comboId: string;
  savedAt: string;
};

export type ConvenienceFavoritesSnapshot = {
  version: 1;
  items: ConvenienceFavoriteRecord[];
};
