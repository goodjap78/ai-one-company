# MEAL_KIT_FINAL_FULL_AUDIT

Generated: 2026-08-13T09:14:15.411Z

TOTAL_RECIPES: 300
PREVIOUS_ELIGIBLE: 23

FINAL_STRONG: 24
FINAL_VALID: 22
FINAL_WEAK: 34
FINAL_NONE: 220

KEEP: 20
ADD: 26
REMOVE: 3

FINAL_RECOMMENDED_ELIGIBLE: 46 (STRONG + VALID)

## Change vs previous 23

| recipeId | recipeName | previous | status | action | validCount |
|----------|------------|----------|--------|--------|------------|
| 001 | 제육볶음 | Y | STRONG | KEEP | 2 |
| 003 | 김치찌개 | Y | STRONG | KEEP | 3 |
| 004 | 된장찌개 | Y | VALID | KEEP | 4 |
| 006 | 불고기 | Y | STRONG | KEEP | 3 |
| 007 | 김치볶음밥 | Y | VALID | KEEP | 4 |
| 010 | 닭갈비 | N | VALID | ADD | 2 |
| 012 | 닭볶음탕 | Y | STRONG | KEEP | 4 |
| 013 | 오징어볶음 | Y | STRONG | KEEP | 3 |
| 014 | 갈비탕 | Y | VALID | KEEP | 1 |
| 015 | 육개장 | Y | STRONG | KEEP | 3 |
| 016 | 미역국 | N | STRONG | ADD | 2 |
| 024 | 부대찌개 | Y | WEAK | REMOVE | 1 |
| 025 | 청국장찌개 | Y | STRONG | KEEP | 4 |
| 026 | 소고기무국 | Y | STRONG | KEEP | 3 |
| 032 | 떡갈비 | N | STRONG | ADD | 3 |
| 033 | 갈치조림 | N | STRONG | ADD | 4 |
| 034 | 닭개장 | N | STRONG | ADD | 5 |
| 037 | 비빔국수 | N | VALID | ADD | 1 |
| 038 | 냉면 | N | STRONG | ADD | 2 |
| 039 | 잡채 | N | VALID | ADD | 1 |
| 047 | 순대국 | Y | STRONG | KEEP | 2 |
| 048 | 칼국수 | Y | NONE | REMOVE | 0 |
| 049 | 수제비 | Y | STRONG | KEEP | 2 |
| 060 | 프렌치토스트 | N | VALID | ADD | 1 |
| 062 | 매콤순대볶음 | Y | STRONG | KEEP | 2 |
| 065 | 치즈볼 | Y | STRONG | KEEP | 3 |
| 066 | 감자튀김 | Y | VALID | KEEP | 1 |
| 086 | 참치김치찌개 | N | VALID | ADD | 2 |
| 088 | 비빔냉면 | Y | VALID | KEEP | 1 |
| 091 | 보쌈 | N | STRONG | ADD | 4 |
| 092 | 찜닭 | N | VALID | ADD | 3 |
| 095 | 은갈치조림 | N | STRONG | ADD | 2 |
| recipe_0103 | 새우볶음밥 | Y | STRONG | KEEP | 4 |
| recipe_0122 | 오뎅탕 | N | VALID | ADD | 1 |
| recipe_0123 | 시래기된장국 | N | VALID | ADD | 2 |
| recipe_0125 | 황태해장국 | Y | VALID | KEEP | 1 |
| recipe_0127 | 오삼불고기 | N | VALID | ADD | 3 |
| recipe_0144 | 무생채 | N | STRONG | ADD | 2 |
| recipe_0147 | 진미채볶음 | N | VALID | ADD | 2 |
| recipe_0149 | 새우볶음 | N | VALID | ADD | 1 |
| recipe_0150 | 메추리알장조림 | N | STRONG | ADD | 2 |
| recipe_0151 | 연근조림 | N | STRONG | ADD | 2 |
| recipe_0159 | 애호박전 | Y | NONE | REMOVE | 0 |
| recipe_0163 | 단호박죽 | N | VALID | ADD | 1 |
| recipe_0199 | 치즈떡볶이 | N | VALID | ADD | 1 |
| recipe_0202 | 김치전 | N | VALID | ADD | 5 |
| recipe_0235 | 닭칼국수 | N | VALID | ADD | 1 |
| recipe_0254 | 닭곰탕 | N | STRONG | ADD | 3 |
| recipe_0272 | 고등어무조림 | Y | VALID | KEEP | 1 |

## ADD (false negatives / newly eligible)

