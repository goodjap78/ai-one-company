import path from 'node:path';
import { buildCoupangAuthorization } from '../server/shopping/coupangHmac';
import { loadShoppingProxyEnv } from '../server/shopping/loadShoppingProxyEnv';

const APP_ROOT = path.resolve(__dirname, '..');

async function main(): Promise<void> {
  const env = loadShoppingProxyEnv(APP_ROOT);
  if (!env) return;

  const keyword = encodeURIComponent('대파');
  const requestPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${keyword}&limit=3`;
  const authorization = buildCoupangAuthorization('GET', requestPath, env.accessKey, env.secretKey);

  const response = await fetch(`https://api-gateway.coupang.com${requestPath}`, {
    method: 'GET',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
  });

  const text = await response.text();
  console.log('httpStatus:', response.status);
  console.log('contentType:', response.headers.get('content-type') ?? 'none');
  console.log('bodyLength:', text.length);
  const safe = text.replace(/access-key[=][^,\s]+/gi, 'access-key=[redacted]');
  console.log('bodyPreview:', safe.slice(0, 200).replace(/\n/g, ' '));
}

void main();
