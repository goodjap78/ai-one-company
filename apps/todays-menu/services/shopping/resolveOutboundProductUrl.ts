import type { ShoppingProduct } from '../../types/shoppingProduct';
import { SHOPPING_CONFIG } from '../../constants/shoppingConfig';

/** Outbound URL policy — affiliate first, optional productUrl fallback. */
export function resolveOutboundProductUrl(product: ShoppingProduct): string | null {
  const affiliate = product.affiliateUrl?.trim();
  const productUrl = product.productUrl?.trim();

  if (affiliate) return affiliate;

  if (SHOPPING_CONFIG.affiliateOnly) return null;
  if (productUrl) return productUrl;

  return null;
}

export function canOpenShoppingProduct(product: ShoppingProduct): boolean {
  return resolveOutboundProductUrl(product) !== null;
}
