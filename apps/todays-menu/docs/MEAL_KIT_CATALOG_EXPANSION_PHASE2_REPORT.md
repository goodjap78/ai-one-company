# MEAL_KIT_CATALOG_EXPANSION_PHASE2_REPORT

Generated: 2026-08-13
Sprint: 66-B / Phase 2
Proxy: `https://hankki-shopping-proxy.vercel.app`
Second validation: `docs/meal-kit-phase2-second-validation.json` (4 queries, 0×429)

**PRODUCTION_CATALOG_MERGED: NO** — user confirmation required before `hankkiRecipes.ts` import.
**ELIGIBILITY_CHANGED: NO** — validated allowlist 23 unchanged.
**EXISTING_HERO_300: UNTOUCHED**
**SHABU / ALTANG: NOT IN THIS SPRINT**

---

## Schema mapping (requested → existing)

No new Recipe fields. Phase 1 brief names map as:

| Brief | Existing |
|-------|----------|
| id 후보 | `id` (`recipe_0301`–`recipe_0304`) |
| name | `name` |
| subtitle / description | 없음 → `recommendationMessages` + `situation` |
| servings | `serving` |
| cookTime | `time` |
| difficulty | `difficulty` (`쉬움`/`보통`/`어려움`) |
| mealType | `mealType` + `decisionTags.mealTime` + `standardMetadata.mealTypes` |
| cuisine | `standardMetadata.cuisine` |
| categories | `category` |
| ingredients main/sub/seasoning | `ingredients[].group` |
| steps / tips | `recipe.steps[].instruction` / `.tip` |
| situationTags / dietaryTags | `standardMetadata.situationTags` / `dietaryTags` |

Factory: `buildBatch46CRecipes` → `createHankkiRecipeBatch`.
Draft file (not imported): `data/recipes/batches/batch24MealKitPhase2Draft.ts`.

---

## EXISTING_ELIGIBILITY

Allowlist 23 **KEEP**. Monitor only:

- `024` 부대찌개
- `048` 칼국수
- `recipe_0159` 애호박전

028 콩나물국 remains OUT.

---

## Per-menu

### 1. 밀푀유나베

NAME: 밀푀유나베
ID: `recipe_0301`
HERO_KEY: `millefeuille_nabe`
DUPLICATE_CHECK: **PASS** — catalog exact NEW. Concept near `recipe_0253 두부버섯전골` (야채 전골) only.
RECIPE_SCHEMA: **PASS** — `createHankkiRecipe` + `validateHankkiRecipe` 0 issues
INGREDIENT_CLASSIFICATION: **PASS**
- main: 소고기, 배추, 버섯
- sub: 양파, 대파
- seasoning: 물, 간장, 다진마늘
MEAL_TIME_METADATA: **PASS** — `['저녁']`; dinner fit 1.00; breakfast conservative; no late_night author
HERO_ASSET: **PASS_STAGED** — 1344×768 JPEG, high-angle layered pot, center safe-zone. Tiny dipping dish present (policy: max one small side). Not copied to `assets/meals/` yet.
FRIDGE_COMPATIBILITY: **PASS** — HIGH. 배추·버섯·양파·대파 are fridge staples; 소고기 often missing (CTA value).
MEALKIT_SEARCH_KEYWORD: `밀푀유나베 밀키트`
SECOND_VALIDATION_RAW: 5
SECOND_VALIDATION_VALID: 5 (clear 5)
BRAND_DIVERSITY: 3 (고기가좋다, 쿠킹박스, MYCHEF)
FINAL_DECISION: **READY_FOR_CATALOG_MERGE**
Notes: `standardMetadata.dishType` override `stew` (name 나베 would otherwise infer soup from 국물 category).

---

### 2. 불고기전골

