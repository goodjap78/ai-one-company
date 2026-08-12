/**
 * Outbound URL policy check on live products — no full URL output.
 */
import path from 'node:path';
import { getDefaultCoupangPartnersClient } from '../server/shopping/coupangPartnersClient';
import {
  canOpenShoppingProduct,
  resolveOutboundProductUrl,
} from '../services/shopping/resolveOutboundProductUrl';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';

const APP_ROOT = path.resolve(__dirname, '..');

async function main(): Promise<void> {
  const client = getDefaultCoupangPartnersClient(APP_ROOT);
  if (!client) process.exit(1);

  const result = await client.searchProductsByKeyword('대파', 1);
  if (!result.ok || result.products.length === 0) {
    console.log('outbound: FAIL no products');
    process.exit(1);
  }

  const product = result.products[0]!;
  const outbound = resolveOutboundProductUrl(product);
  const canOpen = canOpenShoppingProduct(product);

  console.log('hasOutbound:', outbound !== null);
  console.log('canOpen:', canOpen);
  console.log('isAffiliateTracking:', outbound?.includes('link.coupang.com') ?? false);
  console.log('affiliateOnly:', SHOPPING_CONFIG.affiliateOnly);
  console.log('affiliateEnabled:', SHOPPING_CONFIG.affiliateEnabled);

  process.exit(canOpen && outbound?.includes('link.coupang.com') ? 0 : 1);
}

void main();
