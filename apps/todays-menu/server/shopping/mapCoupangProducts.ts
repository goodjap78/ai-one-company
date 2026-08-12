import type { ShoppingProduct } from '../../types/shoppingProduct';
import type { CoupangProductSearchItem } from './coupangPartnersTypes';

function isAffiliateTrackingUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('link.coupang.com') || lower.includes('coupa.ng');
}

/**
 * Maps official Coupang search items to provider-agnostic ShoppingProduct.
 * No synthetic fields — missing API fields stay undefined/null.
 */
export function mapCoupangSearchItemToShoppingProduct(
  item: CoupangProductSearchItem,
  searchKeyword: string,
): ShoppingProduct | null {
  const title = item.productName?.trim();
  const productUrl = item.productUrl?.trim();

  if (!title || !productUrl) return null;

  const affiliateUrl = isAffiliateTrackingUrl(productUrl) ? productUrl : null;

  return {
    id: String(item.productId),
    title,
    imageUrl: item.productImage?.trim() || null,
    price:
      typeof item.productPrice === 'number' && !Number.isNaN(item.productPrice)
        ? item.productPrice
        : null,
    originalPrice: null,
    productUrl,
    affiliateUrl,
    merchant: 'coupang',
    keyword: searchKeyword,
    isAffiliate: Boolean(affiliateUrl),
  };
}

export function mapCoupangSearchItems(
  items: CoupangProductSearchItem[],
  searchKeyword: string,
): ShoppingProduct[] {
  const products: ShoppingProduct[] = [];
  for (const item of items) {
    const mapped = mapCoupangSearchItemToShoppingProduct(item, searchKeyword);
    if (mapped) products.push(mapped);
  }
  return products;
}
