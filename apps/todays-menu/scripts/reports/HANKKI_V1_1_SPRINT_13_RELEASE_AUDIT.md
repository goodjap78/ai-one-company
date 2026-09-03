# HANKKI v1.1 Sprint 13 — Release Candidate Audit / Feature Freeze

**Date:** 2026-09-04  
**Scope:** Static + script QA only. No EAS build, no store upload, no feature work, no version bump, no commit/push.  
**Minimal fix applied:** unify `assets/icon.png` with `assets/adaptive-icon.png` (brand mismatch blocker).

---

## APP_VERSION

**Current:** `1.0.0` (`app.json` / `package.json`)

**Recommended for v1.1 release (do not apply this sprint):** `1.1.0`

## ANDROID_VERSION_CODE

**Current:** `8`  
**EAS production:** `autoIncrement: true` → next cloud production build will bump  
**Recommended next shipping code:** `9` (or let EAS autoIncrement from committed `8`)

## IOS_BUILD_NUMBER

**Current:** `"1"` (first iOS ship candidate)  
**EAS production:** `autoIncrement: true`  
**Recommended:** keep `1` for first TestFlight/App Store build, or allow EAS to increment

### Identity / toolchain (current)

| Field | Value |
|-------|--------|
| android.package | `com.aionecompany.todaysmenu` |
| ios.bundleIdentifier | `com.aionecompany.todaysmenu` |
| eas production profile | present (`eas.json` → `production`, `appVersionSource: local`) |
| Expo SDK | `^54.0.0` |
| React Native | `0.81.5` |

---

## HOME

**PASS (scripts)**

Purpose cards: 오늘 뭐 먹지? / 아이 뭐 먹이지? / 일주일 식단  

| Area | Entries | Routes |
|------|---------|--------|
| 오늘 | 집밥 · 편의점 꿀조합 · 냉장고 털기 | live |
| 아이 | 이유식 · 유아식 · 초등학생 | live |
| Weekly | 2-step: [유아\|초등학생] → [아침 7일\|저녁 7일] | `/toddler-breakfast-week`, `/toddler-dinner-week`, `/elementary-breakfast-week`, `/elementary-dinner-week` |

No dead home hrefs found. Legacy `/toddler-meals-week` still registered (non-primary).

**WARNING:** `test-child-route-audit` does not yet assert Sprint 12 toddler breakfast/dinner routes (files + `_layout` do exist).

---

## ONBOARDING

**PASS**

- Korean IME / last-char: `waitForImeCommit` + ref/`onEndEditing`  
- Trim + AsyncStorage persist + My `useFocusEffect` sync  
- `test-nickname-onboarding` **PASS**

Device re-check still required (Android + iOS keyboard).

---

## ELEMENTARY

**PASS**

- Breakfast/dinner generators, soft A-priority, schoolMorningFriendly  
- 7-day dup 0 · 14-day avoidRecipeIds 0  
- UI regenerate / detail / share wiring covered by existing tests  

---

## TODDLER

**PASS**

- Breakfast egg max ≤3 · non-egg ≥4 · diversity rules (Sprint 11)  
- Dinner form/protein caps  
- Sprint 12 UI + Elementary share card for bf/dinner  

---

## WEEKLY

**PASS** (elementary + toddler generators + UI scripts)

---

## SHARE

**PASS (static + model tests)**

| Surface | Status |
|---------|--------|
| 초등 아침/저녁 | ElementaryWeeklyShareCard · 360×450 → **1080×1350** · 4:5 · 68/32 cream band · Sun full-width |
| 유아 아침/저녁 | Same card via Sprint 12 display models |
| Seed/QA metadata on card | Not exposed |
| Shopping hints | ≤6 |

**WARNING:** Legacy `/toddler-meals-week` (4-tab) still references older list share path; primary home entry uses Sprint 12 bf/dinner screens.

---

## COUPANG

**PASS (static)**

- Home order: **CoupangDynamicBanner → AdMobBanner**  
- Web: placeholder only (no partner widget)  
- Native: WebView widget preserved  

---

## ADMOB

**PASS (static / gate)**

- Web: `null`  
- Native Android: banner gated; production needs `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS=true` + real unit/App ID  
- iOS: **banner UI/init off**; plugin keeps GMA `iosAppId`  
- AD_ID permissions blocked in `app.config.js`  

No native ad request this sprint (by design).

---

## ADAPTIVE_ICON

**FIXED (brand mismatch) + residual WARNING**

| Before | After (this sprint) |
|--------|---------------------|
| `icon.png` 1536×1024 rice-ball mascot | `icon.png` **1024×1024** = same bytes as adaptive |
| `adaptive-icon.png` 1024×1024 Hankki pumpkin-hat lockup | unchanged |

Play listing vs launcher brand divergence addressed for the next native rebuild.

**WARNING:** Adaptive FG still has baked rounded frame (`transparent_pct≈0`) → may look “icon-in-icon” under mask. True transparent FG + safe-zone polish still recommended before store polish pass.  
Backup of pre-fix: `assets/icon.png.rc-audit-backup` (local only).

---

## ANDROID_MEMORY_STATIC_RISK

