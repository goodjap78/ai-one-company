/**
 * Sprint 63-D — shopping provider + affiliate configuration.
 *
 * SECURITY: Never embed API secrets or affiliate keys in this client bundle.
 * Future Coupang/Open API credentials must live behind a server/proxy.
 */

export type ShoppingProviderId = 'coupang' | string | null;

/**
 * Official Coupang Partners disclosure (Coupang Partners program guidance).
 * Set affiliateDisclosureText to this value when affiliateEnabled is true.
 */
export const COUPANG_PARTNERS_OFFICIAL_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

export type ShoppingConfig = {
  /** Master switch for product search / adapter (false = no API calls). */
  productProviderEnabled: boolean;
  provider: ShoppingProviderId;
  affiliateEnabled: boolean;
  /** When true, outbound navigation requires affiliateUrl (no raw productUrl fallback). */
  affiliateOnly: boolean;
  purchaseCtaEnabled: boolean;
  purchaseCtaLabel: string;
  purchaseCtaDisabledHint: string;
  /** Affiliate disclosure — null hides until legal copy is approved. */
  affiliateDisclosureText: string | null;
  maxProductsPerIngredient: number;
  /** Max parallel product searches per screen. */
  maxConcurrentSearches: number;
};

export const SHOPPING_CONFIG: ShoppingConfig = {
  productProviderEnabled: true,
  provider: 'coupang',
  affiliateEnabled: true,
  affiliateOnly: false,
  purchaseCtaEnabled: true,
  purchaseCtaLabel: '선택한 재료 상품 보기',
  purchaseCtaDisabledHint: '상품 연결 준비 중',
  affiliateDisclosureText: COUPANG_PARTNERS_OFFICIAL_DISCLOSURE,
  maxProductsPerIngredient: 3,
  maxConcurrentSearches: 2,
};

/** Fridge matchKeys deselected by default on shopping screen (Sprint 63-C). */
export const COMMON_STAPLE_MATCH_KEYS: readonly string[] = [
  'salt',
  'pepper',
  'cooking_oil',
  'water',
  'sugar',
];

export type ShoppingListMode = 'all' | 'missing';

export function parseShoppingListMode(value: string | undefined | null): ShoppingListMode {
  if (value === 'missing') return 'missing';
  return 'all';
}
