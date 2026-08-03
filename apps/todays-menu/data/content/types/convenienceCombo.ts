import type { CollectionId, ContentBase, ContentStatus } from './contentBase';

export const STORE_SCOPES = ['all', 'cu', 'gs25', 'seven', 'emart24'] as const;
export type StoreScope = (typeof STORE_SCOPES)[number];

export const COMBO_KINDS = ['hack_combo', 'easy_set'] as const;
export type ComboKind = (typeof COMBO_KINDS)[number];

export type ComboItem = {
  name: string;
};

export type ConvenienceCombo = ContentBase & {
  contentType: 'combo';
  collectionIds: CollectionId[];
  storeScope: StoreScope;
  comboKind: ComboKind;
  /** 완성되는 메뉴 이름 — hack_combo에서 강조 */
  transformationName?: string;
  /** 맛의 조화·장점 또는 함께 먹기 좋은 이유 */
  whyItWorks: string;
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

/** Batch source rows — enriched at catalog load with comboKind and whyItWorks. */
export type ConvenienceComboDraft = Omit<ConvenienceCombo, 'comboKind' | 'whyItWorks'>;
