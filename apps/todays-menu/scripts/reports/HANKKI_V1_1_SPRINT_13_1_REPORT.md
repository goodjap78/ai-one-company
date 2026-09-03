# HANKKI_V1_1_SPRINT_13_1_REPORT

**Date:** 2026-09-04  
**Scope:** Release worktree cleanup + icon safety audit. No EAS / production build. No destructive git (`reset --hard`, `clean -fd`, blanket `restore`). No image regeneration.

---

## BRANCH

`hankki/ai-recommendation-metadata-stabilization`  
(tracking `origin/hankki/ai-recommendation-metadata-stabilization`, **ahead 7** after this sprint; not pushed)

---

## UNCOMMITTED_BEFORE

**746** short porcelain paths (commit-script baseline `remain=746` before C1).  
Expanded untracked trees ≈ **889** files in earlier inventory.

| Kind | Count (approx / measured) |
|------|---------------------------|
| MODIFIED | ~159 |
| ADDED (new tracked via later commits) | 0 staged before; all committed via logical commits |
| DELETED | **3** (shared AdMob/Coupang/init → platform split) |
| UNTRACKED | ~727 short / majority of 746 |
| STAGED | **0** before cleanup |
| RENAMES | none detected as `R` in porcelain |
| IGNORED (intentional exclude) | `assets/icon.png.rc-audit-backup`, `assets/_adaptive-icon-review.png` |

---

## Classification (pre-commit buckets)

| Bucket | Count | Notes |
|--------|------:|-------|
| PRODUCT_CODE_COUNT (A) | ~119 | `app/`, `components/`, `hooks/`, `services/`, ads split, home/weekly UI |
| TEST_COUNT (B) | ~84 | `scripts/test-*` (+ related QA helpers) |
| DATA_COUNT (C) | ~70 | toddler/elementary quality + weekly generators / patches |
| IMAGE_COUNT (D) | **516** | meal/step images + Hankki icons (`93ce27e`) |
| CONFIG_COUNT (E) | ~6 | `.gitignore`, `app.json`, `app.config.js`, `eas.json`, `package.json` (+ lock if present) |
| REPORT_COUNT (F) | ~92 | `scripts/reports/**`, sprint audits, sample JSON/JPG under reports |
| TEMP_GENERATED_COUNT (G) | **2** | icon backup + adaptive review PNG — **excluded**, gitignored |
| UNKNOWN_COUNT (H) | **0** after review | nested path below noted as WARNING, not unknown product |

**Deletes (intentional, included):**  
`components/ads/AdMobBanner.tsx`, `components/ads/CoupangDynamicBanner.tsx`, `services/ads/initAdMob.ts` → `.native` / `.web` replacements.

---

## FILES_TO_INCLUDE

- All A–F paths committed across C1–C7 (product, data, images, config, tests, reports)
- Platform-split ads (native vs web)
- `assets/icon.png`, `assets/adaptive-icon.png`

## FILES_TO_EXCLUDE

- `apps/todays-menu/assets/icon.png.rc-audit-backup` (`.gitignore`: `assets/*.rc-audit-backup`)
- `apps/todays-menu/assets/_adaptive-icon-review.png` (`.gitignore`: `assets/_*-review.png`)
- No `dist/`, `.expo/`, or web-export trees were in the 746 set as accidental tracked product (none deleted; none present as release blockers)

## FILES_NEEDING_REVIEW

- `apps/todays-menu/scripts/scripts/reports/image-opt-quality-samples/summary.json` — **nested `scripts/scripts/`** path committed under C7; harmless artifact, consider relocate/remove in a later chore (do not delete in 13.1)
- `scripts/reports/image-opt-quality-samples/*.jpg` (22 files) — QA sample images under reports; kept for history, not runtime

---

## Sprint 1–13 coverage check

| Feature | In Git after cleanup |
|---------|----------------------|
| Home IA | YES (`b314ee5`) |
| Nickname fix | YES |
| Weekly UI (elem + toddler) | YES |
| Elementary recipe quality | YES (`64a4527`) |
| Toddler recipe quality | YES |
| Elementary weekly quality | YES |
| Toddler weekly generators | YES |
| Share card | YES |
| Web AdMob split | YES (`a10750a`) |
| Web Coupang split | YES |
| Adaptive icon + app icon | YES (`93ce27e`) |
| iOS readiness (config/plugins) | YES (config commit; device QA still pending) |

