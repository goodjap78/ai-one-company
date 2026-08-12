import { SHOPPING_CONFIG } from '../../constants/shoppingConfig';

/**
 * Affiliate link transformation — interface only until official provider spec is wired.
 * Returns null when affiliate is disabled or provider is unavailable.
 *
 * SECURITY: Do not embed partner keys or signing logic in the client.
 */
export async function createAffiliateLink(productUrl: string): Promise<string | null> {
  const trimmed = productUrl.trim();
  if (!trimmed) return null;
  if (!SHOPPING_CONFIG.affiliateEnabled) return null;

  // Provider unavailable — no client-side URL transformation.
  void SHOPPING_CONFIG.provider;
  return null;
}

export function isAffiliateLinkAvailable(): boolean {
  return SHOPPING_CONFIG.affiliateEnabled && Boolean(SHOPPING_CONFIG.provider);
}
