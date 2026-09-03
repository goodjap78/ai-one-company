# HANKKI_ELEMENTARY_DINNER_WEEKLY_REPORT

Sprint: HANKKI v1.1 — Elementary Dinner Weekly Plan  
Date: 2026-08-29

---

## DINNER_ELIGIBLE

**17 recipes** (explicit elementary, dinner mealType, child safety pass)

| recipeId | name | time | form | protein |
|----------|------|------|------|---------|
| 002 | 계란볶음밥 | 10m | fried_rice | egg |
| 059 | 오믈렛 | 10m | non_rice | egg |
| recipe_0442 | 소고기계란덮밥 | 15m | rice_bowl | beef |
| recipe_0443 | 햄계란덮밥 | 15m | rice_bowl | pork |
| recipe_0446 | 감자치즈구이 | 20m | non_rice | other |
| recipe_0480 | 소고기야채덮밥 | 15m | rice_bowl | beef |
| recipe_0481 | 닭고기계란덮밥 | 15m | rice_bowl | chicken |
| recipe_0500 | 닭고기간장덮밥 | 15m | rice_bowl | chicken |
| recipe_0501 | 참치계란덮밥 | 15m | rice_bowl | fish |
| recipe_0502 | 돼지고기양배추덮밥 | 15m | rice_bowl | pork |
| recipe_0503 | 닭고기카레볶음밥 | 15m | fried_rice | chicken |
| recipe_0504 | 소고기버섯볶음밥 | 15m | fried_rice | beef |
| recipe_0505 | 햄계란볶음밥 | 12m | fried_rice | pork |
| recipe_0506 | 닭안심간장구이 | 15m | non_rice | chicken |
| recipe_0507 | 두부계란조림밥 | 15m | rice_other | tofu |
| recipe_0508 | 소고기감자조림밥 | 15m | rice_other | beef |
| recipe_0509 | 닭고기감자덮밥 | 15m | rice_bowl | chicken |

No new recipes. No recipe edits.

---

## WEEK_GENERATED

**YES** — MON–SUN 7 unique dinner slots, deterministic by seed.

---

## SAMPLE_WEEK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 감자치즈구이 | 20m |
| TUE | 햄계란볶음밥 | 12m |
| WED | 돼지고기양배추덮밥 | 15m |
| THU | 오믈렛 | 10m |
| FRI | 닭고기계란덮밥 | 15m |
| SAT | 계란볶음밥 | 10m |
| SUN | 닭고기간장덮밥 | 15m |

---

## DIVERSITY_RULES

**Hard (never relaxed):**
- 7 unique recipeIds
- explicit elementary + dinner eligible only
- no consecutive `rice_bowl`
- no consecutive `fried_rice`
- protein streak ≤ 2
- form streak ≤ 2
- optional long-cook consecutive block (relaxed only in later search phases)

**Best effort (soft):**
- protein variety scoring
- form variety scoring
- rice-slot cap (≤6 rice forms in week)
- prefer non-rice when rice count high

**Not applied (breakfast-only):**
- `schoolMorningFriendly`
- bread/oatmeal breakfast weighting

---

## BREAKFAST_INFRA_REUSED

| Layer | Reuse |
|-------|-------|
| RNG / seed normalize | `elementaryWeeklyPlanCommon.ts` (new shared module) |
| Share dimensions 1080×1350 | `elementaryBreakfastShareCard.ts` constants |
| Share capture/save/share | `weeklyPlanShare.ts` |
| Share card UI | `ElementaryWeeklyPlanShareCard.tsx` (parameterized copy) |
| Screen UX pattern | refresh, persistence, footer, hero cards, recipe detail |
| Analytics events | same events + `mode` param |

Breakfast generator (`elementaryBreakfastWeeklyPlan.ts`) **unchanged in logic**.

---

## COMMON_WEEKLY_ENGINE

Partial commonization (no risky breakfast refactor):

- `elementaryWeeklyPlanCommon.ts` — blocked collisions, RNG, seed, shuffle
- `weeklyPlanShare.ts` — PNG capture/save/share
- `ElementaryWeeklyPlanShareCard.tsx` — shared 4:5 card layout
- Analytics `mode: 'breakfast' | 'dinner'` on existing weekly events

Separate generators: breakfast vs dinner (mode-specific diversity rules).

---

## ENTRY_POINT

