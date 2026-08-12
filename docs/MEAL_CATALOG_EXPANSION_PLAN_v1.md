# MEAL Catalog Expansion Plan v1

Sprint 57 — Meal-Time Recommendation Foundation  
Recorded: 2026-08-09  
Current catalog: **160 recipes** → 1st target: **300 recipes** (+140)

---

## 1. Current pool statistics (derived, score ≥ threshold)

Source: `generated/meal-time-recommendation/meal-time-summary.json` (Sprint 57 audit)

| Slot | Label | ≥0.7 | ≥0.5 | ≥0.3 | Target ≥0.7 | Gap |
|------|-------|------|------|------|-------------|-----|
| breakfast | 아침 | **31** | 56 | 101 | 45 | **+14** |
| lunch | 점심 | **108** | 115 | 152 | 70 | −38 (surplus) |
| dinner | 저녁 | **115** | 123 | 153 | 80 | −35 (surplus) |
| lateNight | 야식 | **31** | 37 | 126 | 40 | **+9** |

**Primary meal-time distribution (160 recipes)**

| Slot | Primary count |
|------|---------------|
| breakfast | 21 |
| lunch | 97 |
| dinner | 34 |
| lateNight | 8 |

Interpretation: lunch/dinner pools are already wide at ≥0.7. Expansion priority is **breakfast** and **lateNight** slots, plus **food-type depth** (not raw pool count) for lunch/dinner sub-types.

---

## 2. Target pools (post-300 catalog)

After +140 recipes, target ≥0.7 pools:

| Slot | Current ≥0.7 | Target ≥0.7 | Planned new recipes |
|------|--------------|-------------|---------------------|
| breakfast | 31 | 55–60 | ~35 |
| lunch | 108 | 85–95 | ~25 (type diversity, not volume) |
| dinner | 115 | 95–105 | ~30 (type diversity) |
| lateNight | 31 | 50–55 | ~30 |
| **Total** | — | — | **~140** |

Lunch/dinner new items should **raise food-type coverage** without inflating already-large pools.

---

## 3. Food-type gap analysis (score ≥0.7 in slot)

Top gaps (current vs target):

| Slot | Food type | Current | Target | Gap |
|------|-----------|---------|--------|-----|
| lunch | rice_bowl | 8 | 18 | **10** |
| breakfast | sandwich | 1 | 10 | **9** |
| breakfast | yogurt_fruit | 1 | 8 | **7** |
| breakfast | porridge | 0 | 6 | **6** |
| breakfast | salad_light | 0 | 6 | **6** |
| lunch | fried_rice | 6 | 12 | **6** |
| lunch | gimbap | 2 | 8 | **6** |
| lunch | sandwich_lunch | 2 | 8 | **6** |
| dinner | pasta_western | 6 | 12 | **6** |
| dinner | grilled | 6 | 12 | **6** |
| lateNight | ramen | 6 | 12 | **6** |
| lateNight | light_late | 1 | 6 | **5** |
| lateNight | noodle | 6 | 10 | **4** |
| breakfast | toast | 6 | 8 | **2** |
| breakfast | light_rice | 4 | 6 | **2** |

**Breakfast gaps:** porridge, salad_light, sandwich, yogurt_fruit, egg depth  
**Lunch gaps:** rice_bowl, gimbap, fried_rice, sandwich_lunch  
**Dinner gaps:** pasta_western, grilled (meat/fish/family already stronger)  
**LateNight gaps:** ramen, snack, light_late, spicy_quick

---

## 4. New recipe priority (140 allocation)

| Priority tier | Count | Focus |
|---------------|-------|-------|
| P1 — Breakfast core | 35 | porridge×6, sandwich×9, yogurt/fruit×7, salad_light×6, egg×4, toast×2, light_rice×2 |
| P2 — Late night | 30 | ramen×6, snack×8, light_late×5, spicy_quick×6, noodle×4, convenience-style×3 |
| P3 — Lunch type depth | 25 | rice_bowl×10, gimbap×6, fried_rice×6, sandwich_lunch×5 |
| P4 — Dinner type depth | 30 | pasta_western×6, grilled×6, fish×5, soup_stew×5, side_dish_combo×5, family×5, meat×5 |
| P5 — Quality / balance | 10 | duplicate-title fixes, SIDE_DISH depth, seasonal rotation |

