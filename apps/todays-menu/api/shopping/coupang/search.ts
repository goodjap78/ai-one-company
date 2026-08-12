import { SHOPPING_PROXY_MAX_BODY_BYTES } from '../../../server/shopping/http/constants';
import { createShoppingProxyContext } from '../../../server/shopping/http/context';
import {
  dispatchShoppingProxyRequest,
  SHOPPING_PROXY_PATHS,
} from '../../../server/shopping/http/dispatchShoppingProxyRequest';
import { shoppingErrorResponse } from '../../../server/shopping/http/errors';

type VercelLikeRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

type VercelLikeResponse = {
  status: (code: number) => VercelLikeResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  end: () => void;
};

const context = createShoppingProxyContext();

function clientIp(req: VercelLikeRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  if (Array.isArray(forwarded)) return forwarded[0]?.trim();
  return req.socket?.remoteAddress;
}

function normalizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

function serializeBody(body: unknown): string {
  if (typeof body === 'string') return body;
  if (body === undefined || body === null) return '';
  return JSON.stringify(body);
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  let bodyRaw: string | undefined;
  if (req.method === 'POST') {
    const raw = serializeBody(req.body);
    if (Buffer.byteLength(raw, 'utf8') > SHOPPING_PROXY_MAX_BODY_BYTES) {
      const err = shoppingErrorResponse(413, 'SHOPPING_PAYLOAD_TOO_LARGE');
      res.status(err.status).json(err.json);
      return;
    }
    bodyRaw = raw;
  }

  const response = await dispatchShoppingProxyRequest(context, {
    method: (req.method ?? 'GET').toUpperCase(),
    pathname: SHOPPING_PROXY_PATHS.search,
    headers: normalizeHeaders(req.headers),
    bodyRaw,
    clientIp: clientIp(req),
  });

  res.status(response.status);
  for (const [key, value] of Object.entries(response.headers)) {
    res.setHeader(key, value);
  }
  if (response.json !== undefined) {
    res.json(response.json);
  } else {
    res.end();
  }
}
