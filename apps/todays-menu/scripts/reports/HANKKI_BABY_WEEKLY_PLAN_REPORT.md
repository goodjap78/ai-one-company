# HANKKI_BABY_WEEKLY_PLAN_REPORT

Sprint: HANKKI v1.1 — Baby Weekly Menu Plan  
Date: 2026-08-29

---

## STAGE_COUNTS

| Stage | Label | Eligible |
|-------|-------|----------|
| early | 시작기 | **17** |
| middle | 적응기 | **17** |
| late | 확장기 | **17** |
| completion | 전환기 | **19** |

**Total baby weekly eligible: 70** (same approved baby feed pool; honey-listed recipes excluded from weekly generator only).

---

## EARLY_ELIGIBLE: 17
## MIDDLE_ELIGIBLE: 17
## LATE_ELIGIBLE: 17
## COMPLETION_ELIGIBLE: 19

---

## WEEK_GENERATED

**YES** — MON–SUN 7 unique slots per stage, deterministic by seed. All four stages generate successfully.

---

## SAMPLE_EARLY_WEEK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 애호박미음 | 20m |
| TUE | 두부당근죽 | 25m |
| WED | 콜리플라워미음 | 30m |
| THU | 소고기시금치죽 | 30m |
| FRI | 당근미음 | 30m |
| SAT | 닭고기미음 | 35m |
| SUN | 단호박미음 | 25m |

## SAMPLE_MIDDLE_WEEK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 단호박쌀죽 | 25m |
| TUE | 계란죽 | 20m |
| WED | 닭고기브로콜리죽 | 30m |
| THU | 두부채소죽 | 25m |
| FRI | 배퓌레 | 20m |
| SAT | 소고기당근죽 | 28m |
| SUN | 감자당근죽 | 25m |

## SAMPLE_LATE_WEEK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 닭고기무른밥 | 30m |
| TUE | 찐배 | 25m |
| WED | 소고기애호박무른밥 | 35m |
| THU | 브로콜리진밥 | 30m |
| FRI | 이유식계란찜 | 15m |
| SAT | 닭고기애호박죽 | 30m |
| SUN | 찐사과배 | 25m |

## SAMPLE_COMPLETION_WEEK

Seed `42`:

| Day | Menu | Time |
|-----|------|------|
| MON | 감자당근진밥 | 30m |
| TUE | 감자계란찜 | 20m |
| WED | 닭고기채소국밥 | 35m |
| THU | 김가루주먹밥 | 25m |
| FRI | 흰살생선애호박진밥 | 35m |
| SAT | 채소밥볼 | 30m |
| SUN | 흰살생선구이밥 | 35m |

---

## DIVERSITY_RULES

**Hard (never relaxed):**
- 7 unique recipeIds per week
- selected stage only (`babyFood.stage` match)
- approved explicit baby feed eligibility
- honey-listed recipes excluded
- no consecutive identical menu family (`familyKey` streak ≤ 1)

**Best effort (phased search, safety never relaxed):**
- protein group streak ≤ 2 (relaxed in later phases if needed)
- veg/fruit group streak ≤ 2
- texture group streak ≤ 2
- refresh tries alternate seeds and avoids identical recipe set when possible

**Not applied this sprint:**
- batch cooking badge on cards (deferred — avoid clutter)
- multi-recipe portion aggregation on weekly screen

---

## SAFETY_GUIDANCE

Non-prescriptive copy on weekly screen:

- 「이미 먹어본 재료를 중심으로 활용해보세요.」
- 「새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.」
- 「1세 미만에는 꿀을 주지 마세요.」
- Source: 질병관리청 이유식 안내를 참고했어요.

App does **not** prescribe day order, allergy intervals, or new-food introduction schedules.

---

## ENTRY_POINT

| Surface | Entry |
|---------|-------|
| **Baby feed** (`/baby-food`) | `[메뉴 찾기]` (current) + `[이번 주 메뉴]` chip → weekly |
| **Baby weekly** (`/baby-food-week`) | 「메뉴 찾기」 link back to feed |

Stage tabs shared via `babyFoodFeedStageStorage` (same last-selected stage on both screens).

---

## ROUTE

`/baby-food-week` (`BABY_FOOD_WEEKLY_HREF`)

---

## REFRESH

「다른 일주일 골라보기」 — new seed via `createBabyWeeklyPlanSeed()`, regenerate with `avoidRecipeIds` best-effort, save on success; alert + keep existing plan on failure; in-flight guard.

---

## PERSISTENCE

Stage-scoped AsyncStorage keys (independent plans per stage):

