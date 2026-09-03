# HANKKI Sprint 5.2 — Weekly Share Card Final Visual Upgrade

**Date:** 2026-09-03  
**Scope:** Elementary breakfast + dinner weekly share image (design/layout only)  
**Status:** PASS

---

## SHARE_RATIO

**4:5** (360×450 logical)

---

## SHARE_RESOLUTION

**1080×1350** capture output (`view-shot` unchanged)

---

## CARD_LAYOUT

| Zone | Content |
|------|---------|
| Header | `초등학생 아침/저녁` → `일주일 식단` → benefit (max 2 lines) |
| Body | Mon–Sat 2×3 grid + Sunday full-width |
| Footer | Shopping hint (≤6) + brand (small) |

Per meal cell: **요일 · 큰 음식 사진 · 메뉴명 · 조리시간** only.

---

## IMAGE_RATIO

- Grid: `flex: 1` + `SHARE_GRID_IMAGE_MIN_HEIGHT = 62` → targets **~55–65%** of meal cell
- Documented preferred frame: `SHARE_GRID_IMAGE_ASPECT_RATIO = 5/4`
- Fixed 50px strip height: **removed** (prior sprints)

---

## IMAGE_VISIBILITY

- `MealImageView` `variant="hero"` + emoji fallback retained
- Day badge overlays photo (does not steal vertical text space)
- Cover crop container is taller (min 62px) to avoid thin-strip “face crop”
- Missing image → emoji fallback preserved

---

## MON_SAT_LAYOUT

2 columns × 3 rows  
Each cell: day badge on photo → large photo → menu name (2 lines) → cook time

---

## SUNDAY_LAYOUT

Full-width standalone card (`SHARE_SUNDAY_CARD_HEIGHT = 92`):

```
[요일 badge on image]
[넓은 음식 사진]
[메뉴명 · 조리시간]
```

Footer `flexShrink: 0` — no overlap with shopping/brand.

---

## INFO_REMOVED

- Seed / SeedMascot
- recipeId
- tip card / tip title-body
- ingredient hints on meal cells
- foodPoint badges
- quality grade / reviewed / QA internals
- `adjustsFontSizeToFit` shrink (prefer natural 2-line wrap)

---

## SHOPPING_HINT

Safe weekly extraction, **max 6** ingredients (was 7), stopwords filtered.  
Example shape: `계란 · 우유 · 바나나 · 치즈 · 감자 · …`  
No shopping feature / CTA built.

---

## BRANDING

```
한끼
우리 아이 밥 고민을 덜어드려요
```

Small footer only — brand secondary to food photos.

---

## BREAKFAST_PREVIEW

`/qa/elementary-weekly-share` — switch chip **아침 7일**  
Uses `ElementaryWeeklyShareCardPreview` → same `ElementaryWeeklyShareCard` as capture.

---

## DINNER_PREVIEW

Same QA route — switch chip **저녁 7일**  
Identical card component + dinner copy.

---

## SAVED_IMAGE_MATCHES_PREVIEW

**YES** — Preview only scales (`min(90vw, 560px)`); capture host still renders unscaled `ElementaryWeeklyShareCard` at 360×450 → 1080×1350.

Asserted: breakfast/dinner screens + QA preview all import the same card component.

---

## OVERLAP_TEST

| Check | Result |
|-------|--------|
| Body `flex: 1` + `minHeight: 0` | PASS |
| Footer `flexShrink: 0` | PASS |
| Sunday fixed height | PASS |
| Shopping/brand below Sunday | PASS |

---

## LONG_TITLE_TEST

`numberOfLines={2}` on menu names; no `ellipsizeMode`; seed model build does not crash (Sprint 5 regression).

---

## WEB_EXPORT

```
npx expo export --platform web → Exported: dist (PASS)
```

---

## SAVE_TEST

Capture pipeline wired (`captureElementaryBreakfastShareCard` / `captureElementaryDinnerShareCard`) — static QA **PASS** (opaque host, view-shot, media library save).

---

## SHARE_TEST

OS share sheet path unchanged — static QA **PASS**.

---

## QA Commands

```bash
npx tsx scripts/test-elementary-weekly-sprint5-2-share.ts   # PASS
npx tsx scripts/test-elementary-weekly-sprint5-1-share.ts   # PASS
npx tsx scripts/test-elementary-weekly-sprint5-share.ts      # PASS
npx tsx scripts/test-elementary-breakfast-weekly-plan-share.ts # PASS
npx expo export --platform web                               # PASS
```

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `constants/elementaryWeeklyShareCardLayout.ts` | Image min 62, Sunday 92, padding tune |
| `components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx` | Photo-first grid + stacked Sunday |
| `components/elementaryWeekly/ElementaryWeeklyShareCard.tsx` | Compact header/footer, 2-line subtitle |
| `components/elementaryWeekly/ElementaryWeeklyShareCardPreview.tsx` | Unchanged (still scales same card) |
| `components/qa/ElementaryWeeklyShareQaScreen.tsx` | Breakfast/dinner switch |
| `constants/elementaryBreakfastWeeklyPlanCopy.ts` | Subtitle + brand tagline |
| `constants/elementaryDinnerWeeklyPlanCopy.ts` | Subtitle + brand tagline |
| `services/weeklyPlan/elementaryWeeklyShareCardModel.ts` | Shopping hint max 6 |
| `scripts/test-elementary-weekly-sprint5-2-share.ts` | Expanded final QA |
| `scripts/reports/HANKKI_SPRINT_5_2_REPORT.md` | This report |

**Not changed:** weekly generators, recipe DB, AdMob/Coupang, iOS config, shopping feature.

---

## RESULT

**PASS**

Share card is food-photo-first card-news: larger images, readable menu names when phone-scaled, Sunday isolated, shopping hint compact, QA preview large with meal switch, preview ≡ capture layout. Awaiting next sprint.
