# MEAL_KIT_CATALOG_EXPANSION_PHASE3_REPORT

Generated: 2026-08-13
Sprint: 66-C / Phase 3 Catalog Merge

---

## MERGED_RECIPES

| ID | Name | heroImageKey | meal-kit keyword |
|----|------|--------------|------------------|
| recipe_0301 | 밀푀유나베 | millefeuille_nabe | 밀푀유나베 밀키트 |
| recipe_0302 | 불고기전골 | bulgogi_jeongol | 불고기전골 밀키트 |
| recipe_0303 | 쭈꾸미볶음 | jjuggumi_bokkeum | 쭈꾸미볶음 밀키트 |
| recipe_0304 | 해물탕 | haemul_tang | 해물탕 밀키트 |

Source: `data/recipes/batches/batch24.ts` → `hankkiRecipes.ts`
Schema: `createHankkiRecipe` / Batch46C. **No new fields.**

샤브샤브 / 알탕: not merged.

---

CATALOG_SIZE_BEFORE: **300**
CATALOG_SIZE_AFTER: **304**

HERO_ASSETS: **PASS**
- Copied from `docs/meal-kit-phase2/heroes/` → `assets/meals/{key}.jpg`
- Existing 300 JPGs not overwritten (copy aborted if dest existed)
- 1344×768 JPEG, crop-safe center 60–70%
- `validate:hankki-recipes` missing hero meals: **0**

IMAGE_MAP: **PASS**
- `recipeImageMap.ts` local entries for recipe_0301–0304
- `mealImageTypes.ts` + `mealImageAssets.ts` require() registered
- Home/Detail still `HomeHeroFocalImage` + `height: '100%'` (no 128% crop)
- Cards keep `FocalMealImage` (centered subject survives)

METADATA: **PASS**
- 304/304 cuisine, dishType, mealTypes, situationTags, cookingTime, servings
- 4 new: `reviewNeeded=false`
- 불고기전골 `dishType: stew` override (name regex would infer stir_fry)
- 밀푀유나베 `dishType: stew` override

MEALKIT_ELIGIBILITY: **PASS**
- Validated allowlist **23 → 27**
- Existing 23 kept, including monitor `024` / `048` / `recipe_0159`
- 028 remains OUT
- HIGH audit list still 24 (unchanged)
- No prices / titles / URLs / affiliateUrl stored
- CTA: `isMealKitEligible` only

FRIDGE_COMPATIBILITY: **PASS**
- main/sub drive missing count; seasoning excluded
- 쭈꾸미볶음 고추장/고춧가루 remain seasoning (013/001 policy)
- Seasoning audit lines 370 → 377 (new recipes only; no reclass)

RECOMMENDATION_COMPATIBILITY: **PASS**
- 4 recipes in `HANKKI_RECIPES` candidate pool
- Scoring / weights **unchanged**
- Meal-time engine + cross-slot diversity PASS
- Dinner-primary fit 1.00 on all 4

DUPLICATE_IDS: **0**
DUPLICATE_NAMES: **0** (불고기전골 ≠ 불고기)
MISSING_IMAGES: **0** (heroes)

---

## TESTS

| Command | Result |
|---------|--------|
| validate:hankki-recipes | PASS (304, heroes 0 missing) |
| validate:recipe-metadata | PASS (304) |
| test:meal-catalog-300 / 304 | PASS |
| test:meal-kit-phase3-heroes | PASS |
| test:meal-time-recommendation-engine | PASS |
| test:cross-slot-hero-diversity | PASS |
| test:fridge-raid | PASS |
| test:fridge-seasoning-policy | PASS |
| test:recipe-shopping-list | PASS (2303 lines, 304 recipes) |
| test:meal-kit-final-pilot | PASS (27 eligible + 024 kept) |
| test:detail-hero-parity | PASS |
| smoke:rc | PASS 15/15 (`heroes 300+140w/304`, `recipes-ready 304+140w/304`) |

REGRESSION: **NONE** — scoring/proxy/HMAC/affiliate/fridge missing policy unchanged.

ANDROID_REBUILD_REQUIRED: **YES** — new catalog rows + 4 bundled JPGs. Preview APK rebuild needed for device retest.

---

## Device retest checklist

1. Home dinner/lunch — 4 menus can appear; hero crop-safe (food centered, mascot not covering dish)
2. Recipe detail — same crop as Home; 2-card CTA (장보기 + 밀키트) on all 4
3. Meal-kit mode — max 3 products, keyword as above
4. Fridge — main/sub missing only; 고추장 not in missing count for 쭈꾸미볶음
5. 024 부대찌개 CTA still present (monitor, not removed)

---

## Verdict

**CATALOG_304_READY_FOR_DEVICE_RETEST**
