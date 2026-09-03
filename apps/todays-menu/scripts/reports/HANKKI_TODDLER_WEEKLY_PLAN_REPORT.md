# HANKKI_TODDLER_WEEKLY_PLAN_REPORT

Sprint: HANKKI v1.1 — Toddler Weekly Menu Plan  
Date: 2026-08-29

---

## ELIGIBLE_COUNTS

| Meal | Count |
|------|-------|
| **BREAKFAST** | **15** |
| **LUNCH** | **19** |
| **DINNER** | **24** |
| **SNACK** | **16** |

**Total toddler weekly eligible: 74** (matches toddler feed pool; collision-blocked recipes excluded from weekly generator only).

Re-verified via `listToddlerWeeklyPlanMealCounts()` and `test:toddler-weekly-plan`.

---

## WEEK_GENERATED

**YES** — MON–SUN 7 unique slots per mealType, deterministic by seed. All four meal types generate successfully.

---

## SAMPLE_BREAKFAST

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 당근계란밥 | 12m |
| TUE | 바나나오트밀죽 | 8m |
| WED | 애호박계란국 | 12m |
| THU | 연두부맑은국 | 10m |
| FRI | 고구마바나나볼 | 12m |
| SAT | 계란치즈밥 | 12m |
| SUN | 닭고기주먹밥 | 15m |

## SAMPLE_LUNCH

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 간장계란밥 | 10m |
| TUE | 참치감자볶음밥 | 15m |
| WED | 채소계란볶음 | 12m |
| THU | 닭고기채소덮밥 | 15m |
| FRI | 두부계란볶음밥 | 12m |
| SAT | 참치두부덮밥 | 12m |
| SUN | 소고기브로콜리볶음밥 | 15m |

## SAMPLE_DINNER

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 당근계란볶음 | 12m |
| TUE | 감자국 | 20m |
| WED | 브로콜리계란볶음 | 12m |
| THU | 감자두부국 | 18m |
| FRI | 두부구이 | 12m |
| SAT | 소고기배추국 | 20m |
| SUN | 부드러운계란국 | 12m |

## SAMPLE_SNACK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 고구마팬케이크 | 18m |
| TUE | 사과바나나요거트 | 10m |
| WED | 감자치즈전 | 15m |
| THU | 과일요거트 | 8m |
| FRI | 바나나오트밀볼 | 10m |
| SAT | 바나나팬케이크 | 15m |
| SUN | 우유오트밀 | 7m |

---

## DIVERSITY_RULES

**Hard (never relaxed):**
- 7 unique recipeIds per week
- selected mealType only (`standardMetadata.mealTypes` match)
- approved explicit toddler feed eligibility (`toddlerSafetyReview: approved`)
- collision/safety eligibility via `hasWeeklyPlanBlockedCollision` + `isEligibleToddlerMealFeedRecipe`
- no consecutive 덮밥 or 볶음밥 (lunch)

**Best effort (phased backtracking search; safety never relaxed):**
- protein group streak ≤ 2 (beef/chicken/egg/pork/tofu/fish/other)
- form group streak ≤ 2 (meal-specific classifiers)
- main ingredient streak ≤ 2
- egg menu cap ≤ 3 per week
- long-cook (≥20m) consecutive minimization
- breakfast quick-menu bonus (≤12m)
- snack form dispersion (yogurt/pancake/steamed/other)
- refresh tries alternate seeds and avoids identical 7-recipe set when possible

**Meal-specific form classifiers** (`classifyToddlerWeeklyForm` in shared engine config pattern):
- **breakfast:** bread / egg / grain / other
- **lunch:** rice_bowl / fried_rice / rice_other / non_rice
- **dinner:** soup / one_bowl / rice_side / other
- **snack:** yogurt / pancake / steamed / other

**Not applied this sprint:**
- search/filter state from toddler feed browse → weekly generator (state separated; future “내 필터로 일주일 만들기” structurally possible via separate candidate filter hook)

---

## ENTRY_POINT

| Surface | Entry |
|---------|-------|
| **Toddler feed** (`/toddler-meals`) | `[메뉴 찾기]` (current) + `[이번 주 메뉴]` chip → weekly |
| **Toddler weekly** (`/toddler-meals-week`) | 「메뉴 찾기」 link back to feed |

Last-selected meal type persisted via `saveToddlerWeeklyPlanLastMeal` when entering weekly from feed.

---

## ROUTE

`/toddler-meals-week` (`TODDLER_MEALS_WEEKLY_HREF`)

---

## REFRESH

「다른 일주일 골라보기」 — new seed via `createToddlerWeeklyPlanSeed()`, regenerate with `avoidRecipeIds` best-effort (up to 4 seed attempts), save on success; keep existing plan on failure; in-flight guard.

---

## PERSISTENCE

MealType-scoped AsyncStorage keys (independent plans per meal):

| Meal | Key |
|------|-----|
| breakfast | `@hankki/toddler_weekly_plan/breakfast` |
| lunch | `@hankki/toddler_weekly_plan/lunch` |
| dinner | `@hankki/toddler_weekly_plan/dinner` |
| snack | `@hankki/toddler_weekly_plan/snack` |

