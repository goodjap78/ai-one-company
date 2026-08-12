import type { ShoppingProduct } from '../../types/shoppingProduct';

export type ProductSearchInput = {
  shoppingKeyword: string;
  ingredientName: string;
  limit?: number;
};

export type ShoppingProductAdapterAvailability = 'available' | 'disabled';

/**
 * Provider-agnostic product search contract.
 * Coupang-specific implementations must live in their own adapter file.
 */
export interface ShoppingProductAdapter {
  readonly availability: ShoppingProductAdapterAvailability;
  searchProducts(input: ProductSearchInput): Promise<ShoppingProduct[]>;
}
