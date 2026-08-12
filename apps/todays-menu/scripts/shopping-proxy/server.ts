/**
 * Sprint 64-B — local shopping proxy (long-running Node entry).
 *
 * Launch: npm run shopping-proxy
 */
import http from 'node:http';
import path from 'node:path';
import { readBoundedBody } from '../../server/shopping/http/body';
import { createShoppingProxyContext } from '../../server/shopping/http/context';
import { dispatchShoppingProxyRequest } from '../../server/shopping/http/dispatchShoppingProxyRequest';
import {
  sendProxyHttpResponse,
  toProxyHttpRequest,
} from '../../server/shopping/http/nodeAdapter';

const APP_ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.HANKKI_SHOPPING_PROXY_PORT || 4730);
const context = createShoppingProxyContext({ appRoot: APP_ROOT });

function readBody(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      const result = readBoundedBody(chunks);
      if (!result.ok) {
        sendProxyHttpResponse(res, {
          status: result.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          },
          json: result.json,
        });
        resolve(undefined);
        return;
      }
      resolve(result.raw);
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const bodyRaw =
    req.method === 'POST' ? await readBody(req, res) : undefined;
  if (req.method === 'POST' && bodyRaw === undefined && res.writableEnded) {
    return;
  }

  const proxyRequest = toProxyHttpRequest(req, url.pathname, bodyRaw);
  const response = await dispatchShoppingProxyRequest(context, proxyRequest);
  sendProxyHttpResponse(res, response);
});

server.listen(PORT, () => {
  const configured = context.isCoupangConfigured();
  console.log(`HANKKI shopping proxy listening on http://127.0.0.1:${PORT}`);
  console.log(`Coupang credentials configured: ${configured ? 'yes' : 'no'}`);
});
