/**
 * Sprint 63-D — affiliate link foundation QA.
 * Run: npm run test:affiliate-link-foundation
 */
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { createAffiliateLink } from '../services/shopping/affiliateLinkService';
import {
  canOpenShoppingProduct,
  resolveOutboundProductUrl,
} from '../services/shopping/resolveOutboundProductUrl';
import type { ShoppingProduct } from '../types/shoppingProduct';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => console.log(`✅ ${name}`))
        .catch((error) => {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ ${name}: ${message}`);
        });
      return;
    }
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

const baseProduct: ShoppingProduct = {
  id: 'p1',
  title: '양파 1kg',
  productUrl: 'https://example.com/product/onion',
  affiliateUrl: 'https://example.com/affiliate/onion',
  keyword: '양파',
  isAffiliate: true,
};

console.log('Sprint 63-D affiliate link foundation QA — start\n');

run('Scenario C — affiliateUrl preferred', () => {
  const url = resolveOutboundProductUrl(baseProduct);
  assert(url === baseProduct.affiliateUrl, 'affiliate first');
  assert(canOpenShoppingProduct(baseProduct), 'can open');
});

run('Scenario D — productUrl fallback when affiliate missing', () => {
  const product: ShoppingProduct = {
    ...baseProduct,
    affiliateUrl: null,
    isAffiliate: false,
  };
  assert(resolveOutboundProductUrl(product) === product.productUrl, 'productUrl fallback');
});

run('Scenario D — affiliateOnly blocks productUrl', () => {
  const prev = SHOPPING_CONFIG.affiliateOnly;
  SHOPPING_CONFIG.affiliateOnly = true;
  const product: ShoppingProduct = {
    ...baseProduct,
    affiliateUrl: null,
  };
  assert(resolveOutboundProductUrl(product) === null, 'no fallback when affiliateOnly');
  SHOPPING_CONFIG.affiliateOnly = prev;
});

run('Scenario B — missing price does not break outbound resolve', () => {
  const product: ShoppingProduct = {
    ...baseProduct,
    price: undefined,
    originalPrice: null,
  };
  assert(resolveOutboundProductUrl(product) !== null, 'outbound still resolves');
});

run('createAffiliateLink does not client-transform URLs', async () => {
  const link = await createAffiliateLink('https://example.com/p');
  assert(link === null, 'no client transform — use API product URLs');
});

run('Scenario E — disclosure configured when affiliate enabled', () => {
  if (SHOPPING_CONFIG.affiliateEnabled) {
    assert(Boolean(SHOPPING_CONFIG.affiliateDisclosureText?.trim()), 'disclosure set');
  } else {
    assert(SHOPPING_CONFIG.affiliateDisclosureText === null, 'disclosure null');
  }
});

run('Scenario F — disclosure can be injected via config', () => {
  const prev = SHOPPING_CONFIG.affiliateDisclosureText;
  SHOPPING_CONFIG.affiliateDisclosureText = 'Official disclosure placeholder';
  assert(SHOPPING_CONFIG.affiliateDisclosureText?.trim().length > 0, 'disclosure set');
  SHOPPING_CONFIG.affiliateDisclosureText = prev;
});

run('Scenario I — blank URL candidates rejected', () => {
  const blankProduct: ShoppingProduct = {
    ...baseProduct,
    productUrl: '',
    affiliateUrl: '',
  };
  assert(resolveOutboundProductUrl(blankProduct) === null, 'blank urls');
  assert(!canOpenShoppingProduct(blankProduct), 'cannot open blank');
});

setTimeout(() => {
  console.log('\nSprint 63-D affiliate link foundation QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — affiliate link foundation');
}, 200);
