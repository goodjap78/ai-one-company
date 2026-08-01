import type { CollectionId, ContentBase } from './contentBase';

/** Placeholder — full schema deferred to a later sprint. */
export type MealkitProduct = ContentBase & {
  contentType: 'mealkit';
  collectionIds: CollectionId[];
  brand: string;
};
