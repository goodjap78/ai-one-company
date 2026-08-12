import { applyCors, handleCorsPreflight } from './cors';
import type { ShoppingProxyContext } from './context';
import { shoppingErrorResponse } from './errors';
import { handleCoupangSearchRequest } from './handleCoupangSearchRequest';
import { handleHealthRequest } from './handleHealthRequest';
import type { ProxyHttpRequest, ProxyHttpResponse } from './types';

const HEALTH_PATH = '/api/health';
const SEARCH_PATH = '/api/shopping/coupang/search';

function methodNotAllowed(allowed: string): ProxyHttpResponse {
  return {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Allow: allowed,
      'Cache-Control': 'no-store',
    },
    json: shoppingErrorResponse(405, 'SHOPPING_METHOD_NOT_ALLOWED').json,
  };
}

function notFound(): ProxyHttpResponse {
  return {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    json: shoppingErrorResponse(404, 'SHOPPING_NOT_FOUND').json,
  };
}

export async function dispatchShoppingProxyRequest(
  context: ShoppingProxyContext,
  request: ProxyHttpRequest,
): Promise<ProxyHttpResponse> {
  const preflight = handleCorsPreflight(request, context.allowedOrigins);
  if (preflight) {
    return applyCors(request, preflight, context.allowedOrigins);
  }

  try {
    let response: ProxyHttpResponse;

    if (request.pathname === HEALTH_PATH) {
      if (request.method !== 'GET') {
        response = methodNotAllowed('GET');
      } else {
        response = handleHealthRequest(context);
      }
    } else if (request.pathname === SEARCH_PATH) {
      if (request.method !== 'POST') {
        response = methodNotAllowed('POST');
      } else {
        response = await handleCoupangSearchRequest(
          context,
          request.bodyRaw,
          request.clientIp,
        );
      }
    } else {
      response = notFound();
    }

    return applyCors(request, response, context.allowedOrigins);
  } catch {
    const response: ProxyHttpResponse = {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      json: shoppingErrorResponse(500, 'SHOPPING_INTERNAL_ERROR').json,
    };
    return applyCors(request, response, context.allowedOrigins);
  }
}

export const SHOPPING_PROXY_PATHS = {
  health: HEALTH_PATH,
  search: SEARCH_PATH,
} as const;
