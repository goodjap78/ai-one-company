# Gold Meal TOP20 — Review Packet

**Version:** 1.1  
**Status:** ✅ Approved  
**Date:** 2026-07-06  
**Sprint:** 24 (selection) · 25-A (flagship draft) · **25-B (flagship production)**

---

> **Purpose:** Confirm the official 20 Gold Meals before expanding content and wiring the recommendation engine.  
> HANKKI recommends **complete MAIN meals** — not recipes, not side dishes, not alcohol.

**Companion docs:** [Content Standard](./HANKKI_CONTENT_STANDARD.md) · [Meal Intelligence DB](./MEAL_INTELLIGENCE_DATABASE_v1.md) · [Flagship 5 content](../apps/todays-menu/content/gold-meals/flagship/)

---

## Approval checklist

| # | Question | Status |
|---|----------|--------|
| 1 | All 20 are **MAIN meals** Koreans actually eat frequently? | ✅ |
| 2 | Cuisine mix (KR 10 · Western 4 · JP 3 · CN 3) is correct? | ✅ |
| 3 | All five `mealStyle` values are represented? | ✅ |
| 4 | Real situations covered (family, solo, busy, rain, weekend, late-night, comfort, quick)? | ✅ |
| 5 | **Flagship 5** content standard approved for remaining 15? | ✅ |
| 6 | No alcohol in any pairing? | ✅ |
| 7 | Ready to wire TOP20 into recommendation engine? | ✅ (selection); wiring in Sprint 26 |

**Sign-off:** Product approved **2026-07-06**

---

## Summary

| Metric | Value |
|--------|-------|
| Total meals | 20 |
| Korean | 10 |
| Western | 4 (includes 짜파게티 instant) |
| Japanese | 3 |
| Chinese | 3 |
| `recipe` | 14 |
| `grill` | 1 |
| `assembly` | 1 |
| `instant` | 1 |
| `delivery` | 3 |
| Flagship content complete | 5 | **Production-ready** (Sprint 25-B) |
| Draft content (needs flagship template) | 15 | ⏸ Not started — Sprint 25-C |

---

## TOP20 — Full list

### Korean (10)

| # | Meal | ID | Style | Mode | Content status | Review |
|---|------|-----|-------|------|----------------|--------|
| 1 | **김치찌개** | `gold_kr_kimchi_jjigae` | recipe | 집에서 | ✅ **Production** | ✅ |
| 2 | 된장찌개 | `gold_kr_doenjang_jjigae` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 3 | **제육볶음** | `gold_kr_jeyuk_bokkeum` | recipe | 집에서 | ✅ **Production** | ✅ |
| 4 | 불고기 | `gold_kr_bulgogi` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 5 | **비빔밥** | `gold_kr_bibimbap` | recipe | 집에서 | ✅ **Production** | ✅ |
| 6 | 김치볶음밥 | `gold_kr_kimchi_bokkeumbap` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 7 | 닭갈비 | `gold_kr_dakgalbi` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 8 | 순두부찌개 | `gold_kr_sundubu_jjigae` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 9 | 부대찌개 | `gold_kr_budae_jjigae` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 10 | **삼겹살** | `gold_kr_samgyeopsal` | grill | 집에서 | ✅ **Production** | ✅ |

### Western (4)

| # | Meal | ID | Style | Mode | Content status | Review |
|---|------|-----|-------|------|----------------|--------|
| 11 | 카레라이스 | `gold_w_curry_rice` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 12 | 크림 파스타 | `gold_w_cream_pasta` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 13 | 수제버거 | `gold_w_burger` | assembly | 집에서 | ⏸ Sprint 25-C | ☐ |
| 14 | **짜파게티** | `gold_kr_jjapaghetti` | instant | 집에서 | ✅ **Production** | ✅ |

### Japanese (3)

