/**
 * Sprint 63-E — Coupang product adapter (client → HANKKI proxy only).
 *
 * SECURITY: No Coupang credentials or HMAC logic in this bundle.
 */
import { SHOPPING_CONFIG } from '../../../constants/shoppingConfig';
import type { ShoppingProduct } from '../../../types/shoppingProduct';
import { isShoppingApiConfigured } from '../shoppingApiConfig';
import { fetchShoppingProductsFromProxy } from '../shoppingProxyClient';
import type { ShoppingProductAdapter } from './types';

function applyAffiliatePolicy(products: ShoppingProduct[]): ShoppingProduct[] {
  if (!SHOPPING_CONFIG.affiliateEnabled) {
    return products.map((product) => ({
      ...product,
      affiliateUrl: null,
      isAffiliate: false,
    }));
  }

  return products.map((product) => {
    const affiliateUrl = product.affiliateUrl?.trim() || null;
    return {
      ...product,
      affiliateUrl,
      isAffiliate: Boolean(affiliateUrl),
    };
  });
}

export const coupangProductAdapter: ShoppingProductAdapter = {
  availability: 'available',
  async searchProducts(input) {
    const requested = input.limit ?? SHOPPING_CONFIG.maxProductsPerIngredient;
    const hardCap = Math.max(
      SHOPPING_CONFIG.maxProductsPerIngredient,
      SHOPPING_CONFIG.maxMealKitSearchResults,
    );
    const limit = Math.min(Math.max(1, requested), hardCap);

    const keyword = input.shoppingKeyword.trim();
    if (!keyword) return [];

    if (!isShoppingApiConfigured()) {
      throw new Error('shopping_api_not_configured');
    }

    const products = await fetchShoppingProductsFromProxy(keyword, limit);
    return applyAffiliatePolicy(products);
  },
};

export function isCoupangProductAdapterReady(): boolean {
  return isShoppingApiConfigured();
}
