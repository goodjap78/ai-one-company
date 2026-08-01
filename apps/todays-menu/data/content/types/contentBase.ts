/**
 * Sprint 46-B — shared content catalog identifiers.
 *
 * ID policy (new content only; existing 001–100 IDs unchanged):
 * - recipe_0101
 * - combo_0001
 * - kit_0001
 * - chain_0001
 */

export const CONTENT_TYPES = ['recipe', 'combo', 'mealkit', 'franchise'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const COLLECTION_IDS = [
  'HOME',
  'SOLO',
  'FAMILY',
  'KIDS',
  'FAST',
  'MIDNIGHT',
  'HANGOVER',
  'DIET',
  'HEALTHY',
  'PARTY',
  'CAMPING',
  'CONVENIENCE',
  'MEALKIT',
  'FRANCHISE',
  'RAINY',
  'SPRING',
  'SUMMER',
  'AUTUMN',
  'WINTER',
  'POPULAR',
  'NEW',
  'EDITOR_PICK',
] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Minimal shared catalog record — extend per contentType when needed. */
export type ContentBase = {
  id: string;
  contentType: ContentType;
  collectionIds: CollectionId[];
  title: string;
  tags: string[];
  status: ContentStatus;
};

/** Future extension points (not used in Sprint 46-B). */
export type ContentImageRef = {
  emoji?: string;
  heroImageKey?: string;
  localPath?: string;
  remoteUrl?: string | null;
};

export function isCollectionId(value: string): value is CollectionId {
  return (COLLECTION_IDS as readonly string[]).includes(value);
}

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}
