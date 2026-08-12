import { createShoppingProxyContext } from '../server/shopping/http/context';
import {
  dispatchShoppingProxyRequest,
  SHOPPING_PROXY_PATHS,
} from '../server/shopping/http/dispatchShoppingProxyRequest';

type VercelLikeRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
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

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const response = await dispatchShoppingProxyRequest(context, {
    method: (req.method ?? 'GET').toUpperCase(),
    pathname: SHOPPING_PROXY_PATHS.health,
    headers: normalizeHeaders(req.headers),
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
