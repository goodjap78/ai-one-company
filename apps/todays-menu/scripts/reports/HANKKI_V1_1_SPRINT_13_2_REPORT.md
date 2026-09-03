# HANKKI_V1_1_SPRINT_13_2_REPORT

**Date:** 2026-09-04  
**Scope:** Version bump + adaptive icon finalize + push. No EAS build. No store submit. No new features.

---

## VERSION

**1.1.0** (`app.json` + `package.json`)

## ANDROID_VERSION_CODE

**9** (was 8)

## IOS_BUILD_NUMBER

**2** (was 1)

### EAS autoIncrement note

- `eas.json` → `cli.appVersionSource = "local"` → marketing version / versionCode / buildNumber come from local `app.json` for this RC.
- `build.production.autoIncrement = true` → on a **future EAS production** build, EAS will auto-increment **Android `versionCode` and/or iOS `buildNumber`** beyond the committed values (typically +1 from the last remote build history for that platform), while the marketing `version` (`1.1.0`) stays local unless changed.
- `preview` profile has **no** `autoIncrement`.
- This sprint’s explicit RC baseline remains **version 1.1.0 / versionCode 9 / buildNumber 2**.

---

## ICON_PNG

- Path: `assets/icon.png`
- 1024×1024, mode **RGB**, **no alpha**
- Unchanged brand lockup (full square app icon for iOS / Expo `icon`)
- **IOS_ICON_SAFE: YES**

## ADAPTIVE_ICON

- Path: `assets/adaptive-icon.png`
- 1024×1024, mode **RGBA**
- Same Hankki lockup; outer near-white padding → **transparent**
- Lockup scaled to ~**58%** of canvas and centered (OEM margin under 66% safe circle)
- **Different binary** from `icon.png` (expected)

## ADAPTIVE_SAFE_ZONE

- Opaque content outside Android 66% safe circle: **~1.31%** (antialiased orange-border corners only)
- Character / 「한끼」 bar remain inside safe area for circle / squircle crop
- **ADAPTIVE_SAFE_ZONE: PASS**

## CONFIG

- `android.adaptiveIcon.foregroundImage` = `./assets/adaptive-icon.png`
- `android.adaptiveIcon.backgroundColor` = `#FFF4EC` (matches splash brand cream; was `#FDFDFD`)

## CONFIG_RESOLVE

**PASS** (`npx expo config --type public` → version `1.1.0`, versionCode `9`, buildNumber `2`, adaptiveIcon paths/colors correct)

## WEB_EXPORT

**PASS** (`npx expo export --platform web`; temp output removed, not committed)

## REGRESSION

**PASS** — home UX, nickname, toddler weekly UI, elementary share, Coupang, AdMob gate

---

## COMMIT

`chore(todays-menu): prepare Hankki v1.1 release candidate`  
(SHA filled after commit)

## PUSH

`origin/hankki/ai-recommendation-metadata-stabilization` (no force)

## REMOTE_SHA_MATCH

(filled after push)

## GIT_STATUS_FINAL

(filled after push)

---

## READY_FOR_ANDROID_RC_BUILD

**YES** (metadata + adaptive FG ready; EAS not run this sprint)

## READY_FOR_IOS_TESTFLIGHT_BUILD

**YES** (icon RGB / no alpha; buildNumber 2; EAS not run this sprint)

## BLOCKERS

None

## WARNINGS

1. First production EAS build may bump versionCode/buildNumber again via `autoIncrement: true` — expect Play/TestFlight numbers ≥ committed 9 / 2.
2. Device launcher visual QA still recommended on Samsung circle + Pixel squircle.

## RESULT

**PASS**
