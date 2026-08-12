import { SHOPPING_CONFIG } from '../../../constants/shoppingConfig';
import { coupangProductAdapter, isCoupangProductAdapterReady } from './coupangProductAdapter';
import { disabledProductAdapter } from './disabledProductAdapter';
import type { ShoppingProductAdapter } from './types';

/**
 * Resolves the active product adapter from shopping config.
 */
export function getShoppingProductAdapter(): ShoppingProductAdapter {
  if (!SHOPPING_CONFIG.productProviderEnabled || !SHOPPING_CONFIG.provider) {
    return disabledProductAdapter;
  }

  if (SHOPPING_CONFIG.provider === 'coupang' && isCoupangProductAdapterReady()) {
    return coupangProductAdapter;
  }

  return disabledProductAdapter;
}

export function isShoppingProductSearchEnabled(): boolean {
  const adapter = getShoppingProductAdapter();
  return SHOPPING_CONFIG.productProviderEnabled && adapter.availability === 'available';
}
