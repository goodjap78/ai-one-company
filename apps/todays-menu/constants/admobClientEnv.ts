/**
 * Metro-inlined Expo public env for AdMob client runtime.
 * Must use static `process.env.EXPO_PUBLIC_*` dots — never `process.env` as an object.
 */
import type { AdMobRuntimeEnv } from './admobGate';

export function readClientAdMobRuntimeEnv(): AdMobRuntimeEnv {
  return {
    EXPO_PUBLIC_QA_TOOLS: process.env.EXPO_PUBLIC_QA_TOOLS,
    EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
    EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID:
      process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID,
    EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS:
      process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS,
  };
}