**Not in Sprint 57:** actual recipe authoring — plan only.

---

## 5. Expected final catalog composition (300)

| Collection | Current | Target | Notes |
|------------|---------|--------|-------|
| HOME (main) | 130 | ~220 | Core meal-time recommendation pool |
| SIDE_DISH | 30 | ~50 | Dinner side-dish combinations |
| SOLO / GENERAL | 20+20 | ~30 | Single-serving & quick meals |
| **Total** | 160 | 300 | |

Cuisine mix (approximate target):

- Korean 55%, Japanese 12%, Western 15%, Chinese 8%, Healthy/quick 10%

---

## 6. Batch expansion plan

| Batch | Size | Theme | Post-batch checks |
|-------|------|-------|-------------------|
| **Batch 1** | +30 | Breakfast foundation (porridge, egg, toast, sandwich, yogurt) | duplicate title, unit audit, validate:hankki-recipes, meal-time pool recompute |
| **Batch 2** | +30 | Late night (ramen variants, snacks, light late) | same + image coverage plan |
| **Batch 3** | +30 | Lunch bowls & gimbap | same |
| **Batch 4** | +30 | Dinner western/grilled/fish | same |
| **Batch 5** | +20 | Gap fill + quality | final pool audit toward 300 |

Each batch pipeline:

1. `recipes:validate` / `validate:hankki-recipes`
2. `test:ingredient-unit-audit`
3. `validate:recipe-metadata`
4. `test:meal-time-metadata` (pool + gap recompute)
5. Hero image queue / step image coverage plan

---

## 7. Batch 1 recommended composition (+30)

| # | Proposed type | mealType hint | cookTime target |
|---|---------------|---------------|-----------------|
| 6 | porridge / 죽 variants | 아침 | ≤20 min |
| 6 | egg dishes (beyond current) | 아침 | ≤15 min |
| 5 | sandwich / toast | 아침 | ≤15 min |
| 5 | yogurt / fruit / parfait | 아침, 야식 | ≤10 min |
| 4 | light salad breakfast | 아침 | ≤15 min |
| 4 | light soup breakfast | 아침 | ≤20 min |

Batch 1 closes ~60% of breakfast food-type gaps and ~8 of the 14 breakfast pool ≥0.7 gap.

---

## 8. Architecture notes

- **Metadata storage:** sidecar `data/recommendation/recipeMealTimeMetadata.ts` + `deriveMealTimeFit()` — no batch file edits for scoring.
- **Overrides:** sparse `data/recommendation/mealTimeOverrides.ts` only when rules fail.
- **Existing fields reused:** `mealType`, `decisionTags.mealTime`, `standardMetadata.mealTypes`, `dishType`, `cookTime`, `spicyLevel`, tags, ingredients.
- **Not duplicated:** boolean breakfast/lunch flags — replaced by continuous `MealTimeFit` scores.

---

## 9. Out of scope (Sprint 57)

- Home recommendation engine wiring
- Production AsyncStorage cache
- UI changes
- New recipe JSON in batches

---

## 10. Success metrics (Sprint 58+)

| Metric | Current (160) | Target (300) |
|--------|---------------|--------------|
| breakfast ≥0.7 | 31 | ≥55 |
| lateNight ≥0.7 | 31 | ≥50 |
| sandwich (breakfast) | 1 | ≥10 |
| porridge | 0 | ≥6 |
| rice_bowl (lunch) | 8 | ≥18 |
| ramen (lateNight) | 6 | ≥12 |

Re-run: `npm run test:meal-time-metadata` after each batch.
