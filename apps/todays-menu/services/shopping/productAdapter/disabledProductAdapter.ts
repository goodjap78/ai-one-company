import type { ShoppingProductAdapter } from './types';

/**
 * Default adapter while no product provider is configured.
 * Never returns synthetic / placeholder products.
 */
export const disabledProductAdapter: ShoppingProductAdapter = {
  availability: 'disabled',
  async searchProducts() {
    return [];
  },
};
