import { Linking, Platform } from 'react-native';
import type { ShoppingProduct } from '../../types/shoppingProduct';
import { trackShoppingEvent } from './shoppingAnalytics';
import { canOpenShoppingProduct, resolveOutboundProductUrl } from './resolveOutboundProductUrl';

function isHttpOrHttpsUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/**
 * Android 11+ package visibility: Linking.canOpenURL('https://...') often returns false
 * unless AndroidManifest <queries> lists the scheme — while Linking.openURL still works.
 * Skip the canOpen gate for http(s); keep it for custom schemes.
 */
async function canAttemptOpen(url: string): Promise<boolean> {
  if (isHttpOrHttpsUrl(url)) return true;
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

function logOutboundDev(stage: string, ok: boolean): void {
  if (!__DEV__) return;
  // Never log secrets or full tracking URLs.
  console.log(`[SHOPPING_OUTBOUND] ${stage} result=${ok ? 'success' : 'error'}`);
}

/**
 * Opens a shopping product in the system browser / external handler.
 * Never throws — returns false on invalid URL or Linking failure.
 */
export async function openShoppingProduct(product: ShoppingProduct): Promise<boolean> {
  if (__DEV__) {
    console.log('[SHOPPING_OUTBOUND] PRODUCT_CARD_PRESS');
  }

  if (!canOpenShoppingProduct(product)) {
    logOutboundDev('OUTBOUND_URL_PRESENT=false', false);
    return false;
  }

  const url = resolveOutboundProductUrl(product);
  if (!url) {
    logOutboundDev('OUTBOUND_URL_PRESENT=false', false);
    return false;
  }

  if (__DEV__) {
    console.log(
      `[SHOPPING_OUTBOUND] OUTBOUND_URL_PRESENT=true scheme=${isHttpOrHttpsUrl(url) ? 'https' : 'other'} platform=${Platform.OS}`,
    );
  }

  try {
    const canOpen = await canAttemptOpen(url);
    if (__DEV__) {
      console.log(`[SHOPPING_OUTBOUND] CAN_OPEN=${canOpen}`);
    }
    if (!canOpen) {
      logOutboundDev('OPEN_RESULT', false);
      return false;
    }

    await Linking.openURL(url);

    trackShoppingEvent('shopping_product_click', {
      productId: product.id,
      keyword: product.keyword,
      merchant: product.merchant ?? undefined,
      isAffiliate: product.isAffiliate,
    });

    logOutboundDev('OPEN_RESULT', true);
    return true;
  } catch {
    logOutboundDev('OPEN_RESULT', false);
    return false;
  }
}

/**
 * Safe open for arbitrary URL strings (tests / guards).
 */
export async function openOutboundUrl(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const canOpen = await canAttemptOpen(trimmed);
    if (!canOpen) return false;
    await Linking.openURL(trimmed);
    return true;
  } catch {
    return false;
  }
}
