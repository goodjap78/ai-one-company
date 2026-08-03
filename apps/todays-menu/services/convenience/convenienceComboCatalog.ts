import { CONVENIENCE_COMBOS } from '../../data/content/combos';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  COMBO_KINDS,
  STORE_SCOPES,
  type ComboKind,
  type StoreScope,
} from '../../data/content/types/convenienceCombo';

/** Raw tag on combo data → display filter chip. */
export const COMBO_SITUATION_TAG = {
  hearty: '든든한한끼',
  budget: '가성비',
  lateNight: '야식',
  spicy: '매운맛',
  light: '가벼운식사',
  protein: '단백질',
  dessert: '디저트',
  hangover: '해장',
} as const;

export type ComboSituationFilterId =
  | 'all'
  | keyof typeof COMBO_SITUATION_TAG;

export type ComboStoreFilterId =
  | 'all'
  | 'common'
  | StoreScope;

export type ComboSortId = 'default' | 'price_low' | 'prep_fast';

export type ComboKindFilterId = 'all' | ComboKind;

export const COMBO_KIND_FILTER_ORDER: ComboKindFilterId[] = [
  'all',
  'hack_combo',
  'easy_set',
];

export const SITUATION_FILTER_ORDER: ComboSituationFilterId[] = [
  'all',
  'hearty',
  'budget',
  'lateNight',
  'spicy',
  'light',
  'protein',
  'dessert',
  'hangover',
];

export const STORE_FILTER_ORDER: ComboStoreFilterId[] = [
  'all',
  'common',
  ...STORE_SCOPES.filter((s) => s !== 'all'),
];

const SITUATION_PRIORITY: string[] = [
  COMBO_SITUATION_TAG.hearty,
  COMBO_SITUATION_TAG.lateNight,
  COMBO_SITUATION_TAG.spicy,
  COMBO_SITUATION_TAG.budget,
  COMBO_SITUATION_TAG.light,
  COMBO_SITUATION_TAG.protein,
  COMBO_SITUATION_TAG.dessert,
  COMBO_SITUATION_TAG.hangover,
];

export function resolveAvailabilityDisclaimer(combo: ConvenienceCombo): string {
  const note = combo.availabilityNote.trim();
  if (note) return note;
  return convenienceCombosCopy.priceDisclaimer;
}

export function formatComboKindLabel(kind: ComboKind): string {
  switch (kind) {
    case 'hack_combo':
      return convenienceCombosCopy.kindHackBadge;
    case 'easy_set':
      return convenienceCombosCopy.kindEasyBadge;
    default:
      return kind;
  }
}

export function matchesComboKindFilter(
  combo: ConvenienceCombo,
  filterId: ComboKindFilterId,
): boolean {
  if (filterId === 'all') return true;
  return combo.comboKind === filterId;
}

export function countCombosByKind(): Record<ComboKind, number> {
  const counts = Object.fromEntries(
    COMBO_KINDS.map((kind) => [kind, 0]),
  ) as Record<ComboKind, number>;
  for (const combo of listAllConvenienceCombos()) {
    counts[combo.comboKind] += 1;
  }
  return counts;
}

export function summarizeAssemblyGuide(
  steps: string[],
  maxSteps = 2,
): string {
  return steps.slice(0, maxSteps).join(' → ');
}

export function listAllConvenienceCombos(): ConvenienceCombo[] {
  return CONVENIENCE_COMBOS.filter((c) => c.status === 'published');
}

export function getConvenienceComboById(id: string): ConvenienceCombo | undefined {
  return listAllConvenienceCombos().find((c) => c.id === id);
}

export function countCombosByStoreScope(): Record<StoreScope, number> {
  const counts = Object.fromEntries(
    STORE_SCOPES.map((scope) => [scope, 0]),
  ) as Record<StoreScope, number>;
  for (const combo of listAllConvenienceCombos()) {
    counts[combo.storeScope] += 1;
  }
  return counts;
}

export function countCombosBySituationTag(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tag of Object.values(COMBO_SITUATION_TAG)) {
    counts[tag] = 0;
  }
  for (const combo of listAllConvenienceCombos()) {
    for (const tag of combo.tags) {
      if (counts[tag] != null) counts[tag] += 1;
    }
  }
  return counts;
}

