# HANKKI v1.1 Sprint 6 — Recipe Quality Upgrade

**Date:** 2026-09-02  
**Scope:** 30 elementary recipes (15 breakfast + 15 dinner)  
**Status:** PASS

---

## BREAKFAST_SELECTED_15

| ID | Name | Selection rationale |
|----|------|---------------------|
| recipe_0477 | 계란치즈또띠아 | Highest weekly exposure (100/100 seeds); school-morning; batch38 hero image |
| recipe_0313 | 버터고구마 | 2nd highest exposure (85/100); other category; easy prep |
| recipe_0312 | 바나나우유시리얼 | Oatmeal/cereal diversity; high exposure (51/100) |
| recipe_0316 | 바나나오트밀 | Required cereal category; high exposure (50/100) |
| recipe_0315 | 감자수프 | Soup/other morning; moderate exposure (21/100) |
| recipe_0305 | 간장계란덮밥 | Canonical batch25 rice breakfast; representative |
| recipe_0175 | 사과치즈토스트 | Bread diversity; moderate exposure |
| recipe_0396 | 참치마요주먹밥 | Rice_ball portable; batch32 |
| recipe_0472 | 소고기주먹밥 | Beef rice_ball; batch38 |
| recipe_0441 | 사과시나몬토스트 | Bread variety; batch35 |
| recipe_0173 | 햄치즈토스트 | Toast staple; legacy promoted |
| recipe_0478 | 감자햄토스트 | Toast + potato; batch38 |
| recipe_0295 | 버터계란토스트 | Legacy bridge; low exposure diversity |
| recipe_0306 | 참치계란주먹밥 | Portable rice; batch25 |
| recipe_0308 | 꼬마김밥 | Gimbap/lunchbox; batch25 |

**Deferred (over-represented legacy):** 060, 059, 002 — high frequency but shared dinner pool / legacy catalog.

---

## DINNER_SELECTED_15

| ID | Name | Selection rationale |
|----|------|---------------------|
| recipe_0500 | 닭고기간장덮밥 | batch40 dinner-native; representative 덮밥 |
| recipe_0482 | 참치치즈덮밥 | High weekly exposure; fish protein |
| recipe_0505 | 햄계란볶음밥 | High exposure fried_rice |
| recipe_0405 | 애호박계란국밥 | Soup rice — fills non-덮밥 gap |
| recipe_0406 | 야채볶음우동 | Only noodle in pool |
| recipe_0436 | 떡갈비주먹밥 | Portable dinner; cross-slot |
| recipe_0444 | 닭고기또띠아랩 | non_rice wrap |
| recipe_0476 | 불고기또띠아랩 | non_rice beef wrap |
| recipe_0475 | 햄계란김밥 | Under-selected gimbap |
| recipe_0447 | 고구마치즈구이 | Vegetable-forward non_rice |
| recipe_0442 | 소고기계란덮밥 | Beef rice_bowl |
| recipe_0480 | 소고기야채덮밥 | Beef variety |
| recipe_0506 | 닭안심간장구이 | Chicken non_rice; under-selected |
| recipe_0507 | 두부계란조림밥 | Tofu; lowest exposure candidate |
| recipe_0508 | 소고기감자조림밥 | rice_other beef |

---

## RECIPES_REVIEWED

**30 / 30** — `elementaryQuality.contentVerificationStatus = 'reviewed'`

---

## SERVING_FIXED

All 30 retain explicit `serving: 1` (child portion). No serving changes required.

---

## INGREDIENT_QUANTITY_FIXED

- **recipe_0295:** `후추 약간` → `1/16작은술`
- **recipe_0396:** `마요네즈` clarified to `1큰술` in patch
- Remaining 28 selected recipes already used g/ml/개/큰술/작은술 in batch source

---

## STEPS_IMPROVED

