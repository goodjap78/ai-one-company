# FRIDGE_SEASONING_POLICY_REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## 1. 기존 missing 정책

`alignFridgeIngredients` counted **main + sub + selected seasonings** (`TIER_SEASONING_KEYS`: 간장, 고추장, 참기름, 돤장, 식초, 돈까스소스) toward `missingCount` and `missingIngredients`.

Fridge shopping (`mode=missing`) and card CTA used that list → 간장·참기름 등이 “부족한 재료”로 노출되고 Coupang 자동 검색 대상이 됨.

## 2. 새 recommendation 기준

Fridge Raid recommendation / missing 판정:

| 포함 | 제외 |
|------|------|
| `group === 'main'` | `group === 'seasoning'` (전체) |
| `group === 'sub'` | |

Recipe 원본 ingredient 데이터 **변경 없음**.

## 3. seasoning 제외 범위

- Tier / star rating / primary vs extended eligibility
- 카드 `missingIngredients` / `missingCount` 표시
- `buildMissingRecipeShoppingList` 항목
- Fridge `mode=missing` 자동 product search 대상

Staple matchKeys (소금·후추·식용유·물·설탕) — shopping UI에서 여전히 별도 “기본 양념” 섹션, Fridge missing count에는 원래도 alignment tier에 설탕 미포함.

## 4. missing count before/after

**예시 — 제육볶음 (`001`), 보유: 돼지고기·양파**

| | Before | After |
|---|--------|-------|
| missingCount | 4+ (대파 + 간장·참기름 등) | **2** (대파·당근) |
| 간장/참기름 in missing | Yes | **No** |

**seasoning만 부족한 경우:** `missingCount === 0` → “지금 있는 재료로 바로 만들 수 있어요”

## 5. Shopping 자동 검색 before/after

**Fridge `mode=missing` (recipe `001`, empty pantry)**

| | Before | After |
|---|--------|-------|
| List items | main+sub+seasoning (9 non-staple) | **main+sub only (4)** |
| Initial Coupang requests | ~9 | **4** |

Seasoning Coupang 검색: **사용자가 “+ 양념도 확인하기” 후 체크할 때만**

일반 recipe shopping (`mode=all`): **변경 없음** — main 기본 선택, sub/seasoning opt-in.

## 6. 양념도 확인하기 UX

- **FridgeShoppingBridge:** zero missing 시 complete 메시지 + `+ 양념도 확인하기` → `/shopping/{id}?mode=missing&seasonings=1`
- **ShoppingScreen (`mode=missing`):** 동일 secondary 버튼; tap 시 recipe seasoning 목록 표시, 기본 미선택, 선택 시 product search
- Fridge missing CTA는 **main/sub missing > 0**일 때만 orange primary 노출

## 7. 핵심 ingredient가 seasoning으로 분류된 의심 사례

**자동 재분류하지 않음.** Catalog audit (370 lines flagged):

| iconKey | 예시 |
|---------|------|
| `gochujang` | 제육볶음, 비빔밥 등 |
| `soy_sauce` | 다수 레시피 |
| `doenjang` | 김치찌개, 된장찌개 |
| `sesame_oil` | 다수 레시피 |
| `tonkatsu_sauce` | 돈까스류 |
| `vinegar` | 샐러드/무침류 |

향후 recipe metadata 정리 시 별도 Sprint에서 검토 권장.

## 8. Modified files

- `services/fridge/fridgeIngredientAlignment.ts`
- `services/shopping/shoppingSelection.ts`
- `services/shopping/buildRecipeShoppingList.ts`
- `services/shopping/index.ts`
- `constants/shoppingCopy.ts`
- `components/shopping/ShoppingScreen.tsx`
- `components/fridge/FridgeShoppingBridge.tsx`
- `app/shopping/[recipeId].tsx`
- `scripts/test-fridge-seasoning-policy.ts` (new)
- `scripts/test-shopping-selection.ts`
- `scripts/test-shopping-selective-search.ts`
- `scripts/test-fridge-shopping-bridge.ts`
- `package.json`
- `docs/FRIDGE_SEASONING_POLICY_REPORT.md` (this file)

## 9. Tests

- `test:fridge-seasoning-policy` — PASS (new)
- `test:fridge-raid` — PASS
- `test:fridge-recommendation` — PASS
- `test:fridge-shopping-bridge` — PASS
- `test:recipe-shopping-list` — PASS
- `test:shopping-selective-search` — PASS
- `test:shopping-selection` — PASS
- `test:coupang-shopping-integration` — PASS
- `smoke:rc` — PASS

## 10. Android rebuild required

**Yes** — Fridge recommendation UI + Shopping flow 변경. Preview APK 재빌드 후 실기기 retest 권장.

### Device retest checklist

1. Fridge 결과 — 간장/참기름만 없을 때 “바로 만들 수 있어요”, 장보기 CTA 없음
2. Fridge 카드 — 부족 N개에 seasoning 미포함
3. `+ 양념도 확인하기` → seasoning 목록, 체크 시 검색
4. Fridge shopping — main/sub만 자동 검색
5. 일반 장보기 — main만 기본 선택 (기존 정책 유지)