export function parseEstimatedPriceMin(
  range: ConvenienceCombo['estimatedPriceRange'] | unknown,
): number | null {
  if (!range || typeof range !== 'object') return null;
  const min = (range as { min?: unknown }).min;
  if (typeof min === 'number' && Number.isFinite(min)) return min;
  if (typeof min === 'string') {
    const digits = min.replace(/[^\d]/g, '');
    if (!digits) return null;
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatEstimatedPriceRange(
  range: ConvenienceCombo['estimatedPriceRange'],
): string {
  const min = parseEstimatedPriceMin(range);
  const max =
    typeof range.max === 'number' && Number.isFinite(range.max)
      ? range.max
      : min;
  if (min == null && max == null) return '';
  if (min != null && max != null && min !== max) {
    return `약 ${min.toLocaleString('ko-KR')}~${max.toLocaleString('ko-KR')}원`;
  }
  const value = min ?? max;
  return value != null ? `약 ${value.toLocaleString('ko-KR')}원` : '';
}

export function formatStoreScopeLabel(scope: StoreScope): string {
  switch (scope) {
    case 'all':
      return '편의점 공통';
    case 'cu':
      return 'CU';
    case 'gs25':
      return 'GS25';
    case 'seven':
      return '세븐일레븐';
    case 'emart24':
      return '이마트24';
    default:
      return scope;
  }
}

export function getPrimarySituationTag(combo: ConvenienceCombo): string | null {
  for (const tag of SITUATION_PRIORITY) {
    if (combo.tags.includes(tag)) return tag;
  }
  return combo.tags[0] ?? null;
}

export function situationTagToLabel(tag: string): string {
  const entry = Object.entries(COMBO_SITUATION_TAG).find(([, v]) => v === tag);
  if (!entry) return tag;
  const labels: Record<keyof typeof COMBO_SITUATION_TAG, string> = {
    hearty: '든든한 한 끼',
    budget: '가성비',
    lateNight: '야식',
    spicy: '매운맛',
    light: '가벼운 식사',
    protein: '단백질',
    dessert: '디저트',
    hangover: '해장',
  };
  return labels[entry[0] as keyof typeof COMBO_SITUATION_TAG];
}

export function matchesSituationFilter(
  combo: ConvenienceCombo,
  filterId: ComboSituationFilterId,
): boolean {
  if (filterId === 'all') return true;
  const tag = COMBO_SITUATION_TAG[filterId];
  return combo.tags.includes(tag);
}

export function matchesStoreFilter(
  combo: ConvenienceCombo,
  filterId: ComboStoreFilterId,
): boolean {
  if (filterId === 'all') return true;
  if (filterId === 'common') return combo.storeScope === 'all';
  return combo.storeScope === filterId;
}

export function filterConvenienceCombos(input: {
  combos?: ConvenienceCombo[];
  situationFilter?: ComboSituationFilterId;
  storeFilter?: ComboStoreFilterId;
  kindFilter?: ComboKindFilterId;
  favoriteIds?: Set<string>;
  favoritesOnly?: boolean;
}): ConvenienceCombo[] {
  const source = input.combos ?? listAllConvenienceCombos();
  const situation = input.situationFilter ?? 'all';
  const store = input.storeFilter ?? 'all';
  const kind = input.kindFilter ?? 'all';
  const favorites = input.favoriteIds ?? new Set<string>();

  return source.filter((combo) => {
    if (input.favoritesOnly && !favorites.has(combo.id)) return false;
    if (!matchesSituationFilter(combo, situation)) return false;
    if (!matchesStoreFilter(combo, store)) return false;
    if (!matchesComboKindFilter(combo, kind)) return false;
    return true;
  });
}

export function sortConvenienceCombos(
  combos: ConvenienceCombo[],
  sortId: ComboSortId,
): ConvenienceCombo[] {
  if (sortId === 'default') return [...combos];

  const indexed = combos.map((combo, index) => ({ combo, index }));

  if (sortId === 'price_low') {
    return indexed
      .sort((a, b) => {
        const aMin = parseEstimatedPriceMin(a.combo.estimatedPriceRange);
        const bMin = parseEstimatedPriceMin(b.combo.estimatedPriceRange);
        if (aMin == null && bMin == null) return a.index - b.index;
        if (aMin == null) return 1;
        if (bMin == null) return -1;
        if (aMin !== bMin) return aMin - bMin;
        return a.index - b.index;
      })
      .map((row) => row.combo);
  }

  if (sortId === 'prep_fast') {
    return indexed
      .sort((a, b) => {
        const aPrep = a.combo.prepTimeMinutes;
        const bPrep = b.combo.prepTimeMinutes;
        if (aPrep !== bPrep) return aPrep - bPrep;
        return a.index - b.index;
      })
      .map((row) => row.combo);
  }

  return [...combos];
}

export function findSimilarConvenienceCombos(
  combo: ConvenienceCombo,
  limit = 3,
): ConvenienceCombo[] {
  const all = listAllConvenienceCombos();
  const tagSet = new Set(combo.tags);
  const scored = all
    .filter((c) => c.id !== combo.id)
    .map((c, index) => ({
      combo: c,
      index,
      score: c.tags.filter((t) => tagSet.has(t)).length,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

  const result: ConvenienceCombo[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    if (seen.has(row.combo.id)) continue;
    seen.add(row.combo.id);
    result.push(row.combo);
    if (result.length >= limit) break;
  }
  return result;
}

export function formatComboItemsPreview(
  items: ConvenienceCombo['items'],
  maxVisible = 3,
): { visible: string[]; extraCount: number } {
  const names = items.map((item) => item.name);
  const visible = names.slice(0, maxVisible);
  const extraCount = Math.max(0, names.length - visible.length);
  return { visible, extraCount };
}
