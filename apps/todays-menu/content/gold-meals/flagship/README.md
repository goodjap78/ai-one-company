# HANKKI Gold Meal Content — Flagship 5

**Sprint:** 25-B  
**Status:** ✅ Production-ready  
**TOP20:** Approved 2026-07-06

---

## Purpose

These 5 meals are the **official HANKKI content standard**.

- Meal decision first — recipes only support the meal when needed.
- User should feel: *"I know exactly what I should eat today."*
- Remaining 15 TOP20 meals are **not authored yet** — wait for Sprint 25-C.

---

## Flagship Meals (published)

| # | Meal | ID | Style | Content | TypeScript |
|---|------|-----|-------|---------|------------|
| 1 | 김치찌개 | `gold_kr_kimchi_jjigae` | recipe | [md](./gold_kr_kimchi_jjigae.md) | `library/gold-meals/flagship.ts` |
| 2 | 삼겹살 | `gold_kr_samgyeopsal` | grill | [md](./gold_kr_samgyeopsal.md) | ✅ |
| 3 | 제육볶음 | `gold_kr_jeyuk_bokkeum` | recipe | [md](./gold_kr_jeyuk_bokkeum.md) | ✅ |
| 4 | 비빔밥 | `gold_kr_bibimbap` | recipe | [md](./gold_kr_bibimbap.md) | ✅ |
| 5 | 짜파게티 | `gold_kr_jjapaghetti` | instant | [md](./gold_kr_jjapaghetti.md) | ✅ |

---

## Production format

Each `.md` file includes:

1. **YAML frontmatter** — machine-readable metadata (`status: published`, intelligence fields)
2. **Human-readable sections** — same 8-field template for content review

Import from code:

```typescript
import { GOLD_MEALS_FLAGSHIP, getFlagshipGoldMealById } from '@/library/gold-meals/flagship';
```

---

## Content template

1. Meal Name  
2. Short Description — decision-first, one sentence  
3. Best Situations  
4. AI Recommendation Reason — warm, natural  
5. Suggested Pairings — no alcohol  
6. Required Ingredients — if applicable  
7. Cooking Support — max 4 steps OR enjoy guide  
8. AI Confidence Reasons — 4 signals  

---

## Next sprint

**25-C** — Author remaining 15 TOP20 meals using this template (after explicit go-ahead).