| Stage | Key |
|-------|-----|
| early | `@hankki/baby_weekly_plan/early` |
| middle | `@hankki/baby_weekly_plan/middle` |
| late | `@hankki/baby_weekly_plan/late` |
| completion | `@hankki/baby_weekly_plan/completion` |

Switching stage loads that stage's saved plan or generates a new one. No account/profile required.

---

## SAVE

PNG 1080×1350 (4:5) via `captureBabyWeeklyShareCard` → shared `weeklyPlanShare.ts` → MediaLibrary.

Button: 「식단 이미지 저장」

---

## SHARE

OS share sheet; text: `이번 주 우리 아이 이유식 메뉴 🍼\n한끼에서 골라봤어요.`

Share card: **이번 주 이유식 메뉴** + stage line + MON–SUN names + 한끼 branding. Minimal safety text on card.

---

## PORTION_INTEGRATION

Weekly screen shows cook time only. **No 1/3/6 aggregation** on weekly plan.

Card tap → existing `/recipe/:id` detail with `BabyPortionPresetSelector` (1/3/6) unchanged.

---

## ANALYTICS

Dedicated baby weekly events (no `mode` param):

| Event | Payload |
|-------|---------|
| `baby_weekly_plan_view` | `stage`, `seed` |
| `baby_weekly_plan_stage_change` | `stage` |
| `baby_weekly_plan_refresh` | `stage`, `seed` |
| `baby_weekly_plan_recipe_click` | `stage`, `seed`, `recipe_id` |
| `baby_weekly_plan_share` | `stage`, `seed` |
| `baby_weekly_plan_save` | `stage`, `seed` |

No menu names, age, or PII. Total analytics events: **35**.

---

## FILES_CHANGED

**New**
- `data/recipes/babyWeeklyPlan.ts`
- `constants/babyWeeklyPlanCopy.ts`
- `services/weeklyPlan/babyWeeklyPlanStorage.ts`
- `services/weeklyPlan/babyWeeklyPlanDisplay.ts`
- `services/weeklyPlan/babyWeeklyPlanShare.ts`
- `components/babyFood/BabyFoodWeeklyPlanScreen.tsx`
- `app/baby-food-week.tsx`
- `scripts/test-baby-weekly-plan.ts`
- `scripts/reports/HANKKI_BABY_WEEKLY_PLAN_REPORT.md`

**Modified**
- `constants/appRoutes.ts` — `BABY_FOOD_WEEKLY_HREF`
- `constants/babyFoodFeedCopy.ts` — weekly chip labels
- `components/babyFood/BabyFoodFeedScreen.tsx` — `[메뉴 찾기]` / `[이번 주 메뉴]` chips
- `components/elementaryWeekly/ElementaryWeeklyPlanShareCard.tsx` — optional stage line
- `services/analytics/analyticsEvents.ts`, `analytics.ts`, `index.ts`
- `data/recipes/index.ts` — baby weekly exports
- `app/_layout.tsx`, `package.json`, `scripts/test-analytics-events.ts`

**Not changed:** baby recipes, baby feed selector logic, toddler/elementary weekly generators, home rec engine.

---

## TEST_RESULTS

```
npm run test:baby-weekly-plan              → PASS
npm run test:baby-food-ui                  → PASS
npm run test:child-search-filter           → PASS
npm run test:child-detail-implementation   → PASS
npm run test:weekly-plan                   → PASS (breakfast regression)
npm run test:elementary-dinner-weekly-plan → PASS
npm run test:analytics-events              → PASS (35 events)
npm run test:family-audience               → PASS
npm run test:home-final-qa                 → PASS
```

---

## REGRESSIONS

| Check | Status |
|-------|--------|
| Baby feed 70 (17/17/17/19) | PASS |
| Baby search/filter | PASS |
| Baby 1/3/6 detail | PASS |
| Elementary breakfast weekly 45 | PASS |
| Elementary dinner weekly 17 | PASS |
| No recipe edits | PASS |

---

## RISKS

1. **Small pools (17 per stage)** — refresh diversity limited; familyKey hard rule may occasionally require alternate seed attempts.
2. **Shared stage storage with feed** — last-selected stage syncs between feed and weekly (intentional UX; stage-specific *plans* remain separate).
3. **Honey exclusion** — weekly pool may be ≤ feed pool if honey-listed recipes exist in a stage (currently counts match feed).

---

## READY_FOR_TODDLER_WEEKLY

**YES** — same pattern (stage/meal-scoped generator + per-scope storage + shared share card) applies to toddler weekly MVP.

---

## READY_FOR_BABY_MULTI_RECIPE_BATCH_COOKING

**NO** — multi-recipe ingredient aggregation and weekly batch-cooking totals are deferred to a separate sprint (portion UI stays per-recipe on detail only).