| Surface | Entry |
|---------|-------|
| **Elementary browse** | `[초등 아침 7일]` + `[초등 저녁 7일]` chips |
| **Breakfast weekly** | chips → browse + 저녁 7일 |
| **Dinner weekly** | chips → browse + 아침 7일 |

Search/filter state stays on browse; weekly screens are separate routes (no state leak).

---

## ROUTE

`/elementary-dinner-week` (`ELEMENTARY_DINNER_WEEK_HREF`)

---

## REFRESH

「다른 일주일 추천」 — new seed, regenerate, save on success; alert + keep plan on failure; in-flight guard (same as breakfast).

---

## PERSISTENCE

| Plan | Storage key |
|------|-------------|
| Breakfast | `@hankki/elementary_breakfast_weekly_plan` |
| Dinner | `@hankki/elementary_dinner_weekly_plan` |

Keys separated; breakfast plan never overwritten by dinner.

---

## SAVE

PNG 1080×1350 via `captureElementaryDinnerShareCard` → `weeklyPlanShare.ts` → MediaLibrary.

---

## SHARE

OS share sheet; copy: `이번 주 우리 아이 저녁 식단 🍚\n한끼에서 골라봤어요.`

Card title: **초등학생 저녁 / 일주일 식단** + MON–SUN rows + 한끼 branding + seed in plan (not exposed on card).

---

## ANALYTICS

Existing events with **`mode`** param:

- `elementary_weekly_plan_view`
- `elementary_weekly_plan_refresh`
- `elementary_weekly_plan_recipe_click`
- `elementary_weekly_plan_image_save`
- `elementary_weekly_plan_share`

Payload: `mode` (`breakfast`|`dinner`), `seed`; click adds `recipe_id`. No menu names / PII.

---

## FILES_CHANGED

**New**
- `data/recipes/elementaryWeeklyPlanCommon.ts`
- `data/recipes/elementaryDinnerWeeklyPlan.ts`
- `constants/elementaryDinnerWeeklyPlanCopy.ts`
- `services/weeklyPlan/elementaryDinnerWeeklyPlanStorage.ts`
- `services/weeklyPlan/elementaryDinnerWeeklyPlanDisplay.ts`
- `services/weeklyPlan/elementaryDinnerWeeklyPlanShare.ts`
- `services/weeklyPlan/weeklyPlanShare.ts`
- `components/elementaryWeekly/ElementaryWeeklyPlanShareCard.tsx`
- `components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx`
- `app/elementary-dinner-week.tsx`
- `scripts/test-elementary-dinner-weekly-plan.ts`
- `scripts/reports/HANKKI_ELEMENTARY_DINNER_WEEKLY_REPORT.md`

**Modified**
- `constants/appRoutes.ts`, `constants/childSearchCopy.ts`
- `components/elementary/ElementaryBrowseScreen.tsx`
- `components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx` (mode analytics + cross-links)
- `services/analytics/analyticsEvents.ts`, `analytics.ts`, `index.ts`
- `data/recipes/index.ts`, `app/_layout.tsx`, `package.json`
- Test scripts: analytics, weekly-plan-ui, child-search-filter

**Not changed:** recipes, Home rec engine, breakfast generator logic.

---

## TEST_RESULTS

```
npm run test:elementary-dinner-weekly-plan  → PASS
npm run test:weekly-plan                    → PASS (breakfast regression)
npm run test:weekly-plan-ui                 → PASS
npm run test:weekly-plan-share              → PASS
npm run test:analytics-events               → PASS (after count update)
npm run test:child-search-filter            → PASS
```

---

## REGRESSIONS

| Check | Status |
|-------|--------|
| Breakfast 45 candidates | PASS |
| Breakfast seed-42 week | PASS |
| Breakfast storage key | PASS |
| Breakfast share 1080×1350 | PASS |
| Elementary browse 78 | PASS |
| No recipe edits | PASS |

---

## RISKS

1. **17 dinner candidates** — tight pool; refresh diversity limited but 7-slot generation verified.
2. **002 / 059** in dinner pool — legacy ids also tagged elementary explicit; eligibility gate passes.
3. **Shared analytics events** — dashboards must filter by `mode` for breakfast vs dinner.

---

## READY_FOR_BABY_WEEKLY

**YES** — weekly infra pattern (mode config + separate storage + shared share) is reusable for baby weekly MVP.
