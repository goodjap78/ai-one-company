/**
 * Sprint 63-D / 63-E — shopping product adapter QA.
 * Run: npm run test:shopping-product-adapter
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import {
  disabledProductAdapter,
} from '../services/shopping/productAdapter/disabledProductAdapter';
import { getShoppingProductAdapter } from '../services/shopping/productAdapter/getShoppingProductAdapter';
import { searchProductsForRequests } from '../services/shopping/searchProductsForRequests';

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
  console.log('Sprint 63-D shopping product adapter QA — start\n');
  loadDotEnv();

  await run('Scenario A — adapter matches production config', async () => {
    assert(SHOPPING_CONFIG.productProviderEnabled === true, 'provider enabled');
    const adapter = getShoppingProductAdapter();
    if (process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim()) {
      assert(adapter.availability === 'available', 'adapter available when API base set');
    } else {
      assert(adapter.availability === 'disabled', 'adapter disabled without API base');
    }
  });

  await run('disabledProductAdapter direct', async () => {
    const products = await disabledProductAdapter.searchProducts({
      shoppingKeyword: '계란',
      ingredientName: '계란',
    });
    assert(products.length === 0, 'disabled adapter empty');
  });

  if (process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim()) {
    await run('Live proxy batch search', async () => {
      const results = await searchProductsForRequests([
        {
          ingredientName: '양파',
          shoppingKeyword: '양파',
          matchKey: 'onion',
        },
      ]);
      assert(results.length === 1, 'one result row');
      assert(results[0]!.status === 'success', 'success status');
      assert(results[0]!.products.length > 0, 'live products');
    });
  }

  console.log('\nSprint 63-D shopping product adapter QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — shopping product adapter');
}

void main();
