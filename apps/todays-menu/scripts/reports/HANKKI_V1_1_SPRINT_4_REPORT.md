# HANKKI_V1_1_SPRINT_4_REPORT

Date: 2026-09-02  
Scope: Elementary breakfast/dinner weekly plan UI upgrade  
Project: `apps/todays-menu`

---

## CURRENT_WEEKLY_UI (before)

| Area | State |
|---|---|
| **Header** | Single-line title (`초등학생 아침 7일 식단`) + short subtitle |
| **Navigation** | Two link chips: `초등학생 메뉴` (browse) + `초등 저녁 7일` / `초등 아침 7일` |
| **Day cards** | 80×80 thumb, day label, name, cook time only — no ingredient hints |
| **Footer** | `screenLayout.footer` inside SafeAreaView (top+bottom edges); save/share row + refresh below; padding estimate could clip on some devices |
| **Breakfast/dinner switch** | Chip link only (secondary) |
| **Share card** | Breakfast used separate `ElementaryBreakfastShareCard`; dinner used shared card |
| **Recipe detail** | `/recipe/${recipeId}` + analytics seed — working |

---

## NEW_WEEKLY_UI (after)

| Area | Change |
|---|---|
| **Header** | Eyebrow (`초등학생 아침` / `저녁`) + title (`7일 식단`) + benefit subtitle |
| **Navigation** | Browse chip **removed** from weekly screens (still on Home kids + elementary browse) |
| **Meal switch** | Full-width segmented control: `아침 7일` ↔ `저녁 7일` |
| **Day cards** | Shared `ElementaryWeeklyPlanDayCard`: 72×72 hero image, day badge, name, **1–2 main ingredients**, cook time, chevron |
| **Footer** | Sticky `ElementaryWeeklyPlanFooter` with `useSafeAreaInsets` bottom padding; primary row **이미지 저장 / 공유하기**; secondary **다른 일주일 추천** |
| **Share card** | Both screens use unified `ElementaryWeeklyPlanShareCard`; row typography bumped for mobile readability |
| **Safe area** | SafeAreaView `edges={['top']}`; footer owns bottom inset |

---

## FILES_CHANGED

| File | Change |
|---|---|
| `components/elementaryWeekly/ElementaryWeeklyPlanHeader.tsx` | **Added** — eyebrow + title + subtitle |
| `components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx` | **Added** — hero image card with ingredients |
| `components/elementaryWeekly/ElementaryWeeklyPlanFooter.tsx` | **Added** — sticky CTA footer + scroll padding helper |
| `components/elementaryWeekly/ElementaryWeeklyMealSwitch.tsx` | **Added** — breakfast/dinner segmented switch |
| `components/elementaryWeekly/WeeklyPlanErrorPanel.tsx` | **Added** — shared error state |
| `components/elementaryWeekly/ElementaryWeeklyPlanShareCard.tsx` | Row font sizes increased for share readability |
| `components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx` | Refactored to shared weekly UI kit |
| `components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx` | Refactored to shared weekly UI kit |
| `services/weeklyPlan/elementaryWeeklyPlanDisplayCommon.ts` | **Added** — main ingredient hint helpers |
| `services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay.ts` | `ingredientHint` on slot display |
| `services/weeklyPlan/elementaryDinnerWeeklyPlanDisplay.ts` | `ingredientHint` on slot display |
| `constants/elementaryBreakfastWeeklyPlanCopy.ts` | New header/CTA/switch copy |
| `constants/elementaryDinnerWeeklyPlanCopy.ts` | New header/CTA/switch copy |
| `scripts/test-elementary-weekly-sprint4-ui.ts` | **Added** — Sprint 4 UI QA |
| `scripts/test-elementary-breakfast-weekly-plan-ui.ts` | Updated assertions for shared UI |
| `scripts/test-elementary-breakfast-weekly-plan-share.ts` | Points to shared share card component |
| `scripts/test-child-search-filter.ts` | Weekly meal switch replaces browse chip assertion |

**Unchanged:** generators, storage, analytics events, routes, AdMob, baby/toddler data, 14-day generator API.

---

## REAL_RECIPE_IMAGES

**YES** — `ElementaryWeeklyPlanDayCard` uses `resolveMealHeroImage(recipeId)` + `MealImageView` with `showEmojiFallback` on load failure.

---

## BREAKFAST_DINNER_SWITCH

**YES** — `ElementaryWeeklyMealSwitch` on both screens; `router.replace()` between `/elementary-breakfast-week` and `/elementary-dinner-week`.

---

## IMAGE_SAVE

**Preserved** — `captureElementaryBreakfastShareCard` / `captureElementaryDinnerShareCard` → MediaLibrary save; analytics `trackElementaryWeeklyPlanImageSave`.

---

## SHARE

**Preserved** — view-shot capture of off-screen share card → OS share sheet; unified card layout; 1080×1350 output.

---

## REGENERATE

**Preserved** — `createElementaryBreakfastWeekSeed()` / `createElementaryDinnerWeekSeed()` on refresh; in-flight guard; 7-day unique within week.

---

## RECIPE_DETAIL_ENTRY

**Preserved** — `router.push(\`/recipe/${slot.recipeId}\`)`; `setRecipeOpenSource('kids_weekly_plan')`; click analytics with `recipe_id` + `seed`.

---

## BOTTOM_SAFE_AREA

**Improved** — Footer uses `useSafeAreaInsets().bottom`; `elementaryWeeklyPlanFooterScrollPadding()` for scroll content; top-only SafeAreaView to avoid double bottom padding.

---

## WEB_PREVIEW

**PASS** — `npx expo export --platform web` exit 0.

---

## REGRESSION

| Test | Result |
|---|---|
| `test-elementary-weekly-sprint4-ui.ts` | **PASS** |
| `test-elementary-breakfast-weekly-plan-ui.ts` | **PASS** |
| `test-elementary-breakfast-weekly-plan.ts` | **PASS** |
| `test-elementary-dinner-weekly-plan.ts` | **PASS** |
| `test-elementary-breakfast-weekly-plan-share.ts` | **PASS** |
| `test-child-search-filter.ts` | **PASS** (assertion updated) |
| `test-child-meal-planning-integrated.ts` | **PASS** |

---

## ISSUES_FOUND

1. **Intentional:** Browse chip removed from weekly screens — browse still reachable via Home kids panel and `ElementaryBrowseScreen`.
2. **`ElementaryBreakfastShareCard.tsx`** retained but unused by screen (breakfast now uses shared card); safe to delete in a future cleanup sprint.

---

## SCREENSHOT_QA_REQUIRED

**YES** — Manual device/browser screenshot review recommended for footer overlap on iOS home indicator and narrow Android widths.

---

## RESULT

**PASS**

---

## Test commands

```bash
cd apps/todays-menu
npx tsx scripts/test-elementary-weekly-sprint4-ui.ts
npx expo export --platform web
```

---

*Next sprint: on hold per instruction.*
