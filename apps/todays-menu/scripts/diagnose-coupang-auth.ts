/**
 * Auth diagnostic — HTTP status / rCode only. No credentials or Authorization output.
 */
import path from 'node:path';
import { buildCoupangAuthorization, formatCoupangSignedDate } from '../server/shopping/coupangHmac';
import { COUPANG_API_BASE_URL, COUPANG_PRODUCT_SEARCH_PATH } from '../server/shopping/coupangPartnersClient';
import { loadShoppingProxyEnv } from '../server/shopping/loadShoppingProxyEnv';

const APP_ROOT = path.resolve(__dirname, '..');

async function probe(keyword: string): Promise<void> {
  const env = loadShoppingProxyEnv(APP_ROOT);
  if (!env) {
    console.log('credentials: NOT SET');
    process.exit(1);
  }

  const params = new URLSearchParams();
  params.set('keyword', keyword);
  params.set('limit', '3');
  params.set('srpLinkOnly', 'false');
  const requestPath = `${COUPANG_PRODUCT_SEARCH_PATH}?${params.toString()}`;

  const signedDate = formatCoupangSignedDate(new Date());
  const authorization = buildCoupangAuthorization(
    'GET',
    requestPath,
    env.accessKey,
    env.secretKey,
    signedDate,
  );

  console.log('signedDateFormat:', signedDate);
  console.log('method:', 'GET');
  console.log('path:', COUPANG_PRODUCT_SEARCH_PATH);
  console.log('queryKeys:', ['keyword', 'limit', 'srpLinkOnly']);
  console.log('messagePattern:', 'signedDate + METHOD + path + query');
  console.log('authHeaderFormat:', 'CEA algorithm=HmacSHA256 (no value logged)');

  const url = `${COUPANG_API_BASE_URL}${requestPath}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  });

  console.log('httpStatus:', response.status);

  const text = await response.text();
  try {
    const json = JSON.parse(text) as { rCode?: string; rMessage?: string };
    console.log('rCode:', json.rCode ?? 'missing');
    console.log('rMessage:', json.rMessage?.slice(0, 120) ?? 'missing');
  } catch {
    console.log('bodyParse:', 'non-json');
    console.log('bodyLength:', text.length);
  }
}

void probe('대파');
