import type { ComboItem } from '../../data/content/types/convenienceCombo';
import { lookupConvenienceComponentAlias } from '../../data/content/combos/convenienceComponentCatalog';
import {
  compactIngredientName,
  inferIngredientIconCategory,
  lookupIngredientAlias,
  type IngredientIconCategory,
} from '../../data/ingredients/ingredientAliases';
import type { ConvenienceIllustrationIconKey } from '../../types/convenienceIllustrationIcon';

export type ConvenienceComboItemUi = {
  label: string;
  quantity?: string;
  /** Ingredient icon registry key (egg, kim, etc.). */
  iconKey?: string;
  /** Phase 1 convenience illustration production icon. */
  illustrationIconKey?: ConvenienceIllustrationIconKey;
  optional?: boolean;
  fallbackCategory?: IngredientIconCategory;
};

type ParsedComboItem = {
  label: string;
  quantity?: string;
  optional: boolean;
};

type ItemMatch = {
  iconKey?: string;
  categoryOnly?: IngredientIconCategory;
};

/** Convenience-specific rules — checked when catalog has no illustration/reuse. */
const COMBO_ITEM_RULES: Array<{ test: (compact: string) => boolean; match: ItemMatch }> = [
  {
    test: (n) => /컵누들|누들|국수|칼국수|비빔면/.test(n),
    match: { categoryOnly: 'grain' },
  },
  {
    test: (n) => /주먹밥|김밥/.test(n) || n === '밥',
    match: { iconKey: 'rice' },
  },
  {
    test: (n) => /반숙란|삶은계란|계란|달걀/.test(n),
    match: { iconKey: 'egg' },
  },
  {
    test: (n) => /치즈/.test(n),
    match: { iconKey: 'cheese' },
  },
  {
    test: (n) => /닭가슴살|치킨텐더|치킨너겟|닭/.test(n),
    match: { iconKey: 'chicken' },
  },
  {
    test: (n) => /소시지|핫도그/.test(n),
    match: { iconKey: 'sausage' },
  },
  {
    test: (n) => /떡볶이|떡국|순대|떡/.test(n),
    match: { iconKey: 'rice_cake' },
  },
  {
    test: (n) => /참치/.test(n),
    match: { iconKey: 'tuna' },
  },
  {
    test: (n) => /김가루|김/.test(n),
    match: { iconKey: 'seaweed' },
  },
  {
    test: (n) => /요거트|요구르트/.test(n),
    match: { iconKey: 'milk' },
  },
  {
    test: (n) => /바나나/.test(n),
    match: { iconKey: 'banana' },
  },
  {
    test: (n) => /과일/.test(n),
    match: { iconKey: 'banana' },
  },
  {
    test: (n) => /두부샐러드|두부/.test(n),
    match: { iconKey: 'tofu' },
  },
  {
    test: (n) => /어묵|오뎅/.test(n),
    match: { iconKey: 'fish_cake' },
  },
  {
    test: (n) => /버터/.test(n),
    match: { iconKey: 'butter' },
  },
  {
    test: (n) => /커피/.test(n),
    match: { categoryOnly: 'generic' },
  },
  {
    test: (n) => /케이크|아이스크림|호떡|디저트|빵/.test(n),
    match: { categoryOnly: 'processed' },
  },
  {
    test: (n) => /음료|주스/.test(n),
    match: { categoryOnly: 'generic' },
  },
  {
    test: (n) => /감자/.test(n),
    match: { iconKey: 'potato' },
  },
  {
    test: (n) => /김치/.test(n),
    match: { iconKey: 'kimchi' },
  },
  {
    test: (n) => /콩나물/.test(n),
    match: { iconKey: 'bean_sprout' },
  },
];

