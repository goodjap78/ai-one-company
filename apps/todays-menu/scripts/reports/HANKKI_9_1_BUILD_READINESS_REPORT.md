# HANKKI_9_1_BUILD_READINESS_REPORT

Date: 2026-08-30  
Scope: Readiness audit only — **EAS build not executed**

---

## PREVIEW_PROFILE

**READY**

| Setting | Value | Status |
|---|---|---|
| Profile name | `preview` | OK |
| `distribution` | `internal` | OK |
| `android.buildType` | `apk` | OK |
| `env.EXPO_PUBLIC_QA_TOOLS` | `"1"` | OK |
| iOS | `simulator: false` | OK (Android focus) |

**Separation from production:**

| | preview | production |
|---|---|---|
| APK vs default AAB | **APK** explicit | No `buildType` → AAB default |
| `autoIncrement` | No | **Yes** |
| `EXPO_PUBLIC_QA_TOOLS` | **1** | Not set |
| QA / test AdMob path | Enabled | Production gate only if env set |

`development` profile also internal + `EXPO_PUBLIC_QA_TOOLS=1` (local dev client; not used for 9/1 APK).

---

## EAS_PROJECT

| Field | Value |
|---|---|
| CLI login | **mymy1004** (goodjap78@gmail.com) |
| Project slug | `@mymy1004/todays-menu` |
| Project ID | `6273721d-6284-4025-8b52-457191e0f9a3` |
| `app.json` `extra.eas.projectId` | **Match** |
| Owner | `mymy1004` |

**9/1 command (recorded):**

```bash
cd apps/todays-menu
eas build --platform android --profile preview --non-interactive
```

Optional: `npx eas-cli build ...` (project has `eas-cli` devDependency ^21.3.0; global may differ).

---

## ANDROID_PACKAGE

**com.aionecompany.todaysmenu**

| | Value |
|---|---|
| `version` | 1.0.0 (unchanged) |
| `versionCode` | 8 (unchanged) |

---

## ENV_READY

**YES** for preview

| Variable | preview (`eas.json`) | Effect |
|---|---|---|
| `EXPO_PUBLIC_QA_TOOLS` | `1` | AdMob test environment |
| `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS` | **unset** | Production gate **OFF** |
| `EAS_BUILD_PROFILE` | `preview` (EAS injects) | Not production AdMob throw |

Gate simulation (Node):

- `isAdMobProductionUnitsGateOn` → **false**
- `isAdMobTestAdEnvironment` → **true**
- Android unit → Google **test** adaptive ID (`3940256099942544/...`)

Real production banner unit ID **not required** for preview.

---

## ADMOB_PREVIEW

**READY**

- Plugin: `react-native-google-mobile-ads` in `app.config.js` (test App ID fallback)
- Runtime: Android Home only; NPA; iOS banner UI off
- Preview: test unit via `EXPO_PUBLIC_QA_TOOLS=1` + `EAS_BUILD_PROFILE=preview`
- Production gate: requires explicit `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS=true` (not in preview env)

---

## NATIVE_MODULES

All listed dependencies in `package.json`; prebuild via config plugins / autolinking:

| Module | package.json | Prebuild hook |
|---|---|---|
| `react-native-view-shot` | 4.0.3 | Autolink |
| `expo-sharing` | ~14.0.8 | Autolink |
| `expo-media-library` | ~18.2.1 | `app.json` plugin (save-only) |
| `react-native-google-mobile-ads` | 15.8.0 | `app.config.js` plugin |
| `@react-native-firebase/app` + `analytics` | ^26.2.0 | `app.config.js` (if `google-services.json` present) |
| `@react-native-async-storage/async-storage` | 2.2.0 | Autolink |

**Firebase:** `google-services.json` present on disk and **tracked in git**.

**AD_ID blocked:** `app.config.js` → `blockedPermissions` for AD_ID + AdServices (when Android Firebase file exists).

**firebase.json:** `google_analytics_adid_collection_enabled: false`.

---

## QA_DOCUMENT

**`docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md`** — present, covers required checklist:

| Required area | Doc section |
|---|---|
| APK install | B |
| Home | E (via flows) |
| Baby / Toddler / Elementary | E |
| Weekly plans | E, F |
| Save / share | F |
| Grocery checklist | G |
| Permissions | C |
| AdMob test | I |
| Coupang | H |
| Analytics | J |
| Image crop / performance | K |
| Merged manifest | D |
| APK size | L |

**Minor drift (non-blocker):** Section L cites ~158 MB bundled estimate; post PNG-as-JPG cleanup static bundle is **~105.5 MB** (meals+steps). Update on 9/1 after APK measure.

Privacy URL now live (deployed 2026-08-30) — store-ready; QA doc unchanged (still valid for device QA).

---

## GIT_WORKTREE

**Large uncommitted tree** — EAS uploads **local files**, so build can run from current workspace, but reproducibility risk if not committed.

Sprint-critical paths (sample):

| Path | Status |
|---|---|
| `legal/privacy.html` | Modified (deployed to Vercel) |
| `components/child/` (FlatList) | Untracked |
| `package.json` (`test:release-static`) | Modified |
| `eas.json` | Modified (+ QA_TOOLS on development) |
| `docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md` | Untracked |
| `scripts/reports/*` | Untracked |
| Child/step images, recipes, many assets | Modified / untracked (100+ files) |

**Recommendation before 9/1:** User-directed **commit** of intended v1.1 preview scope (not performed this audit).  
**No commit/push executed** per instructions.

---

## BLOCKERS

**None** for starting preview build on 9/1.

| Item | Severity | Notes |
|---|---|---|
| Uncommitted git state | Process | Not EAS-hard-block; commit recommended |
| QA doc bundle estimate | Low | Update after APK build |
| Deferred 2 step images | Low | Text-only fallback; not build blocker |
| `eas-cli` version drift | Low | Project ^21.3.0; npx may pull newer; works |

---

## STATIC_VERIFICATION

`npm run test:release-static` — **PASS** (re-run 2026-08-30)

---

## FILES_CHANGED

**None** (audit-only report)

---

## READY_TO_RUN_ON_9_1

**YES**

Preview profile, EAS project linkage, Android package, preview env, native modules, QA doc, and static lock are aligned. Run the command above when ready; follow `docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md` on device.
