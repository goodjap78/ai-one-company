/**
 * AdMob / Google Mobile Ads — central config (Android banner phase 1).
 *
 * App ID (ca-app-pub-xxx~yyy) ≠ Ad unit ID (ca-app-pub-xxx/zzz).
 * Phase 1: runtime always uses Google official TEST banner unit IDs.
 * Production unit IDs are reserved via env names only — not wired yet.
 */
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** Google official sample App IDs (safe for test builds / plugin fallback). */
export const GOOGLE_TEST_ADMOB_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

/**
 * Build-time App ID for Expo config plugin (see app.config.js).
 * Prefer EAS env `ADMOB_ANDROID_APP_ID` (not required in JS bundle).
 * Falls back to Google test App ID so prebuild never crashes without secrets.
 */
export function resolveAndroidAdMobAppIdFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const fromEnv =
    env.ADMOB_ANDROID_APP_ID?.trim() ||
    env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim();
  return fromEnv || GOOGLE_TEST_ADMOB_APP_IDS.android;
}

/** iOS App ID for plugin only — iOS UI ads are not enabled in phase 1. */
export function resolveIosAdMobAppIdFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const fromEnv = env.ADMOB_IOS_APP_ID?.trim();
  return fromEnv || GOOGLE_TEST_ADMOB_APP_IDS.ios;
}

/**
 * Phase 1 banner unit: Google official TEST adaptive banner only.
 * Future production path (not enabled):
 *   EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS=1
 *   + EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID
 */
export function getAdMobBannerUnitId(): string {
  if (Platform.OS !== 'android') {
    return TestIds.ADAPTIVE_BANNER;
  }
  // Force test units for this implementation phase.
  return TestIds.ADAPTIVE_BANNER;
}

export function isAdMobBannerEnabled(): boolean {
  return Platform.OS === 'android';
}
