# SPRINT 61-E FINAL QA REPORT

**Date:** 2026-08-10  
**Scope:** Home Production Lock — no new design changes

---

## 1. 360px QA

**Code review + responsive guards:** PASS

- Primary 3× `flex:1` + `adjustsFontSizeToFit` (편의점 꿀조합)
- Meal tabs `flex:1` × 4, gap 2px
- Hero title/badge `numberOfLines={1}`, overlay `right: 56` (heart clearance)
- Alternative 3-column `flex:1`, `aspectRatio` wide images
- 한끼 더하기 fixed width ~3.5 peek scroll
- `ScrollView` vertical only on Home (no page horizontal scroll)

**Manual device check at 360px:** Recommended before release build.

---

## 2. 390px QA

Same guards as 360px. Primary minHeight 54, secondary minHeight 48 — hierarchy preserved.

**Manual device check:** Recommended.

---

## 3. 430px QA

Same layout rules; wider cards improve readability.

**Manual device check:** Recommended.

---

## 4. Hero slot interaction

**Automated:** `test:cross-slot-hero-diversity` PASS — 0/10 cross-slot duplicates, 0 three-slot repeats, all slots hero not null.

**Code:** `handleSlotChange` → `getMealTimeSlotHomeRecommendation` + `sessionShownIds` (Sprint 61-B unchanged).

---

## 5. Refresh interaction

**Code:** `handleRefresh` in `useHomeScreen.ts` — refresh generation, session protection unchanged.

**Automated:** cross-slot + daily-slot-cache PASS.

---

## 6. Accept flow

**Code:** `handleAccept` → `/ingredients/[id]` (homemade) or `/delivery/[id]` (delivery).

CTA copy: `이 메뉴로 할게요 →` / `다른 메뉴 볼래요` (handler unchanged).

---

## 7. Favorite

**Code:** `handleHeartPress` + `FavoriteHeartButton` on hero; favorites route `/favorites`.

---

## 8. Alternative menus

**Code:** `handleSelectAlternative` in `useHomeScreen`; `AlternativeMealsRow` uses `resolveMealHeroImage(alt.recipe.id)`.

---

## 9. Primary features

| Feature | Route / behavior |
|---------|------------------|
| 집밥 | `handleMealModeChange('homemade')` |
| 편의점 꿀조합 | `/convenience-combos` |
| 냉장고 털기 | `/fridge-raid` |

---

## 10. 한끼 더하기

**Code:** `HomeComingSoonSection` → `openSurvey(featureId)` (coming-soon surveys). No new screens.

Items: 외식, 우리아이 식단, 영수증, 건강, 한끼 리워드.

---

## 11. 나의 한끼

| Row | Route |
|-----|-------|
| 저장한 메뉴 | `/favorites` |
| 최근 본 메뉴 | `/meal-history` |

**Known (Sprint 62 candidate):** "최근 본 메뉴" uses meal history proxy, not viewed-recipe history.

---

## 12. Regression tests

| Test | Result |
|------|--------|
| `test:meal-hero-expansion` | PASS (300/300, waiver 0, fallback 0) |
| `test:meal-catalog-300` | PASS |
| `test:meal-time-recommendation-engine` | PASS |
| `test:daily-slot-cache` | PASS |
| `test:cross-slot-hero-diversity` | PASS |
| `test:home-navigation` | PASS |
| `test:home-final-qa` | PASS |
| `test:fridge-raid` | **1 FAIL** (SIDE_DISH 30 vs 31 — fridge catalog, **not Home**) |
| `validate:hankki-recipes` | PASS |
| `validate:recipe-metadata` | PASS |
| `smoke:rc` | PASS (15/15) |

**Typecheck:** Pre-existing repo errors (fridge copy, batch14 metadata, etc.). Home-specific fixes applied: `SeedMascotSize` +73, `HomeRecommendTip.embed` Props.

---

## 13. 발견된 bugs

1. `test:fridge-raid` SIDE_DISISH count 31 vs 30 — **not Home-related**
2. `HomeRecommendTip` missing `embed` in Props — **fixed**
3. `SeedMascotSize` missing 73 — **fixed**
4. 최근 본 메뉴 → meal-history proxy — **documented, Sprint 62**

---

## 14. 수정한 bugs

- `SeedMascot.tsx` — add `73` to `SeedMascotSize` (header mascot TS)
- `HomeRecommendTip.tsx` — add `embed?: boolean` to Props (TS)
- `scripts/test-home-final-qa.ts` — new production lock script
- `package.json` — `test:home-final-qa`

**No visual/design changes in this sprint step.**

---

## 15. Remaining issues

- Manual responsive screenshot QA at 360/390/430 (recommended)
- `test:fridge-raid` SIDE_DISH classification (fridge sprint)
- Viewed-recipe history for "최근 본 메뉴" (Sprint 62)
- Repo-wide `tsc` errors outside Home

---

## 16. Production Lock 여부

### **SPRINT 61 HOME PRODUCTION LOCKED**

Home structure, interactions (code-verified), recommendation regression, Hero 300/300, waiver 0, fallback 0, cross-slot diversity maintained.

---

## Final verdict: **PASS**

(Home scope. `test:fridge-raid` single failure is outside Home production lock criteria.)
