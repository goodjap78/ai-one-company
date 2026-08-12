/**
 * Future shopping-affiliate slot for fridge-raid results.
 * Disabled by default — no URLs, providers, or tracking codes in repo.
 */

export type FridgeShoppingProvider = string | null;

/** Type-only — no point accrual logic is implemented. */
export type FridgeShoppingRewardPointPolicy = {
  pointsPerPurchase?: number;
  maxDailyGrants?: number;
  requiresServerConfirmation?: boolean;
};

export type FridgeShoppingConfig = {
  enabled: boolean;
  provider: FridgeShoppingProvider;
  targetUrl: string | null;
  bannerImageUrl: string | null;
  isAffiliate: boolean;
  disclosureText?: string | null;
  analyticsEventName?: string | null;
  rewardPointPolicy?: FridgeShoppingRewardPointPolicy | null;
};

import { COUPANG_PARTNERS_OFFICIAL_DISCLOSURE } from './shoppingConfig';

export const FRIDGE_SHOPPING_CONFIG: FridgeShoppingConfig = {
  enabled: true,
  provider: 'coupang',
  targetUrl: null,
  bannerImageUrl: null,
  isAffiliate: true,
  disclosureText: COUPANG_PARTNERS_OFFICIAL_DISCLOSURE,
  analyticsEventName: null,
  rewardPointPolicy: null,
};
