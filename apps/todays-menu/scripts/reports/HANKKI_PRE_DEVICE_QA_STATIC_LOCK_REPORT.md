# HANKKI_PRE_DEVICE_QA_STATIC_LOCK_REPORT

Sprint: Pre-Device-QA Static Lock  
Date: 2026-08-29  
Version unchanged: **1.0.0** / android versionCode **8** / ios buildNumber **1**

---

## PRIVACY_URL

| Item | Value |
|---|---|
| App config URL | `https://hankki-legal.vercel.app/hankki/privacy` |
| Terms URL | `https://hankki-legal.vercel.app/hankki/terms` |
| Source of truth | `legal/privacy.html` (repo) |
| Vercel project | `hankki-legal` (`legal/vercel.json` rewrites) |
| Deploy command | `cd apps/todays-menu/legal && npx vercel deploy --prod --yes --name hankki-legal` |

**Live fetch (2026-08-29):**

| Check | Result |
|---|---|
| HTTPS | YES |
| 404 | NO — page loads |
| Mobile-friendly HTML | YES (viewport meta) |
| Repo date `2026-08-29` | **NO on live** — live still shows **pre–Precheck Fix** content |
| Photo save wording on live | **MISSING** |
| AdMob SDK on live | **STALE** (“AdMob 등 별도 광고 SDK는 포함되어 있지 않습니다”) |

---

## PRIVACY_DEPLOY

**DEPLOY_PENDING** — production URL exists and is reachable, but **out of sync** with repo `legal/privacy.html` (2026-08-29).  
**No deploy executed** (user approval required per sprint rules).

---

## DEFERRED_STEP_IMAGES

| Key | Recipe | On disk | Registry | Generation log |
|---|---|---|---|---|
| `toddler_egg_cheese_rice_breakfast_step_02` | recipe_0484 | **MISSING** | Expected (batch4 pilot) | `batch4-step-generate.log`: Gemini missing inline image data |
| `toddler_egg_bread_snack_step_04` | recipe_0498 | **MISSING** | Expected (batch4 pilot) | Same failure |

**Status:** DEFERRED (quota/generation failure from prior sprint; not retried this sprint).  
**UI impact:** NONE — `ChildStepImageSlots` returns null → text-only fallback (test:child-image-registry allows 46/48 with 2 deferred).  
**Blocker:** NO for 9/1 preview QA.

When credits available:

```bash
cd apps/todays-menu
npm run step:generate -- --keys=toddler_egg_cheese_rice_breakfast_step_02,toddler_egg_bread_snack_step_04 --force
npm run step:approve -- --approved-only
npm run prepare:new-recipes -- --since recipe_0484
```

---

## RELEASE_STATIC_SCRIPT

**ADDED:** `npm run test:release-static`

Chains existing scripts only (no duplicated test logic):

- `validate:hankki-recipes`
- `validate:recipe-metadata`
- `validate:hero-runtime`
- `test:family-audience`
- `test:child-image-registry`
- `test:child-search-filter`
- `test:child-detail-implementation`
- `test:child-meal-planning-integrated`
- `test:baby-weekly-plan`
- `test:baby-batch-cooking`
- `test:baby-grocery-checklist`
- `test:toddler-weekly-plan`
- `test:weekly-plan`
- `test:elementary-dinner-weekly-plan`
- `test:analytics-events`
- `test:release-precheck-privacy`
- `test:legal-coupang-compliance`
- `test:home-final-qa`

**Also added (sprint route audit, not in master chain):** `npm run test:child-route-audit`

---

## STATIC_TEST_RESULT

| Suite | Result |
|---|---|
| `npm run test:release-static` | **PASS** (exit 0, ~33s) |
| `npm run test:child-route-audit` | **PASS** |

---

## CATALOG

**517** — verified (`test:child-image-registry`, `validate:hankki-recipes`)

---

## BABY

**70** — verified (`listBabyFoodFeedRecipes`, familyAudience baby count)

---

## TODDLER

**74** — verified (`listToddlerMealFeedRecipes`)

---

## ELEMENTARY

**78** — verified (`listElementaryBrowseRecipes`)

---

## CHILD

**222** — verified (70 + 74 + 78, child hero registry 222/222)

---

## ANALYTICS_EVENTS

**49** — verified (`ANALYTICS_EVENTS` keys in `analyticsEvents.ts`, `test:analytics-events`)

