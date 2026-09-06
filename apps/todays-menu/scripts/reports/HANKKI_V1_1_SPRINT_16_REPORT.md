# HANKKI_V1_1_SPRINT_16_REPORT

**Date:** 2026-09-06  
**Scope:** Weekly share card **visual upgrade** only (elementary card-news; toddler reuses same component).  
No generators, routes, save/share pipeline, ads, or EAS.

---

## CHANGED_FILES

| File | Change |
|------|--------|
| `constants/elementaryWeeklyShareCardLayout.ts` | Hero/grid flex ratios, body split, canvas tokens |
| `components/elementaryWeekly/ElementaryWeeklyShareCard.tsx` | Header hierarchy + Mon hero + Tue–Sun 2×3 grid |
| `components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx` | `hero` / `grid` / `featured` variants; 80% photo |
| `scripts/test-elementary-weekly-sprint5-3-share.ts` | Sprint 16 layout assertions |
| `scripts/test-elementary-weekly-sprint5-share.ts` | Hero/featured checks |
| `scripts/test-elementary-weekly-sprint5-1-share.ts` | Align with hero layout |
| `scripts/test-elementary-weekly-sprint5-2-share.ts` | Align with featured Sun |
| `scripts/test-toddler-sprint12-weekly-ui.ts` | Image flex band 78–82% |
| `scripts/reports/HANKKI_V1_1_SPRINT_16_REPORT.md` | This report |

---

## DESIGN_SUMMARY

### Before (Sprint 15)
- Uniform Mon–Sat 2×3 + Sunday full-width strip
- Photo ~74% / text ~26%
- Header: large audience line + “7일 식단” secondary

### After (Sprint 16)
1. **Header**
   - Small label: `초등학생 아침` / `초등학생 저녁`
   - Large headline: `7일 식단`
   - Subtitle: 이번 주 아침|저녁 고민, 한 번에 해결해보세요.
2. **Lead hero** — Monday full-width card (photo **82%** / text **18%**, larger name)
3. **Grid** — Tue–Sun in **2×3** (photo **80%** / text **20%**)
4. **Sunday** — `featured` accent (orange border + stronger badge), not a table row
5. **Footer** — brand `한끼` + short tagline only (shopping still off)
6. Tone — warm cream canvas, white cells, cover crop, card-news not spreadsheet

---

## WEB_PREVIEW_PATH

`/qa/elementary-weekly-share`

```bash
cd apps/todays-menu
npx expo start --web --port 8090
# → http://localhost:8090/qa/elementary-weekly-share
```

Requires `__DEV__` or `EXPO_PUBLIC_QA_TOOLS=1`.

---

## QA_CHECKPOINTS

- [ ] Breakfast + dinner toggle on QA route
- [ ] Mon hero photo dominates first glance
- [ ] Tue–Sun grid readable; Sun accent visible
- [ ] Long names (계란치즈또띠아 등) wrap ≤2 lines, no clip
- [ ] Save/share image matches QA preview (same component)
- [ ] No shopping hint / seed / grade / recipeId on card
- [ ] Footer brand quiet vs food

---

## SHARE_RATIO / RESOLUTION

**4:5** · **1080×1350** (360×450 @3x)

## IMAGE_RATIO

| Slot | Image | Text |
|------|------:|-----:|
| Grid / featured | **0.80** | 0.20 |
| Hero (Mon) | **0.82** | 0.18 |

## PREVIEW_SAVE_PARITY

**YES** — `ElementaryWeeklyShareCardPreview` + capture hosts both use `ElementaryWeeklyShareCard`

## LONG_TITLE_QA

**PASS** (script samples + `numberOfLines={2}` + non-shrinking text band)

## IMAGE_VISIBILITY

**IMPROVED** — hero lead + 80% grid photo vs prior 74% uniform grid

## WEB_EXPORT

**PASS**

## REGRESSION

**PASS**

- `test-elementary-weekly-sprint5-3-share` (Sprint 16 suite)
- `test-elementary-weekly-sprint5-share`
- `test-elementary-weekly-sprint5-1-share`
- `test-elementary-weekly-sprint5-2-share`
- `test-toddler-sprint12-weekly-ui`
- web export

## SCREENSHOT_QA_REQUIRED

**YES** — confirm card-news feel in browser before next native RC rebuild

## BLOCKERS

None

## WARNINGS

1. Human screenshot judgment still required (“저장하고 싶은가”).
2. Existing preview APK does not include this design — rebuild preview for device share QA.
3. Hero is always **Monday** (week opener); not recipe-quality ranked.

## RESULT

**PASS**

Awaiting next sprint instruction.