- 010 닭갈비 [VALID] valid=2 — 마들푸드 춘천 닭갈비 밀키트 부재료 포함 국내산 닭다리살, 4인세트(닭갈비1kg+양배추고구마+떡+소스), 1세트, 1kg
- 016 미역국 [STRONG] valid=2 — 친절한이서방 전복 미역국 밀키트 (2인분), 3개, 160g
- 032 떡갈비 [STRONG] valid=3 — [엔터푸드] 떡갈비 밀키트 (150g), 150g, 1개
- 033 갈치조림 [STRONG] valid=4 — 여수 맛집 청정게장촌 갈치조림 2~3인분 양념 밀키트 국내산 캠핑, 1개, 1kg
- 034 닭개장 [STRONG] valid=5 — [로켓프레시] 프로즌 재료가득 든든닭개장 5개입 (냉동), 1.15kg, 1개
- 037 비빔국수 [VALID] valid=1 — [로켓프레시] 쿡솜씨 물비빔국수 밀키트 (냉동)
- 038 냉면 [STRONG] valid=2 — (당일배송) 조선호랑이냉면 물냉면 냉면 밀키트 (5인분), 3.05kg, 1개
- 039 잡채 [VALID] valid=1 — 맛집곳간 인생잡채 매운맛 매운잡채 밀키트 10분완성 실온보관 간편식 100%국내산채소, 3개, 99g
- 060 프렌치토스트 [VALID] valid=1 — [맛집키트] 마핑파 프렌치토스트 쿠킹박스 밀키트(2~3인) 홈브런치 집들이 밀키트 홈파티 홈카페 l
- 086 참치김치찌개 [VALID] valid=2 — 곰곰 참치김치찌개 (냉동)
- 091 보쌈 [STRONG] valid=4 — 복선당 전통 목전지 보쌈 295g (냉동), 295g, 1세트
- 092 찜닭 [VALID] valid=3 — [로켓프레시] 청춘불판 순살 안동찜닭 (냉동), 900g, 1팩
- 095 은갈치조림 [STRONG] valid=2 — 훈훈수산 순살 갈치조림 밀키트 제주 은갈치조림 간편 조리
- recipe_0122 오뎅탕 [VALID] valid=1 — 마녀바스켓 어묵탕 오뎅탕 밀키트(스프포함), 200g, 10개
- recipe_0123 시래기된장국 [VALID] valid=2 — 피아골미선씨 프리미엄 고로쇠 시래기된장국 (냉동)
- recipe_0127 오삼불고기 [VALID] valid=3 — [로켓프레시] 셰프초이스 오삼불고기 (냉동)
- recipe_0144 무생채 [STRONG] valid=2 — 음식나라실습키트 한식조리기능사 실기재료 밀키트판매(6가지) 6번-잡채,더덕생채,미나리강회,탕평채,비빔밥,무생채
- recipe_0147 진미채볶음 [VALID] valid=2 — 본죽 밑반찬 2종 반찬세트(진미채볶음, 깻잎무침) 간편식 밀키트
- recipe_0149 새우볶음 [VALID] valid=1 — 을지옥 쭈꾸미볶음 밀키트 세트 대창 차돌 삼겹 새우 볶음밥 2개씩 16ea
- recipe_0150 메추리알장조림 [STRONG] valid=2 — 본죽 밑반찬 장조림 3종 반찬세트(쇠고기장조림, 메추리알장조림, 꽈리고추 돼지고기 장조림) 간편식 밀키트
- recipe_0151 연근조림 [STRONG] valid=2 — 비비고 간편반찬 오징어채볶음 호두연근조림 세트 가정간편식 밀키트
- recipe_0163 단호박죽 [VALID] valid=1 — [국내산] 본초맘죽 단호박죽 영양 간편식 밀키트 간편죽 이유식 아기죽 아침대용
- recipe_0199 치즈떡볶이 [VALID] valid=1 — [인생건어물] 형기네 눈꽃치즈 떡볶이 470g 5봉 밀키트 대용량 업소용
- recipe_0202 김치전 [VALID] valid=5 — 오뚜기 초간편 김치전 믹스
- recipe_0235 닭칼국수 [VALID] valid=1 — 간편담은 쫄깃 구포 잔치국수 비빔국수 해물맛칼국수 닭칼국수 김치국수 1인분 (면+스프 라면처럼 간편 밀키트), 1개, 108g
- recipe_0254 닭곰탕 [STRONG] valid=3 — 춘풍접객 진한 닭곰탕 600g 영양식 곰탕 가정식 업소용 밀키트 냉동 즉석국, 1개, 600g

## REMOVE (previous 23, now WEAK/NONE)

