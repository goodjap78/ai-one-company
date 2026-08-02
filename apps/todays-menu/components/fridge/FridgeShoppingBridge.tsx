import { FRIDGE_SHOPPING_CONFIG } from '../../constants/fridgeShoppingConfig';

/**
 * Optional shopping slot at the bottom of fridge-raid results.
 * Renders nothing until `FRIDGE_SHOPPING_CONFIG.enabled` is true and
 * future UI wiring is added (provider, targetUrl, bannerImageUrl, etc.).
 */
export function FridgeShoppingBridge(): null {
  const config = FRIDGE_SHOPPING_CONFIG;

  if (!config.enabled) {
    return null;
  }

  if (!config.targetUrl) {
    return null;
  }

  // Future: render provider-specific banner / CTA when config is populated.
  return null;
}
