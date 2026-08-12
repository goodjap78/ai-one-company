# HANKKI Meal Intelligence Database v1.0

**Status:** Official — AI decision model  
**Version:** 1.0  
**Audience:** Product, engineering, content, AI  
**Companion docs:** [Product Bible](./HANKKI_BIBLE.md) · [Content Standard](./HANKKI_CONTENT_STANDARD.md) · [Launch Checklist](./LAUNCH_CHECKLIST.md)

---

> This document defines **how HANKKI thinks** before recommending a meal.  
> It is **not** a recipe database. It is an **AI decision database**.

Every meal record stores **what the meal is**.  
This model stores **when, why, and for whom** the AI should choose it — and **how to explain that choice**.

---

## 1. Core Philosophy

| Principle | Rule |
|-----------|------|
| **Not recipes** | HANKKI recommends the **best complete meal** for the user's current situation — not a cooking tutorial catalog. |
| **Always MAIN** | Today's pick is always `type = MAIN` (PD-002). |
| **Always a reason** | Every recommendation must be **explainable**. The user sees *why this meal, now* — never a random card. |
| **Never random** | Selection uses the decision flow and formula below. Random shuffle is forbidden. |

```text
Recipe database:   "How do I cook X?"
Meal intelligence: "Should the user eat X today — and why?"
```

---

## 2. AI Decision Flow

The recommendation engine evaluates candidates **in this order**.  
Each step **narrows the pool**. Later steps **rank** survivors.

```text
┌─────────────────────────────────────────────────────────────┐
│  STEP 1  Meal Time                                          │
│  BREAKFAST → LUNCH → DINNER → LATE_NIGHT                    │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2  Meal Type                                          │
│  MAIN only — SIDE / SOUP / DESSERT / DRINK excluded         │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3  Meal Style                                         │
│  recipe · grill · delivery · assembly · instant             │
│  (Filter by user mode: 집에서 vs 시켜 when applicable)       │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4  Situation (Context)                                │
│  weather · social setting · day type · location             │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5  Meal Purpose                                       │
│  comfort · diet · quick · family · kids · recovery · …      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6  Preference DNA                                     │
│  cuisine · dislikes · spice · skill · favorites             │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7  Recent Meals                                       │
│  Down-rank repeats · avoid same cuisine/tags within window  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
                    Selected meal + reasons
```

### Step reference

| Step | Input | Action |
|------|-------|--------|
| **1 — Meal Time** | Current clock → `BREAKFAST` / `LUNCH` / `DINNER` / `LATE_NIGHT` | Keep meals where `mealTime` includes current slot |
| **2 — Meal Type** | — | Keep `type = MAIN` only |
| **3 — Meal Style** | User mode (homemade / delivery), pantry signals (future) | Keep compatible `mealStyle`; e.g. delivery mode → `delivery` meals |
| **4 — Situation** | Today context: weather, weekend, alone, family, camping, date | Score meals matching `situationTags` + `weatherTags` |
| **5 — Meal Purpose** | Inferred or explicit user intent | Score meals matching `mealPurpose[]` |
| **6 — Preference DNA** | Favorites, tags, skill, dislikes, spice tolerance | Boost matches; hard-exclude disliked ingredients (future) |
| **7 — Recent Meals** | 7-day meal history | Penalize same `id`, similar cuisine, or overlapping purpose |

---

## 3. Meal Object (Intelligence Layer)

The Meal Intelligence record **extends** the [Content Standard](./HANKKI_CONTENT_STANDARD.md) menu object with decision metadata.

### Required fields

| Field | Type | Role |
|-------|------|------|
| `id` | `string` | Stable key |
| `title` | `string` | Display name |
| `type` | enum | `MAIN` \| `SIDE` \| `SOUP` \| `DESSERT` \| `DRINK` |
| `mealStyle` | enum | `recipe` \| `grill` \| `delivery` \| `assembly` \| `instant` |
| `mealPurpose` | `string[]` | Why someone picks this meal — see §4 |
| `mealTime` | `string[]` | `BREAKFAST` \| `LUNCH` \| `DINNER` \| `LATE_NIGHT` |
| `weatherTags` | `string[]` | When weather makes this meal a good fit — see §6 |
| `situationTags` | `string[]` | Social / context fit — see §5 |
| `difficulty` | enum | `easy` \| `normal` \| `hard` |
| `cookTime` | `integer` | Minutes until ready |
| `servings` | `integer` | Default portions |
| `ingredients` | `array` | Required components (content) |
| `steps` | `array` | Guide steps when applicable |
| `recommendedSides` | `string[]` | Paired SIDE meal IDs |
| `heroImage` | `object` | `emoji` + optional `url` |
| `aiReason` | `string` | Default one-line reason template |

### Intelligence vs. content

| Layer | Document | Owns |
|-------|----------|------|
| **Content** | Content Standard | Copy, ingredients, steps, images, `tags` |
| **Intelligence** | This document | `mealPurpose`, `weatherTags`, `situationTags`, scoring, explainability |

