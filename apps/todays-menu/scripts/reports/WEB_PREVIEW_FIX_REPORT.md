# WEB_PREVIEW_FIX_REPORT

Date: 2026-09-01  
Scope: Expo web preview — AdMob web-only bypass (no native changes)

---

## ROOT_CAUSE

`react-native-google-mobile-ads` was pulled into the **web** Metro graph via:

1. `components/ads/AdMobBanner.tsx` — top-level `import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'`
2. `services/ads/initAdMob.ts` — imported from `app/_layout.tsx` and `require('react-native-google-mobile-ads')` at module scope

On web, that package resolves to native codegen (`codegenNativeComponent`), which does not exist in the browser bundle → **web bundling failed**.

---

## FILES_CHANGED

| Action | Path |
|---|---|
| **Added** | `components/ads/AdMobBanner.native.tsx` — original Android AdMob banner (`BannerAd`, gate, NPA, failure hide) |
| **Added** | `components/ads/AdMobBanner.web.tsx` — returns `null`; **no** `react-native-google-mobile-ads` import |
| **Removed** | `components/ads/AdMobBanner.tsx` — single-file import caused web graph leak |
| **Added** | `services/ads/initAdMob.native.ts` — lazy `require('react-native-google-mobile-ads')` inside `initAdMob()` |
| **Added** | `services/ads/initAdMob.web.ts` — no-op `initAdMob()` |
| **Removed** | `services/ads/initAdMob.ts` |
| **Updated** | `scripts/test-admob-banner-phase1.ts` — asserts `.native.tsx` / `.web.tsx` split |
| **Updated** | `scripts/test-admob-production-gate.ts` — reads `.native.ts` / `.native.tsx` paths |

**Unchanged imports (Metro resolves platform extensions):**

- `components/home/HomeScreen.tsx` → `import { AdMobBanner } from '../ads/AdMobBanner'`
- `app/_layout.tsx` → `import { initAdMob } from '../services/ads/initAdMob'`

`constants/admobConfig.ts` still imports `TestIds` from `react-native-google-mobile-ads` but is only consumed from **native** AdMob paths (`.native.tsx`), not from web stubs.

---

## WEB_ADMOB_BEHAVIOR

| Item | Web behavior |
|---|---|
| `AdMobBanner` | Returns `null` — no placeholder, no reserved ad height |
| `initAdMob()` | No-op |
| `react-native-google-mobile-ads` | **Not** in web bundle |

---

## NATIVE_ADMOB_PRESERVED

| Check | Result |
|---|---|
| `npx tsx scripts/test-admob-banner-phase1.ts` | **PASS** |
| `npx tsx scripts/test-admob-production-gate.ts` | **PASS** |
| Android banner logic | Unchanged in `.native.tsx` (gate, NPA, adaptive banner, hide on failure) |
| SDK init | Unchanged in `.native.ts` (one-shot guard, lazy require, gate-aware) |
| Package / config plugin | Not removed |
| Home mount order | AdMob still after Coupang banner |

**Android/iOS native code paths: no functional change.**

---

## WEB_BUNDLE

| Command | Result |
|---|---|
| `npx expo start --web --port 8090` | **PASS** — `Web Bundled 2048ms` (2322 modules), HTTP **200** |
| `npx expo export --platform web` | **PASS** — exit 0, `dist/_expo/static/js/web/entry-*.js` (4.81 MB) |

**Grep on exported web JS:**

| Pattern | In bundle? |
|---|---|
| `google-mobile-ads` | **No** |
| `codegenNativeComponent` | **No** |
| `BannerAd` | **No** |
| `HomePurposeCards` | **Yes** |
| Weekly routes (`baby-food-week`, `toddler-meals-week`, `elementary-breakfast-week`, `elementary-dinner-week`) | **Yes** |
| Tab shell (`tabBarIcon`) | **Yes** |

---

## HOME_RENDER

**Dev server:** `http://localhost:8090` — HTML shell + JS bundle served (200).

**Bundle includes home UI graph (static verification):**

- `HomePurposeCards` — purpose tabs (today / kids / weekly)
- `HomePurposeSubPanel`, `HomeFeatureCards`
- `MealTimeSlotTabs`, `TodayMealCard`, `AlternativeMealsRow`
- Bottom tab layout (`tabBarIcon`)
- Weekly plan route modules

**Runtime visual QA:** Automated browser MCP was unavailable in this session. Static + dev-server evidence indicates home and weekly screens are bundled and servable. Manual spot-check at `http://localhost:8090` recommended for final pixel QA.

| UI area | Static evidence |
|---|---|
| HomePurposeCards | Component in bundle |
| 오늘 뭐 먹지? / 아이 뭐 먹이지? / 일주일 식단 | Via `HOME_PURPOSES` + `HomePurposeCards` (purpose ids `today`, `kids`, `weekly` in bundle) |
| 추천 메뉴 | `TodayMealCard`, `AlternativeMealsRow` in bundle |
| 하단 navigation | `tabBarIcon` + `(tabs)/_layout` in graph |
| Weekly plan screens | Route modules present in bundle |

---

## RESULT

**PASS**

Web preview unblocked. AdMob remains fully wired on native; web uses platform stubs only.

---

*Next sprint: on hold per instruction.*
