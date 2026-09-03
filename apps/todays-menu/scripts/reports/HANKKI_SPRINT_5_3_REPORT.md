# HANKKI Sprint 5.3 — Weekly Share Card Text Readability Fix

**Date:** 2026-09-03  
**Scope:** Mon–Sat menu name clipping under food photos  
**Status:** PASS

---

## PROBLEM

Sprint 5.2 made food photos large via `flex: 1` on the image frame. With cell `overflow: 'hidden'`, the photo consumed vertical space and **clipped menu names** below the image.

---

## FIX

### Mon–Sat cell split

| Zone | Flex | Behavior |
|------|------|----------|
| Image | **0.68** (~65–70%) | `flexShrink: 1`, yields when row is tight |
| Text band | **0.32** (~30–35%) | `flexShrink: 0`, `minHeight: 34` — **never clipped** |

Text band is a separate cream (`#FFFCF7`) strip under the photo — no overlay, no overlap.

### Menu name

- Max **2 lines**, natural wrap
- No `adjustsFontSizeToFit` / no `ellipsizeMode`
- Cook time: small text, bottom-right of text band (`alignSelf: 'flex-end'`)

### Title

- Breakfast: **초등학생 아침 7일 식단**
- Dinner: **초등학생 저녁 7일 식단**

### Sunday

Full-width preserved: wide photo (~70%) + cream text band with name · time.

### Shopping hint

Font **9 / 12** (was 8 / 11), up to 2 lines for readability.

---

## QA

| Check | Result |
|-------|--------|
| Mon–Sun names present (breakfast + dinner seed 42) | PASS |
| Image/text flex 0.68 / 0.32 | PASS |
| Cream text band reserved | PASS |
| 1080×1350 / 4:5 | PASS |
| Preview ≡ capture card | PASS |
| Sprint 5 / 5.1 / 5.2 / breakfast share regression | PASS |

```bash
npx tsx scripts/test-elementary-weekly-sprint5-3-share.ts  # PASS
npx tsx scripts/test-elementary-weekly-sprint5-2-share.ts  # PASS
npx tsx scripts/test-elementary-weekly-sprint5-1-share.ts  # PASS
npx tsx scripts/test-elementary-weekly-sprint5-share.ts     # PASS
npx tsx scripts/test-elementary-breakfast-weekly-plan-share.ts # PASS
```

---

## FILES_CHANGED

- `constants/elementaryWeeklyShareCardLayout.ts`
- `components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx`
- `components/elementaryWeekly/ElementaryWeeklyShareCard.tsx`
- `constants/elementaryBreakfastWeeklyPlanCopy.ts`
- `constants/elementaryDinnerWeeklyPlanCopy.ts`
- `scripts/test-elementary-weekly-sprint5-3-share.ts` (new)
- `scripts/test-elementary-weekly-sprint5-2-share.ts` (compat)
- `scripts/test-elementary-weekly-sprint5-1-share.ts` / `sprint5-share.ts` (compat)

**Unchanged:** generators, recipe DB, ads, capture resolution, shopping feature.

---

## RESULT

**PASS**

Photos stay large (~68% of cell). Menu names live in a reserved cream text band and are fully readable. Awaiting next sprint.
