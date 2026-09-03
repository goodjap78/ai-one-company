# HANKKI v1.1 Sprint 12 — Toddler Weekly UI + Share

**Date:** 2026-09-03  
**Scope:** Wire Sprint 11 toddler breakfast/dinner generators to UI + share (reuse elementary weekly shell)  
**No:** new design system, recipe DB edits, generator rule changes, AdMob/Coupang/iOS config, baby weekly

---

## ROUTES_ADDED

| Route | File |
|-------|------|
| `/toddler-breakfast-week` | `app/toddler-breakfast-week.tsx` |
| `/toddler-dinner-week` | `app/toddler-dinner-week.tsx` |

Registered in `app/_layout.tsx`. Legacy `/toddler-meals-week` kept (lunch/snack 4-tab screen).

---

## TODDLER_BREAKFAST_UI

**YES** — `ToddlerBfDnWeeklyPlanScreen` `mealType="breakfast"`

- Header: **유아 아침** / **7일 식단** / “이번 주 아침 고민, 한 번에 해결해보세요.”
- Day cards: weekday · food image · name · cook time · main ingredients 1–2
- Generator: `generateToddlerBreakfastWeek`

## TODDLER_DINNER_UI

**YES** — same screen `mealType="dinner"`

- Header: **유아 저녁** / **7일 식단** / evening subtitle
- Generator: `generateToddlerDinnerWeek`

---

## BREAKFAST_DINNER_SWITCH

**YES** — `ElementaryWeeklyMealSwitch` with route `replace` between breakfast/dinner weeks (same UX as elementary).

## REGENERATE

**YES** — “다른 일주일 추천” → new seed + Sprint 11 generator; passes prior week `avoidRecipeIds` best-effort. Egg cap / uniqueness enforced by generator.

## RECIPE_DETAIL

**YES** — card → `/recipe/{recipeId}` with `kids_weekly_plan` open source + toddler weekly recipe-click analytics.

---

## SHARE_CARD

**YES** — reuses `ElementaryWeeklyShareCard` (Sprint 5.3 photo-first). Model via `buildToddler*WeeklyShareCardModel` → `buildElementaryWeeklyShareCardModel`.

Titles:
- 유아 아침 7일 식단
- 유아 저녁 7일 식단

Mon–Sat 2×3 · Sunday full-width · shopping hints ≤6 · brand 한끼 / 우리 아이 밥 고민을 덜어드려요

## SHARE_RATIO

**4:5** — capture layout 360×450 → **1080×1350**  
Image flex **0.68** / cream text band **0.32** (Sprint 5.3)

## SAVE

**YES** — album save via existing `toddlerWeeklyPlanShare` → `weeklyPlanShare`

## SHARE

**YES** — OS share sheet with meal-specific `shareText`

---

## HOME_WEEKLY_ENTRY

**YES** — 2-step weekly IA (no 4-chip clutter):

1. [유아] [초등학생]
2. [아침 7일] [저녁 7일]

Entries in `HOME_PURPOSES.weekly` include toddler + elementary breakfast/dinner hrefs.  
Toddler feed “이번 주 메뉴” → `/toddler-breakfast-week`.

---

## ELEMENTARY_REGRESSION

**PASS** — elementary breakfast weekly UI + Sprint 5 share + Sprint 7 weekly quality

## TODDLER_GENERATOR_REGRESSION

**PASS** — Sprint 11 generators QA (egg max, 7-day / 14-day dup 0)

## WEB_EXPORT

**PASS** (wiring) — QA route `/qa/elementary-weekly-share` now toggles **유아 / 초등학생** × **아침 / 저녁**; gated by `isInternalQaEnabled()` (production redirect).

---

## SCREENSHOT_QA_REQUIRED

**YES** (device save/share still manual)

Browser checked (localhost:8090):
1. `/toddler-breakfast-week` — header · switch · day cards · footer OK
2. `/toddler-dinner-week` — evening mode selected · day cards OK
3. `/qa/elementary-weekly-share` — 유아/초등 · 아침/저녁 chips · share card preview (68/32, Mon–Sat 2×3, Sun full-width) OK
4. Home 2-step weekly — code/tests PASS (manual home tap optional)
5. Native album save / OS share — device required

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `app/toddler-breakfast-week.tsx` | **NEW** route |
| `app/toddler-dinner-week.tsx` | **NEW** route |
| `app/_layout.tsx` | Register routes |
| `constants/appRoutes.ts` | Hrefs |
| `constants/toddlerBreakfastWeeklyPlanCopy.ts` | **NEW** |
| `constants/toddlerDinnerWeeklyPlanCopy.ts` | **NEW** |
| `constants/homeIaCopy.ts` | Toddler weekly entries + audience helpers |
| `components/toddlerWeekly/ToddlerBfDnWeeklyPlanScreen.tsx` | **NEW** screen |
| `components/home/HomePurposeSubPanel.tsx` | 2-step weekly IA |
| `components/toddlerMeals/ToddlerMealFeedScreen.tsx` | Weekly → breakfast week |
| `components/qa/ElementaryWeeklyShareQaScreen.tsx` | Audience toggle |
| `components/qa/ElementaryWeeklyShareQaEntry.tsx` | Label |
| `services/weeklyPlan/toddlerBfDnWeeklyPlanDisplay.ts` | **NEW** display/share models |
| `services/weeklyPlan/toddlerWeeklyPlanShare.ts` | Optional shareText |
| `data/recipes/index.ts` | Export bf/dinner generators |
| `scripts/test-toddler-sprint12-weekly-ui.ts` | **NEW** |
| `scripts/test-sprint-1-1-home-ux.ts` | Weekly entries assertions |
| `scripts/test-toddler-weekly-plan.ts` | Feed entry + new routes |
| `package.json` | `test:toddler-sprint12-weekly-ui` |
| `scripts/reports/HANKKI_V1_1_SPRINT_12_REPORT.md` | This report |

---

## REGRESSION

| Test | Result |
|------|--------|
| `test-toddler-sprint12-weekly-ui` | **PASS** |
| `test-toddler-sprint11-weekly-generators` | **PASS** |
| `test-toddler-weekly-plan` | **PASS** |
| `test-toddler-meal-feed` | **PASS** |
| `test-sprint-1-1-home-ux` | **PASS** |
| `test-elementary-breakfast-weekly-plan-ui` | **PASS** |
| `test-elementary-weekly-sprint5-share` | **PASS** |
| `test-elementary-sprint7-weekly-quality` | **PASS** |
| `test-fridge-raid` | **PASS** |

---

## RESULT

**PASS**

Next sprint: Hold — awaiting user direction. Screenshot QA listed above.
