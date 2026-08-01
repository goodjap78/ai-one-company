import type { CollectionId, ContentBase } from './contentBase';

/** Placeholder — full schema deferred to a later sprint. */
export type FranchiseMenu = ContentBase & {
  contentType: 'franchise';
  collectionIds: CollectionId[];
  chainName: string;
};
