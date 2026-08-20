/**
 * Phase 1 candidate live check — 6 menus only. Does not touch catalog.
 * Run: npx tsx scripts/audit-meal-kit-phase1-candidates.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { isAcceptableMealKitProduct } from '../services/shopping/mealKit/filterMealKitProducts';
import {
  createProxySearchClient,
  loadDotEnv,
  resolveProxyBaseUrl,
} from './mealKitAudit/proxySearchCache';

const APP_ROOT = path.resolve(__dirname, '..');
const CANDIDATES = [
  { name: '밀푀유나베', keyword: '밀푀유나베 밀키트' },
  { name: '불고기전골', keyword: '불고기전골 밀키트' },
  { name: '샤브샤브', keyword: '샤브샤브 밀키트' },
  { name: '쭈꾸미볶음', keyword: '쭈꾸미볶음 밀키트' },
  { name: '해물탕', keyword: '해물탕 밀키트' },
  { name: '알탕', keyword: '알탕 밀키트' },
] as const;

async function main(): Promise<void> {
  loadDotEnv(APP_ROOT);
  const client = createProxySearchClient({ delayMs: 500, cooldownMs: 10000 });
  console.log(`Phase1 candidate check — proxy ${resolveProxyBaseUrl()}\n`);

  const rows = [];
  for (const item of CANDIDATES) {
    const products = await client.search(item.keyword, 8);
    const valid = products.filter((product) =>
      isAcceptableMealKitProduct(item.name, item.keyword, product.title),
    );
    const clear = valid.filter((product) => /밀키트|mealkit/i.test(product.title));
    rows.push({
      name: item.name,
      keyword: item.keyword,
      rawCount: products.length,
      validCount: valid.length,
      clearMealKitCount: clear.length,
      validTitles: valid.map((product) => product.title),
      rawTitles: products.map((product) => product.title),
    });
    console.log(
      `${item.name}: raw=${products.length} valid=${valid.length} clear=${clear.length}`,
    );
    valid.forEach((product) => console.log(`  + ${product.title}`));
  }

  const out = path.join(APP_ROOT, 'docs', 'meal-kit-phase1-candidate-live.json');
  fs.writeFileSync(
    out,
    JSON.stringify({ generatedAt: new Date().toISOString(), stats: client.stats(), rows }, null, 2),
    'utf8',
  );
  console.log(`\nWrote ${out}`);
  console.log(JSON.stringify(client.stats()));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