- 024 부대찌개 [WEAK] valid=1
- 048 칼국수 [NONE] valid=0
- recipe_0159 애호박전 [NONE] valid=0

## FALSE_NEGATIVES_FOUND

Previous audit/eligibility missed these catalog menus that now have STRONG/VALID meal kits:

- 닭갈비 (010)
- 미역국 (016)
- 떡갈비 (032)
- 갈치조림 (033)
- 닭개장 (034)
- 비빔국수 (037)
- 냉면 (038)
- 잡채 (039)
- 프렌치토스트 (060)
- 참치김치찌개 (086)
- 보쌈 (091)
- 찜닭 (092)
- 은갈치조림 (095)
- 오뎅탕 (recipe_0122)
- 시래기된장국 (recipe_0123)
- 오삼불고기 (recipe_0127)
- 무생채 (recipe_0144)
- 진미채볶음 (recipe_0147)
- 새우볶음 (recipe_0149)
- 메추리알장조림 (recipe_0150)
- 연근조림 (recipe_0151)
- 단호박죽 (recipe_0163)
- 치즈떡볶이 (recipe_0199)
- 김치전 (recipe_0202)
- 닭칼국수 (recipe_0235)
- 닭곰탕 (recipe_0254)

## FALSE_POSITIVES_FOUND

Previous eligible menus that no longer have a clear meal-kit hit:

- 부대찌개 (024)
- 칼국수 (048)
- 애호박전 (recipe_0159)

## STRONG sample

- 001 제육볶음 (2)
- 003 김치찌개 (3)
- 006 불고기 (3)
- 012 닭볶음탕 (4)
- 013 오징어볶음 (3)
- 015 육개장 (3)
- 016 미역국 (2)
- 025 청국장찌개 (4)
- 026 소고기무국 (3)
- 032 떡갈비 (3)
- 033 갈치조림 (4)
- 034 닭개장 (5)
- 038 냉면 (2)
- 047 순대국 (2)
- 049 수제비 (2)
- 062 매콤순대볶음 (2)
- 065 치즈볼 (3)
- 091 보쌈 (4)
- 095 은갈치조림 (2)
- recipe_0103 새우볶음밥 (4)
- recipe_0144 무생채 (2)
- recipe_0150 메추리알장조림 (2)
- recipe_0151 연근조림 (2)
- recipe_0254 닭곰탕 (3)

API_REQUEST_COUNT: 691
RATE_LIMIT_EVENTS: 90

## QUALITY_CAVEATS (do not auto-apply to production)

- **024 부대찌개 REMOVE/WEAK:** 실시간 상위 히트에 `밀키트` 문구가 없고 가드 통과 1건만. 이전 기기 QA에서는 정상 노출됐음. ranking drift. production allowlist에서 바로 빼지 말 것.
- **048 칼국수 / recipe_0159 애호박전:** 이번 런에서 clear meal-kit 0. 일시적 재고/랭킹 가능.
- **ADD 품질 편차:** `김치전`은 부침개 믹스, `무생채/연근조림/메추리알장조림`은 조리기능사·밑반찬 세트. 한 끼 메인 추천과 결이 다름.
- **FINAL_RECOMMENDED 46**은 STRONG+VALID 합산. Pilot 확대 전에 메인 식사 적합도 재필터 필요.

Note: production eligibility file was NOT updated. This report is discovery-only.

## FINAL DECISION (audit only)

EXISTING_300_AUDIT: 300
FINAL_ELIGIBLE: 46 (STRONG 24 + VALID 22)
PREVIOUS_ELIGIBLE: 23
KEEP: 20 / ADD: 26 / REMOVE: 3
NEW_STRONG_CANDIDATES: 3 (extractor raw; curated: 밀푀유나베 중심)
NEW_ADD_CANDIDATES: 12 (raw; 브랜드 접두 혼입 있음)
API_REQUEST_COUNT: 691
RATE_LIMIT_EVENTS: 90
PRODUCTION_CODE_CHANGED: NO
RECIPE_DATA_CHANGED: NO

CATALOG_EXPANSION_RECOMMENDATION: **LIMITED_GO**

1. 기존 300에서 밀키트가 되는 메인은 찌개/조림/국 중심으로 늘릴 여지가 있으나, ADD 26 전부는 품질이 고르지 않다.
2. Coupang 역방향에서 **밀푀유나베 / 불고기전골 / 해물탕·알탕**은 실제 밀키트가 확인됐고 catalog에 없다.
3. 추출명에 브랜드가 붙어 raw TOP가 지저분하므로, 신규 recipe 추가는 사람 검수 후 소수만 진행한다.
