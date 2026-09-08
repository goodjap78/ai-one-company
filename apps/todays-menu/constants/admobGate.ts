/**
 * Pure AdMob environment gate — no React Native imports (Node QA can load this).
 *
 * Production ads require BOTH:
 *   EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'
 *   and a real (non-sample) Android banner unit ID.
 *
 * Play-like releases without that pair never receive Google test units.
 */

export const GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID = '3940256099942544';

export const GOOGLE_TEST_ADMOB_APP_IDS = {
  android: `ca-app-pub-${GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID}~3347511713`,
  ios: `ca-app-pub-${GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID}~1458002511`,
} as const;

/** Same value as TestIds.ADAPTIVE_BANNER on Android. */
export const GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID =
  `ca-app-pub-${GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID}/9214589741`;

export const ADMOB_ANDROID_APP_ID_ENV = 'ADMOB_ANDROID_APP_ID';
export const ADMOB_ANDROID_BANNER_UNIT_ENV = 'EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID';
export const ADMOB_PRODUCTION_UNITS_GATE_ENV = 'EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS';
export const ADMOB_PRODUCTION_UNITS_GATE_VALUE = 'true';

export type AdMobRuntimeEnv = {
  ADMOB_ANDROID_APP_ID?: string;
  EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?: string;
  EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID?: string;
  EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS?: string;
  EXPO_PUBLIC_QA_TOOLS?: string;
  EAS_BUILD_PROFILE?: string;
  ADMOB_IOS_APP_ID?: string;
};

export type AdMobBannerResolveInput = {
  platform: string;
  env?: AdMobRuntimeEnv;
  isDev?: boolean;
};

const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10,}$/;
const ADMOB_UNIT_ID_PATTERN = /^ca-app-pub-\d{16}\/\d{10,}$/;

function readTrimmed(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function isGoogleSampleAdMobId(id: string): boolean {
  return id.includes(GOOGLE_SAMPLE_ADMOB_PUBLISHER_ID);
}

export function isPlausibleAdMobAppId(id: string): boolean {
  return ADMOB_APP_ID_PATTERN.test(id);
}

export function isPlausibleAdMobUnitId(id: string): boolean {
  return ADMOB_UNIT_ID_PATTERN.test(id);
}

export function isAdMobProductionUnitsGateOn(env: AdMobRuntimeEnv = {}): boolean {
  return readTrimmed(env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS) === ADMOB_PRODUCTION_UNITS_GATE_VALUE;
}

export function isAdMobTestAdEnvironment(
  env: AdMobRuntimeEnv = {},
  isDev = false,
): boolean {
  if (isDev) return true;
  // Client preview: EXPO_PUBLIC_QA_TOOLS only. EAS_BUILD_PROFILE is not inlined in JS.
  return readTrimmed(env.EXPO_PUBLIC_QA_TOOLS) === '1';
}

export function readConfiguredAndroidAdMobAppId(env: AdMobRuntimeEnv = {}): string | null {
  const fromEnv =
    readTrimmed(env.ADMOB_ANDROID_APP_ID) ||
    readTrimmed(env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID);
  return fromEnv || null;
}

export function resolveAndroidAdMobAppIdFromEnv(env: AdMobRuntimeEnv = {}): string {
  return readConfiguredAndroidAdMobAppId(env) || GOOGLE_TEST_ADMOB_APP_IDS.android;
}

/** Plugin-only iOS App ID. UI/init stay off; GMA still requires GADApplicationIdentifier. */
export function resolveIosAdMobAppIdFromEnv(env: AdMobRuntimeEnv = {}): string {
  return readTrimmed(env.ADMOB_IOS_APP_ID) || GOOGLE_TEST_ADMOB_APP_IDS.ios;
}

export function isAndroidAdMobAppIdProductionReady(env: AdMobRuntimeEnv = {}): boolean {
  const id = readConfiguredAndroidAdMobAppId(env);
  if (!id || isGoogleSampleAdMobId(id)) return false;
  return isPlausibleAdMobAppId(id);
}

export function readProductionAndroidBannerUnitId(env: AdMobRuntimeEnv = {}): string | null {
  const id = readTrimmed(env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID);
  if (!id || isGoogleSampleAdMobId(id) || !isPlausibleAdMobUnitId(id)) return null;
  return id;
}

export function isAdMobProductionReady(env: AdMobRuntimeEnv = {}): boolean {
  return (
    isAdMobProductionUnitsGateOn(env) &&
    isAndroidAdMobAppIdProductionReady(env) &&
    readProductionAndroidBannerUnitId(env) !== null
  );
}

/**
 * Android banner unit or null to disable.
 * iOS always null (no AdMob UI).
 */
export function resolveAdMobBannerUnitId(input: AdMobBannerResolveInput): string | null {
  if (input.platform !== 'android') return null;

  const env = input.env ?? {};

  if (isAdMobProductionUnitsGateOn(env)) {
    return readProductionAndroidBannerUnitId(env);
  }

  if (isAdMobTestAdEnvironment(env, Boolean(input.isDev))) {
    return GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID;
  }

  return null;
}

export function isAdMobBannerEnabledFor(input: AdMobBannerResolveInput): boolean {
  return resolveAdMobBannerUnitId(input) !== null;
}

export function shouldInitializeAdMob(input: AdMobBannerResolveInput): boolean {
  return isAdMobBannerEnabledFor(input);
}

export function shouldFailEasProductionWithoutAppId(env: AdMobRuntimeEnv = {}): boolean {
  return (
    readTrimmed(env.EAS_BUILD_PROFILE) === 'production' &&
    isAdMobProductionUnitsGateOn(env) &&
    !isAndroidAdMobAppIdProductionReady(env)
  );
}
