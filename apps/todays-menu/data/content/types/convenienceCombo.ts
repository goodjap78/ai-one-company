import type { CollectionId, ContentBase, ContentStatus } from './contentBase';

export const STORE_SCOPES = ['all', 'cu', 'gs25', 'seven', 'emart24'] as const;
export type StoreScope = (typeof STORE_SCOPES)[number];

export type ComboItem = {
  name: string;
};

export type ConvenienceCombo = ContentBase & {
  contentType: 'combo';
  collectionIds: CollectionId[];
  storeScope: StoreScope;
  items: ComboItem[];
  estimatedPriceRange: { min: number; max: number };
  prepTimeMinutes: number;
  difficulty: '쉬움' | '보통';
  description: string;
  assemblyGuide: string[];
  calories: number | null;
  availabilityNote: string;
  status: ContentStatus;
};
