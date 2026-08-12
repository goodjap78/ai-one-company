/**
 * Coupang Partners Open API response shapes (server-only).
 * Source: affiliate_open_api v1 products/search (official Partners API).
 */

export type CoupangProductSearchItem = {
  keyword?: string;
  rank?: number;
  isRocket?: boolean;
  isFreeShipping?: boolean;
  productId: number;
  productImage?: string;
  productName: string;
  productPrice?: number;
  productUrl: string;
  categoryName?: string;
};

export type CoupangProductSearchData = {
  landingUrl?: string;
  productData?: CoupangProductSearchItem[];
};

export type CoupangApiResponse<T> = {
  rCode: string;
  rMessage?: string;
  data?: T;
};

export type CoupangClientErrorCode =
  | 'credentials_missing'
  | 'invalid_keyword'
  | 'invalid_limit'
  | 'timeout'
  | 'http_error'
  | 'api_error'
  | 'malformed_response'
  | 'network_error';

export type CoupangClientError = {
  code: CoupangClientErrorCode;
  message: string;
  status?: number;
  rCode?: string;
};
