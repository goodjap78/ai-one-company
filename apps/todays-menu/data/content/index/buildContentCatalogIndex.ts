import type { Recipe } from '../../recipes/types';
import type { CollectionId, ContentBase, ContentType } from '../types/contentBase';

export type ContentCatalogIndex = {
  byId: Map<string, ContentBase>;
  byCollection: Map<CollectionId, Set<string>>;
  byType: Map<ContentType, Set<string>>;
};

export function recipeToContentBase(recipe: Recipe): ContentBase {
  return {
    id: recipe.id,
    contentType: recipe.contentType,
    collectionIds: recipe.collectionIds,
    title: recipe.name,
    tags: recipe.tags,
    status: 'published',
  };
}

function toContentBase(entry: ContentBase | Recipe): ContentBase {
  if ('name' in entry && 'contentType' in entry) {
    return recipeToContentBase(entry as Recipe);
  }
  return entry as ContentBase;
}

/** Build O(n) catalog indexes from content records or production recipes. */
export function buildContentCatalogIndex(
  contents: ReadonlyArray<ContentBase | Recipe>,
): ContentCatalogIndex {
  const byId = new Map<string, ContentBase>();
  const byCollection = new Map<CollectionId, Set<string>>();
  const byType = new Map<ContentType, Set<string>>();

  for (const raw of contents) {
    const item = toContentBase(raw);

    if (byId.has(item.id)) {
      throw new Error(`buildContentCatalogIndex: duplicate content id "${item.id}"`);
    }

    byId.set(item.id, item);

    let typeSet = byType.get(item.contentType);
    if (!typeSet) {
      typeSet = new Set<string>();
      byType.set(item.contentType, typeSet);
    }
    typeSet.add(item.id);

    for (const collectionId of item.collectionIds) {
      let collectionSet = byCollection.get(collectionId);
      if (!collectionSet) {
        collectionSet = new Set<string>();
        byCollection.set(collectionId, collectionSet);
      }
      collectionSet.add(item.id);
    }
  }

  return { byId, byCollection, byType };
}

export function getContentById(index: ContentCatalogIndex, id: string): ContentBase | undefined {
  return index.byId.get(id);
}

export function getContentIdsByCollection(
  index: ContentCatalogIndex,
  collectionId: CollectionId,
): Set<string> {
  return index.byCollection.get(collectionId) ?? new Set<string>();
}

export function getContentIdsByType(
  index: ContentCatalogIndex,
  contentType: ContentType,
): Set<string> {
  return index.byType.get(contentType) ?? new Set<string>();
}