Both layers share the same `id`. Intelligence fields power **selection and explanation**; content fields power **execution after accept**.

---

## 4. Meal Purpose Values

`mealPurpose` — one or more per MAIN meal.  
Describes **why** a user would choose this meal today.

| Value | Korean | When to tag |
|-------|--------|-------------|
| `comfort` | 위로·편안 | Rainy day, stress, nostalgic cravings |
| `diet` | 다이어트 | Calorie-conscious, light eating |
| `muscle` | 고단백 | Post-workout, protein-forward |
| `healthy` | 건강식 | Balanced, vegetable-forward |
| `quick` | 빠른 한 끼 | `cookTime` ≤ 20, busy day |
| `family` | 가족 식사 | Shared table, kid-friendly options |
| `kids` | 아이 식사 | Mild, familiar, picky-eater safe |
| `baby` | 이유식·유아 | Soft, low salt (specialized catalog) |
| `recovery` | 회복·보양 | After illness, fatigue, hangover |
| `guest` | 손님 상 | Presentable, crowd-pleasing |
| `party` | 모임·파티 | Sharing, fun, group |
| `camping` | 캠핑 | Outdoor grill, portable prep |
| `lateNight` | 야식 | After 21:00, satisfying not heavy |

A meal may have multiple purposes (e.g. 삼겹살 → `comfort`, `family`, `muscle`, `party`).

---

## 5. Situation Tags

`situationTags` — where and with whom the meal fits.

| Tag | Meaning |
|-----|---------|
| `home` | Eaten at home |
| `delivery` | Typically ordered in |
| `alone` | Solo dining (혼밥) |
| `couple` | Date, two people |
| `family` | Family dinner |
| `friends` | Friends gathering |
| `office` | Work lunch context |
| `weekend` | Saturday / Sunday |
| `holiday` | Public holiday, celebration day |

Situation is **inferred at runtime** from time, calendar, household profile (future), and user mode — then matched against these tags.

---

## 6. Weather Tags

`weatherTags` — meals that score higher under specific weather.

| Tag | Typical boost |
|-----|----------------|
| `hot` | Summer heat → lighter, cold noodles, salad |
| `cold` | Winter chill → soup, stew, grill indoors |
| `rain` | Rainy day → comfort, soup, grill at home |
| `snow` | Snow → hot pot, stew, delivery |
| `humid` | Humid monsoon → mild soup, less fried |

Weather comes from **Today context** at runtime — not stored per user.

---

## 7. AI Recommendation Formula

Final score is a **weighted blend** — never a single signal alone.

```text
score(meal) =
    w₁ × popularity(meal)
  + w₂ × mealTimeMatch(meal, now)
  + w₃ × weatherMatch(meal, today.weather)
  + w₄ × situationMatch(meal, today.context)
  + w₅ × purposeMatch(meal, inferredPurpose)
  + w₆ × preferenceDNA(meal, user)
  − w₇ × recentMealPenalty(meal, history)
```

### Signals (mandatory)

| Signal | Source | Rule |
|--------|--------|------|
| **Popularity** | Catalog priors, favorites aggregate (future) | Baseline boost for well-tested Gold menus |
| **Meal Time** | Clock | Hard filter — must match `mealTime` |
| **Weather** | Today briefing | Boost `weatherTags` overlap |
| **Situation** | Calendar + context | Boost `situationTags` overlap |
| **Meal Purpose** | Inferred intent + history | Boost `mealPurpose` overlap |
| **Preference DNA** | Favorites, tags, skill, spice | Boost match; exclude conflicts |
| **Recent Meals** | 7-day history | Penalize same `id` and near-duplicates |

### Explainability output

The engine returns **up to 3 human-readable reasons** drawn from matched signals:

| Matched signal | Example reason (KO) |
|----------------|---------------------|
| Weather + meal | 🌧 비 오는 날엔 따뜻한 국물이 좋아요 |
| Purpose + meal | 👨‍👩‍👧 가족이 함께 먹기 좋아요 |
| Preference DNA | ❤️ 평소 좋아하시는 맛이에요 |
| Recent avoidance | 🍽️ 어제와 다른 메뉴를 골랐어요 |

`aiReason` on the meal is the **fallback** when no structured signal fires.

---

## 8. Preference DNA (Step 6 detail)

Runtime snapshot — not duplicated per meal.

| Dimension | Used for |
|-----------|----------|
| Favorite cuisine | Boost matching cuisine |
| Disliked ingredients | Exclude or penalize (future hard filter) |
| Spicy level | Match `mealPurpose` + tags `spicy` / `mild` |
| Cooking skill | Prefer `difficulty` ≤ skill ceiling |
| Recent history | Feed Step 7 penalties |

Stored in `RecommendationContext` (see engineering types). Meals do **not** store user DNA — only **compatibility tags** (`mealPurpose`, `situationTags`, `weatherTags`, content `tags`).

---

## 9. Recent Meals (Step 7 detail)

