# HANKKI_RELEASE_PRECHECK_FIX_REPORT

Sprint: Release Precheck Fix (pre-9/1, no device)  
Date: 2026-08-29  
Version unchanged: **1.0.0** / android versionCode **8** / ios buildNumber **1**

---

## PRIVACY_POLICY

**File:** `legal/privacy.html`  
**Status:** UPDATED (repo only; Vercel deploy deferred to store submit)

| Area | Change |
|---|---|
| Photo save | Removed absolute “사진 라이브러리 접근 … 수행하지 않습니다”. Added write/add-only wording for user-initiated weekly plan PNG save; no read/scan/upload. |
| Child PII | Added note: baby/toddler/elementary flows do not collect child name/age/month. |
| AdMob | Kept Google Mobile Ads SDK disclosure; clarified Android Home banner vs iOS UI off; removed stale “미설치” style claims (none remained in body). |
| Coupang / ads | Scoped dynamic banner to Home + general recipe ingredients; baby detail / batch / grocery excluded. |
| Analytics | Added child event examples (`stage`, `meal_type`, `query_length`, weekly `mode`). |
| Date | `2026-08-29` |

---

## DATA_SAFETY_DRAFT

**File:** `docs/HANKKI_PLAY_DATA_SAFETY_DRAFT.md`  
**Status:** UPDATED

- Removed “AdMob 미설치” and “Photos = NO” absolutes.
- Added **Device access vs off-device collection** section.
- Photo library: save-only on device; **not** off-device photo collection.
- Analytics params documented (`recipe_id`, `stage`, `meal_type`, `mode`, `query_length`; no raw query/PII).
- AdMob Android + NPA + AD_ID blocked (merged manifest **9/1 CHECK_REQUIRED**).
- Contains ads = YES aligned with Coupang + AdMob SDK capability.

---

## APP_STORE_PRIVACY_DRAFT

**File:** `docs/HANKKI_APP_STORE_PRIVACY_DRAFT.md` (NEW)  
**Status:** CREATED (draft only; no App Store Connect submit)

- Photo Library: add/save only via `expo-media-library`.
- Tracking: no ATT; AdMob iOS UI off.
- Analytics payload + affiliate/ad scope documented.
- CHECK_REQUIRED items flagged for 9/1 preview build.

---

## ADMOB_WORDING

Privacy + Data Safety now describe **Google Mobile Ads SDK** on Android Home (when unit resolved), NPA, AD_ID blocked in config. No “AdMob not installed” claims. Internal production gate / env OFF not exposed to users.

---

## COUPANG_WORDING

Privacy §6 updated: Coupang dynamic banner on **Home + general recipe shopping**; **not** on baby detail, batch cooking, or grocery checklist. Consistent with Contains ads = YES and existing affiliate disclosure.

---

## PHOTO_SAVE_WORDING

Privacy + both store drafts distinguish **user-initiated save of app-generated PNG** from reading/uploading existing photos. Matches `services/weeklyPlan/weeklyPlanShare.ts` (`MediaLibrary.saveToLibraryAsync`, `requestPermissionsAsync(true, ['photo'])`).

---

## CHILD_BROWSE_BEFORE

- `ChildRecipeBrowseList`: `View` + `recipes.map()` — all 70–78 rows mounted inside parent `ScrollView`.
- Risk: **HIGH** (integrated QA / precheck audit).

---

## CHILD_BROWSE_AFTER

- `ChildRecipeBrowseList`: `FlatList` with `scrollEnabled={false}`, `nestedScrollEnabled`, `keyExtractor={(r) => r.id}`, batch/window tuning.
- Parent screens unchanged (Baby/Toddler/Elementary browse UI, search, filters, navigation, analytics).

---

## VIRTUALIZATION

**YES** — FlatList virtualization for child browse lists. Empty state unchanged. No parent ScrollView refactor (minimal diff).

---

## WEEKLY_LOOKUP

**FIXED (safe)** — `getHankkiRecipeById` now uses lazy `Map<string, Recipe>` in `data/recipes/hankkiRecipes.ts`. Weekly display modules (`*WeeklyPlanDisplay.ts`) benefit without API change. 7-slot plans: O(7) map lookups vs O(7×517) linear scans.

---

## IMAGE_ASSET_AUDIT

Read-only (no recompress / no adds):

