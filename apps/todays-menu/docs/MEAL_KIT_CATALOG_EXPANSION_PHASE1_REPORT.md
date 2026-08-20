# MEAL_KIT_CATALOG_EXPANSION_PHASE1_REPORT

Generated: 2026-08-13
Proxy: `https://hankki-shopping-proxy.vercel.app`
Live candidate check: `docs/meal-kit-phase1-candidate-live.json` (6 queries, 0×429)
Production: **RECIPE_DATA_CHANGED NO** / **ELIGIBILITY_CHANGED NO** / **UI_CHANGED NO**

---

## EXISTING_ELIGIBILITY_POLICY

기존 validated allowlist(23)는 단일 audit FAIL로 제거하지 않는다.

| Rule | Action |
|------|--------|
| Validated recipe + 1회 FAIL | **KEEP** (다음 런까지 유지) |
| Validated recipe + 2회 연속 FAIL | **REMOVE** 후보 |
| Validated recipe + 명확한 false positive | **REMOVE** 후보 (연속 FAIL 전에라도) |
| `productsChecked = 0` (rate limit / empty fetch) | FAIL로 치지 않음 |
| 신규 recipe 활성화 | 최소 **2회 VALID** 또는 **1회 STRONG + 실기기 확인** |
| Audit HIGH ≠ CTA | runtime `isMealKitEligible`는 `mealKitValidatedEligibility`만 본다 |
| 028 콩나물국 | 이미 validated에서 제외. 신규 정책상 1회 FAIL만으로 빠진 상태. **재활성화 금지** (2회 VALID 또는 STRONG+기기 전까지 OUT 유지) |

### History used (024 / 048 / recipe_0159)

| ID | Name | Audit1 HIGH | Runtime 66-B | Final 300 | Device QA | Phase1 |
|----|------|-------------|--------------|-----------|-----------|--------|
| 024 | 부대찌개 | HIGH (clear kits) | **PASS** valid=3 | WEAK valid=1 (오뎅식당 냉동) | Preview QA fixture, 노출 확인 | **KEEP** |
| 048 | 칼국수 | HIGH (누들정 등) | **PASS** valid=3 | NONE valid=0 (checked=5) | QA fixture 아님 | **REVIEW** (list 유지) |
| recipe_0159 | 애호박전 | HIGH | **PASS** valid=2 (오징어애호박전) | NONE **checked=0** | QA fixture 아님 | **REVIEW** (list 유지) |

- 024: 1회 WEAK는 ranking drift. 기기 성공 + 직전 PASS. 제거 금지.
- 048: 1회 NONE. 2연속 FAIL 아님. 다음 런에서 또 NONE이면 REMOVE.
- 0159: Final NONE은 empty fetch라 FAIL 아님. Runtime 통과 상품이 `오징어애호박전`이라 **near-FP 모니터링**. 이번 제거 금지.

### Counts (production allowlist unchanged = 23)

STABLE_KEEP_COUNT: **20**
REVIEW_COUNT: **3** (024 KEEP-in-list / 048 REVIEW / 0159 REVIEW)
REMOVE_COUNT: **0**

STABLE_KEEP IDs:
`001 003 004 006 007 012 013 014 015 025 026 047 049 062 065 066 088 recipe_0103 recipe_0125 recipe_0272`

REVIEW (stay on allowlist):
`024 부대찌개` · `048 칼국수` · `recipe_0159 애호박전`

---

## NEW_MENU_CANDIDATES

Catalog scan: 300 recipes. Exact title 없음.
유사만 존재: `006 불고기`(볶음), `013 오징어볶음`, `recipe_0253 두부버섯전골`, `recipe_0112 오뎅탕`, `050 해물파전`, `recipe_0131 낙지비빔밥`.
다음 ID 슬롯(미사용): `recipe_0301+`. Hero/step 자산 없음 → 모든 후보 `IMAGE_REQUIRED: YES`.
권장 작성 경로: `createHankkiRecipe` + `decisionTags` (`mealTime/mood/situation/timeRequired/budget/difficultyLevel/weather/season/kidFriendly/spicyLevel`). 기존 Home 추천 메타와 호환.

Live search limit: proxy top 5 (요청 8이어도 현재 5 반환). Guard: `isAcceptableMealKitProduct`.

---

### 1. 밀푀유나베

