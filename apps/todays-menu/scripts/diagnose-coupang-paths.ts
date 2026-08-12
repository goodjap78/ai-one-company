/**
 * Path probe — HTTP status only. No credential output.
 */
import path from 'node:path';
import { buildCoupangAuthorization } from '../server/shopping/coupangHmac';
import { loadShoppingProxyEnv } from '../server/shopping/loadShoppingProxyEnv';

const APP_ROOT = path.resolve(__dirname, '..');
const BASE = 'https://api-gateway.coupang.com';

async function probePath(label: string, requestPath: string): Promise<void> {
  const env = loadShoppingProxyEnv(APP_ROOT);
  if (!env) return;

  const authorization = buildCoupangAuthorization('GET', requestPath, env.accessKey, env.secretKey);
  const response = await fetch(`${BASE}${requestPath}`, {
    method: 'GET',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
  });

  let rCode = 'n/a';
  try {
    const json = (await response.json()) as { rCode?: string };
    rCode = json.rCode ?? 'missing';
  } catch {
    rCode = 'non-json';
  }

  console.log(`${label}: http=${response.status} rCode=${rCode}`);
}

async function main(): Promise<void> {
  const keyword = encodeURIComponent('대파');
  await probePath(
    'v1+srpLinkOnly',
    `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${keyword}&limit=3&srpLinkOnly=false`,
  );
  await probePath(
    'v1',
    `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${keyword}&limit=3`,
  );
  await probePath(
    'legacy',
    `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${keyword}&limit=3`,
  );
}

void main();
