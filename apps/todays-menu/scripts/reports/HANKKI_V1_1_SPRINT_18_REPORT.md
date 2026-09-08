# HANKKI_V1_1_SPRINT_18_REPORT

**Date:** 2026-09-08  
**Scope:** Final prebuild gate — Weekly Recipe Access + AdMob Preview env inline.  
No EAS. No production Android/iOS.

**Branch:** `hankki/ai-recommendation-metadata-stabilization`

---

## WEEKLY_RECIPE_ACCESS_INCLUDED

**YES**

- Day card full `Pressable`
- `레시피 보기 ›` CTA
- Elementary breakfast/dinner → `/recipe/{recipeId}`
- Toddler breakfast/dinner → `/recipe/{recipeId}`
- QA metadata (A/B/C, reviewed, unverified) not shown
- Share PNG copy: `레시피는 한끼 앱에서 확인하세요`
- Generators unchanged

## WEEKLY_RECIPE_INDEX

**YES** — `이번 주 7개 레시피 보기` → `/weekly-recipes?source=…`  
Reloads current stored `plan.slots` on focus (regenerate sync).

## TODDLER_DETAIL_EXTRAS

**YES** — Sprint 9 user fields (prep / kid tip / substitutes / storage / reheat) render when reviewed/verified. Labels stay hidden.

---

## ADMOB_ROOT_CAUSE

Metro only inlines `process.env.EXPO_PUBLIC_*` **static dots**.  
`admobConfig` / `initAdMob` passed the whole `process.env` object, so Preview APK saw `EXPO_PUBLIC_QA_TOOLS` as undefined → banner gated off. Coupang (separate path) still showed.

## ADMOB_ENV_INLINE_FIX

**YES** — `readClientAdMobRuntimeEnv()` / `admobClientEnv.ts`:

- `process.env.EXPO_PUBLIC_QA_TOOLS`
- `process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
- `process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID`
- `process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS`

Whole `process.env` is not passed to client gates.

## PREVIEW_GATE

`EXPO_PUBLIC_QA_TOOLS === '1'` → test-ad environment.  
`EAS_BUILD_PROFILE` is not used for client runtime.

## PREVIEW_TEST_UNIT

Google official TEST adaptive banner (`TestIds.ADAPTIVE_BANNER`).  
Production units only if `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'` + real IDs.

## ADMOB_INIT

`initAdMob.native.ts` uses the same helper.  
Preview Android: `shouldInitializeAdMob === true`. iOS UI remains off.

## LOAD_FAILURE_LOGGING

Preview/QA only: `console.warn('[AdMob QA] onAdFailedToLoad', { code, message })`.  
Production UI: no debug text. Fail → hide, no crash.

---

## STATIC_QA

**PASS**

| Area | Script | Result |
|------|--------|--------|
| Home | `test-sprint-1-1-home-ux`, `test:home-final-qa` | PASS |
| Nickname | `test-nickname-onboarding` | PASS |
| Elementary weekly | `test:weekly-plan-ui` | PASS |
| Weekly share | `test:weekly-plan-share`, sprint5, sprint5-3 | PASS |
| Weekly alternate | `test-weekly-alternate-qa` | PASS |
| Toddler weekly | `test:toddler-sprint12-weekly-ui` | PASS |
| Weekly recipe access | `test:weekly-recipe-access` | PASS |
| Coupang | `test:coupang-dynamic-banner` | PASS |
| AdMob A–D | `test:admob-production-gate`, `test:admob-banner-phase1` | PASS |

Share test: stale `Share-only card-news layout` comment assert updated to `card-news` (Sprint 16 card).

## WEB_EXPORT

**PASS** — `npx expo export --platform web` exit 0  
Temp output only.

---

## COMMITS

| SHA | Message |
|-----|---------|
| `dddd5fe` | `feat(todays-menu): add weekly recipe access` |
| `831f0f8` | `fix(todays-menu): enable AdMob test banner in preview builds` |

Feature tip pushed: `831f0f85c876ccda6f473135aba3abb70b97ddce`  
This report is a follow-up docs commit on the same branch.

## REMOTE_SHA_MATCH

**YES** at feature tip (`831f0f8` == `origin` before this docs commit).  
Re-verify after this report is pushed.

## GIT_STATUS_FINAL

Working tree was **clean** after the two feature commits and first push.

---

## READY_FOR_FINAL_PREVIEW_BUILD

**YES**

## BLOCKERS

None.

## WARNINGS

- Device QA of AdMob TEST banner still needs the **next** Preview APK (current installed APK predates this fix).
- No EAS this sprint.

## RESULT

**PASS**