NAME: 밀푀유나베
DUPLICATE_CHECK: **NEW** — catalog 없음. 포맷 유사 `recipe_0253 두부버섯전골`(야채 전골). 단백질·조리법이 다름.
CATEGORY: `['한식', '국물요리', '전골']`
MEAL_TIME: 저녁 (decision: `dinner`, guest/family)
COOK_TIME: 30분 (`timeRequired: 30`)
DIFFICULTY: 보통
SERVING: 3
MAIN_INGREDIENTS:
- main: 소고기(샤브용) 300g `beef`, 배추 6장 `cabbage`, 버섯 200g `mushroom`
- sub: 양파 1/2개 `onion`, 대파 1대 `green_onion`, 팽이버섯 1봉 `mushroom`
- seasoning: 물 1.2L `water`, 간장 2큰술 `soy_sauce`, 다진마늘 1큰술 `garlic`, 맛술 1큰술 `mirin`(없으면 생략 가능)
FRIDGE_FIT: **HIGH** — 배추·버섯·양파·대파 냉장고 털기 핵심. 소고기만 부족 확률 높음.
MEALKIT_SEARCH_KEYWORD: `밀푀유나베 밀키트`
VALID_PRODUCT_COUNT: **5** (clear 밀키트 5 / 브랜드 3+: 고기가좋다, 쿠킹박스, MYCHEF)
RECIPE_READINESS: DRAFT_ONLY — 레시피/히어로/스텝 이미지 없음. 메타 설계만 가능.
IMAGE_REQUIRED: YES (`millefeuille_nabe` + step_01–04)
METADATA_COMPAT: YES — `createHankkiRecipe` + dinner/family/comfort/guest, spicyLevel 0, kidFriendly true
FINAL_DECISION: **READY_TO_ADD** (catalog 초안 다음 단계. 밀키트 CTA는 2회 VALID 또는 기기 확인 후)

---

### 2. 불고기전골

NAME: 불고기전골
DUPLICATE_CHECK: **NEW (near-name, distinct dish)** — `006 불고기`는 볶음/구이. 전골 포맷은 `recipe_0253`만 있음. `불고기치즈샌드`/`불고기주먹밥`은 별 카테고리.
CATEGORY: `['한식', '국물요리', '전골']`
MEAL_TIME: 저녁 (lunch 가능, 기본 dinner)
COOK_TIME: 35분 (`timeRequired: 40`)
DIFFICULTY: 보통
SERVING: 3
MAIN_INGREDIENTS:
- main: 소불고기용 고기 400g `beef`, 버섯 150g `mushroom`, 양파 1개 `onion`
- sub: 대파 1대 `green_onion`, 당근 1/4개 `carrot`, 두부 1/2모 `tofu`(선택)
- seasoning: 간장 3큰술 `soy_sauce`, 설탕 1큰술 `sugar`, 다진마늘 1큰술 `garlic`, 참기름 1작은술 `sesame_oil`, 물 800ml `water`
FRIDGE_FIT: **HIGH** — 006 불고기와 재료 겹침. 양파·버섯·대파·당근 활용도 높음.
MEALKIT_SEARCH_KEYWORD: `불고기전골 밀키트` (띄어쓰기 `불고기 전골 밀키트`도 히트하나 단일 키워드 유지)
VALID_PRODUCT_COUNT: **3** (clear 3: 우본, 프레시지 서울식, MYCHEF 버섯가득). 상위 비통과: 뚝불고기 간편식(전골 미포함).
RECIPE_READINESS: DRAFT_ONLY
IMAGE_REQUIRED: YES (`bulgogi_jeongol`)
METADATA_COMPAT: YES — 006과 태그 유사하되 category/전골·국물로 분리. spicyLevel 0–1, kidFriendly true
FINAL_DECISION: **READY_TO_ADD** — 006과 CTA 키워드가 다름 (`불고기 밀키트` vs `불고기전골 밀키트`). 병행 가능.

---

### 3. 샤브샤브

