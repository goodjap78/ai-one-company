/**
 * One-shot Google Mobile Ads SDK init (Android only).
 * Safe no-op on iOS / web / when native module is missing (Expo Go).
 */
import { Platform } from 'react-native';

let initStarted = false;

export function initAdMob(): void {
  if (Platform.OS !== 'android' || initStarted) {
    return;
  }
  initStarted = true;

  try {
    // Lazy require so Metro/web/tests without native module do not crash at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads').default as () => {
      initialize: () => Promise<unknown>;
    };
    void mobileAds()
      .initialize()
      .catch(() => {
        // Quiet failure — banner component also hides on load error.
      });
  } catch {
    // Native module unavailable (Expo Go / node tests).
  }
}

/** Test helper */
export function resetAdMobInitForTests(): void {
  initStarted = false;
}
