/**
 * Sprint 63-D — provider-agnostic shopping product model.
 * UI must not depend on Coupang-specific response shapes.
 */

export type ShoppingMerchant = string;

export type ShoppingProduct = {
  id: string;
  title: string;
  imageUrl?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  productUrl: string;
  affiliateUrl?: string | null;
  merchant?: ShoppingMerchant | null;
  /** Search keyword used to retrieve this product. */
  keyword: string;
  isAffiliate: boolean;
};

export type ProductSearchRequest = {
  ingredientName: string;
  shoppingKeyword: string;
  matchKey: string;
  amountText?: string;
};

export type ShoppingProductSearchStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'disabled';

export type IngredientProductResult = {
  request: ProductSearchRequest;
  status: ShoppingProductSearchStatus;
  products: ShoppingProduct[];
  errorMessage?: string;
};
