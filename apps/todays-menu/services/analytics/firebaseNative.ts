/**
 * Optional native Firebase Analytics loader.
 * Never throws — missing native module / config is a silent no-op.
 */

type NativeLogEvent = (
  name: string,
  params: Record<string, string | number>,
) => Promise<void>;

let cachedLog: NativeLogEvent | null | undefined;

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function isFirebaseAnalyticsNativeAvailable(): boolean {
  return loadNativeLogEvent() !== null;
}

export async function logFirebaseAnalyticsEvent(
  name: string,
  params: Record<string, string | number>,
): Promise<boolean> {
  const log = loadNativeLogEvent();
  if (!log) return false;

  try {
    await log(name, params);
    return true;
  } catch (error) {
    if (isDev()) {
      console.log('[analytics] native log failed', name);
    }
    return false;
  }
}

function loadNativeLogEvent(): NativeLogEvent | null {
  if (cachedLog !== undefined) return cachedLog;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/analytics') as {
      default?: () => { logEvent?: (n: string, p: object) => Promise<void> };
      getAnalytics?: () => unknown;
      logEvent?: (analytics: unknown, n: string, p: object) => Promise<void>;
    };

    if (typeof mod.getAnalytics === 'function' && typeof mod.logEvent === 'function') {
      cachedLog = async (name, params) => {
        await mod.logEvent!(mod.getAnalytics!(), name, params);
      };
      return cachedLog;
    }

    if (typeof mod.default === 'function') {
      const analytics = mod.default();
      if (analytics && typeof analytics.logEvent === 'function') {
        cachedLog = async (name, params) => {
          await analytics.logEvent!(name, params);
        };
        return cachedLog;
      }
    }
  } catch {
    cachedLog = null;
    return null;
  }

  cachedLog = null;
  return null;
}

export function resetFirebaseNativeCacheForTests(): void {
  cachedLog = undefined;
}
