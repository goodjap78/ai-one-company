# HANKKI Gold Meal Library v1.0

**Status:** Production content  
**Sprint:** 25 — Gold Meal Library Content v1.0  
**Meals:** 20 MAIN meals (approved Sprint 24)

---

## Index

### Korean (10)

| ID | Meal | Style | File |
|----|------|-------|------|
| `gold_kr_kimchi_jjigae` | 김치찌개 | recipe | [gold_kr_kimchi_jjigae.md](./gold_kr_kimchi_jjigae.md) |
| `gold_kr_doenjang_jjigae` | 된장찌개 | recipe | [gold_kr_doenjang_jjigae.md](./gold_kr_doenjang_jjigae.md) |
| `gold_kr_jeyuk_bokkeum` | 제육볶음 | recipe | [gold_kr_jeyuk_bokkeum.md](./gold_kr_jeyuk_bokkeum.md) |
| `gold_kr_bulgogi` | 불고기 | recipe | [gold_kr_bulgogi.md](./gold_kr_bulgogi.md) |
| `gold_kr_bibimbap` | 비빔밥 | recipe | [gold_kr_bibimbap.md](./gold_kr_bibimbap.md) |
| `gold_kr_kimchi_bokkeumbap` | 김치볶음밥 | recipe | [gold_kr_kimchi_bokkeumbap.md](./gold_kr_kimchi_bokkeumbap.md) |
| `gold_kr_dakgalbi` | 닭갈비 | recipe | [gold_kr_dakgalbi.md](./gold_kr_dakgalbi.md) |
| `gold_kr_sundubu_jjigae` | 순두부찌개 | recipe | [gold_kr_sundubu_jjigae.md](./gold_kr_sundubu_jjigae.md) |
| `gold_kr_budae_jjigae` | 부대찌개 | recipe | [gold_kr_budae_jjigae.md](./gold_kr_budae_jjigae.md) |
| `gold_kr_samgyeopsal` | 삼겹살 | grill | [gold_kr_samgyeopsal.md](./gold_kr_samgyeopsal.md) |

### Western (3) + Instant (1)

| ID | Meal | Style | File |
|----|------|-------|------|
| `gold_w_curry_rice` | 카레라이스 | recipe | [gold_w_curry_rice.md](./gold_w_curry_rice.md) |
| `gold_w_cream_pasta` | 크림 파스타 | recipe | [gold_w_cream_pasta.md](./gold_w_cream_pasta.md) |
| `gold_w_burger` | 수제버거 | assembly | [gold_w_burger.md](./gold_w_burger.md) |
| `gold_kr_jjapaghetti` | 짜파게티 | instant | [gold_kr_jjapaghetti.md](./gold_kr_jjapaghetti.md) |

### Japanese (3)

| ID | Meal | Style | File |
|----|------|-------|------|
| `gold_j_donkatsu` | 돈카츠 | recipe | [gold_j_donkatsu.md](./gold_j_donkatsu.md) |
| `gold_j_omurice` | 오므라이스 | recipe | [gold_j_omurice.md](./gold_j_omurice.md) |
| `gold_j_gyudon` | 규동 | recipe | [gold_j_gyudon.md](./gold_j_gyudon.md) |

### Chinese (3)

| ID | Meal | Style | File |
|----|------|-------|------|
| `gold_c_jajangmyeon` | 짜장면 | delivery | [gold_c_jajangmyeon.md](./gold_c_jajangmyeon.md) |
| `gold_c_jjamppong` | 짬뽕 | delivery | [gold_c_jjamppong.md](./gold_c_jjamppong.md) |
| `gold_c_malatang` | 마라탕 | delivery | [gold_c_malatang.md](./gold_c_malatang.md) |

---

## Content rules applied

- All meals are `type = MAIN` (PD-002)
- Complete meal recommendations, not recipe pages (PD-011)
- No alcohol in pairings
- Delivery meals: no ingredient list; enjoy guide only
- Grill / assembly / instant: enjoy guide, no forced recipe steps
- Recipe meals: max 5–7 short steps

---

## Related code

TypeScript runtime library: `apps/todays-menu/library/gold-meals/`