| Rule | Window | Effect |
|------|--------|--------|
| Same `id` | 7 days | Strong penalty |
| Same cuisine | 3 days | Medium penalty |
| Same `mealPurpose` | 2 days | Light penalty |

Refresh (**다시 추천받기**) applies penalties immediately to the current pick.

---

## 10. Future Expansion

The v1.0 schema is designed so these features **add columns or linked tables** — not redesign.

| Feature | Extends |
|---------|---------|
| **Restaurant recommendation** | `delivery` meals + `restaurantIds[]` linked table |
| **Shopping list** | `ingredients[]` → SKU mapping table |
| **Meal planner** | User plan table references meal `id` + date |
| **Weekly meal plan** | 7× `id` slots + Purpose/Situation per day |
| **AI Chef** | Conversation layer reads same intelligence fields |
| **Nutrition** | `nutrition` object on content layer |
| **Voice guide** | `chefStyle` + step `guide` — no intelligence change |

```text
Meal Intelligence v1.0  →  selection & explanation (stable)
Content Standard        →  execution content (stable)
Future modules          →  new edges, same meal node
```

---

## 11. Complete Example — 삼겹살

### Meal intelligence record (abbreviated)

```json
{
  "id": "kr_samgyeopsal",
  "title": "삼겹살",
  "type": "MAIN",
  "mealStyle": "grill",
  "mealPurpose": ["comfort", "family", "muscle", "party", "camping"],
  "mealTime": ["DINNER", "LATE_NIGHT"],
  "weatherTags": ["rain", "cold"],
  "situationTags": ["home", "family", "friends", "weekend", "couple"],
  "difficulty": "easy",
  "cookTime": 40,
  "servings": 3,
  "aiReason": "비 오는 날 가족과 함께 구워 먹기 좋아요.",
  "recommendedSides": [
    "kr_doenjang_jjigae",
    "side_lettuce",
    "side_garlic",
    "side_ssamjang",
    "side_kimchi"
  ],
  "heroImage": { "emoji": "🥓", "url": null }
}
```

### Today’s context (runtime)

| Dimension | Value |
|-----------|--------|
| Meal Time | `DINNER` |
| Weather | `rain` |
| Situation | `family` (inferred: weekend evening, household size > 1) |
| Inferred Purpose | `comfort` |
| User mode | `homemade` (집에서 먹기) |
| Preference DNA | likes Korean grill, tolerates spicy, skill `normal` |
| Recent Meals | 어제: 김치볶음밥 |

### AI reasoning trace

```text
STEP 1  Meal Time = DINNER
        → 842 candidates → 312 match DINNER

STEP 2  type = MAIN
        → 312 → 298 MAIN meals

STEP 3  mealStyle compatible with homemade
        → 298 → 186 (recipe, grill, assembly, instant — not delivery-only)

STEP 4  Situation: rain + family + weekend
        → Boost meals with weatherTags [rain] and situationTags [family, home]
        → 삼겹살 score +0.31 (rain + family match)

STEP 5  Purpose: comfort (inferred from rain + family dinner)
        → 삼겹살 mealPurpose includes comfort → +0.22

STEP 6  Preference DNA
        → Korean cuisine favorite → +0.15
        → difficulty easy ≤ skill normal → +0.08
        → muscle purpose matches post-week pattern → +0.05

STEP 7  Recent Meals
        → Not samgyeopsal yesterday → no id penalty
        → Different from 김치볶음밥 → +0.04 diversity

FINAL   삼겹살 wins top score among grill + comfort cluster
```

### Recommendation output (user-facing)

| Field | Value |
|-------|-------|
| **Recommendation** | 삼겹살 |
| **Confidence** | High (multiple signals aligned) |

**Reasons shown on Home:**

1. 🌧 비 오는 날, 집에서 구워 먹기 좋아요  
2. 👨‍👩‍👧 가족 저녁에 딱 맞는 메뉴예요  
3. 💪 든든한 고기 한 끼로 충분해요  

**After accept** (`mealStyle = grill`):

```text
삼겹살
  → 필요한 재료 (삼겹살, 소금, 후추, …)
  → 추천 반찬 (future UI)
       · 된장찌개
       · 상추
       · 마늘
       · 쌈장
       · 김치
  → 구이 가이드
```

---

## 12. Relationship to other documents

| Document | Relationship |
|----------|--------------|
| [HANKKI_BIBLE](./HANKKI_BIBLE.md) | Principles PD-002, PD-011 — MAIN meals, complete meals |
| [Content Standard](./HANKKI_CONTENT_STANDARD.md) | Shared meal object; content authoring rules |
| [Launch Checklist](./LAUNCH_CHECKLIST.md) | Preference DNA, explainable AI — verification gates |

When content authors publish a meal, they must fill **both** content fields and intelligence fields (`mealPurpose`, `weatherTags`, `situationTags`).

---

## 13. Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-06 | Initial Meal Intelligence Database — Sprint 22-B |

---

*HANKKI thinks before it recommends. Every meal has a reason.*