| # | Meal | ID | Style | Mode | Content status | Review |
|---|------|-----|-------|------|----------------|--------|
| 15 | 돈카츠 | `gold_j_donkatsu` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 16 | 오므라이스 | `gold_j_omurice` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |
| 17 | 규동 | `gold_j_gyudon` | recipe | 집에서 | ⏸ Sprint 25-C | ☐ |

### Chinese (3)

| # | Meal | ID | Style | Mode | Content status | Review |
|---|------|-----|-------|------|----------------|--------|
| 18 | 짜장면 | `gold_c_jajangmyeon` | delivery | 시켜 | ⏸ Sprint 25-C | ☐ |
| 19 | 짬뽕 | `gold_c_jjamppong` | delivery | 시켜 | ⏸ Sprint 25-C | ☐ |
| 20 | 마라탕 | `gold_c_malatang` | delivery | 시켜 | ⏸ Sprint 25-C | ☐ |

**Content paths**

- Flagship (approved template): `apps/todays-menu/content/gold-meals/flagship/`
- Draft (pre-flagship): `apps/todays-menu/content/gold-meals/`
- TypeScript runtime: `apps/todays-menu/library/gold-meals/`

---

## Situation coverage matrix

| Situation | Meals |
|-----------|-------|
| **Rainy day** | 김치찌개, 된장찌개, 삼겹살, 순두부찌개, 짬뽕 |
| **Busy weekday** | 제육볶음, 김치볶음밥, 순두부찌개, 규동, 수제버거, 짜장면 |
| **Weekend** | 삼겹살, 닭갈비, 불고기, 수제버거, 마라탕 |
| **Family dinner** | 김치찌개, 된장찌개, 불고기, 삼겹살, 카레라이스, 돈카츠, 짜장면 |
| **Eating alone** | 김치볶음밥, 순두부찌개, 규동, 크림 파스타, 짜파게티, 짜장면 |
| **Late-night** | 김치볶음밥, 순두부찌개, 부대찌개, 짜파게티, 짬뽕, 마라탕 |
| **Comfort food** | 김치찌개, 된장찌개, 부대찌개, 오므라이스, 짜파게티, 짬뽕 |
| **Quick meal** | 제육볶음, 김치볶음밥, 규동, 짜파게티, 수제버거, 짜장면 |

---

## Flagship 5 — Content standard preview

These five define the template for the remaining 15. **Bold** in tables above.

| # | Meal | Short description (decision-first) | Key pairings |
|---|------|-----------------------------------|--------------|
| 1 | 김치찌개 | 비 오는 저녁, 얼큰한 국물 한 그릇과 밥 — 오늘은 이걸 먹으면 됩니다. | 계란말이 · 김 · 공기밥 |
| 2 | 삼겹살 | 주말 저녁, 가족과 함께 구워 먹는 삼겹살 — 오늘은 이 한 상이면 충분해요. | 상추 · 마늘 · 쌈장 · 된장찌개 · 볶음김치 |
| 3 | 제육볶음 | 바쁜 날, 밥 위에 올리면 끝 — 오늘은 제육볶음 한 그릇이면 충분해요. | 상추쌈 · 김치 · 공기밥 |
| 4 | 비빔밥 | 한 그릇에 정리되는 균형 잡힌 한 끼 — 오늘은 비빔밥이 딱이에요. | 미역국 · 김 · 계란후라이 |
| 5 | 짜파게티 | 10분이면 끝 — 오늘은 요리 말고, 편하게 한 그릇 위로받으면 돼요. | 계란후라이 · 파김치 · 단무지 |

Full content: [flagship/README.md](../apps/todays-menu/content/gold-meals/flagship/README.md)

---

## Per-meal review cards (TOP20)

Use these for line-by-line approval or swap proposals.

---

### 1. 김치찌개 `gold_kr_kimchi_jjigae`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Rainy day, family dinner, comfort, late-night, solo |
| AI reason | 오늘 하루가 길었죠. 따뜻한 국물 한 그릇이면 오늘을 편하게 마무리할 수 있어요. |
| Pairings | 계란말이, 김, 공기밥 |
| Content | ✅ Flagship |