---

## STORAGE_KEYS

All `@hankki/*` + legacy `@todays_menu/*` — **0 collisions** among active keys.

### Child / weekly (release-critical)

| Key | Purpose |
|---|---|
| `@hankki/baby_weekly_plan/early` | Baby weekly — 시작기 |
| `@hankki/baby_weekly_plan/middle` | Baby weekly — 적응기 |
| `@hankki/baby_weekly_plan/late` | Baby weekly — 확장기 |
| `@hankki/baby_weekly_plan/completion` | Baby weekly — 전환기 |
| `@hankki/baby_food_feed_stage` | Baby feed last stage tab |
| `@hankki/baby_grocery_checklist` | Batch grocery checklist state |
| `@hankki/toddler_weekly_plan/breakfast` | Toddler weekly |
| `@hankki/toddler_weekly_plan/lunch` | Toddler weekly |
| `@hankki/toddler_weekly_plan/dinner` | Toddler weekly |
| `@hankki/toddler_weekly_plan/snack` | Toddler weekly |
| `@hankki/toddler_weekly_plan/last_meal` | Toddler weekly last meal tab |
| `@hankki/elementary_breakfast_weekly_plan` | Elementary breakfast weekly |
| `@hankki/elementary_dinner_weekly_plan` | Elementary dinner weekly |

### Other app keys (unique namespaces)

| Key | Purpose |
|---|---|
| `@hankki/favorites` | Favorites |
| `@hankki/viewed_recipe_history` | Recently viewed |
| `@hankki/meal_history` | Meal history |
| `@hankki/meal_planning` | Meal planning (+ legacy `@hankki/meal_calendar` migrate) |
| `@hankki/pantry` | Pantry |
| `@hankki/grocery_list` | Grocery list snapshot |
| `@hankki/food_memory` | Food memory |
| `@hankki/context_memory` | Context memory |
| `@hankki/conversation_memory` | Conversation memory |
| `@hankki/user_profile` | User profile |
| `@hankki/daily_recommendation` | Daily recommendation |
| `@hankki/meal_time_recommendation` | Meal time cache |
| `@hankki/ai_recommendation_settings` | AI settings |
| `@hankki/recommendation_feedback` | Recommendation feedback |
| `@hankki/recent_searches` | Recent searches |
| `@hankki/convenience-favorites` | Convenience favorites |
| `@hankki/meal_reminders` | Meal reminders |
| `@hankki/onboarding_complete` | Onboarding |
| `@todays_menu/nickname` | Nickname (legacy namespace) |
| `@todays_menu/recent_recommendations` | Recent recommendations |
| `@todays_menu/recent_seed_messages` | Seed messages |
| `@todays_menu/feature_votes` | Feature votes |
| `@todays_menu/taste_preferences` | Legacy favorites (migrate-only) |

**Rename performed:** NONE (release lock).

---

## ROUTES

**9/9 child routes PASS** (`test:child-route-audit`)

| Route | Stack | Screen | Params | Back fallback |
|---|---|---|---|---|
| `/baby-food` | YES | BabyFoodFeedScreen | None | Home |
| `/baby-food-week` | YES | BabyFoodWeeklyPlanScreen | None | Home |
| `/baby-food-batch` | YES | BabyBatchCookingSelectScreen | None | Baby weekly |
| `/baby-food-batch-result` | YES | BabyBatchCookingResultScreen | None | Empty session → weekly / batch select |
| `/toddler-meals` | YES | ToddlerMealFeedScreen | None | Home |
| `/toddler-meals-week` | YES | ToddlerWeeklyPlanScreen | None | Home |
| `/elementary-browse` | YES | ElementaryBrowseScreen | None | Home |
| `/elementary-breakfast-week` | YES | ElementaryBreakfastWeeklyPlanScreen | None | Home |
| `/elementary-dinner-week` | YES | ElementaryDinnerWeeklyPlanScreen | None | Home |

---

## USER_FACING_TECH_TERMS

Scanned `constants/*Copy.ts` string values + child UI components.

| Term | User-facing exposure |
|---|---|
| `early` / `middle` / `late` / `completion` | **NONE** — mapped to 시작기/적응기/확장기/전환기 |
| `toddler` / `elementary` | **NONE** on screen labels |
| `review_required` / `batch_friendly` | **NONE** in UI copy |
| `babySafetyReview` / `toddlerSafetyReview` | **NONE** in UI |

