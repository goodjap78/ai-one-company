# HANKKI_BABY_GROCERY_CHECKLIST_REPORT

Sprint: HANKKI v1.1 — Baby Grocery / Prep Checklist MVP  
Date: 2026-08-29

---

## ENTRY_POINT

**Baby Weekly** → 「재료 한 번에 준비하기」 → menu/portion select → **기존 `/baby-food-batch-result` Result 화면**에 checklist 확장.

별도 route 추가 없음.

---

## ROUTE

`/baby-food-batch-result` (`BABY_FOOD_BATCH_RESULT_HREF`) — unchanged

---

## CHECKLIST

각 aggregated ingredient row:

- `[ ]` / `[x]` checkbox (Pressable, accessibilityRole=`checkbox`)
- Display line: e.g. `쌀 120g`
- 완료 시: opacity 0.72 + strike-through (가독성 유지)
- 상단 progress: **「준비한 재료 2 / 7」**
- 전체 완료: **「모든 재료를 확인했어요.」** (과한 애니메이션 없음)

**Completed filter:** 미구현 — typical row count 10–16 (7-recipe week ~16 rows); 기능 과잉 방지.

---

## ROW_IDENTITY

Stable key: **`normalizedName::unit::displayCategory`**

- `우유 100ml` vs `우유 2큰술` → **별도 row**
- Display name only key 사용 금지
- `BabyBatchGroceryItem.id === rowKey` (index-based id 제거)

---

## CATEGORY_GROUPING

기존 aggregation IIE category → baby display groups (metadata 재사용, 임의 추론 없음):

| Group | Label |
|-------|-------|
| grains | 곡류 |
| protein | 육류·생선 |
| produce | 채소·과일 |
| other | 기타 |

---

## CHECK_PROGRESS

`checklistProgress(checked, total)` → `준비한 재료 ${checked} / ${total}`

Toggle 시 즉시 반영 + AsyncStorage 저장.

---

## RESET

보조 액션 **「체크 초기화」** — checkedCount === 0 이면 disabled. 별도 confirm modal 없음 (기존 패턴).

---

## PERSISTENCE

**Option B — AsyncStorage** (weekly plan과 분리)

| Key | `@hankki/baby_grocery_checklist` |
|-----|----------------------------------|
| Stored | `fingerprint`, `checkedRowIds[]` |
| Not stored | ingredient 원본 데이터 복제 없음 |

In-memory cache + AsyncStorage. 재진입 시 fingerprint 일치하면 check 복원.

---

## AGGREGATION_FINGERPRINT

```
baby-batch:{stage}:{recipeId:portion|...}#{sorted rowKeys}
```

Selection/portion/aggregation 변경 → fingerprint 변경 → stale checks 자동 제거 (`reconcileCheckedRowIds`).

---

## SHARE

**Included** — OS `Share.share` text:

```
이번 주 이유식 준비 재료

쌀 120g
소고기 45g
...

한끼에서 준비했어요.
```

메뉴명·PII 미포함. PNG/share card 없음.

---

## SHOPPING

**NONE** — 「준비할 재료」 중심 카피 유지. 장보기 상품 추천/affiliate 확장 없음.

## COUPANG

**NONE**

## ADMOB

**NONE**

---

## ANALYTICS

Total events: **49** (+4)

| Event | Payload |
|-------|---------|
| `baby_grocery_checklist_view` | `stage`, `item_count`, `checked_count` |
| `baby_grocery_item_toggle` | `stage`, `item_count`, `checked_count` |
| `baby_grocery_checklist_reset` | `stage`, `item_count`, `checked_count` |
| `baby_grocery_checklist_share` | `stage`, `item_count`, `checked_count` |

금지: `ingredient_name`, menu_name, 아이 정보, 월령, PII

---

## FILES_CHANGED

**New**
- `services/babyFood/babyGroceryChecklist.ts`
- `services/babyFood/babyGroceryChecklistStorage.ts`
- `scripts/test-baby-grocery-checklist.ts`
- `scripts/reports/HANKKI_BABY_GROCERY_CHECKLIST_REPORT.md`

**Modified**
- `services/babyFood/buildBabyBatchGroceryList.ts` — `rowKey`, `displayCategory`, `fingerprint`; category labels ·
- `components/babyFood/BabyBatchCookingResultScreen.tsx` — checklist UI, reset, share
- `components/babyFood/BabyBatchCookingSelectScreen.tsx` — **broken import fix**, stage param
- `constants/babyBatchCookingCopy.ts` — checklist/share copy
- `services/analytics/analyticsEvents.ts`, `analytics.ts`, `index.ts`
- `scripts/test-baby-batch-cooking.ts` — stage param
- `scripts/test-analytics-events.ts` — 49 events
- `scripts/test-child-meal-planning-integrated.ts` — 49 events
- `package.json` — `test:baby-grocery-checklist`

**Not changed:** recipes, merge math, Coupang/AdMob, weekly plan storage.

---

## TEST_RESULTS

```
npm run test:baby-grocery-checklist          → PASS (A–H scenarios)
npm run test:baby-batch-cooking              → PASS
npm run test:baby-weekly-plan                → PASS
npm run test:baby-food-ui                    → PASS
npm run test:analytics-events                → PASS (49 events)
npm run test:child-meal-planning-integrated  → PASS
npm run test:home-final-qa                   → PASS
```

---

## REGRESSIONS

| Area | Status |
|------|--------|
| Aggregation merge/fraction/review_required | PASS |
| Batch Coupang/AdMob absent | PASS |
| Baby weekly / feed / UI | PASS |
| Child meal planning integrated | PASS |

---

## RISKS

1. **AsyncStorage vs session-only expectation** — checklist survives app background; cleared when aggregation fingerprint changes (by design).
2. **Row key includes displayCategory** — same normalizedName+unit in different groups (edge case) stays separate; acceptable for MVP.
3. **Share sheet** — real-device UX deferred to 9/1 QA (same as weekly share).

---

## READY_FOR_REAL_DEVICE_QA

**YES** — checklist toggle, persistence restore, reset, OS share text, and regressions all PASS statically.

---

## READY_FOR_RELEASE_PRECHECK

**YES** — MVP scope complete; no blockers for v1.1 baby prep checklist pilot.