---

### 2. 된장찌개 `gold_kr_doenjang_jjigae`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Rainy day, family dinner, comfort, busy weekday |
| AI reason | 매운 것보다 편안한 맛이 당길 때, 된장찌개가 딱이에요. |
| Pairings | 계란말이, 깍두기, 공기밥 |
| Content | 🟡 Draft — rewrite after flagship approval |

---

### 3. 제육볶음 `gold_kr_jeyuk_bokkeum`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Busy weekday, quick meal, family, solo |
| AI reason | 시간은 없는데 든든하게 먹고 싶을 때, 고민할 필요 없어요. |
| Pairings | 상추쌈, 김치, 공기밥 |
| Content | ✅ Flagship |

---

### 4. 불고기 `gold_kr_bulgogi`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Family dinner, weekend, guest meal |
| AI reason | 오늘 저녁을 조금 더 특별하게 먹고 싶을 때, 불고기가 좋아요. |
| Pairings | 상추, 쌈장, 김치, 공기밥 |
| Content | 🟡 Draft |

---

### 5. 비빔밥 `gold_kr_bibimbap`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Busy weekday, solo, family, comfort |
| AI reason | 오늘은 무겁지 않게, 한 그릇으로 깔끔하게 — 오늘의 답은 비빔밥이에요. |
| Pairings | 미역국, 김, 계란후라이 |
| Content | ✅ Flagship |

---

### 6. 김치볶음밥 `gold_kr_kimchi_bokkeumbap`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Quick meal, solo, late-night, busy weekday |
| AI reason | 바쁜 하루 끝, 부담 없이 빠르게 먹고 싶을 때 김치볶음밥이 딱이에요. |
| Pairings | 계란후라이, 김, 단무지 |
| Content | 🟡 Draft |

---

### 7. 닭갈비 `gold_kr_dakgalbi`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Weekend, family dinner, friends |
| AI reason | 오늘은 함께 모여 든든하게 먹고 싶을 때, 닭갈비가 좋아요. |
| Pairings | 떡, 콩나물, 김, 공기밥 |
| Content | 🟡 Draft |

---

### 8. 순두부찌개 `gold_kr_sundubu_jjigae`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Rainy day, solo, late-night, quick, comfort |
| AI reason | 혼자, 따뜻하고 얼큰한 게 땡길 때 순두부찌개가 잘 맞아요. |
| Pairings | 계란, 김, 공기밥 |
| Content | 🟡 Draft |

---

### 9. 부대찌개 `gold_kr_budae_jjigae`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Weekend, late-night, friends, comfort |
| AI reason | 한 냄비로 풍성하게 나눠 먹고 싶을 때, 부대찌개가 딱이에요. |
| Pairings | 라면사리, 김치, 치즈 |
| Content | 🟡 Draft |

---

### 10. 삼겹살 `gold_kr_samgyeopsal`

| Field | Value |
|-------|-------|
| Style | grill · 집에서 |
| Best for | Weekend, family dinner, rainy day, comfort |
| AI reason | 비 오는 저녁, 집에서 고기 구울 냄새가 생각날 때 — 쌈 싸 먹으며 마무리해요. |
| Pairings | 상추, 마늘, 쌈장, 된장찌개, 볶음김치 |
| Content | ✅ Flagship |

---

### 11. 카레라이스 `gold_w_curry_rice`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Family dinner, busy weekday, comfort, quick |
| AI reason | 복잡한 요리 없이, 모두가 좋아하는 맛으로 편하게 먹고 싶을 때. |
| Pairings | 단무지, 샐러드, 피클 |
| Content | 🟡 Draft |

---

### 12. 크림 파스타 `gold_w_cream_pasta`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Solo, comfort, weekend, busy weekday |
| AI reason | 오늘은 한식 말고, 부드러운 양식이 땡길 때. |
| Pairings | 마늘빵, 샐러드 |
| Content | 🟡 Draft |

