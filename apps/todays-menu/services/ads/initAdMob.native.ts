/**
 * One-shot Google Mobile Ads SDK init (Android only).
 * Skipped on iOS and when the production/test gate has no unit to show.
 */
import { Platform } from 'react-native';
import { shouldInitializeAdMob } from '../../constants/admobGate';

let initStarted = false;

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function initAdMob(): void {
  if (
    initStarted ||
    !shouldInitializeAdMob({
      platform: Platform.OS,
      env: process.env,
      isDev: isDevRuntime(),
    })
  ) {
    return;
  }
  initStarted = true;

  try {
    // Lazy require — only resolved on native bundles.
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
