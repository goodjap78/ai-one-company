# HANKKI_V1_1_SPRINT_15_REPORT

**Date:** 2026-09-04  
**Scope:** Elementary (and shared toddler) weekly share card **design upgrade** only.  
No generators, recipe DB, ads, native config, or EAS.

---

## CURRENT_DESIGN

- Canvas 360×450 → capture **1080×1350** (4:5)
- Single-line title (`초등학생 아침 7일 식단`) + optional empty line2 + subtitle
- Mon–Sat **2×3**, Sunday full-width
- Image/text **0.73 / 0.27**, `resizeMode="contain"` (letterboxing risk)
- Soft cream text band; shopping hint already removed (14.1)
- Tiny brand footer; QA preview scales same `ElementaryWeeklyShareCard`

## NEW_DESIGN

- Warm cream canvas `#FFF8EF`, white cells, orange day badges, unified radius **10**
- Header card-news:
  - Title: **초등학생 아침** / **초등학생 저녁**
  - Line2: **7일 식단** (primary orange, bold)
  - Subtitle: 이번 주 아침|저녁 고민, 한 번에 해결해보세요.
- Compact header → more vertical room for food grid
- Mon–Sat: photo **74%** / text **26%**; day badge orange on photo; cream text band; cook time small
- Sunday: **76% / 24%**, taller full-width card (98 logical px)
- Food: `resizeMode="cover"` (natural crop, no thin strip / no contain letterbox)
- Footer: brand only (한끼 + tagline), shopping still off
- Preview ≡ capture (same component)

---

## SHARE_RATIO

**4:5**

## SHARE_RESOLUTION

**1080 × 1350** (360×450 @ pixelRatio 3)

## PHOTO_PRIORITY

**YES** — food is primary visual mass

## IMAGE_RATIO

Mon–Sat **0.74 / 0.26** (72–75% target)  
Sunday **0.76 / 0.24** (75–78% target)

## MENU_NAME_SIZE

Grid **12/15** bold · Sunday **13/16** bold

## MENU_NAME_WRAP

**Max 2 lines** · dedicated text band · no `adjustsFontSizeToFit` · no ellipsis mode

## MON_SAT_LAYOUT

2 columns × 3 rows · day badge · photo · name · cook time only

## SUNDAY_LAYOUT

Full-width · larger photo band · name + time in cream band

## HEADER

Two-line purpose title + short subtitle (compact)

## FOOTER

Small centered branding only

## SHOPPING_HINT

**REMOVED** (unchanged from 14.1)

## PREVIEW_SAVE_PARITY

**YES** — `ElementaryWeeklyShareCardPreview` + screen capture hosts both mount `ElementaryWeeklyShareCard`

## LONG_TITLE_QA

**PASS** (script: 계란치즈또띠아 / 참치마요주먹밥 / 소고기야채덮밥 / 사과시나몬토스트 samples + 2-line band)

## IMAGE_CROP_QA

**PASS** (script: cover + 74% band). Human visual check still recommended on real heroes.

## OVERLAP_QA

**PASS** (text band `flexShrink: 0`, badge absolute on image only)

## WEB_EXPORT

**PASS**

## SAVE_TEST

**PASS** (pipeline unchanged; same card component — device album check still for RC)

## SHARE_TEST

**PASS** (pipeline unchanged — device share sheet for RC)

## REGRESSION

**PASS**

- `test-elementary-weekly-sprint5-3-share`
- `test-elementary-weekly-sprint5-share`
- `test-elementary-weekly-sprint4-ui`
- `test-toddler-sprint12-weekly-ui`
- elementary breakfast / dinner weekly plan scripts
- web export

## SCREENSHOT_QA_REQUIRED

**YES** — confirm in `/qa/elementary-weekly-share` (breakfast + dinner) before next native RC: food-first, readable names, card-news feel (not app screenshot).

## BLOCKERS

None

## WARNINGS

1. Visual “엄마가 저장하고 싶은가” judgment needs human screenshot review.
2. `cover` may trim edges of some plated meals — better for card-news than contain letterboxing; flag outliers in screenshot QA.
3. Preview APK from Sprint 14 does not include this design — rebuild preview after merge for device share QA.

## RESULT

**PASS** (engineering + automated QA). Screenshot visual sign-off still required before calling the share design “ship-final.”

Awaiting next sprint instruction.