---

### 13. 수제버거 `gold_w_burger`

| Field | Value |
|-------|-------|
| Style | assembly · 집에서 |
| Best for | Quick meal, solo, weekend, busy weekday |
| AI reason | 배달 기다리기 싫고, 한 손에 든든하게 — 20분이면 끝나요. |
| Pairings | 감자튀김, 피클, 콜라 |
| Content | 🟡 Draft |

---

### 14. 짜파게티 `gold_kr_jjapaghetti`

| Field | Value |
|-------|-------|
| Style | instant · 집에서 |
| Best for | Quick meal, late-night, solo, comfort, busy weekday |
| AI reason | 바쁜 하루를 보냈다면, 복잡하게 생각하지 않아도 돼요. |
| Pairings | 계란후라이, 파김치, 단무지 |
| Content | ✅ Flagship |

---

### 15. 돈카츠 `gold_j_donkatsu`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Family dinner, comfort, weekend |
| AI reason | 바삭하고 든든한 한 끼가 필요할 때, 실패 없는 선택이에요. |
| Pairings | 양배추샐러드, 단무지, 미소국 |
| Content | 🟡 Draft |

---

### 16. 오므라이스 `gold_j_omurice`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Family dinner, comfort, weekend |
| AI reason | 부드럽고 편안한 맛 — 아이와 함께 먹기 좋은 한 그릇. |
| Pairings | 수프, 샐러드 |
| Content | 🟡 Draft |

---

### 17. 규동 `gold_j_gyudon`

| Field | Value |
|-------|-------|
| Style | recipe · 집에서 |
| Best for | Quick meal, solo, busy weekday, comfort |
| AI reason | 점심에 빠르게 한 그릇 — 고민할 시간도 아까워요. |
| Pairings | 미소국, 장아찌 |
| Content | 🟡 Draft |

---

### 18. 짜장면 `gold_c_jajangmyeon`

| Field | Value |
|-------|-------|
| Style | delivery · 시켜 |
| Best for | Quick meal, solo, family, comfort, busy weekday |
| AI reason | 요리하기 싫고, 누구나 좋아하는 편안한 맛이 당길 때. |
| Pairings | 탕수육(소), 단무지, 양파 |
| Content | 🟡 Draft |

---

### 19. 짬뽕 `gold_c_jjamppong`

| Field | Value |
|-------|-------|
| Style | delivery · 시켜 |
| Best for | Rainy day, late-night, solo, comfort |
| AI reason | 비 오는 날, 얼큰한 국물이 생각날 때. |
| Pairings | 군만두, 깍두기 |
| Content | 🟡 Draft |

---

### 20. 마라탕 `gold_c_malatang`

| Field | Value |
|-------|-------|
| Style | delivery · 시켜 |
| Best for | Late-night, weekend, friends, comfort |
| AI reason | 매콤얼얼한 맛이 당길 때, 친구와 나눠 먹기 좋아요. |
| Pairings | 꿔바로우, 볶음밥(소) |
| Content | 🟡 Draft |

---

## Swap candidates (if needed)

| Current | Alternative | Notes |
|---------|-------------|-------|
| — | 갈비탕 | Warmer soup option; less interactive than 삼겹살 |
| — | 치킨 | Popular delivery MAIN; would need delivery slot |
| — | 라면 (일반) | Overlaps 짜파게티 instant slot |
| 크림 파스타 | 토마토 파스타 | Lighter; similar style coverage |

*No swaps proposed by default — list approved as-is from Sprint 24.*

---

## After approval

1. **Sprint 25-B** — Rewrite remaining 15 meals using flagship template  
2. **Sprint 26** — Wire `GOLD_MEAL_LIBRARY` into `recommendationEngine`  
3. **Sprint 27** — Extended catalog toward 100 MAIN meals  

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-06 | Initial TOP20 review packet |

---

*Reply with approved meal numbers, swap requests, or flagship content edits.*