No core feature files were left uncommitted.

---

## Icon safety audit

| Field | Value |
|-------|--------|
| ICON_PNG_ALPHA | **NO** (`icon.png` 1024×1024, mode **RGB**) |
| ADAPTIVE_ICON_ALPHA | **NO** (`adaptive-icon.png` 1024×1024, mode **RGB**) |
| Same binary today | **YES** (identical SHA-256) |
| IOS_ICON_SAFE | **YES** — square, no alpha channel (App Store alpha risk **cleared** for current files) |
| ANDROID_ADAPTIVE_ICON_SAFE | **PARTIAL** — usable as opaque FG+baked lockup; **no transparent safe-zone FG**. Preferred long-term: opaque `icon.png` + transparent-edge `adaptive-icon.png` (same brand, different binaries). **No regen this sprint.** |

**BLOCKER (icon alpha):** none for current RGB icons.  
**WARNING:** adaptive foreground is not a true transparent layer.

---

## COMMITS_CREATED

**8** (7 logical product commits + 1 docs report; plus optional follow-up docs tweak if present on HEAD)

| # | SHA | Message |
|---|-----|---------|
| C1 | `44711eb` | chore(todays-menu): ignore local icon review artifacts |
| C2 | `a10750a` | fix(todays-menu): split AdMob and Coupang for native vs web |
| C3 | `b314ee5` | feat(todays-menu): ship v1.1 home, child meals, and weekly UI |
| C4 | `64a4527` | feat(todays-menu): add toddler elementary quality and weekly data |
| C5 | `93ce27e` | feat(todays-menu): update meal images and Hankki app icons |
| C6 | `4489d46` | chore(todays-menu): update package and Expo release config |
| C7 | `32897ec` | test(todays-menu): add v1.1 QA scripts and release audit reports |
| C8 | `59cccfb` | docs(todays-menu): add Sprint 13.1 worktree cleanup report |

**COMMIT_SHAS:** `44711eb a10750a b314ee5 64a4527 93ce27e 4489d46 32897ec 59cccfb` (+ any subsequent docs-only tweak on HEAD)

---

## UNCOMMITTED_AFTER / GIT_STATUS_FINAL

**Target:** `git status` clean (only intentional gitignored icon review/backup locals).  
Branch ahead of remote by **8+** (docs finalize may add 1).

---

## REGRESSION

All PASS (`npx tsx`, exit 0):

- `test-sprint-1-1-home-ux.ts`
- `test-nickname-onboarding.ts`
- `test-toddler-sprint11-weekly-generators.ts`
- `test-toddler-sprint12-weekly-ui.ts`
- `test-elementary-sprint7-weekly-quality.ts`
- `test-elementary-weekly-sprint5-share.ts`
- `test-coupang-dynamic-banner.ts`
- `test-admob-production-gate.ts`
- `test-admob-banner-phase1.ts`

Web export not re-run as a full Expo export this sprint (no EAS; ads web stubs covered by Coupang/AdMob tests).

---

## BLOCKERS

- **None for git hygiene** (Sprint 13 blocker cleared).
- **Version still `1.0.0`** — do not ship native RC as “1.1” until version bump sprint.
- Device keyboard / store checklist still pending (carry from Sprint 13).

## WARNINGS

1. `icon.png` ≡ `adaptive-icon.png` (opaque RGB) — OK for iOS alpha; suboptimal Android adaptive FG.
2. Nested `scripts/scripts/reports/...` path in tree.
3. Image-opt quality sample JPGs live under `scripts/reports/` (not product runtime).
4. Branch not pushed; remote still behind.

---

## READY_FOR_VERSION_BUMP

**YES**

## READY_FOR_NATIVE_RC_BUILD

**NO** — wait for explicit version bump to `1.1.0` (+ Android/iOS build numbers policy), then EAS when user requests. Git worktree is release-candidate **hygiene**-ready.

---

## RESULT

**PASS**

Git worktree cleaned into 7 logical commits; icons alpha-safe for iOS; core regressions green; no files discarded.

**Next:** do not start Sprint 14 until requested. Version bump → then native RC when asked.