**Result:** CLEAN — no changes required.

---

## IMAGE_RUNTIME

| Metric | Value |
|---|---|
| Child Hero | **222 / 222** registered + on disk |
| Meals JPG files | 517 catalog heroes (522 files in folder incl. aliases/extras) |
| Step JPG files | **200** on disk (2 deferred missing → 46/48 batch4 pilot OK) |
| Broken registry (child hero) | **0** |
| PNG-as-JPG (meals) | **0** |
| PNG-as-JPG (recipe-steps) | **39** — post–Sprint1 batch3/batch4 child step assets (PNG bytes, `.jpg` ext) |
| Bundled meals+steps | **~157.8 MB** (83.2 + 74.6 MB) |
| Top step file | ~2.1 MB (`toddler_tuna_veg_fried_rice_step_04.jpg`) |
| `assets/_backup/` in bundle | **NO** — `.gitignore` + no `require()` references in app code |

**Recompress:** NOT performed (sprint rule).

---

## IMAGE_BUNDLE_RISK

| Risk | Level | Notes |
|---|---|---|
| ~158 MB bundled images | MEDIUM | APK size TBD on 9/1 |
| 39 PNG-as-JPG steps | LOW–MEDIUM | Renders OK; optional normalize post-preview |
| 2 deferred step slots | LOW | Text-only fallback |
| Large step files (>1.4 MB) | LOW | Display size small; monitor APK |

---

## KNOWN_ISSUES

### HIGH

| Issue | Status |
|---|---|
| Real-device QA not run | PENDING — 9/1 |
| Privacy live URL out of sync with repo | DEPLOY_PENDING |

### MEDIUM

| Issue | Status |
|---|---|
| Nested FlatList in ScrollView (child browse) | Needs 9/1 scroll perf check |
| APK/AAB size not measured | 9/1 preview build |
| Merged manifest AD_ID / media permissions | 9/1 `aapt dump permissions` |
| 39 PNG-as-JPG step files (batch3/4) | Deferred normalize (not sprint scope) |

### LOW

| Issue | Status |
|---|---|
| 2 deferred step images (Gemini fail) | Text-only fallback OK |
| AdMob production unit IDs not configured | Intentional OFF |
| Play/App Store privacy forms not submitted | Draft docs ready |

### DEFERRED

| Item | Notes |
|---|---|
| `toddler_egg_cheese_rice_breakfast_step_02` | Regenerate when credits OK |
| `toddler_egg_bread_snack_step_04` | Regenerate when credits OK |
| Production AAB / store submit | After preview PASS |
| Vercel privacy deploy | User approval |

---

## REQUIRED_BEFORE_9_1

- [x] Static lock report
- [x] `test:release-static` master script
- [x] Counts / storage / routes verified
- [x] Device QA package doc (`docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md`)
- [ ] **Optional:** User-approved Vercel privacy deploy (store path)

---

## REQUIRED_ON_9_1

See `docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md`:

1. `eas build --platform android --profile preview`
2. Install APK + permission/manifest checks
3. Child full-flow + weekly save/share + grocery checklist
4. Coupang / AdMob test banner / analytics spot check
5. Scroll performance + APK size
6. **No production AAB until preview PASS**

---

## FILES_CHANGED

| File | Action |
|---|---|
| `package.json` | Added `test:release-static`, `test:release-precheck-privacy`, `test:child-route-audit` |
| `scripts/test-child-route-audit.ts` | Created |
| `docs/HANKKI_9_1_DEVICE_QA_PACKAGE.md` | Created |
| `scripts/reports/HANKKI_PRE_DEVICE_QA_STATIC_LOCK_REPORT.md` | This report |

**No recipe / feature / UI / version / build changes.**

---

## TEST_RESULTS

| Test | Result |
|---|---|
| `npm run test:release-static` | **PASS** |
| `npm run test:child-route-audit` | **PASS** |

---

## REGRESSIONS

None.

---

## STATIC_RELEASE_LOCK

**PASS**

All catalog counts, storage namespaces, routes, and release-static tests locked. Privacy **deploy** pending does not fail static code lock.

---

## READY_FOR_9_1_PREVIEW_BUILD

**YES**

Static state is ready for preview APK build on 9/1. Deploy updated privacy URL before store submission (not required for internal preview QA).
