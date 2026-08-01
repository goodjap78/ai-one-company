export type {
  CollectionId,
  ContentBase,
  ContentImageRef,
  ContentStatus,
  ContentType,
} from './types/contentBase';
export { COLLECTION_IDS, CONTENT_STATUSES, CONTENT_TYPES, isCollectionId, isContentType } from './types/contentBase';

export type { ConvenienceCombo, ConvenienceStoreId, ComboItem } from './types/convenienceCombo';
export type { MealkitProduct } from './types/mealkit';
export type { FranchiseMenu } from './types/franchise';

export {
  COLLECTION_REGISTRY,
  getCollectionDefinition,
  listRegisteredCollectionIds,
} from './collections/collectionRegistry';
export type { CollectionDefinition, CollectionStatus } from './collections/collectionRegistry';

export {
  buildContentCatalogIndex,
  getContentById,
  getContentIdsByCollection,
  getContentIdsByType,
  recipeToContentBase,
} from './index/index';
export type { ContentCatalogIndex } from './index/index';

export {
  HANKKI_CONTENT_CATALOG,
  HANKKI_CONTENT_ITEMS,
} from './hankkiContentCatalog';