- All 30 retain 4–6 structured steps from batch46C builder
- **Targeted step updates:** recipe_0477 (fire level, lid, cut size), recipe_0305 (egg doneness for kids)
- Step tips reviewed; vague tips in steps kept as guidance but ingredient amounts standardized separately

---

## TIME_FIXED

- Added `prepTimeMinutes` to all 30 reviewed recipes
- Added `prerequisites` clarifying rice/egg/pre-cook assumptions (e.g. 찬밥·즉석밥 기준, +20~25분 if cooking rice fresh)
- Total time = prep + cook shown on elementary detail UI

---

## ALLERGY_REVIEWED

- Existing `standardMetadata.allergyTags` retained unchanged
- Allergy labels shown via `ElementaryDetailExtraSections` (unchanged mapper)
- No new allergy claims added without source data

---

## KID_ADJUSTMENT_ADDED

All 30 include `elementaryQuality.kidAdjustmentTip`:
- Reduced salt/sugar/sauce for children
- Bite-size cutting (2–3cm)
- Mild spice / low-sodium product guidance

---

## STORAGE_INFO_ADDED

All 30 include `storageInfo` + `reheatingMethod` in `elementaryQuality`.

---

## IMAGE_RECIPE_MISMATCH

**0 confirmed mismatches** among selected 30.  
All patches set `imageRecipeMatch: true` after editorial review against `heroImageKey` assets.  
No image file changes in this sprint.

---

## NUTRITION_UNVERIFIED

**All 30 remain `nutrition.source: 'unverified'`** — no fabricated calorie/protein values.  
UI continues to hide unverified nutrition via `resolveRecipeCalories`.

---

## VERIFICATION_STATUS

New optional field on `Recipe`:

```typescript
elementaryQuality.contentVerificationStatus: 'unverified' | 'reviewed' | 'verified'
```

- Sprint 6 reviewed set → **`reviewed`**
- Does not replace `familyAudience.reviewStatus` (weekly pool gate remains `explicit`)
- **`verified`** reserved for future nutrition/lab pass

---

## Weekly Generator Investigation

- Current generator uses diversity scoring + shuffle; **does not** read `elementaryQuality` or `contentVerificationStatus`
- Safe future extension: soft +1 score for `reviewed` in `scoreCandidate()` — **not implemented** (Sprint 6 scope)
- `avoidRecipeIds` cross-week dedupe unchanged

---

## FILES_CHANGED

- `data/recipes/elementaryRecipeQualityTypes.ts` (new)
- `data/recipes/elementarySprint6QualityPatches.ts` (new)
- `data/recipes/types.ts`
- `data/recipes/recipeMasterTemplate.ts`
- `components/recipe/ChildDetailSections.tsx`
- `constants/childDetailCopy.ts`
- `scripts/test-elementary-sprint6-recipe-quality.ts` (new)
- `scripts/analyze-elementary-weekly-frequency.ts` (new)

---

## REGRESSION

Run locally:

```bash
npx tsx scripts/test-elementary-sprint6-recipe-quality.ts
npx tsx scripts/test-elementary-breakfast-weekly-plan.ts
npx tsx scripts/test-elementary-dinner-weekly-plan.ts
npx tsx scripts/test-child-detail-implementation.ts
```

Weekly generator logic **unchanged**.

---

## BLOCKERS

None.

---

## WARNINGS

1. **Nutrition still unverified** — do not show kcal until verified pass
2. **Only 30/72 elementary pool recipes upgraded** — remaining pool recipes unchanged
3. **recipe_0477 breakfast skew** (100/100 seeds) is a generator scoring issue — separate sprint
4. Step-level images (`*_step_XX`) not individually re-shot this sprint

---

## RESULT

**PASS** — 30 core elementary breakfast/dinner recipes editorially reviewed with prep time, prerequisites, kid tips, storage/reheat, quantity fixes, and `reviewed` verification status. Nutrition left unverified. Weekly algorithm unchanged. Awaiting next sprint instructions.
