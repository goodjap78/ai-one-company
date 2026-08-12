/**
 * Sprint 64-B — shopping proxy security QA.
 * Run: npm run test:shopping-proxy-security
 */
import fs from 'node:fs';
import path from 'node:path';
import { createShoppingProxyContextForTests } from '../server/shopping/http/context';
import {
  dispatchShoppingProxyRequest,
  SHOPPING_PROXY_PATHS,
} from '../server/shopping/http/dispatchShoppingProxyRequest';
import { SHOPPING_PROXY_MAX_BODY_BYTES } from '../server/shopping/http/constants';
import { NoOpShoppingCache } from '../server/shopping/http/cache';

const APP_ROOT = path.resolve(__dirname, '..');

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
  console.log('Sprint 64-B shopping proxy security QA — start\n');

  const throwingClient = {
    searchProductsByKeyword: async () => {
      throw new Error('internal_stack_trace_should_not_leak');
    },
  };

  const context = createShoppingProxyContextForTests({
    appRoot: APP_ROOT,
    cache: new NoOpShoppingCache(),
    isCoupangConfigured: () => true,
    getCoupangClient: () => throwingClient,
  });

  await run('D — oversized body → 413', async () => {
    const huge = JSON.stringify({ keyword: 'x', pad: 'a'.repeat(SHOPPING_PROXY_MAX_BODY_BYTES) });
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: huge,
    });
    assert(res.status === 413, 'status 413');
    const body = res.json as { error?: string };
    assert(body.error === 'SHOPPING_PAYLOAD_TOO_LARGE', 'error code');
  });

  await run('E — empty keyword → 400', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '  ' }),
    });
    assert(res.status === 400, 'status 400');
  });

  await run('F — keyword too long → 400', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '가'.repeat(101) }),
    });
    assert(res.status === 400, 'status 400');
  });

  await run('G — limit too large → clamp to 5', async () => {
    let seenLimit = 0;
    const spyClient = {
      searchProductsByKeyword: async (_keyword: string, limit: number) => {
        seenLimit = limit;
        return { ok: true as const, products: [] };
      },
    };
    const spyContext = createShoppingProxyContextForTests({
      appRoot: APP_ROOT,
      cache: new NoOpShoppingCache(),
      isCoupangConfigured: () => true,
      getCoupangClient: () => spyClient,
    });
    const res = await dispatchShoppingProxyRequest(spyContext, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '양파', limit: 99 }),
    });
    assert(res.status === 200, 'status 200');
    assert(seenLimit === 5, 'limit clamped to 5');
  });

  await run('I — server error → no stack leak', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '계란', limit: 1 }),
    });
    assert(res.status === 500, 'status 500');
    const serialized = JSON.stringify(res.json);
    assert(!serialized.includes('internal_stack_trace'), 'no stack in json');
    assert(!serialized.includes('should_not_leak'), 'no raw error message');
  });

  await run('J — secrets not in health response', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'GET',
      pathname: SHOPPING_PROXY_PATHS.health,
      headers: {},
    });
    const serialized = JSON.stringify(res.json);
    assert(!serialized.includes('COUPANG_PARTNERS'), 'no env key names');
    assert(!serialized.includes('signature'), 'no signature');
    assert(!serialized.includes('Authorization'), 'no auth header');
  });

  await run('Security — no secret in client shopping paths', () => {
    const forbidden = ['COUPANG_PARTNERS_SECRET_KEY', 'buildCoupangAuthorization'];
    const scanRoots = ['services/shopping', 'hooks', 'components/shopping', 'api'];
    for (const rel of scanRoots) {
      const dir = path.join(APP_ROOT, rel);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir, { recursive: true }) as string[];
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
        const full = path.join(dir, file);
        const text = fs.readFileSync(full, 'utf8');
        for (const token of forbidden) {
          assert(!text.includes(token), `${token} not in ${rel}/${file}`);
        }
      }
    }
  });

  console.log('\nSprint 64-B shopping proxy security QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — shopping proxy security');
}

void main();