NAME: 샤브샤브
DUPLICATE_CHECK: **NEW** — catalog 없음. **상품 겹침**: live valid 3 중 1건이 `밀푀유나베 샤브샤브` 콤보. 밀푀유나베와 동일 냄비 포맷.
CATEGORY: `['한식', '국물요리', '전골']`
MEAL_TIME: 저녁
COOK_TIME: 25분 (`timeRequired: 30`)
DIFFICULTY: 쉬움
SERVING: 3
MAIN_INGREDIENTS:
- main: 소고기(샤브) 300g `beef`, 배추 1/4포기 `cabbage`, 버섯 200g `mushroom`
- sub: 숙주 1봉 `bean_sprouts`(또는 생략), 대파 1대 `green_onion`
- seasoning: 물 1.5L `water`, 다시마 1장(선택), 소금 약간 `salt`
FRIDGE_FIT: **HIGH** — 채소 중심. 밀푀유나베와 재료 거의 동일 → 추천 엔진에서 중복 노출 위험.
MEALKIT_SEARCH_KEYWORD: `샤브샤브 밀키트` (대안 `소고기 샤브샤브 밀키트`는 하모/얼큰 변형 혼입 가능)
VALID_PRODUCT_COUNT: **3** (clear 3) — 전용 2 (프레시밀, 채선당) + 밀푀유나베 교차 1. 대한푸드상회 얼큰샤브는 밀키트/간편 표기 없어 가드 탈락.
RECIPE_READINESS: DRAFT_ONLY
IMAGE_REQUIRED: YES (`shabu_shabu`)
METADATA_COMPAT: YES — 다만 밀푀유나베와 decisionTags가 거의 같아 Home 다양성↓
FINAL_DECISION: **REVIEW** — 밀키트는 있으나 (1) 밀푀유나베 교차 히트 (2) 요리명 범용 (3) fridge/추천 중복. Phase1에서는 밀푀유나베를 우선.

---

### 4. 쭈꾸미볶음

NAME: 쭈꾸미볶음
DUPLICATE_CHECK: **NEW (similar format)** — exact 없음. 최근접 `013 오징어볶음`(매콤 해산물 볶음). `recipe_0131 낙지비빔밥`은 밥 메뉴.
CATEGORY: `['한식', '볶음', '집밥']`
MEAL_TIME: 저녁
COOK_TIME: 20분 (`timeRequired: 20`)
DIFFICULTY: 보통
SERVING: 2
MAIN_INGREDIENTS:
- main: 쭈꾸미 400g `octopus`
- sub: 양파 1/2개 `onion`, 양배추 3장 `cabbage`, 대파 1대 `green_onion`, 당근 1/4개 `carrot`
- seasoning: 고추장 1.5큰술 `gochujang`, 고춧가루 1큰술 `gochugaru`, 간장 1큰술 `soy_sauce`, 설탕 1작은술 `sugar`, 다진마늘 1큰술 `garlic`, 참기름 1작은술 `sesame_oil`
FRIDGE_FIT: **MEDIUM** — 채소는 013과 동일하게 잘 맞음. 주재료 쭈꾸미는 가정 상비 낮음 → missing CTA 가치는 높음.
MEALKIT_SEARCH_KEYWORD: `쭈꾸미볶음 밀키트`
VALID_PRODUCT_COUNT: **2** (clear 1 + 냉동 HMR 1). 상위 다수는 양념쭈꾸미만(밀키트/간편 표기 없는 SKU는 탈락).
RECIPE_READINESS: DRAFT_ONLY — 013 스텝 패턴 재사용 가능 (손질→양념→볶음→참기름).
IMAGE_REQUIRED: YES (`jjuggumi_bokkeum`)
METADATA_COMPAT: YES — 013 복제 후 name/main만 교체. spicyLevel 2, kidFriendly false
FINAL_DECISION: **READY_TO_ADD** — VALID(2)라 CTA 활성화는 2번째 VALID 런 또는 기기 확인 후.

---

### 5. 해물탕

NAME: 해물탕
DUPLICATE_CHECK: **NEW** — catalog 없음. `050 해물파전`은 전. `recipe_0112 오뎅탕`은 어묵탕. 연포탕/동태탕 없음.
CATEGORY: `['한식', '국물요리', '탕']`
MEAL_TIME: 저녁
COOK_TIME: 40분 (`timeRequired: 40`)
DIFFICULTY: 보통
SERVING: 3
MAIN_INGREDIENTS:
- main: 모둠해물 500g `squid`(오징어 아이콘 재사용), 무 200g `radish`
- sub: 양파 1/2개 `onion`, 대파 1대 `green_onion`, 청양고추 1개 `chili`(선택)
- seasoning: 고춧가루 2큰술 `gochugaru`, 다진마늘 1큰술 `garlic`, 국간장 1큰술 `soy_sauce`, 물 1.2L `water`
FRIDGE_FIT: **MEDIUM-LOW** — 무·양파·대파는 활용. 모둠해물은 상비 낮음. 파티/손님 국물로는 추천 적합.
MEALKIT_SEARCH_KEYWORD: `해물탕 밀키트`
VALID_PRODUCT_COUNT: **3** (clear 2: 알탕·해물탕 콤보, 문어해물탕 + HMR 탕선생). 짬뽕탕/해신탕은 가드 탈락.
RECIPE_READINESS: DRAFT_ONLY
IMAGE_REQUIRED: YES (`haemul_tang`)
METADATA_COMPAT: YES — 갈비탕/육개장류 soup comfort, spicyLevel 2, kidFriendly false, weather cold/rain
FINAL_DECISION: **READY_TO_ADD** — 알탕보다 전용 키트 다양. 알탕과 콤보 SKU 1건 공유 → 알탕보다 먼저 넣는 것이 안전.