NAME: 불고기전골
ID: `recipe_0302`
HERO_KEY: `bulgogi_jeongol`
DUPLICATE_CHECK: **PASS (concept distinct)** — name matcher `near_alias` vs `006 불고기` (길이 차 2≤4). Dish is 전골, not 볶음. Keywords differ (`불고기전골 밀키트` vs `불고기 밀키트`). Also distinct from `recipe_0253`.
RECIPE_SCHEMA: **PASS**
INGREDIENT_CLASSIFICATION: **PASS**
- main: 소고기, 버섯
- sub: 양파, 대파, 당근, 두부
- seasoning: 간장, 설탕, 다진마늘, 참기름, 물
MEAL_TIME_METADATA: **PASS** — `['점심','저녁']`; dinner 1.00
HERO_ASSET: **PASS_STAGED** — centered pot, beef+veg visible, 1344×768
FRIDGE_COMPATIBILITY: **PASS** — HIGH. Shares pantry with 006 (양파·버섯·대파·당근).
MEALKIT_SEARCH_KEYWORD: `불고기전골 밀키트`
SECOND_VALIDATION_RAW: 5
SECOND_VALIDATION_VALID: 4 (clear 4; 뚝불고기 간편식 1건 가드 탈락)
BRAND_DIVERSITY: 3 (우본, 프레시지, MYCHEF)
FINAL_DECISION: **READY_FOR_CATALOG_MERGE**
Notes: Auto `mapDishType` would set `stir_fry` because `/불고기(?!덮)/`. Override `dishType: 'stew'` + `reviewNeeded: false`.

---

### 3. 쭈꾸미볶음

NAME: 쭈꾸미볶음
ID: `recipe_0303`
HERO_KEY: `jjuggumi_bokkeum`
DUPLICATE_CHECK: **PASS** — exact NEW. Similar format only: `013 오징어볶음`, `recipe_0270 오징어간장볶음`, `recipe_0215 버터오징어볶음`, `recipe_0131 낙지비빔밥`. Pipeline `낙지볶음` is not in production 300.
RECIPE_SCHEMA: **PASS**
INGREDIENT_CLASSIFICATION: **PASS** with seasoning-identity note
- main: 쭈꾸미
- sub: 양파, 양배추, 대파, 당근
- seasoning: 고추장, 고춧가루, 간장, 설탕, 다진마늘, 참기름, 식용유
MEAL_TIME_METADATA: **PASS** — `['저녁']` (013과 동일). late_night not authored (안주 태그는 있으나 보수적).
HERO_ASSET: **PASS_STAGED** — red octopus + veg centered, 1344×768
FRIDGE_COMPATIBILITY: **PASS** — MEDIUM. 채소 HIGH; 쭈꾸미 상비 낮음 → missing CTA 가치 있음.
MEALKIT_SEARCH_KEYWORD: `쭈꾸미볶음 밀키트`
SECOND_VALIDATION_RAW: 5
SECOND_VALIDATION_VALID: 2 (clear 1 + 냉동 HMR 1)
BRAND_DIVERSITY: 2 (우주 + 전용 밀키트 SKU)
FINAL_DECISION: **READY_FOR_CATALOG_MERGE**
Phase1 VALID(2) + Phase2 VALID(2) = 2회 VALID. Meal-kit CTA는 merge 후 allowlist 등재 시점에 활성화.

**SEASONING_IDENTITY_NOTE (no reclass):**
고추장·고춧가루는 음식 정체성 소스지만 `013 오징어볶음` / `001 제육볶음`과 같이 `group: seasoning` 유지.
Fridge missing count에서 제외됨 (`test:fridge-seasoning-policy` 기존 정책). 임의 재분류하지 않음.

---

### 4. 해물탕

