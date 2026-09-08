# HANKKI_ADMOB_PREVIEW_GATE_FIX_REPORT

**Date:** 2026-09-08  
**Scope:** Preview APK AdMob runtime gate — Metro `EXPO_PUBLIC_*` inline. No EAS build this step.

---

## ROOT_CAUSE

Expo/Metro inlines `EXPO_PUBLIC_*` only on **static dot references** (`process.env.EXPO_PUBLIC_QA_TOOLS`).

`admobConfig.runtimeEnv()` and `initAdMob.native.ts` passed the **whole `process.env` object**. Client code then read `env.EXPO_PUBLIC_QA_TOOLS`, which is **undefined** in the Preview APK bundle.

Gate treated Preview like production-without-gate → `isAdMobBannerEnabled() === false` → banner `null`. Coupang (unrelated path) still showed.

`EAS_BUILD_PROFILE` was also used as a test-ad fallback, but it is **not** `EXPO_PUBLIC_*` and is **not** inlined in the client JS. It cannot recover Preview.

---

## EXPO_PUBLIC_INLINE_FIX

Added `constants/admobClientEnv.ts` with static references only:

- `process.env.EXPO_PUBLIC_QA_TOOLS`
- `process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
- `process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID`
- `process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS`

`admobConfig` and `initAdMob.native` now pass this **explicit object**. They no longer pass `process.env` as a whole.

---

## PREVIEW_GATE

Preview = `EXPO_PUBLIC_QA_TOOLS === '1'` (plus `__DEV__` for local).

`isAdMobTestAdEnvironment` no longer uses `EAS_BUILD_PROFILE`.

`EAS_BUILD_PROFILE` remains only for **config-time** fail-closed (`shouldFailEasProductionWithoutAppId`).

Expected Preview client:

- `isAdMobBannerEnabled() === true`
- `shouldInitializeAdMob() === true`

---

## PREVIEW_UNIT

Preview resolve = **Google TEST adaptive banner**  
(`ca-app-pub-3940256099942544/9214589741` / `TestIds.ADAPTIVE_BANNER`).

Production unit only if `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'` **and** a real (non-sample) unit. Preview `eas.json` does not set that gate.

---

## INIT_ADMOB

`initAdMob.native.ts` uses `readClientAdMobRuntimeEnv()` + `shouldInitializeAdMob` from `admobGate` (still no eager `TestIds` load).

Preview Android: `shouldInitializeAdMob() === true`.

---

## LOAD_FAILURE_DIAGNOSTICS

Preview/QA only (`isInternalQaEnabled()` = `__DEV__` or `EXPO_PUBLIC_QA_TOOLS=1`):

- `console.warn('[AdMob QA] onAdFailedToLoad', { code, message })`
- Small on-screen `AdMob QA: …` after load fail (or `gated off` if the unit gate is closed)

Production users: no text, no reserved empty space (still `null` on fail).

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `constants/admobClientEnv.ts` | **New** — static `EXPO_PUBLIC_*` object |
| `constants/admobConfig.ts` | Stop returning `process.env`; use helper |
| `constants/admobGate.ts` | Test-ad env = `__DEV__` or `QA_TOOLS=1` only |
| `services/ads/initAdMob.native.ts` | Explicit client env, not whole `process.env` |
| `components/ads/AdMobBanner.native.tsx` | QA-only fail log + tiny debug state |
| `scripts/test-admob-production-gate.ts` | A–E + no wholesale `process.env` |
| `scripts/test-admob-banner-phase1.ts` | Static-ref + QA diagnostic asserts |
| `scripts/reports/HANKKI_ADMOB_PREVIEW_GATE_FIX_REPORT.md` | This report |

---

## TESTS

**PASS**

| Case | Result |
|------|--------|
| A. `EXPO_PUBLIC_QA_TOOLS=1` → enabled + TEST adaptive unit | PASS |
| B. production env + production gate off → banner disabled | PASS |
| C. production gate on + real IDs → production unit | PASS |
| D. iOS → banner disabled / init off | PASS |
| E. Preview init → `shouldInitializeAdMob === true` | PASS |
| `EAS_BUILD_PROFILE=preview` alone → **not** test ads | PASS |
| `npm run test:admob-production-gate` | PASS |
| `npm run test:admob-banner-phase1` | PASS |

---

## WEB_EXPORT

**PASS** — `npx expo export --platform web` exit 0  
Temp output: `%TEMP%\hankki-admob-preview-gate-web-export` (not committed)

---

## NEEDS_NEW_PREVIEW_BUILD

**YES**

Metro inlines `EXPO_PUBLIC_*` at bundle time. The current device APK still has the old `process.env` pass. This fix is not on that APK until a new Preview EAS build.

---

## RESULT

**PASS** — static/code + web export. Device confirm needs the next Preview APK.

**Not done this step:** EAS build, commit, device QA.
