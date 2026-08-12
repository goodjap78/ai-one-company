/**
 * Sprint 63-E — Coupang server client QA.
 * Run: npm run test:coupang-server-client
 */
import path from 'node:path';
import { buildCoupangAuthorization } from '../server/shopping/coupangHmac';
import { getDefaultCoupangPartnersClient } from '../server/shopping/coupangPartnersClient';
import { mapCoupangSearchItemToShoppingProduct } from '../server/shopping/mapCoupangProducts';
import { isShoppingProxyConfigured } from '../server/shopping/loadShoppingProxyEnv';
import {
  validateCoupangSearchInput,
  validateCoupangSearchKeyword,
} from '../server/shopping/validateSearchInput';

const APP_ROOT = path.resolve(__dirname, '..');
const LIVE_KEYWORDS = ['대파', '양파', '계란', '돼지고기', '고추장'];

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

async function main(): Promise<void> {
  console.log('Sprint 63-E Coupang server client QA — start\n');

  await run('HMAC authorization format', () => {
    const pathWithQuery =
      '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=대파&limit=3&srpLinkOnly=false';
    const auth = buildCoupangAuthorization(
      'GET',
      pathWithQuery,
      'test-access-key',
      'test-secret-key',
      '240101T000000Z',
    );
    assert(auth.includes('CEA algorithm=HmacSHA256'), 'CEA prefix');
    assert(auth.includes('access-key=test-access-key'), 'access-key header part');
    assert(auth.includes('signed-date=240101T000000Z'), 'signed-date');
    assert(auth.includes('signature='), 'signature present');
    assert(!auth.includes('test-secret-key'), 'secret not in authorization string');
  });

  await run('keyword validation', () => {
    assert(validateCoupangSearchKeyword('대파') === '대파', 'korean keyword');
    assert(validateCoupangSearchKeyword('  양파  ') === '양파', 'trim');
    assert(validateCoupangSearchKeyword('') === null, 'empty rejected');
    assert(validateCoupangSearchKeyword('a'.repeat(101)) === null, 'max length');
  });

  await run('search input validation', () => {
    const valid = validateCoupangSearchInput({ keyword: '고추장', limit: 3 });
    assert(valid?.keyword === '고추장', 'keyword');
    assert(valid?.limit === 3, 'limit');
    const capped = validateCoupangSearchInput({ keyword: '계란', limit: 99 });
    assert(capped?.limit === 10, 'limit capped at API max 10');
    assert(validateCoupangSearchInput({ keyword: '', limit: 1 }) === null, 'invalid keyword');
  });

  await run('response mapping — no fake fields', () => {
    const mapped = mapCoupangSearchItemToShoppingProduct(
      {
        productId: 12345,
        productName: '국산 대파 1kg',
        productPrice: 5900,
        productImage: 'https://ads-partners.coupang.com/image1/sample.jpg',
        productUrl: 'https://link.coupang.com/re/AFFSDP?lptag=sample',
      },
      '대파',
    );
    assert(mapped !== null, 'mapped');
    assert(mapped!.id === '12345', 'id from productId');
    assert(mapped!.title === '국산 대파 1kg', 'title');
    assert(mapped!.price === 5900, 'price');
    assert(mapped!.affiliateUrl?.includes('link.coupang.com') === true, 'affiliate url');
    assert(mapped!.isAffiliate === true, 'isAffiliate');
    assert(mapped!.merchant === 'coupang', 'merchant');
  });

  await run('response mapping — missing price/image', () => {
    const mapped = mapCoupangSearchItemToShoppingProduct(
      {
        productId: 99,
        productName: '테스트 상품',
        productUrl: 'https://link.coupang.com/re/AFFSDP?lptag=sample',
      },
      '테스트',
    );
    assert(mapped !== null, 'mapped without optional fields');
    assert(mapped!.price === null, 'price null');
    assert(mapped!.imageUrl === null, 'image null');
  });

  const liveConfigured = isShoppingProxyConfigured(APP_ROOT);
  console.log(`\nLive Coupang API configured: ${liveConfigured ? 'yes' : 'no (skipped)'}\n`);

  if (liveConfigured) {
    const client = getDefaultCoupangPartnersClient(APP_ROOT);
    assert(client !== null, 'client created');

    for (const keyword of LIVE_KEYWORDS) {
      await run(`Live keyword — ${keyword}`, async () => {
        const result = await client!.searchProductsByKeyword(keyword, 3);
        assert(result.ok, `HTTP/API success for ${keyword}`);
        if (!result.ok) return;
        const products = result.products;
        console.log(`   products returned: ${products.length}`);
        if (products.length > 0) {
          const first = products[0]!;
          assert(first.title.length > 0, `${keyword} title`);
          assert(first.productUrl.length > 0, `${keyword} url`);
          console.log(
            `   sample: title=${first.title.slice(0, 40)} price=${first.price ?? 'n/a'} affiliate=${first.isAffiliate}`,
          );
        }
      });
    }
  }

  console.log('\nSprint 63-E Coupang server client QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — coupang server client');
}

void main();
