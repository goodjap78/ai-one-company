/**
 * Production shopping proxy smoke — uses SHOPPING_PROXY_PRODUCTION_BASE_URL only.
 * Never prints credentials or full affiliate URLs.
 * Run: npm run test:shopping-proxy-production
 */
const BASE_URL = process.env.SHOPPING_PROXY_PRODUCTION_BASE_URL?.trim().replace(/\/$/, '');

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

function forbiddenInText(text: string): void {
  const lower = text.toLowerCase();
  assert(!lower.includes('secret_key'), 'no secret_key in response');
  assert(!lower.includes('access_key'), 'no access_key in response');
  assert(!text.includes('buildCoupangAuthorization'), 'no auth builder leak');
}

async function main(): Promise<void> {
  console.log('Sprint 64-C shopping proxy production smoke — start\n');

  if (!BASE_URL) {
    console.error(
      'SHOPPING_PROXY_PRODUCTION_BASE_URL: NOT SET — skip production live tests',
    );
    process.exit(2);
  }

  console.log('SHOPPING_PROXY_PRODUCTION_BASE_URL: SET\n');

  await run('Health GET 200', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const text = await res.text();
    forbiddenInText(text);
    assert(res.status === 200, 'status 200');
    const body = JSON.parse(text) as {
      ok?: boolean;
      coupangConfigured?: boolean;
      rateLimitMode?: string;
      rateLimitActive?: boolean;
    };
    assert(body.ok === true, 'ok true');
    assert(body.coupangConfigured === true, 'coupangConfigured true');
    assert(typeof body.rateLimitMode === 'string', 'rateLimitMode present');
    assert(typeof body.rateLimitActive === 'boolean', 'rateLimitActive present');
  });

  const keywords = ['대파', '계란', '고추장'];
  for (const keyword of keywords) {
    await run(`Search keyword: ${keyword}`, async () => {
      const res = await fetch(`${BASE_URL}/api/shopping/coupang/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, limit: 3 }),
      });
      const text = await res.text();
      forbiddenInText(text);
      assert(res.status === 200, 'status 200');
      const body = JSON.parse(text) as {
        products?: Array<{
          title?: string;
          imageUrl?: string;
          price?: number;
          productUrl?: string;
          affiliateUrl?: string;
        }>;
      };
      assert(Array.isArray(body.products) && body.products.length > 0, 'products > 0');
      const first = body.products![0]!;
      assert(typeof first.title === 'string' && first.title.length > 0, 'title');
      assert(typeof first.imageUrl === 'string' && first.imageUrl.length > 0, 'imageUrl');
      assert(typeof first.price === 'number' && first.price > 0, 'price');
      assert(
        typeof first.productUrl === 'string' && first.productUrl.includes('coupang'),
        'productUrl coupang',
      );
      assert(
        typeof first.affiliateUrl === 'string' && first.affiliateUrl.includes('coupang'),
        'affiliateUrl coupang',
      );
    });
  }

  await run('GET search → 405', async () => {
    const res = await fetch(`${BASE_URL}/api/shopping/coupang/search`);
    const text = await res.text();
    forbiddenInText(text);
    assert(res.status === 405, 'status 405');
  });

  await run('Empty keyword → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/shopping/coupang/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: '' }),
    });
    const text = await res.text();
    forbiddenInText(text);
    assert(res.status === 400, 'status 400');
  });

  await run('Oversized body → 413', async () => {
    const huge = JSON.stringify({ keyword: 'x', pad: 'a'.repeat(1100) });
    const res = await fetch(`${BASE_URL}/api/shopping/coupang/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: huge,
    });
    const text = await res.text();
    forbiddenInText(text);
    assert(res.status === 413, 'status 413');
  });

  console.log('\nSprint 64-C shopping proxy production smoke — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — shopping proxy production smoke');
}

void main();