| Bucket | Count | Size |
|---|---|---|
| `assets/meals` | 522 JPG | 83.2 MB |
| `assets/recipe-steps` | 201 JPG | 74.6 MB |
| **Meals + steps (bundled hero/step)** | **723** | **~157.8 MB** |

- `npm run recipe-assets:check` — **PASS** (0 mapping updates needed).
- `recipe-assets:validate` — exit 1 (pre-existing; not modified this sprint).
- Actual APK/AAB size: **9/1 preview build**.

---

## ANDROID_CONFIG

| Item | Status |
|---|---|
| `expo-media-library` save-only | OK — `photosPermission: false`, `savePhotosPermission` set, `granularPermissions: ["photo"]` |
| AD_ID blocked | OK — `app.config.js` merges `blockedPermissions` for AD_ID + AdServices |
| AdMob plugin | Present (no production ON) |
| Version / versionCode | Unchanged (8) |

Merged manifest verification: **9/1**.

---

## IOS_CONFIG

| Item | Status |
|---|---|
| Save permission string | Via Expo plugin (`savePhotosPermission`) |
| AdMob UI | Off (`AdMobBanner` Android-only) |
| Firebase ADID | `withoutAdIdSupport: true` in plugin config |
| buildNumber | Unchanged (1) |

Merged Info.plist `NSPhotoLibraryAddUsageDescription`: **9/1 verify**.

---

## FILES_CHANGED

| File | Action |
|---|---|
| `legal/privacy.html` | Updated |
| `docs/HANKKI_PLAY_DATA_SAFETY_DRAFT.md` | Updated |
| `docs/HANKKI_APP_STORE_PRIVACY_DRAFT.md` | Created |
| `components/child/ChildRecipeBrowseList.tsx` | FlatList virtualization |
| `data/recipes/hankkiRecipes.ts` | Recipe ID map cache |
| `scripts/test-release-precheck-privacy.ts` | Created |
| `scripts/test-legal-coupang-compliance.ts` | Updated assertions |
| `scripts/test-child-search-filter.ts` | FlatList assertions |
| `scripts/test-baby-food-ui.ts` | FlatList assertions |
| `scripts/reports/HANKKI_RELEASE_PRECHECK_FIX_REPORT.md` | This report |

**Not changed:** version, EAS profiles, AdMob production env, store submissions.

---

## TEST_RESULTS

| Test | Result |
|---|---|
| `test-release-precheck-privacy` | **PASS** |
| `test-legal-coupang-compliance` | **PASS** |
| `test:child-search-filter` | **PASS** |
| `test:baby-food-ui` | **PASS** |
| `test:toddler-feed` | **PASS** |
| `test:weekly-plan` | **PASS** |
| `test:child-meal-planning-integrated` | **PASS** |
| `test:analytics-events` | **PASS** |
| `test:home-final-qa` | **PASS** |

---

## REGRESSIONS

None observed in static/Node QA suite above.

---

## RISKS

| Risk | Mitigation |
|---|---|
| FlatList nested in ScrollView layout edge cases | Real-device scroll on 9/1 (baby/toddler/elementary browse + filters). |
| Nested FlatList `scrollEnabled={false}` height on very small screens | Same 9/1 QA. |
| Privacy URL still serves old HTML until Vercel deploy | Deploy before store submit. |
| AD_ID in merged manifest | 9/1 preview AAB inspect. |
| AdMob visibility on production-like build without test env | Expected null banner when gate off; confirm on device. |

---

## REMAINING_BEFORE_9_1

- [x] Privacy policy repo update  
- [x] Data Safety draft update  
- [x] App Store privacy draft  
- [x] Child browse FlatList  
- [x] Weekly recipe lookup map  
- [x] Static privacy/config tests  
- [ ] **Vercel deploy** `legal/privacy.html` (when approved for store path)  

---

## REMAINING_AFTER_9_1

- EAS **preview APK** (not production AAB)
- Merged manifest / Info.plist verification (AD_ID, photo add permission)
- Real-device QA: share/save, permissions prompt, scroll perf, Coupang/AdMob
- Actual APK/AAB size measurement
- Play Console Data Safety + App Store Connect privacy form entry
- Version bump when approved
- Production AdMob decision (still **NO** for this sprint)

---

## READY_FOR_PREVIEW_APK_ON_9_1

**YES**

Repo-side release-precheck blockers addressed. Preview build + device QA still required before production store submit.
