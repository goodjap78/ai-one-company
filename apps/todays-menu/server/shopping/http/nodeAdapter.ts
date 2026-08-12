import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ProxyHttpResponse } from './types';

export function sendProxyHttpResponse(
  res: ServerResponse,
  response: ProxyHttpResponse,
): void {
  const headers = { ...response.headers };
  if (response.json !== undefined) {
    headers['Content-Type'] ??= 'application/json; charset=utf-8';
  }
  res.writeHead(response.status, headers);
  if (response.json !== undefined) {
    res.end(JSON.stringify(response.json));
  } else {
    res.end();
  }
}

export function extractClientIp(req: IncomingMessage): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.socket.remoteAddress;
}

export function toProxyHttpRequest(
  req: IncomingMessage,
  pathname: string,
  bodyRaw?: string,
): {
  method: string;
  pathname: string;
  headers: Record<string, string | undefined>;
  bodyRaw?: string;
  clientIp?: string;
} {
  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = Array.isArray(value) ? value[0] : value;
  }

  return {
    method: (req.method ?? 'GET').toUpperCase(),
    pathname,
    headers,
    bodyRaw,
    clientIp: extractClientIp(req),
  };
}