Last meal: `@hankki/toddler_weekly_plan/last_meal`

Switching meal tab loads that meal's saved plan or generates a new one.

---

## SAVE

PNG 1080×1350 (4:5) via `captureToddlerWeeklyShareCard` → shared `weeklyPlanShare.ts` → MediaLibrary.

Button: 「식단 이미지 저장」

---

## SHARE

OS share sheet; text: `이번 주 우리 아이 유아식 메뉴 🍽\n한끼에서 골라봤어요.`

Share card: **이번 주 유아식 메뉴** + 끼니 line (아침/점심/저녁/간식) + MON–SUN names + cook time + 한끼 branding.

---

## SAFETY_GUIDANCE

Non-prescriptive copy on weekly screen only:

- 「아이의 식사 경험과 알레르기를 확인하며 활용해보세요.」

App does **not** expose `toddlerSafetyReview`, guarantee “안전한 식단”, “영양 균형”, or growth claims.

Card tap → existing `/recipe/:id` toddler detail (`setRecipeOpenSource('toddler_meal_feed')`).

---

## ANALYTICS

Dedicated toddler weekly events:

| Event | Payload |
|-------|---------|
| `toddler_weekly_plan_view` | `meal_type`, `seed` |
| `toddler_weekly_plan_meal_change` | `meal_type` |
| `toddler_weekly_plan_refresh` | `meal_type`, `seed` |
| `toddler_weekly_plan_recipe_click` | `meal_type`, `seed`, `recipe_id` |
| `toddler_weekly_plan_share` | `meal_type`, `seed` |
| `toddler_weekly_plan_save` | `meal_type`, `seed` |

No menu names, child info, or PII. Total analytics events: **45**.

---

## FILES_CHANGED

**New**
- `data/recipes/toddlerWeeklyPlan.ts`
- `constants/toddlerWeeklyPlanCopy.ts`
- `services/weeklyPlan/toddlerWeeklyPlanStorage.ts`
- `services/weeklyPlan/toddlerWeeklyPlanDisplay.ts`
- `services/weeklyPlan/toddlerWeeklyPlanShare.ts`
- `components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx`
- `app/toddler-meals-week.tsx`
- `scripts/test-toddler-weekly-plan.ts`
- `scripts/reports/HANKKI_TODDLER_WEEKLY_PLAN_REPORT.md`

**Modified**
- `constants/appRoutes.ts` — `TODDLER_MEALS_WEEKLY_HREF`
- `constants/toddlerMealFeedCopy.ts` — `menuBrowseLabel`, `weeklyPlanLink`
- `components/toddlerMeals/ToddlerMealFeedScreen.tsx` — feed chips + last meal save
- `services/analytics/analyticsEvents.ts`, `analytics.ts`, `index.ts` — 6 toddler weekly events
- `data/recipes/index.ts` — toddler weekly exports
- `app/_layout.tsx` — route registration
- `package.json` — `test:toddler-weekly-plan`
- `scripts/test-analytics-events.ts` — 45 events, toddler weekly assertions

**Not changed:** recipe catalog/recipes, toddler feed selector, toddler search/filter logic, baby/elementary weekly generators, home rec engine, toddler Home/Fridge exclusion.

---

## TEST_RESULTS

```
npm run test:toddler-weekly-plan       → PASS
npm run test:analytics-events          → PASS (45 events)
npm run test:toddler-feed              → PASS (74 / 15·19·24·16)
npm run test:child-search-filter       → PASS
npm run test:baby-weekly-plan          → PASS
npm run test:baby-batch-cooking        → PASS
npm run test:weekly-plan               → PASS (elementary breakfast)
npm run test:elementary-dinner-weekly-plan → PASS
npm run test:family-audience           → PASS
npm run test:home-final-qa             → PASS
```

---

## REGRESSIONS

| Check | Status |
|-------|--------|
| Toddler feed 74 (15/19/24/16) | PASS |
| Toddler search/filter (state separate from weekly) | PASS |
| Baby weekly 70 | PASS |
| Baby batch cooking | PASS |
| Elementary breakfast weekly 45 | PASS |
| Elementary dinner weekly 17 | PASS |
| Toddler Home/Fridge exclusion 144 | PASS |
| No recipe edits | PASS |

---

## RISKS

1. **Smallest pool (breakfast 15)** — refresh diversity limited; phased search may occasionally need alternate seed attempts.
2. **Shared last-meal key** — feed → weekly remembers last meal tab; per-meal *plans* remain independent.
3. **Collision exclusion** — weekly pool ⊆ feed pool when collision-flagged toddler recipes exist (counts currently match feed).

---

## READY_FOR_BABY_GROCERY_CHECKLIST

**YES** — toddler weekly is additive; baby batch cooking and grocery aggregation paths unchanged.

---

## READY_FOR_CHILD_MEAL_PLANNING_QA

**YES** — toddler weekly MVP complete with generator, UI, persistence, share/save, analytics, and full regression PASS.