---

### 6. 알탕

NAME: 알탕
DUPLICATE_CHECK: **NEW** — catalog 없음. 해물탕과 **동일 콤보 밀키트 1건 공유**.
CATEGORY: `['한식', '국물요리', '탕']`
MEAL_TIME: 저녁
COOK_TIME: 30분 (`timeRequired: 30`)
DIFFICULTY: 보통
SERVING: 2
MAIN_INGREDIENTS:
- main: 명란/곤이 300g `fish`(또는 `egg` 비권장), 무 150g `radish`
- sub: 대파 1대 `green_onion`, 양파 1/4개 `onion`, 두부 1/4모 `tofu`(선택)
- seasoning: 고춧가루 1.5큰술 `gochugaru`, 다진마늘 1큰술 `garlic`, 국간장 1큰술 `soy_sauce`, 물 1L `water`
FRIDGE_FIT: **LOW** — 알/곤이 가정 보유 드묾. 냉장고 털기 기여 낮음.
MEALKIT_SEARCH_KEYWORD: `알탕 밀키트`
VALID_PRODUCT_COUNT: **3** (clear 1 = 해물탕과 동일 콤보; 나머지 2 = 똑순이 알고니알탕 동일 브랜드 다른 팩수). 동태알탕/알폭탄은 밀키트 표기 없어 탈락.
RECIPE_READINESS: DRAFT_ONLY — `fish` 아이콘으로 알 재료 매핑 가능. 전용 아이콘 없음.
IMAGE_REQUIRED: YES (`al_tang`)
METADATA_COMPAT: YES — 해물탕과 태그 충돌 가능 (둘 다 spicy soup dinner)
FINAL_DECISION: **REVIEW** — 해물탕 우선. 알탕은 2번째 독립 VALID(콤보 제외 전용 키트) 확인 후 추가.

---

## READY_TO_ADD

다음 4개는 **다음 단계 recipe draft** 대상. 이번 단계 catalog 반영 없음.
밀키트 allowlist 등재는 정책대로 2회 VALID 또는 STRONG+기기 이후.

| Name | Valid | Clear kit | Fridge | Duplicate | Next |
|------|-------|-----------|--------|-----------|------|
| 밀푀유나베 | 5 | 5 | HIGH | NEW | recipe + hero → 2nd search → CTA |
| 불고기전골 | 3 | 3 | HIGH | NEW vs 006 | 동일 |
| 쭈꾸미볶음 | 2 | 1 | MEDIUM | similar 013 | 2nd VALID 필수 |
| 해물탕 | 3 | 2 | MEDIUM-LOW | NEW | 알탕보다 먼저 |

## REVIEW

| Name | Why |
|------|-----|
| 샤브샤브 | 밀푀유나베 교차 상품 + 범용 요리명 + 추천/재료 중복 |
| 알탕 | 해물탕 콤보 키트 공유 + fridge LOW + 전용 키트 다양성 낮음 |
| 048 칼국수 | production KEEP, 1회 NONE → 다음 audit |
| recipe_0159 애호박전 | production KEEP, empty-fetch + 오징어애호박전 near-FP |
| 024 부대찌개 | production **KEEP** (기기 이력). REVIEW 모니터링만 |

## DROP

없음 (6 후보 모두 catalog 가치 있음. 우선순위만 나눔).

기존 allowlist REMOVE: **없음**.

---

## Phase 2 가드 (아직 실행하지 않음)

1. recipe catalog에 4개 READY_TO_ADD draft 작성 (hero 자산 준비 후).
2. 동일 6키워드 2nd live run → VALID 재확인.
3. 통과 분만 `mealKitValidatedEligibility`에 추가. HIGH 원본 24는 유지.
4. 048/0159는 2nd FAIL 시에만 REMOVE 제안.
5. 샤브샤브·알탕은 밀푀유나베·해물탕 안정화 후 재평가.

PRODUCTION_CODE_CHANGED: NO
RECIPE_DATA_CHANGED: NO
ELIGIBILITY_CHANGED: NO