**MEDIUM (WARNING, not blocker)**

- Child browse: FlatList nested in ScrollView (`scrollEnabled={false}`) → weak virtualization  
- RN `Image` (no expo-image cachePolicy)  
- Weekly maps 7 slots only (OK)  
- Coupang WebView: no explicit teardown on unmount  
- Stack retains prior screens  

Measure with `meminfo` after final Android build.

---

## IOS_COMPATIBILITY

**READY for TestFlight (static)**

- bundleId + `GoogleService-Info.plist` present  
- `useFrameworks: 'static'` + RNFB forceStaticLinking  
- Photos: save-only (`photosPermission: false`)  
- ATT/IDFA: `withoutAdIdSupport: true`, no tracking usage string, AD_ID blocked on Android  
- Share/save paths shared with Android weekly share  

### TestFlight manual QA checklist

1. Cold start → Korean nickname onboarding (IME last char) → My sync  
2. Home purposes + weekly 2-step (유아/초등 × 아침/저녁)  
3. Recipe detail open from weekly cards  
4. Regenerate week  
5. Share sheet + album save (allow/deny)  
6. Coupang WebView on Home (load / open outbound)  
7. Confirm **no** AdMob banner on iOS  
8. Launcher icon = Hankki lockup (same as Android adaptive)  
9. Splash / cold start visual  
10. Analytics: no nickname in event params  

---

## PRIVACY_ALIGNMENT

**PASS (repo drafts vs code)**

- Firebase Analytics: yes  
- Coupang affiliate + dynamic banner: yes  
- AdMob: Android UI; disclosed  
- Nickname / favorites / recent: local  
- No app login  
- ATT: not required under current withoutAdIdSupport stance  
- IDFA: not requested  

No material privacy.html vs code contradiction found in scripts.

---

## GIT_WORKTREE

**BLOCKER for cloud release build**

| Metric | Value |
|--------|------:|
| Branch | `hankki/ai-recommendation-metadata-stabilization` |
| vs `origin/main` | **ahead 41** / behind 0 |
| **UNCOMMITTED_COUNT** | **746** (≈158 modified + ≈585 untracked) |
| Latest tip | `3345d3b` adaptive icon lockup commit |

Sprint 1–12 work largely lives in this dirty tree / ahead branch — **production EAS must not rely on uncommitted files**.

**RELEASE_BRANCH_STATUS:** needs dedicated commit(s) + PR/merge plan before final native build. This sprint: **no commit/push** (per instructions).

---

## TESTS_RUN

| Suite | Result |
|-------|--------|
| test-sprint-1-1-home-ux | PASS |
| test-nickname-onboarding | PASS |
| test-home-final-qa | PASS |
| test-child-route-audit | PASS* |
| test-coupang-dynamic-banner | PASS |
| test-admob-banner-phase1 | PASS |
| test-admob-production-gate | PASS |
| test-release-precheck-privacy | PASS |
| test-legal-coupang-compliance | PASS |
| elementary breakfast weekly | PASS |
| elementary dinner weekly | PASS |
| elementary sprint7 weekly quality | PASS |
| elementary sprint5 share | PASS |
| toddler sprint11 generators | PASS |
| toddler sprint12 weekly UI | PASS |
| toddler weekly plan | PASS |
| toddler meal feed | PASS |

\*Does not yet list `/toddler-breakfast-week` / `/toddler-dinner-week` (WARNING only).

## TESTS_PASS

**17 / 17 executed suites**

## TESTS_FAIL

**0**

---

## ANDROID_MANUAL_QA_REQUIRED

**YES**

- Adaptive icon on device after rebuild  
- Coupang WebView + AdMob (test vs production gate)  
- Onboarding IME  
- Weekly save/share  
- Long browse scroll / memory spot-check  

## IOS_TESTFLIGHT_QA_REQUIRED

**YES** — see checklist above

---

## BLOCKERS

1. **Git dirty tree (746 paths)** — commit/organize Sprint 1–12 + meal assets before any production EAS build.  
2. ~~Icon brand mismatch (Play vs launcher)~~ → **mitigated** this sprint by aligning `icon.png` to adaptive lockup.

## WARNINGS

1. Adaptive FG still baked square frame (mask polish).  
2. Nested FlatList / no expo-image / WebView retain → memory risk.  
3. App version still `1.0.0` until intentional v1.1 bump.  
4. AdMob production env must be set correctly on EAS (fail-closed if gate on without real IDs).  
5. Child route audit script missing Sprint 12 weekly routes.  
6. Legacy toddler multi-meal week share path still older.  
7. `icon.png.rc-audit-backup` left locally for rollback.

---

## READY_FOR_FINAL_NATIVE_BUILD

**NO**

Reason: worktree not release-clean (uncommitted mass). After commit + optional version bump to `1.1.0` + device QA plan, ready for final Android/iOS cloud builds.

---

## RESULT

**PARTIAL**

Audit complete; core v1.1 scripts green; icon brand blocker fixed; **release build blocked on git hygiene**, not on feature completeness.

**Next:** Hold — awaiting user direction (likely: commit plan / version bump sprint / then EAS).
