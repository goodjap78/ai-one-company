import type { ProxyHttpRequest, ProxyHttpResponse } from './types';

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
];

export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    if (process.env.NODE_ENV === 'production') return [];
    return DEFAULT_DEV_ORIGINS;
  }
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function applyCors(
  request: ProxyHttpRequest,
  response: ProxyHttpResponse,
  allowedOrigins: string[],
): ProxyHttpResponse {
  const origin = request.headers.origin ?? request.headers.Origin;
  if (!origin) return response;

  const allowed =
    allowedOrigins.length === 0
      ? process.env.NODE_ENV !== 'production'
      : allowedOrigins.includes(origin);

  if (!allowed) return response;

  return {
    ...response,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      Vary: 'Origin',
    },
  };
}

export function handleCorsPreflight(
  request: ProxyHttpRequest,
  allowedOrigins: string[],
): ProxyHttpResponse | null {
  if (request.method !== 'OPTIONS') return null;

  const response: ProxyHttpResponse = {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  };

  return applyCors(request, response, allowedOrigins);
}
