/**
 * Sprint 63-E live verification — reports field presence only, no secrets/URLs.
 */
import path from 'node:path';
import { getDefaultCoupangPartnersClient } from '../server/shopping/coupangPartnersClient';

const APP_ROOT = path.resolve(__dirname, '..');
const KEYWORDS = ['대파', '양파', '계란', '돼지고기', '고추장'];

type KeywordReport = {
  keyword: string;
  httpSuccess: boolean;
  productCount: number;
  hasTitle: boolean;
  hasImage: boolean;
  hasPrice: boolean;
  hasProductUrl: boolean;
  hasAffiliateUrl: boolean;
  errorCode?: string;
  sampleTitle?: string;
};

async function main(): Promise<void> {
  const client = getDefaultCoupangPartnersClient(APP_ROOT);
  if (!client) {
    console.error('BLOCKED: credentials not configured');
    process.exit(1);
  }

  const reports: KeywordReport[] = [];

  for (const keyword of KEYWORDS) {
    const result = await client.searchProductsByKeyword(keyword, 3);
    if (!result.ok) {
      reports.push({
        keyword,
        httpSuccess: false,
        productCount: 0,
        hasTitle: false,
        hasImage: false,
        hasPrice: false,
        hasProductUrl: false,
        hasAffiliateUrl: false,
        errorCode: result.error.code,
      });
      continue;
    }

    const products = result.products;
    const first = products[0];
    reports.push({
      keyword,
      httpSuccess: true,
      productCount: products.length,
      hasTitle: products.every((p) => p.title.trim().length > 0),
      hasImage: products.some((p) => Boolean(p.imageUrl?.trim())),
      hasPrice: products.some((p) => p.price != null && p.price > 0),
      hasProductUrl: products.every((p) => p.productUrl.trim().length > 0),
      hasAffiliateUrl: products.some((p) => Boolean(p.affiliateUrl?.trim())),
      sampleTitle: first ? first.title.slice(0, 50) : undefined,
    });
  }

  for (const r of reports) {
    console.log(
      JSON.stringify({
        keyword: r.keyword,
        httpSuccess: r.httpSuccess,
        productCount: r.productCount,
        hasTitle: r.hasTitle,
        hasImage: r.hasImage,
        hasPrice: r.hasPrice,
        hasProductUrl: r.hasProductUrl,
        hasAffiliateUrl: r.hasAffiliateUrl,
        errorCode: r.errorCode ?? null,
        sampleTitle: r.sampleTitle ?? null,
      }),
    );
  }

  const allOk = reports.every((r) => r.httpSuccess && r.productCount > 0);
  process.exit(allOk ? 0 : 1);
}

void main();
