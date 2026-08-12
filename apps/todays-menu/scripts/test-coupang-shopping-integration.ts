/**
 * Sprint 63-E — Coupang shopping integration + security audit.
 * Run: npm run test:coupang-shopping-integration
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { COUPANG_PARTNERS_OFFICIAL_DISCLOSURE } from '../constants/shoppingConfig';
import { getShoppingKeyword } from '../services/shopping/shoppingKeyword';
import { searchProductsForRequests } from '../services/shopping/searchProductsForRequests';
import { validateCoupangSearchInput } from '../server/shopping/validateSearchInput';

const APP_ROOT = path.resolve(__dirname, '..');

function loadDotEnv(): void {
  const envPath = path.join(APP_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
const CLIENT_SCAN_DIRS = [
  'hooks',
  'components/shopping',
  'services/shopping',
  'app/shopping',
  'constants/shoppingConfig.ts',
];

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

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main(): Promise<void> {
  console.log('Sprint 63-E Coupang shopping integration QA — start\n');

  await run('Keyword pipeline → proxy validation', () => {
    const keyword = getShoppingKeyword('대파');
    assert(keyword === '대파', 'shopping keyword');
    const validated = validateCoupangSearchInput({ keyword, limit: SHOPPING_CONFIG.maxProductsPerIngredient });
    assert(validated?.keyword === '대파', 'validated keyword');
    assert(validated?.limit === 3, 'default limit from config');
  });

  await run('Batch search uses live adapter when configured', async () => {
    loadDotEnv();
    const results = await searchProductsForRequests([
      {
        ingredientName: '양파',
        shoppingKeyword: '양파',
        matchKey: 'onion',
      },
    ]);
    assert(results.length === 1, 'one result row');
    if (process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim() && SHOPPING_CONFIG.productProviderEnabled) {
      assert(results[0]!.status === 'success', 'success when live configured');
      assert(results[0]!.products.length > 0, 'live products');
    } else {
      assert(results[0]!.status === 'disabled', 'disabled without API base');
      assert(results[0]!.products.length === 0, 'no fake products');
    }
  });

  await run('Official disclosure constant present', () => {
    assert(
      COUPANG_PARTNERS_OFFICIAL_DISCLOSURE.includes('쿠팡 파트너스'),
      'disclosure mentions Coupang Partners',
    );
    assert(
      COUPANG_PARTNERS_OFFICIAL_DISCLOSURE.includes('수수료를 제공받습니다'),
      'disclosure uses official phrasing',
    );
    if (SHOPPING_CONFIG.affiliateEnabled) {
      assert(Boolean(SHOPPING_CONFIG.affiliateDisclosureText?.trim()), 'disclosure enabled in config');
    }
  });

  await run('Security — no Secret Key in client bundle paths', () => {
    const forbidden = [
      'COUPANG_PARTNERS_SECRET_KEY',
      'COUPANG_PARTNERS_ACCESS_KEY',
      'api-gateway.coupang.com',
      'buildCoupangAuthorization',
    ];
    const allowedServerOnly = [
      path.join(APP_ROOT, 'services/shopping/shoppingProxyClient.ts'),
      path.join(APP_ROOT, 'services/shopping/shoppingApiConfig.ts'),
    ];

    for (const rel of CLIENT_SCAN_DIRS) {
      const target = path.join(APP_ROOT, rel);
      const files = rel.endsWith('.ts') ? [target] : listFilesRecursive(target);
      for (const file of files) {
        if (allowedServerOnly.includes(file)) continue;
        if (file.includes(`${path.sep}server${path.sep}`)) continue;
        const text = fs.readFileSync(file, 'utf8');
        for (const token of forbidden) {
          assert(!text.includes(token), `${token} not in ${path.relative(APP_ROOT, file)}`);
        }
      }
    }
  });

  await run('Security — server client not imported from hooks', () => {
    const hookPath = path.join(APP_ROOT, 'hooks/useShoppingProductResults.ts');
    const text = fs.readFileSync(hookPath, 'utf8');
    assert(!text.includes('coupangPartnersClient'), 'hook does not import server client');
    assert(!text.includes('server/shopping'), 'hook does not import server path');
  });

  await run('Security — git tracked env has no secret values', () => {
    const examplePath = path.join(APP_ROOT, '.env.example');
    const text = fs.readFileSync(examplePath, 'utf8');
    assert(text.includes('COUPANG_PARTNERS_ACCESS_KEY'), 'example names access key');
    assert(!text.match(/COUPANG_PARTNERS_SECRET_KEY=[^\s#]+/), 'no secret value in example');
  });

  console.log('\nSprint 63-E Coupang shopping integration QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — coupang shopping integration');
}

void main();