function parseComboItemInput(item: ComboItem): ParsedComboItem {
  let label = item.name.trim();
  let optional = item.optional ?? false;
  let quantity = item.quantity?.trim();

  if (/\(선택\)|（선택）/.test(label)) {
    optional = true;
    label = label.replace(/\(선택\)|（선택）/g, '').trim();
  }

  const qtySuffix = label.match(/(\d+)\s*개$/);
  if (!quantity && qtySuffix) {
    quantity = `${qtySuffix[1]}개`;
    label = label.replace(/\s*\d+\s*개$/, '').trim();
  }

  return { label, quantity, optional };
}

function matchComboItemRules(compact: string): ItemMatch | null {
  for (const rule of COMBO_ITEM_RULES) {
    if (rule.test(compact)) return rule.match;
  }
  return null;
}

function isNoodleLike(compact: string): boolean {
  return /컵라면|라면|컵누들|누들|우동|국수|면/.test(compact);
}

function resolveCategory(
  label: string,
  ruleMatch: ItemMatch | null,
): IngredientIconCategory {
  if (ruleMatch?.categoryOnly) return ruleMatch.categoryOnly;
  return inferIngredientIconCategory(label);
}

function resolveIconKey(
  label: string,
  compact: string,
  ruleMatch: ItemMatch | null,
): string | undefined {
  if (ruleMatch?.categoryOnly) return undefined;

  if (ruleMatch?.iconKey) return ruleMatch.iconKey;

  const aliasKey = lookupIngredientAlias(label);
  if (aliasKey) {
    if (isNoodleLike(compact) && aliasKey === 'rice_cake') return undefined;
    return aliasKey;
  }

  return undefined;
}

export function resolveConvenienceComboItem(item: ComboItem): ConvenienceComboItemUi {
  const parsed = parseComboItemInput(item);
  const catalog = lookupConvenienceComponentAlias(parsed.label);

  if (catalog?.illustrationIconKey) {
    return {
      label: parsed.label,
      quantity: parsed.quantity,
      optional: parsed.optional,
      illustrationIconKey: catalog.illustrationIconKey,
    };
  }

  if (catalog?.reuseIngredientKey) {
    return {
      label: parsed.label,
      quantity: parsed.quantity,
      optional: parsed.optional,
      iconKey: catalog.reuseIngredientKey,
    };
  }

  const compact = compactIngredientName(parsed.label);
  const ruleMatch = matchComboItemRules(compact);
  const fallbackCategory = resolveCategory(parsed.label, ruleMatch);
  const iconKey = resolveIconKey(parsed.label, compact, ruleMatch);

  return {
    label: parsed.label,
    quantity: parsed.quantity,
    optional: parsed.optional,
    iconKey,
    fallbackCategory,
  };
}

export function resolveConvenienceComboItems(items: ComboItem[]): ConvenienceComboItemUi[] {
  return items.map((item) => resolveConvenienceComboItem(item));
}

export type ComboItemLayoutMode = 'two-col' | 'three-col' | 'wrap';

export function resolveComboItemLayoutMode(count: number): ComboItemLayoutMode {
  if (count <= 2) return 'two-col';
  if (count === 3) return 'three-col';
  return 'wrap';
}

const ITEM_CARD_GAP = 8;
const PLUS_SIGN_WIDTH = 14;

/** Text chip width for 2/3-column rows inside the phone content column. */
export function resolveComboItemCardWidth(
  count: number,
  contentWidth: number,
  mode: ComboItemLayoutMode,
): number {
  if (mode === 'wrap') {
    return Math.min(105, Math.max(90, Math.floor(contentWidth / 3.2)));
  }

  const columns = mode === 'two-col' ? 2 : 3;
  const plusTotal = (columns - 1) * PLUS_SIGN_WIDTH;
  const gaps = (columns - 1) * ITEM_CARD_GAP;
  const raw = Math.floor((contentWidth - plusTotal - gaps) / columns);

  if (mode === 'two-col') {
    return Math.min(140, Math.max(120, raw));
  }
  return Math.min(105, Math.max(90, raw));
}

export const COMBO_ITEM_CARD_GAP = ITEM_CARD_GAP;
export const COMBO_ITEM_PLUS_WIDTH = PLUS_SIGN_WIDTH;
