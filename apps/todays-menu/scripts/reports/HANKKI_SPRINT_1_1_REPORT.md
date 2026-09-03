# HANKKI_SPRINT_1_1_REPORT

Date: 2026-09-01  
Scope: Home UX cleanup — purpose-specific submenus, reduced visual clutter

---

## FILES_CHANGED

| File | Change |
|---|---|
| `components/home/HomeScreen.tsx` | Purpose-gated submenu: `HomeFeatureCards` (today only) / `HomePurposeSubPanel` (kids & weekly only) |
| `components/home/HomePurposeSubPanel.tsx` | Removed duplicate section title; row layout aligned with feature cards |
| `components/home/HomePurposeCards.tsx` | Description shown only on active card; `minHeight` 72→64 |
| `constants/homeIaCopy.ts` | Kids submenu labels: `이유식`, `유아식`, `초등학생` |
| `scripts/test-baby-food-ui.ts` | Assert home submenu title `이유식` |
| `scripts/test-toddler-meal-feed.ts` | Assert home submenu title `유아식` |
| `scripts/test-sprint-1-1-home-ux.ts` | **Added** — Sprint 1.1 static QA |

**Unchanged:** routes, `useHomeScreen` recommendation logic, tab navigation, AdMob web stubs.

---

## DEFAULT_PURPOSE

`useState<HomePurposeId>('today')` — first entry shows **오늘 뭐 먹지?** selected.

---

## TODAY_SUBMENU

Shown only when `activePurpose === 'today'`:

| Button | Action |
|---|---|
| 집밥 | `handleMealModeChange('homemade')` |
| 편의점 꿀조합 | `/convenience-combos` |
| 냉장고 털기 | `/fridge-raid` |

Kids / weekly sub-rows hidden.

---

## KIDS_SUBMENU

Shown only when `activePurpose === 'kids'`:

| Button | Route |
|---|---|
| 이유식 | `/baby-food` |
| 유아식 | `/toddler-meals` |
| 초등학생 | `/elementary-browse` |

No repeated “아이 뭐 먹이지?” heading (purpose card is the label). Today feature row hidden.

---

## WEEKLY_SUBMENU

Shown only when `activePurpose === 'weekly'`:

| Button | Route |
|---|---|
| 초등 아침 7일 | `/elementary-breakfast-week` |
| 초등 저녁 7일 | `/elementary-dinner-week` |

Today / kids sub-rows hidden.

---

## RECOMMENDATION_PRESERVED

- `TodayMealCard`, `MealTimeSlotTabs`, `AlternativeMealsRow` unchanged below submenu
- `useHomeScreen` hook and accept/refresh/alternative flows untouched
- Only one submenu row at a time → recommendation area no longer pushed down by stacked menus

---

## WEB_PREVIEW

| Check | Result |
|---|---|
| `npx expo export --platform web` | **PASS** (exit 0) |
| AdMob web stubs from Sprint web fix | Still effective |

---

## REGRESSION

| Test | Result |
|---|---|
| `test-sprint-1-1-home-ux.ts` | **PASS** |
| `test-home-final-qa.ts` | **PASS** |
| `test-baby-food-ui.ts` | **PASS** |
| `test-toddler-meal-feed.ts` | **PASS** |

---

## RESULT

**PASS**

Purpose-first IA retained; submenu clutter and duplicate “아이 뭐 먹이지?” copy removed. One intent → one submenu row.

---

*Next sprint: on hold per instruction.*