NAME: 해물탕
ID: `recipe_0304`
HERO_KEY: `haemul_tang`
DUPLICATE_CHECK: **PASS** — exact NEW. Near: `recipe_0112 오뎅탕`, `050 해물파전`, `recipe_0257 청양어묵탕`. 알탕/매운탕 미수록. 알탕은 Phase1 REVIEW로 이번 미추가.
RECIPE_SCHEMA: **PASS**
INGREDIENT_CLASSIFICATION: **PASS**
- main: 오징어, 새우, 무
- sub: 양파, 대파, 청양고추
- seasoning: 고춧가루, 다진마늘, 국간장, 물
MEAL_TIME_METADATA: **PASS** — `['점심','저녁']` (갈비탕류)
HERO_ASSET: **PASS_STAGED** — seafood + red broth readable, 1344×768
FRIDGE_COMPATIBILITY: **PASS** — MEDIUM-LOW. 무·양파·대파 HIGH; 오징어·새우 상비 낮음.
MEALKIT_SEARCH_KEYWORD: `해물탕 밀키트`
SECOND_VALIDATION_RAW: 5
SECOND_VALIDATION_VALID: 4 (clear 2 + HMR; 짬뽕탕/해신탕 탈락)
BRAND_DIVERSITY: 3 (간편한수인, 탕선생, 바다자리)
FINAL_DECISION: **READY_FOR_CATALOG_MERGE**
Notes: 알탕 콤보 키트 1건 공유. 해물탕을 먼저 넣는 것이 안전 (Phase1 유지).

---

## Merge checklist (all 4)

| Gate | 밀푀유나베 | 불고기전골 | 쭈꾸미볶음 | 해물탕 |
|------|------------|------------|------------|--------|
| duplicate | PASS | PASS (concept) | PASS | PASS |
| recipe schema | PASS | PASS | PASS | PASS |
| metadata | PASS | PASS | PASS | PASS |
| Hero staged | PASS | PASS | PASS | PASS |
| fridge class | PASS | PASS | PASS | PASS |
| 2nd meal-kit | STRONG | STRONG | VALID | STRONG |

HOLD / DROP: none of the 4.

---

## READY_FOR_CATALOG_MERGE

1. 밀푀유나베 `recipe_0301`
2. 불고기전골 `recipe_0302`
3. 쭈꾸미볶음 `recipe_0303`
4. 해물탕 `recipe_0304`

## HOLD

없음 (이번 4개 기준). 샤브샤브 / 알탕은 Sprint 범위 밖.

## DROP

없음.

---

READY_COUNT: **4**
HOLD_COUNT: **0**
DROP_COUNT: **0**
PROPOSED_NEW_CATALOG_SIZE: **304** (현재 300 + 4, merge 후)

---

## Hero staging (not production)

Tracked copies (do not overwrite existing 300):

`docs/meal-kit-phase2/heroes/`

- `millefeuille_nabe.jpg`
- `bulgogi_jeongol.jpg`
- `jjuggumi_bokkeum.jpg`
- `haemul_tang.jpg`

Merge 시 할 일 (아직 금지):

1. copy → `assets/meals/{key}.jpg`
2. register `recipeImageMap` local require
3. import `PHASE2_MEAL_KIT_DRAFT_INPUTS` into `hankkiRecipes.ts`
4. (optional separate step) add 4 ids to `mealKitValidatedEligibility` after user OK
5. step images: 기존 expansion과 같이 key만 존재, 파일은 후속 waiver/파이프라인

---

## Tests

| Command | Result |
|---------|--------|
| `test:meal-kit-phase2-draft` | PASS |
| `audit:meal-kit-phase2-second` | PASS (4/4) |
| `validate:hankki-recipes` | PASS (300) |
| `validate:recipe-metadata` | PASS (300) |
| `test:meal-catalog-300` | PASS (still 300) |
| `test:meal-time-recommendation-engine` | PASS |
| `test:fridge-raid` | PASS |
| `test:fridge-seasoning-policy` | PASS |
| `test:recipe-shopping-list` | PASS (2262 lines, catalog 300) |
| `test:meal-kit-final-pilot` | PASS (allowlist 23) |
| `smoke:rc` | PASS 15/15 (heroes 300+140w/300) |

---

## Awaiting user confirmation

실제 catalog merge / `assets/meals` 복사 / meal-kit allowlist 추가를 진행하지 않는다.
확인 후 Phase 2.1 merge Sprint에서 4개를 한 번에 반영하는 것을 권장한다.
