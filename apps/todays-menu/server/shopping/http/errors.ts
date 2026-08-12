export type ShoppingProxyErrorCode =
  | 'SHOPPING_INVALID_REQUEST'
  | 'SHOPPING_METHOD_NOT_ALLOWED'
  | 'SHOPPING_PAYLOAD_TOO_LARGE'
  | 'SHOPPING_RATE_LIMITED'
  | 'SHOPPING_PROVIDER_UNAVAILABLE'
  | 'SHOPPING_PROVIDER_ERROR'
  | 'SHOPPING_PROVIDER_TIMEOUT'
  | 'SHOPPING_INTERNAL_ERROR'
  | 'SHOPPING_NOT_FOUND';

export function shoppingErrorResponse(
  status: number,
  error: ShoppingProxyErrorCode,
  message?: string,
): { status: number; json: { error: ShoppingProxyErrorCode; message?: string } } {
  const body: { error: ShoppingProxyErrorCode; message?: string } = { error };
  if (message) body.message = message;
  return { status, json: body };
}

export function mapCoupangClientErrorToHttp(errorCode: string): {
  status: number;
  error: ShoppingProxyErrorCode;
} {
  switch (errorCode) {
    case 'invalid_keyword':
    case 'invalid_limit':
      return { status: 400, error: 'SHOPPING_INVALID_REQUEST' };
    case 'credentials_missing':
      return { status: 503, error: 'SHOPPING_PROVIDER_UNAVAILABLE' };
    case 'timeout':
      return { status: 504, error: 'SHOPPING_PROVIDER_TIMEOUT' };
    case 'http_error':
    case 'api_error':
    case 'malformed_response':
    case 'network_error':
      return { status: 502, error: 'SHOPPING_PROVIDER_ERROR' };
    default:
      return { status: 502, error: 'SHOPPING_PROVIDER_ERROR' };
  }
}
