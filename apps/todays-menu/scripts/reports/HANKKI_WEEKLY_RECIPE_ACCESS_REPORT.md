# HANKKI_WEEKLY_RECIPE_ACCESS_REPORT

**Date:** 2026-09-08  
**Scope:** Weekly card → recipe detail discoverability + 7-recipe index.  
No generator / recipe DB / AdMob / Coupang / EAS.

---

## CURRENT_CARD_BEHAVIOR

All four week types **already** opened recipe detail on card tap:

`haptic` → analytics (`recipe_id` + `seed`) → `setRecipeOpenSource('kids_weekly_plan')` → `router.push(/recipe/{recipeId})` → `/ingredients/{id}`.

No new tap routing was added. Discoverability only.

---

## CARD_PRESSABLE

**YES** — shared `ElementaryWeeklyPlanDayCard` remains a full-card `Pressable` (photo + name + hint + time).

## RECIPE_VIEW_CTA

**YES** — quiet caption under cook time: `레시피 보기 ›`  
Smaller/lighter than the menu name. Standalone right chevron removed to avoid a double ›.

---

## ELEMENTARY_BREAKFAST

**PASS** — `/elementary-breakfast-week` card + CTA → `/recipe/{slot.recipeId}`  
Index CTA source: `elementary-breakfast`

## ELEMENTARY_DINNER

**PASS** — `/elementary-dinner-week` same shared card + CTA  
Index CTA source: `elementary-dinner`

## TODDLER_BREAKFAST

**PASS** — `ToddlerBfDnWeeklyPlanScreen` breakfast  
Index CTA source: `toddler-breakfast`

## TODDLER_DINNER

**PASS** — same screen, dinner  
Index CTA source: `toddler-dinner`

---

## WEEKLY_RECIPE_INDEX

**PASS** — secondary CTA `이번 주 7개 레시피 보기` under the 7 day cards.

Route: `/weekly-recipes?source=…`  
Lists **current stored** `plan.slots` Mon–Sun (day, image, name, cook time, `레시피 보기 ›`).  
Same `recipeId`s as the week. No new recipe data.

Back → source week. Hankki logo → home.

## REGENERATE_SYNC

**PASS** — index does **not** snapshot IDs in the URL.  
`useFocusEffect` reloads `loadCurrentWeeklyPlanForIndex(source)` from the same AsyncStorage the week screen writes on generate/refresh.

Old `recipeId`s cannot linger after “다른 일주일 추천”.

---

## RECIPE_DETAIL_FIELDS

Existing `/ingredients/{id}` (unchanged route):

| Field | Surface |
|-------|---------|
| 메뉴명 | title |
| 음식 이미지 | `RecipeHeroImage` |
| 몇 인분 | `RecipeInfoMeta` + serving adjuster |
| 재료 + 분량 | `RecipeIngredientsList` (scaled) |
| 조리시간 | `RecipeInfoMeta` |
| 준비시간 | quality extras when reviewed/verified + `prepTimeMinutes` |
| 조리순서 | `RecipeStepsList` |
| 아이용 조절 팁 / 대체 재료 / 보관 / 재가열 | `ElementaryDetailExtraSections` |

**Toddler gap closed:** Sprint 9 quality fields (`kidAdjustmentTip`, substitutes, storage, reheat, prep) now also render in `ToddlerDetailExtraSections` when status is `reviewed`/`verified`. Content only — no DB change.

## QUALITY_METADATA_HIDDEN

**YES** — A/B/C `recipeQualityGrade`, `reviewed` / `unverified` labels are not shown. Gate stays internal.

---

## SHARE_CARD_RECIPE_COPY

**YES** — tiny footer line under the tagline: `레시피는 한끼 앱에서 확인하세요`  
No QR. Share PNG stays non-interactive.

---

## WEB_EXPORT

**PASS** — `npx expo export --platform web` exit 0  
Temp output only (not committed).

## REGRESSION

**PASS**

- `test:weekly-recipe-access`
- `test:toddler-sprint12-weekly-ui`
- `test:weekly-plan-ui`
- `test:child-detail-implementation`
- `test-elementary-weekly-sprint5-share`
- `test-elementary-weekly-sprint5-3-share`

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `constants/weeklyRecipeAccessCopy.ts` | Shared CTA / index / share hint copy |
| `constants/appRoutes.ts` | `/weekly-recipes` + `weeklyRecipesHref` |
| `services/weeklyPlan/weeklyRecipeIndex.ts` | Live storage load + slot display |
| `components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx` | `레시피 보기 ›` |
| `components/elementaryWeekly/WeeklyRecipeIndexLink.tsx` | Secondary CTA |
| `components/weeklyRecipes/WeeklyRecipeIndexScreen.tsx` | 7-recipe list |
| `app/weekly-recipes.tsx` | Route |
| `app/_layout.tsx` | Stack screen |
| Four weekly copy files + `ElementaryWeeklyShareCard.tsx` | Share hint |
| Three week screens | Index link |
| `components/recipe/ChildDetailSections.tsx` | Toddler quality user fields |
| `scripts/test-weekly-recipe-access.ts` | QA |
| `package.json` | `test:weekly-recipe-access` |

---

## RESULT

**PASS**
