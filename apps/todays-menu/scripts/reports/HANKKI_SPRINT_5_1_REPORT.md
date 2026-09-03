# HANKKI Sprint 5.1 — Weekly Share Card Image Crop Fix

**Date:** 2026-09-02  
**Scope:** Elementary breakfast + dinner weekly share card layout only  
**Status:** PASS

---

## ROOT_CAUSE

`ElementaryWeeklyShareMealCell` used a fixed `imageWrap` height of **44px** inside flex rows that compressed each grid cell to ~88px tall within a 450px card. With `resizeMode: cover`, food photos were cropped into thin horizontal strips where only a sliver of the dish was visible.

---

## CARD_HEIGHT_BEFORE

| Element | Value |
|---------|-------|
| Grid cell | ~88px (flex-compressed, no fixed height) |
| Food image | **44px** fixed (~50% of cell, but too short for cover crop) |
| Sunday | Paired with tip cell in 2-col grid |
| Tip | Separate grid cell (`ElementaryWeeklyShareTipCell`) |

---

## CARD_HEIGHT_AFTER

| Element | Value |
|---------|-------|
| Grid cell | **86px** fixed (`SHARE_GRID_CELL_HEIGHT`) |
| Food image | **50px** fixed (`SHARE_GRID_IMAGE_HEIGHT`) |
| Image area ratio | **58%** of cell height |
| Sunday row | **72px** full-width (`SHARE_SUNDAY_ROW_HEIGHT`) |
| Sunday image | **64×64px** (`SHARE_SUNDAY_IMAGE_SIZE`) |

Layout constants centralized in `constants/elementaryWeeklyShareCardLayout.ts`.

---

## IMAGE_LAYOUT

- Grid cards: `[day badge on image]` → `[50px food photo]` → `[menu name]` → `[cook time · ingredient hint]`
- Badge overlays top-left of image (no separate badge row stealing height)
- `MealImageView` with explicit container height; `cover` crop now shows recognizable food shape
- Long menu names: `numberOfLines={2}` + `adjustsFontSizeToFit` + `minimumFontScale`
- Removed `foodPoint` badge from share cells (less text clutter)

---

## SUNDAY_LAYOUT

- Full-width horizontal card (`variant="sunday"`)
- Left: 64×64 food image
- Right: day badge + menu name + meta
- No longer paired with tip cell in 2-column grid

---

## TIP_LAYOUT

- Moved from grid cell to footer `tipBlock` (compact text section)
- `ElementaryWeeklyShareTipCell` no longer used in share card
- Tip title + body above shopping hint and brand footer

---

## SEED_REMOVED

- `SeedMascot` removed from `ElementaryWeeklyShareCard` header
- No `recipeId`, seed, or QA debug text rendered on share image
- Brand footer: 한끼 wordmark + “우리 가족 오늘 뭐 먹지?” tagline only

---

## BREAKFAST_PREVIEW

- Route: `/qa/elementary-weekly-share` (internal QA, `isInternalQaEnabled()`)
- `ElementaryWeeklyShareQaScreen` renders `ElementaryWeeklyShareCard` with breakfast model
- Breakfast weekly plan screen uses same share card component

---

## DINNER_PREVIEW

- Same `ElementaryWeeklyShareCard` + `ElementaryWeeklyShareMealCell` for dinner weekly plan
- Identical layout constants and image geometry

---

## WEB_EXPORT

```
npx expo export --platform web
→ Exported: dist
```

---

## QA Commands

```bash
npx tsx scripts/test-elementary-weekly-sprint5-1-share.ts   # PASS
npx tsx scripts/test-elementary-weekly-sprint5-share.ts      # PASS (updated)
npx tsx scripts/test-elementary-breakfast-weekly-plan-share.ts # PASS (updated)
npx expo export --platform web                               # PASS
```

---

## Browser QA Checklist

| Check | Result |
|-------|--------|
| 7 food photos recognizable | ✅ |
| No horizontal strip crop | ✅ |
| Menu names readable | ✅ |
| 1080×1350 no overflow | ✅ |
| Sunday full-width | ✅ |
| Shopping hint footer | ✅ |
| Seed not shown | ✅ |
| Web export | ✅ PASS |

**Preview:** Start dev server → navigate to `/qa/elementary-weekly-share`

---

## Files Changed

- `constants/elementaryWeeklyShareCardLayout.ts` (new)
- `components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx`
- `components/elementaryWeekly/ElementaryWeeklyShareCard.tsx`
- `scripts/test-elementary-weekly-sprint5-1-share.ts` (new)
- `scripts/test-elementary-weekly-sprint5-share.ts`
- `scripts/test-elementary-breakfast-weekly-plan-share.ts`

---

## RESULT

**PASS** — Share card refactored to food-photo-first card-news layout. 4:5 ratio preserved. Mon–Sat 2-col grid with 58% image area. Sunday full-width. Tip in footer. Seed/dev info removed. Breakfast and dinner share cards share the same layout. Awaiting next sprint instructions.
