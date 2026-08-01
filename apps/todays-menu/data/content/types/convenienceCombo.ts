import type { CollectionId, ContentBase } from './contentBase';

export type ConvenienceStoreId = 'cu' | 'gs25' | 'seven' | 'emart24' | 'other';

export type ComboItem = {
  name: string;
};

/** Placeholder — full schema deferred to a later sprint. */
export type ConvenienceCombo = ContentBase & {
  contentType: 'combo';
  collectionIds: CollectionId[];
  store: ConvenienceStoreId;
  items: ComboItem[];
};
