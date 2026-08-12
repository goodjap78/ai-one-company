# HANKKI MVP — Sprint QA-1 Production Validation Report

**Date:** 2026-07-14  
**App:** `apps/todays-menu` (HANKKI / Today's Menu)  
**Mode:** Inspect / validate / report only — **no UI redesign, no features, no recommendation-logic changes**  
**Method:** Static code audit + asset inventory + prior release checklist cross-check (`AI_Company_OS/08_Roadmaps/HANKKI_MVP_Release_Checklist.md`)  
**Device matrix:** Code/layout review for 375 / 390 / 360 / 412 / tablet breakpoints — **physical device pass not executed in this sprint**

---

## Executive verdict

**HANKKI MVP is not production-store ready.** Core recommend → detail → favorite flows exist and recipe text data for 100 meals is structurally present, but store packaging, trust/honesty bugs, and production imagery gaps block public release.

| Gate | Result |
| --- | --- |
| **Release score** | **52 / 100** |
| **Ready for TestFlight** | **NO** |
| **Ready for Play Store** | **NO** |
| **Ready for App Store** | **NO** |
| **Final recommendation** | **Block Release** |

---

## Screen coverage

| # | Screen | Route / entry | Status | Notes |
| --- | --- | --- | --- | ---: |
| 1 | Splash | `/` + `SplashScreen` | PASS* | Cream brand overlay works; native splash is color-only (no image asset) |
| 2 | Onboarding | `/onboarding` | PASS* | Nickname save → tabs; copy/typography drift vs Home |
| 3 | Home | `/(tabs)` | PASS* | Recommend load/refresh/error+retry OK; Accept path risk (see P0) |
| 4 | Recommendation | Home card / refresh | PASS* | Homemade path OK; delivery → coming-soon (intentional) |
| 5 | Recipe Detail | `/ingredients/[id]` (live) | PASS* | Heroes/ings/steps soft-fail; cooking stack orphaned |
| 6 | Favorites | `/(tabs)/menu` + `/favorites` | PASS | Heart toggle + open detail; empty state present |
| 7 | My Page | `/(tabs)/my` | FAIL* | Dead settings rows + dishonest meal-reminder UI |

\* = pass with caveats listed under P0–P2.

---

## Asset inventory (production content)

| Asset class | Expected (001–050) | Present on disk | Coverage |
| --- | --- | ---: | ---: |
| Hero JPG (`assets/meals/{key}.jpg`) | 50 dish keys | **10** (Batch 01) | **20%** |
| Ingredient PNG | **42** unique `iconKey`s | **0** | **0%** |
| Step JPG | **202** step `imageKey`s | **0** | **0%** |
| Cuisine fallbacks | category_* | present | used for 011–050+ |
| App icon / adaptive foreground | store required | **missing** in `app.json` | **0%** |

`recipeImageMap`: `001`–`010` map to dish keys; `011`–`050` map to shared `category_korean` — recommendations beyond Batch 01 look identical.

Recipe **text** content (name, time, nutrition.calorie, ingredients, steps, tips/reasons) appears populated in `HANKKI_RECIPES` (100 recipes). Image layer is the production gap.

---

## Validation matrices

### Visual

| Check | Result | Evidence |
| --- | --- | --- |
| Spacing | WARN | Ad-hoc 8/10/12/14 vs DS 16/24/32 on Home / Ingredients |
| Alignment | OK enough | No systematic overlap found in layout code |
| Typography | WARN | Splash `"오늘 뭐먹지?"` vs Home Jua `"오늘 뭐 먹지?"`; Onboarding lacks Home title font |
| Color consistency | OK | Cream / coral DS retained |
| Rounded corners | WARN | Button radius: DS 24 / Home 18 / Onboarding 28 |
| Icon consistency | WARN | Seed on Splash/Home; emoji on My / Favorites headers |
| Button sizes | WARN | Hero heart **42px** (under ~44–48 touch target; `hitSlop` helps) |
| Safe area | OK | Tabs use `edges=['top']`; Splash full-bleed intentional |
| Dark text visibility | OK | Primary text on light cream — contrast adequate in tokens |

### Functional

| Check | Result | Evidence |
| --- | --- | --- |
| Recipe opens | PASS | Favorites / Accept → `/ingredients/[id]` |
| Favorite works | PASS | `toggleFavorite` + heart UI |
| Back navigation | WARN | Root tabs (My / 내 메뉴) show Back — confusing chrome |
| Recommendation refresh | PASS | Cooldown + error retry in `useHomeScreen` |
| Hero images | PARTIAL | 001–010 OK; 011+ category fallback |
| Ingredient images | FAIL soft | Empty registry → text/dot fallback |
| Step images | FAIL soft | Empty registry → text-only steps |
| Cooking path | FAIL vs checklist | `app/cooking/[recipeId]` exists; **no** `router.push('/cooking/...')` from detail |

### Performance (static risk)

| Check | Result | Notes |
| --- | --- | --- |
| Large image loading | WARN | Batch 01 heroes are large / often PNG-bytes named `.jpg` (~heavy decode) |
| Memory usage | WARN | Same; no device profile this sprint |
| Image caching | N/A / low | Most heroes not unique; Expo Image / resolve chain present |
| Scroll performance | WARN | Nested horizontals on Home / Ingredients — needs device jank check |
| Navigation speed | OK expected | Local data; no network image CDN for missing assets |

### Content

| Check | Result |
| --- | --- |
| Recipe data (structure) | PASS — 100 recipes with ingredients + steps + calories + time |
| Recommendation text | PASS — reasons / situation fields used on Home |
| Cooking tips | PASS on text steps; per-step tip present in schema |
| Ingredient names | PASS |
| Calories / cook time | PASS (`nutrition.calorie`, `time`) |
| Missing / broken assets | **FAIL for production imagery** — 0 ingredient PNGs, 0 step JPGs, 40/50 heroes fallback |

### Mobile sizes (layout readiness)

| Target | Layout readiness | Device tested this sprint |
| --- | --- | --- |
| iPhone 375 | Likely OK (portrait RN layouts) | **No** |
| iPhone 390 | Likely OK | **No** |
| Galaxy 360 | Likely OK; watch wrapping on long Korean titles | **No** |
| Galaxy 412 | Likely OK | **No** |
| Tablet | `supportsTablet: false` — iPad not a ship target | N/A |

### Accessibility

| Check | Result |
| --- | --- |
| Text size | OK body/caption tokens; large Dynamic Type not specially tested |
| Touch target | WARN — hero heart 42; settings rows meet DS minHeight |
| Contrast | OK for primary cream theme |
| Scrollable areas | OK ScrollViews present; nested scroll risk (P1) |

---

## Issue backlog

### P0 — Critical (block public release)

| ID | Issue | Why it blocks | Where |
| --- | --- | --- | --- |
| **P0-1** | **No app icon / adaptive foreground** in Expo config | Store builds / listing / TestFlight IPA packaging incomplete | `app.json` (colors only) |
| **P0-2** | Home **Accept / Save** can throw uncaught | `saveMeal` throws `Failed to save meal`; no `try/catch` on handlers; no ErrorBoundary | `useHomeScreen.ts`, `mealPlanningService.ts` |
| **P0-3** | My settings rows are dead buttons | 문의 / 개인정보 / 이용약관 = `Pressable` + chevron, **no `onPress`** | `MyAppSettingsSection.tsx` |
| **P0-4** | Meal reminders look real but do not schedule | UI persists; `syncMealReminderNotifications` is `void scheduled` stub | `mealReminderNotifications.ts` |
| **P0-5** | Production hero coverage insufficient for “full MVP catalog” claim | Only **10/50** unique dish heroes; 011–050 share one category image | `assets/meals`, `recipeImageMap.ts` |

> **P0 go rule:** Do not upload to App Store / Play Store until **P0-1…P0-4** are fixed or honestly gated. **P0-5** may be mitigated by limiting MVP catalog to Batch 01 (001–010) — product decision required.

### P1 — Should fix before release

| ID | Issue | Where |
| --- | --- | --- |
| **P1-1** | Version drift: `app.json` **1.0.0** vs `package.json` **0.1.0** | root configs |
| **P1-2** | Native splash image missing (cream only) | `app.json` |
| **P1-3** | Pairings `"더보기 >"` non-interactive affordance | `HomePairingChips` |
| **P1-4** | Back button on root Favorites / My tabs | `(tabs)/my.tsx`, `FavoritesScreen` |
| **P1-5** | Primary button radius inconsistency | DS / Home / Onboarding |
| **P1-6** | Splash / Onboarding / Home title copy & font drift | Splash, Onboarding, `northStarHomeCopy` |
| **P1-7** | Checklist happy path expects Accept → cooking; cooking is orphaned | `app/cooking/*` unreachable |
| **P1-8** | Re-encode Batch 01 true JPEG (PNG-as-JPG weight) | `assets/meals/*.jpg` |
| **P1-9** | Tab label clarity: 내 메뉴 vs 즐겨찾기 | tabs layout / copy |
| **P1-10** | Physical device matrix smoke (375/390/360/412) not yet signed off | QA lab |

### P2 — Can wait until v1.1

| ID | Issue |
| --- | --- |
| **P2-1** | Ingredient PNG factory approve → registry (`0/42`) |
| **P2-2** | Step image factory approve → registry (`0/202`) |
| **P2-3** | Heroes 011–050 (and 051–100) dedicated photos |
| **P2-4** | ErrorBoundary / `error.tsx` |
| **P2-5** | `onboarding_complete` flag unused (nickname gate only) |
| **P2-6** | Retire unused Home legacy components |
| **P2-7** | Real `expo-notifications` scheduling after honesty fix |
| **P2-8** | Analytics funnel / 10s decision metric |
| **P2-9** | Cleanup unused seed / hankki placeholder assets |

---

## Release score breakdown

| Dimension | Weight | Score | Weighted |
| --- | ---: | ---: | ---: |
| Critical path (splash → home → detail → favorite) | 25 | 72 | 18.0 |
| Trust / honesty (settings, reminders, pairings) | 20 | 30 | 6.0 |
| Store packaging (icon, splash, version, IDs) | 15 | 35 | 5.3 |
| Production imagery (heroes / ingredients / steps) | 20 | 25 | 5.0 |
| Content text quality (recipes, tips, nutrition) | 10 | 85 | 8.5 |
| Stability / error handling | 10 | 45 | 4.5 |
| **Total** | **100** | | **≈ 52** |

---

## Store readiness

| Channel | Ready? | Why |
| --- | --- | --- |
| **TestFlight** | **NO** | Missing app icon blocks credible IPA packaging; P0 trust bugs still shipping |
| **Play Store** | **NO** | No adaptive foreground icon; same P0 trust + catalog image policy |
| **App Store** | **NO** | No icon asset; Privacy/Terms rows dead (listing risk); reminders misleading |

Bundle IDs present: `com.aionecompany.todaysmenu` (iOS + Android) — OK once packaging assets exist.

---

## Final recommendation

### **Block Release**

**Why**

1. **Store packaging incomplete** — `app.json` has splash/adaptive **colors only**; no `icon` / `foregroundImage`.
2. **Trust regressions** — dead My settings chevrons and meal reminders that persist preferences without scheduling notifications.
3. **Stability risk** — Accept/Save can throw without catch or ErrorBoundary.
4. **Imagery not production-complete** — 10 dish heroes, 0 ingredient icons, 0 step photos for 001–050; shipping all 50+ as unique “today’s meal” visuals would look broken/identical.

**What would move this to Delay → TestFlight (closed)**

1. Ship **P0-1…P0-4** (icon + Accept/Save safety + settings honesty + reminder gate/label).  
2. Explicit product policy: **MVP catalog = Batch 01 (001–010)** *or* finish heroes for intended range.  
3. Device smoke on at least one iPhone + one Android from the matrix.  
4. Align versions; add Privacy/Terms URLs or remove rows.

**What would move this to Release (public stores)**

All of the above **plus** store listing assets, hosted legal URLs, and a conscious decide on ingredient/step imagery (soft-OK for MVP **or** first icon batch approved).

---

## Out of scope (honored this sprint)

- UI redesign  
- New features  
- Recommendation engine changes  
- Image generation / approval  
- Code fixes (report-only)

---

## Evidence references

- Companion: `AI_Company_OS/08_Roadmaps/HANKKI_MVP_Release_Checklist.md`  
- Companion: `AI_Company_OS/08_Roadmaps/HANKKI_MVP_Release_TODO.md`  
- Prior pipelines: `scripts/image-factory/IMG-3_Report.md`, `scripts/ingredient-factory/ING-2_Report.md`, `scripts/step-image-factory/STEP-1_Report.md`  
- Live detail surface: `components/ingredients/IngredientsScreen.tsx`  
- Home handlers: `components/home/useHomeScreen.ts`  
- Reminder stub: `services/reminder/mealReminderNotifications.ts`

---

**Sign-off**

| Role | GO / NO-GO |
| --- | --- |
| QA-1 (this report) | **NO-GO — Block Release** |
| Product | ☐ |
| Engineering | ☐ |
| Design | ☐ |
