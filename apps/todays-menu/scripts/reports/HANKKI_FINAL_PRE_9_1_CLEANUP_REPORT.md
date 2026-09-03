# HANKKI_FINAL_PRE_9_1_CLEANUP_REPORT

Sprint: Final Pre-9/1 Cleanup  
Date: 2026-08-29  
Version unchanged: **1.0.0** / android versionCode **8** / ios buildNumber **1**

---

## STEP_FILES

**200** (unchanged)

---

## PNG_AS_JPG_BEFORE

**39** (recipe-steps only; meals **0**)

---

## PNG_AS_JPG_AFTER

**0** ✓

---

## STEP_SIZE_BEFORE

| Metric | Value |
|---|---|
| Step folder total | **74.58 MB** (78,182,960 bytes) |
| 39 normalized files total | **56.61 MB** (59,370,283 bytes) |
| Average (39 files) | **~1.45 MB** (1,522,315 bytes) |

---

## STEP_SIZE_AFTER

| Metric | Value |
|---|---|
| Step folder total | **22.29 MB** (23,371,476 bytes) |
| 39 normalized files total | **4.35 MB** (4,558,799 bytes) |
| Average (39 files) | **~114 KB** (116,892 bytes) |

---

## STEP_SIZE_SAVED

| Metric | Value |
|---|---|
| 39 files saved | **52.27 MB** (54,811,484 bytes) |
| Step folder delta | **52.27 MB** |
| Per-file average reduction | **~1.34 MB** (~92.3% smaller on normalized set) |

---

## BUNDLE_ASSET_SIZE (meals + steps)

| | Before cleanup | After cleanup |
|---|---|---|
| Meals | 83.22 MB | 83.22 MB (unchanged) |
| Steps | 74.58 MB | 22.29 MB |
| **Total** | **~157.8 MB** | **~105.5 MB** |

---

## BROKEN_REGISTRY

**0** — `test:child-image-registry` PASS (222/222 hero, batch4 pilot 46/48 with 2 deferred allowed)

---

## PRIVACY_REPO

`legal/privacy.html` — **2026-08-29** latest

Present in repo:

- Photo save-only (쓰기/추가), no read/scan/upload
- Google Mobile Ads SDK (Android Home; iOS UI off)
- Coupang scope (Home + general ingredients; baby detail/batch/grocery excluded)
- Child name/age/month not collected
- AdMob + Firebase disclosed

---

## PRIVACY_LIVE

`https://hankki-legal.vercel.app/hankki/privacy` — **STALE**

| Check | Live | Repo |
|---|---|---|
| Date | Old (no 2026-08-29) | 2026-08-29 |
| Photo save-only | **MISSING** — still says “사진 라이브러리 접근 … 수행하지 않습니다” | Present |
| AdMob SDK | **STALE** — “AdMob 등 별도 광고 SDK는 포함되어 있지 않습니다” | Google Mobile Ads SDK |
| Coupang baby exclusion | Not scoped | Present |
| Child PII | Not mentioned | Present |

HTTPS OK · 404 NO · Mobile viewport OK

---

## DEPLOY_NEEDED

**YES** — live URL out of sync with repo before store submit.

**Deploy not executed** this sprint.

---

## SAFE_TO_DEPLOY_PRIVACY

**YES**

| Check | Result |
|---|---|
| `legal/.vercel/project.json` linked | `projectName: hankki-legal`, `projectId` present |
| Rewrites | `legal/vercel.json` → `/hankki/privacy` → `privacy.html` |
| Documented command | `cd apps/todays-menu/legal && npx vercel deploy --prod --yes --name hankki-legal` |
| New project risk | **LOW** — directory already linked to `hankki-legal`; `--name` matches linked project |
| `LEGAL_URLS` in app | Already points at `hankki-legal.vercel.app/hankki/privacy` |

Post-deploy verify: fetch live URL for `2026-08-29`, photo save, AdMob SDK sections.

---

## DEFERRED_STEP_IMAGES

Unchanged — **not blockers**

| Key | Status |
|---|---|
| `toddler_egg_cheese_rice_breakfast_step_02` | MISSING (text-only fallback) |
| `toddler_egg_bread_snack_step_04` | MISSING (text-only fallback) |

---

## STATIC_TEST_RESULT

| Test | Result |
|---|---|
| `npm run test:release-static` | **PASS** |

---

## ASSET_TEST_RESULT

| Test | Result |
|---|---|
| `npm run recipe-assets:check` | **PASS** (0 mapping updates) |
| `npm run test:child-image-registry` | **PASS** |
| `npm run test:release-precheck-privacy` | **PASS** |
| `npm run test:legal-coupang-compliance` | **PASS** |

---

## FILES_CHANGED

| Category | Files |
|---|---|
| Step images | 39 × `assets/recipe-steps/*.jpg` (PNG → true JPEG q80 @ 1024×1024) |
| Script | `scripts/image-opt/normalize_png_as_jpg_steps.py` (new) |
| Report data | `scripts/reports/png-as-jpg-steps-normalize-pre-9-1.json` (new) |
| Backups | `assets/_backup/image-opt-sprint1/` (gitignored, per-file backup before encode) |

**Not changed:** recipes, UI, version, `recipeStepImageAssets.ts` mapping, features.

---

## REGRESSIONS

None in static/Node QA suite.

---

## RISKS

| Risk | Level | Notes |
|---|---|---|
| JPEG re-encode visual delta | LOW | Same pixels via fit_cover; spot-check on 9/1 if desired |
| Privacy live stale until deploy | MEDIUM | Preview QA OK; deploy before store |
| 2 deferred step slots | LOW | Text-only fallback |
| APK size | TBD | Bundle −52 MB steps; measure on 9/1 preview |

---

## PRE_9_1_STATIC_WORK_COMPLETE

**YES**

---

## READY_FOR_PRIVACY_DEPLOY

**YES** (repo ready + command validated; awaiting user approval to run)

---

## READY_FOR_9_1_PREVIEW_BUILD

**YES**

---

## 9/1 FREEZE (recommended)

Until preview QA completes, avoid:

- New features / recipes / image batches
- Version bumps / EAS production builds

Allowed:

- Blocker bugs
- Release compliance fixes (e.g. privacy deploy after approval)

---

## Normalize command (reference)

```bash
cd apps/todays-menu
python scripts/image-opt/normalize_png_as_jpg_steps.py
```

Dry-run: append `--dry-run`
