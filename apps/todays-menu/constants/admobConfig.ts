/**
 * AdMob runtime wrappers. Gate rules live in admobGate.ts (Node-testable).
 */
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { readClientAdMobRuntimeEnv } from './admobClientEnv';
import {
  GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
  isAdMobBannerEnabledFor,
  resolveAdMobBannerUnitId,
  shouldInitializeAdMob as shouldInitializeAdMobFor,
} from './admobGate';

export {
  ADMOB_ANDROID_APP_ID_ENV,
  ADMOB_ANDROID_BANNER_UNIT_ENV,
  ADMOB_PRODUCTION_UNITS_GATE_ENV,
  ADMOB_PRODUCTION_UNITS_GATE_VALUE,
  GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
  GOOGLE_TEST_ADMOB_APP_IDS,
  isAdMobProductionReady,
  isAndroidAdMobAppIdProductionReady,
  resolveAndroidAdMobAppIdFromEnv,
  resolveIosAdMobAppIdFromEnv,
  shouldFailEasProductionWithoutAppId,
} from './admobGate';

function runtimeEnv() {
  return readClientAdMobRuntimeEnv();
}

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function getAdMobBannerUnitId(): string | null {
  const resolved = resolveAdMobBannerUnitId({
    platform: Platform.OS,
    env: runtimeEnv(),
    isDev: isDevRuntime(),
  });
  if (resolved === GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID) {
    return TestIds.ADAPTIVE_BANNER;
  }
  return resolved;
}

export function isAdMobBannerEnabled(): boolean {
  return isAdMobBannerEnabledFor({
    platform: Platform.OS,
    env: runtimeEnv(),
    isDev: isDevRuntime(),
  });
}

export function shouldInitializeAdMob(): boolean {
  return shouldInitializeAdMobFor({
    platform: Platform.OS,
    env: runtimeEnv(),
    isDev: isDevRuntime(),
  });
}
