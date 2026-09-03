# HANKKI Sprint 6.2 — Recipe Reality Fix

**Date:** 2026-09-02  
**Scope:** Sprint 6.1 QA follow-up — 30 elementary recipes (15 breakfast + 15 dinner)  
**Baseline:** Sprint 6.1 — A=8, B=17, C=5

---

## C_FIXED

1. **recipe_0472** (소고기주먹밥) — `schoolMorningFriendly=false`; prerequisite에 prep+cook ≈23분·주말/전날 준비 경로 명시  
2. **recipe_0306** (참치계란주먹밥) — `schoolMorningFriendly=false`; ≈21분 현실성 prerequisite  
3. **recipe_0308** (꼬마김밥) — `schoolMorningFriendly=false`; ≈25분·전날 완성 후 아침 썰기(5분) 경로  
4. **recipe_0405** (애호박계란국밥) — 소금 `1/2` → `1/4작은술`, 보호자 추가 간 안내, step 반영  
5. **recipe_0447** (고구마치즈구이) — 소금 `1/8작은술`, 팬/전자레인지 대체 조리법, `recommendationPriority` 77→62

## B_FIXED

| ID | Fix summary |
|----|-------------|
| recipe_0313 | 전날 찐 vs 생고구마 분기 prerequisite + step 2 분기 |
| recipe_0316 | 소금 `1/16작은술` + step 반영 |
| recipe_0315 | 23분 주말 아침 prerequisite 명시 |
| recipe_0305 | 계란 완숙 step/kid tip 일관화 |
| recipe_0175 | 버터·토스트 열량/시간 step 보강 |
| recipe_0173 | 소금 `1/16작은술`, 저염 햄·치즈 안내, step 보강 |
| recipe_0478 | 전날 감자 찜 prerequisite, 저염 햄 |
| recipe_0295 | 소금·후추 `1/16작은술`, step 1 계량 |
| recipe_0482 | kid tip “적당량” → 구체 분량 |
| recipe_0505 | 간장 1/2큰술 step·저염 햄 안내 |
| recipe_0406 | 우동면 `1봉(200g)` + step |
| recipe_0436 | 가공육 분량 kid tip |
| recipe_0476 | 고기 익힘 doneness tip |
| recipe_0475 | 저염 햄 3장 안내 |
| recipe_0480 | 고기·채소 doneness tip |
| recipe_0506 | 닭가슴살(닭안심) 명칭 정리, step 5 copy |
| recipe_0507 | 물 `120ml` + step |

**A등급 8개 (0477, 0312, 0396, 0441, 0500, 0442, 0444, 0508):** 본문/계량 미수정, `recipeQualityGrade: A` 메타만 추가

---

## SCHOOL_MORNING_RULE

`schoolMorningFriendly=true` 조건 (Sprint 6.2):

- **A.** 실제 prep + cook ≤ 15분  
- **B.** 명시된 전날 준비 후 아침 active time ≤ 10분  

둘 다 미충족 시 `false`. 초등 breakfast browse에는 유지, **빠른 등교 전 weekly pool에서는 제외**.

## MORNING_RECIPES_EXCLUDED

- recipe_0472  
- recipe_0306  
- recipe_0308  

(`recipeFamilyAudienceOverrides` + patch `schoolMorningFriendly: false`)

## MORNING_RECIPES_TIME_FIXED

- 위 3건: prerequisite에 총 소요·전날 준비 경로 명시 (flag false로 weekly fast pool 제외)

---

## SEASONING_FIXED

- recipe_0405, recipe_0505, recipe_0173, recipe_0475, recipe_0308 (저염 햄), recipe_0482 (kid tip)

## MEASUREMENT_FIXED

- recipe_0316, recipe_0173, recipe_0295, recipe_0447, recipe_0406, recipe_0507

## PREREQUISITE_FIXED

- recipe_0313, recipe_0315, recipe_0478, recipe_0472, recipe_0306, recipe_0308, recipe_0447

## STEP_CONFLICT_FIXED

- recipe_0305 (반숙 vs 완숙)

## EQUIPMENT_ALTERNATIVE_ADDED

- recipe_0447 (팬 뚜껑 3분 / 전자레인지 1분 30초; 오븐은 선택)

---

## Re-QA (Sprint 6.1 동일 기준)

| Grade | Before | After |
|-------|--------|-------|
| **A** | 8 | **30** |
| **B** | 17 | **0** |
| **C** | 5 | **0** |

### A_AFTER: 30

### B_AFTER: 0

### C_AFTER: 0

내부 필드 `elementaryQuality.recipeQualityGrade` 추가 (production UI 미노출).  
`contentVerificationStatus=reviewed`와 분리 유지.

---

## FILES_CHANGED

- `data/recipes/elementaryRecipeQualityTypes.ts` — `recipeQualityGrade` 타입  
- `data/recipes/elementarySprint6QualityPatches.ts` — C/B fixes, schoolMorning override, 0447 priority  
- `data/recipes/recipeFamilyAudienceOverrides.ts` — 0472/0306/0308 schoolMorning false  
- `scripts/test-elementary-sprint6-2-recipe-reality.ts` — Sprint 6.2 QA  
- `scripts/reports/HANKKI_SPRINT_6_2_REPORT.md` — 본 보고서  

## REGRESSION

- `npx tsx scripts/test-elementary-sprint6-recipe-quality.ts` — **PASS**  
- `npx tsx scripts/test-elementary-sprint6-2-recipe-reality.ts` — **PASS**  
- Weekly breakfast generator: **변경 없음** (기존 `schoolMorningFriendly===true` 스코어링이 수정된 flag 자동 반영)

---

## RESULT

**PASS**

- C = 0, A = 30 (목표 A≥25, B≤5, C=0 충족)  
- nutrition 임의 생성 없음 (`source: unverified` 유지)  
- 메뉴/ID/route 삭제 없음  

**다음 Sprint 진행하지 않음** (사용자 지시).
