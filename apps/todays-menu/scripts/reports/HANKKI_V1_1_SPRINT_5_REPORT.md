# HANKKI_V1_1_SPRINT_5_REPORT

Date: 2026-09-02  
Scope: Elementary weekly share card design upgrade (save/share image)  
Project: `apps/todays-menu`

---

## CURRENT_SHARE_IMAGE (before)

| Aspect | State |
|---|---|
| **Capture** | `react-native-view-shot` `captureRef` on off-screen View |
| **Resolution** | 360×450 logical → **1080×1350** PNG (`pixelRatio: 3`) |
| **Ratio** | **4:5** |
| **Layout** | Plain text table — weekday / menu name / time in rows |
| **Food photos** | **None** — text only |
| **Branding** | Seed mascot + 한끼 wordmark at bottom |
| **Android / Web** | Same view-shot path; web export supported |

### Design problems (why it felt unshareable)

1. **No food imagery** — reads like a spreadsheet, not a meal plan card
2. **Flat list** — no visual hierarchy or card structure
3. **Low emotional appeal** — nothing mothers would save to camera roll or post
4. **Weak scanability** — 7 rows of similar text blur together at phone thumbnail size

---

## NEW_SHARE_IMAGE (after)

| Aspect | State |
|---|---|
| **Component** | `ElementaryWeeklyShareCard` — SNS card-news layout (separate from in-app list UI) |
| **Grid** | **2-column** meal cells: 월·화 / 수·목 / 금·토 / 일·팁 |
| **Per cell** | Day badge, **hero food photo**, menu name, cook time, 1–2 ingredients, qualitative food point |
| **Tip cell** | “이번 주 팁” benefit card (replaces empty 8th slot) |
| **Shopping hint** | Top recurring main ingredients across the week (omitted if &lt;3 safe items) |
| **Branding** | Small Seed (22px) in header; compact 한끼 footer |
| **Nutrition** | **No** calorie/protein gram values — qualitative tags only |

---

## SHARE_RATIO

**4:5** (360×450 → 1080×1350) — unchanged capture constants

---

## SHARE_RESOLUTION

**1080 × 1350** PNG via `WEEKLY_PLAN_SHARE_OUTPUT_WIDTH/HEIGHT`

---

## FILES_CHANGED

| File | Change |
|---|---|
| `components/elementaryWeekly/ElementaryWeeklyShareCard.tsx` | **Added** — card-news share layout |
| `components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx` | **Added** — per-day cell with image |
| `components/elementaryWeekly/ElementaryWeeklyShareTipCell.tsx` | **Added** — tip card |
| `services/weeklyPlan/elementaryWeeklyShareCardModel.ts` | **Added** — food point + shopping hint builders |
| `services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay.ts` | `buildElementaryBreakfastWeeklyShareCardModel()` |
| `services/weeklyPlan/elementaryDinnerWeeklyPlanDisplay.ts` | `buildElementaryDinnerWeeklyShareCardModel()` |
| `constants/elementaryBreakfastWeeklyPlanCopy.ts` | Share card copy fields |
| `constants/elementaryDinnerWeeklyPlanCopy.ts` | Share card copy fields |
| `components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx` | Uses new share card + model |
| `components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx` | Uses new share card + model |
| `components/qa/ElementaryWeeklyShareQaScreen.tsx` | **Added** — dev preview |
| `components/qa/ElementaryWeeklyShareQaEntry.tsx` | **Added** — My tab QA entry |
| `app/qa/elementary-weekly-share.tsx` | **Added** — gated dev route |
| `app/_layout.tsx` | Register QA route |
| `components/my/MyAppSettingsSection.tsx` | QA entry link |
| `scripts/test-elementary-weekly-sprint5-share.ts` | **Added** |
| `scripts/test-elementary-breakfast-weekly-plan-share.ts` | Updated for new component |
| `scripts/test-elementary-dinner-weekly-plan.ts` | Updated assertions |
| `scripts/test-elementary-weekly-sprint4-ui.ts` | Updated share component path |

**Unchanged:** `ElementaryWeeklyPlanShareCard` (legacy list layout for baby/toddler weekly), generators, recipe DB, capture/save/share services, in-app weekly screen layout.

---

## REAL_IMAGES

**YES** — `ElementaryWeeklyShareMealCell` uses `resolveMealHeroImage` + `MealImageView` with `showEmojiFallback`.

---

## TWO_COLUMN_LAYOUT

**YES** — 4 rows × 2 columns (7 meals + 1 tip cell).

---

## DAY_LABELS

**YES** — Orange soft badge per cell (`월` … `일`).

---

## COOK_TIME

**YES** — Shown in meta line per meal (`12분`).

---

## CORE_INGREDIENTS

**YES** — Up to 2 main ingredients in meta line (`계란 · 밥`).

---

## FOOD_POINT

**YES** — Qualitative badge only: `10분 완성`, `단백질`, `한 그릇`, `채소 포함` — **no nutrition numbers**.

---

## SHOPPING_HINT

**YES (when safe)** — `이번 주 장보기 힌트` from recurring week ingredients; omitted if fewer than 3 distinct items after stopword filter. Not a shopping-list feature.

---

## BRANDING

Small header mascot + footer `한끼` / `우리 가족 오늘 뭐 먹지?` — content-first, brand secondary.

---

## BREAKFAST_SHARE

**YES** — `일주일 아침 식단` + breakfast-specific tip copy.

---

## DINNER_SHARE

**YES** — `일주일 저녁 식단` + dinner-specific tip copy.

---

## WEB_PREVIEW

**Dev route:** `/qa/elementary-weekly-share`  
- Gated by `isInternalQaEnabled()` (`__DEV__` or `EXPO_PUBLIC_QA_TOOLS=1`)  
- Production redirects to `/`  
- My tab → “QA Elementary Weekly Share” (dev only)  
- Shows breakfast + dinner cards at seed 42

---

## SAVE_TEST

**PASS** — capture pipeline unchanged (`captureRef`, opaque host, MediaLibrary save).

---

## SHARE_TEST

**PASS** — `test-elementary-breakfast-weekly-plan-share.ts` + Sprint 5 QA.

---

## REGRESSION

| Test | Result |
|---|---|
| `test-elementary-weekly-sprint5-share.ts` | **PASS** |
| `test-elementary-breakfast-weekly-plan-share.ts` | **PASS** |
| `test-elementary-breakfast-weekly-plan.ts` | **PASS** |
| `test-elementary-dinner-weekly-plan.ts` | **PASS** |
| `test-elementary-weekly-sprint4-ui.ts` | **PASS** |
| `npx expo export --platform web` | **PASS** |

---

## ISSUES_FOUND

1. **Compact 360px canvas** — very long menu names rely on `numberOfLines={2}` + `adjustsFontSizeToFit`; manual screenshot QA recommended.
2. **Baby/toddler weekly** still use legacy list share card — out of scope; elementary only upgraded.

---

## SCREENSHOT_QA_REQUIRED

**YES** — Verify visual balance, image crops, and Korean line breaks on real device capture.

---

## RESULT

**PASS**

---

## Dev preview

```
# Web dev server, then:
/qa/elementary-weekly-share

# Or My tab → QA Elementary Weekly Share (__DEV__ only)
```

## Test command

```bash
cd apps/todays-menu
npx tsx scripts/test-elementary-weekly-sprint5-share.ts
npx expo export --platform web
```

---

*Next sprint: on hold per instruction.*
