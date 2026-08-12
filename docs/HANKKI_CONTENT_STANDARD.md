# HANKKI Content Standard v1.1

**Status:** Official  
**Applies to:** Every menu stored in the HANKKI application  
**Related decisions:** PD-002 (MAIN meals only) · PD-011 (complete meals, not recipes only) — see [Product Bible](./HANKKI_BIBLE.md)

This document is the **single source of truth** for menu content.  
All catalog entries, master recipe JSON files, CMS imports, and AI-generated drafts must conform to this standard before publication.

---

## 1. Purpose

HANKKI helps users decide **today's MAIN meal** — not today's side dish.

HANKKI recommends **complete meals**, not recipes alone. Every menu record includes `mealStyle` so the app knows how to guide the user after they accept.

Every menu record must answer four questions clearly:

1. **What is this?** (title, type, cuisine, mealStyle)
2. **When do people eat it?** (mealTime)
3. **What kind of meal is it?** (recipe / grill / assembly / delivery / instant)
4. **How do I get it on the table?** (ingredients → style-appropriate guide)

Content authors write for a tired person at dinner time.  
Short sentences. Warm tone. No recipe-blog filler.

---

## 2. Menu Record Overview

One menu = one JSON object (or one database row) with the fields below.

```text
Menu
├── Basic Information     id, title, subtitle, description
├── Classification        type, mealStyle
├── Meal Time             mealTime[]
├── Cuisine               cuisine
├── Cooking               cookTime, difficulty, servings
├── Ingredients           ingredients[]
├── Steps / Guide         steps[] (required for recipe; optional per mealStyle)
├── AI Recommendation     aiReason (+ runtime: confidence, weather, …)
├── Tags                  tags[]
├── Related Side Dishes   recommendedSides[]   (structure only — no UI yet)
├── Images                heroImage, ingredientImages, stepImages
└── Future Fields         nutrition, video, shopping, chefStyle
```

---

## 3. Basic Information

### `id` (required)

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | Stable, never reused. Prefer `{cuisine}_{slug}` e.g. `kr_kimchi_jjigae` |
| Rules | Lowercase letters, numbers, underscores only. No spaces. |

The `id` is the permanent key across favorites, meal history, recommendations, and side-dish pairing.

---

### `title` (required)

| Property | Value |
|----------|-------|
| Type | `string` (localized: `{ "ko": "...", "en": "..." }` in master DB) |
| Max length | 30 characters (Korean) |
| Rules | Use the name people actually say at home. No marketing adjectives. |

**Good:** 김치찌개, 제육볶음, 된장찌개  
**Avoid:** 엄마 손맛 가득한 특별 김치찌개

---

### `subtitle` (required)

| Property | Value |
|----------|-------|
| Type | `string` (localized) |
| Max length | 50 characters |
| Purpose | One-line mood or benefit shown under the title on Home |

**Good:** 얼큰하고 든든한 국물 한 그릇  
**Avoid:** Duplicating the full description

---

### `description` (required)

| Property | Value |
|----------|-------|
| Type | `string` (localized) |
| Max length | 200 characters |
| Purpose | 2–3 sentences on the ingredients screen. Sets expectations before cooking. |

Write like you're talking to a friend, not writing a food blog.

---

## 4. Classification

### `type` (required)

Defines the **role** of this menu in a meal — not the time of day.

| Value | Meaning | Today's recommendation? |
|-------|---------|---------------------------|
| `MAIN` | Today's primary meal (한 끼) | **Yes — only this type** |
| `SIDE` | 반찬, banchan | No |
| `SOUP` | Supplementary soup (not a full meal on its own) | No |
| `DESSERT` | Dessert | No |
| `DRINK` | Beverage | No |

**Product rule (Decision #002):**  
The recommendation engine selects **only** `type = MAIN`.  
SIDE dishes must **never** appear as today's first recommendation.

**Migration examples:**

| Menu | Correct `type` |
|------|----------------|
| 김치볶음밥 | `MAIN` |
| 제육볶음 | `MAIN` |
| 애호박볶음 | `SIDE` |
| 계란말이 | `SIDE` |
| 감자조림 | `SIDE` |
| 시금치나물 | `SIDE` |

---

### `mealStyle` (required)

Defines **how the user executes this meal** after accepting today's recommendation.  
**Product Decision #011:** Recipes are only one meal style. The recommendation engine must support all styles equally.

| Value | Label | Description | Example menus |
|-------|-------|-------------|---------------|
| `recipe` | Recipe Meal | Cook from ingredients with guided steps | 김치찌개, 제육볶음, 크림 파스타 |
| `grill` | Grill Meal | Grill or sear — prep + cook at table/stove; sides important | 삼겹살, 소고기 구이, 갈비 |
| `assembly` | Assembly Meal | Combine ready parts — minimal or no heat | 샌드위치, 샐러드 보울, 유부초밥 |
| `delivery` | Delivery Meal | Order from outside — no home cooking | 치킨, 짜장면, 피자 |
| `instant` | Instant Meal | Heat, soak, or open — fastest path | 컵라면, 즉석밥 세트, 냉동 도시락 |

**Authoring rules:**

1. Every `type = MAIN` menu must have exactly one `mealStyle`.
2. `mealStyle` describes execution — `type` describes meal role (MAIN vs SIDE).
3. Do not use `mealStyle = recipe` for meals that are primarily ordered (`delivery`) or assembled (`assembly`).
4. `recommendedSides` is especially important for `grill` and `recipe` styles.

---

## 5. Meal Time

### `mealTime` (required)

| Property | Value |
|----------|-------|
| Type | `string[]` — one or more slots |
| Allowed values | `BREAKFAST`, `LUNCH`, `DINNER`, `LATE_NIGHT` |

Indicates **when this menu is appropriate**, not when the user last ate.

| Slot | Typical window |
|------|----------------|
| `BREAKFAST` | 06:00 – 10:00 |
| `LUNCH` | 11:00 – 14:00 |
| `DINNER` | 17:00 – 21:00 |
| `LATE_NIGHT` | 21:00 – 02:00 |

A menu may belong to multiple slots (e.g. 김치볶음밥 → `LUNCH`, `DINNER`, `LATE_NIGHT`).

---

## 6. Cuisine

### `cuisine` (required)

| Property | Value |
|----------|-------|
| Type | `string` (enum) |

| Value | Examples |
|-------|----------|
| `Korean` | 김치찌개, 불고기, 비빔밥 |
| `Japanese` | 돈카츠, 오므라이스, 우동 |
| `Chinese` | 짜장면, 탕수육, 마파두부 |
| `Western` | 파스타, 스테이크, 샐러드 |
| `Asian` | 쌀국수, 팟타이, 커리 (pan-Asian) |
| `Dessert` | 케이크, 푸딩, 빙수 |
| `Snack` | 떡볶이, 김밥, 핫도그 |

Use the most specific cuisine that fits.  
When in doubt between `Asian` and a specific cuisine, prefer the specific one.

---

## 7. Cooking

### `cookTime` (required)

| Property | Value |
|----------|-------|
| Type | `integer` (minutes) |
| Range | 1 – 600 |
| Rules | Total active + passive time until ready to eat |

Round to realistic values. If a dish takes 23 minutes, write `25` — not `20`.

---

### `difficulty` (required)

| Value | Korean label | When to use |
|-------|--------------|-------------|
| `easy` | 쉬움 | Beginner-friendly, ≤ 3 techniques |
| `normal` | 보통 | Standard home cooking |
| `hard` | 어려움 | Multiple stages, timing-sensitive |

---

### `servings` (required)

| Property | Value |
|----------|-------|
| Type | `integer` |
| Range | 1 – 12 |
| Default | `2` for homemade MAIN meals |

---

## 8. Ingredients

### Philosophy

> **Users always see "필요한 재료" (or equivalent) before instructions.**

HANKKI is a meal decision app that adapts after acceptance.  
The user commits to a **meal** first, **checks what they need**, then follows the path for that `mealStyle`.

Content rules:

1. List every ingredient (or component) the user must have **before** step 1 or assembly.
2. Group optional items clearly (`optional: true`).
3. Use amounts people can measure at home (큰술, 개, g) — not chef units.
4. For `delivery` and `instant`, list what to order / open / have ready — still under `ingredients`.
5. Never hide requirements inside step text only; they belong in this list first.

### `ingredients` (required)

| Property | Value |
|----------|-------|
| Type | `array` of ingredient objects |
| Min items | 1 (all mealStyle values) |

**Ingredient object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` (localized) | Yes | Ingredient name |
| `amount` | `string` | Yes | e.g. `2큰술`, `300g`, `1/2개` |
| `optional` | `boolean` | No | `true` = "있으면 더 좋아요" |

**Grouping (display convention):**

| Group | Label in app |
|-------|--------------|
| Required | 꼭 필요한 재료 |
| Optional | 있으면 더 좋아요 |

---

## 9. Cooking Steps & Guides

### Philosophy

Applies when `mealStyle` includes step-by-step guidance (`recipe`, `grill`, `assembly`, `instant`).

- **One action per step.** Never combine "썰고, 볶고, 끓인다" in one step.
- **Keep every sentence short.** Target ≤ 40 characters per instruction line.
- Each step has a warm `guide` (HANKKI voice) separate from the factual `instruction`.
- `delivery` meals typically have **no steps** — use delivery flow instead.

### `steps` (conditional)

| mealStyle | `steps` required? | Notes |
|-----------|-------------------|-------|
| `recipe` | **Yes** (min 1) | Full guided cooking — 만드는 순서 |
| `grill` | Optional | Short grill guide; sides via `recommendedSides` |
| `assembly` | Optional | Simple assembly guide (2–5 steps) |
| `delivery` | No | Use delivery / order flow |
| `instant` | Optional | 1–3 steps max (끓이기, 데우기, etc.) |

**Step object** (when present):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order` | `integer` | Yes | Starts at 1, sequential |
| `instruction` | `string` (localized) | Yes | What to do — one action |
| `guide` | `string` | Yes | Short encouragement from HANKKI |
| `imageEmoji` | `string` | No | Placeholder until `stepImages` exist |

**Writing checklist:**

- [ ] Can the user do this step without reading the next one?
- [ ] Is there exactly one verb cluster per step?
- [ ] Would this make sense on a phone screen at arm's length?

---

## 10. AI Recommendation & Policy

### Meal recommendation (not recipe recommendation)

The engine recommends **complete MAIN meals** across all `mealStyle` values.  
Selection is **never random**. Signals:

| Signal | Role |
|--------|------|
| **Popularity** | Boost frequently eaten, well-tagged menus |
| **Meal Time** | Match `mealTime` to current slot |
| **Weather** | Soup/grill/indoor bias from today context |
| **Preference DNA** | Favorites, tags, difficulty, cookTime patterns |
| **Recent Meals** | Down-rank repeats within 7 days |

`mealStyle` does **not** exclude a menu from recommendation — it shapes the **post-accept experience**.

### Post-accept experience by `mealStyle`

The AI and app adapt the journey after **오늘 이걸 먹을래**:

```text
recipe
  → 필요한 재료
  → 만들기 시작
  → 만드는 순서 (guided steps)

grill
  → 필요한 재료
  → 추천 반찬 (future)
  → 구이 가이드

assembly
  → 필요한 재료
  → 간단 조립 가이드

delivery
  → 배달 정보
  → 추천 매장 (future)
  → 주문 완료

instant
  → 필요한 것 확인
  → 간단 준비 가이드
```

*UI for grill, assembly, and instant-specific flows is not required in current MVP — document and data model first.*

### `aiReason` (required on menu)

| Property | Value |
|----------|-------|
| Type | `string` (localized) |
| Max length | 80 characters |
| Purpose | Default reason shown when this menu is recommended |

**Tone:** Warm, specific, never generic.  
**Good:** 따뜻한 국물이 당길 때 잘 어울려요.  
**Avoid:** 맛있는 요리입니다.

---

### Runtime fields (not stored on menu — computed per session)

These inputs shape **which** MAIN meal is chosen and **how** reasons are phrased.  
They are not authored per menu but must be understood by content authors.

| Field | Source | Role |
|-------|--------|------|
| `confidence` | Recommendation engine | 0.0 – 1.0 score shown on Home card |
| `weather` | Today context | Rain/cold/hot → prefer soup, light meals, etc. |
| `recentMeals` | Meal history (7-day window) | Down-rank recently eaten menus |
| `preferenceDNA` | Aggregated favorites & tags | Boost menus matching user taste |

Content authors should tag menus accurately (`tags`, `mealTime`, `type`, `mealStyle`) so the AI layer can match them to context.

---

## 11. Tags

### `tags` (required)

| Property | Value |
|----------|-------|
| Type | `string[]` |
| Rules | Use controlled vocabulary below. Min 1, max 8. |

Tags power search, filtering, preference learning, and explainable recommendations.

### Standard tag vocabulary

| Tag (display) | Internal ID | Use when |
|---------------|-------------|----------|
| 혼밥 | `solo` | Good for eating alone |
| 아이식사 | `family` | Kid-friendly, mild, familiar |
| 다이어트 | `healthy` | Lower calorie, lighter |
| 20분완성 | `quick` | `cookTime` ≤ 20 |
| 비오는날 | `comfort` | Cozy, soup/stew mood |
| 매운맛 | `spicy` | Noticeably spicy |
| 순한맛 | `mild` | Not spicy |
| 든든한 | `high_protein` | Protein-forward |
| 밥요리 | `rice_based` | Rice bowl, fried rice, bibimbap |
| 한솥요리 | `one_pot` | Single pot/pan |
| 야식 | `late_night` | Good after 21:00 |
| 가성비 | `budget` | Affordable ingredients |

Authors may combine tags (e.g. 김치찌개 → `comfort`, `spicy`, `one_pot`, `비오는날`).

---

## 12. Related Side Dishes

### `recommendedSides` (optional — structure only)

| Property | Value |
|----------|-------|
| Type | `string[]` — array of menu `id` values |
| Applies to | `type = MAIN` only |
| UI status | **Not implemented** — data structure only |

Prepares future flow:

```text
김치찌개 (MAIN)
    ↓  [user accepts meal]
추천 반찬
    · 계란말이
    · 애호박볶음
    · 시금치나물
```

**Rules:**

1. Every ID in `recommendedSides` must reference a published menu with `type = SIDE`.
2. Recommend 2–4 sides per MAIN — not more.
3. Choose sides that match the main dish's cuisine and intensity.
4. Do not link MAIN → MAIN.

---

## 13. Images

Placeholder images are fully supported in v1.0.  
Every image field may use an emoji or a static URL until photography is ready.

### `heroImage` (required)

| Property | Value |
|----------|-------|
| Type | object |
| Fields | `emoji` (required fallback), `url` (optional) |
| Used on | Home recommendation card, ingredients header |

### `ingredientImages` (optional)

| Property | Value |
|----------|-------|
| Type | `array` — parallel to `ingredients[]` or keyed by ingredient name |
| Purpose | Future: visual prep guide on ingredients screen |

### `stepImages` (optional)

| Property | Value |
|----------|-------|
| Type | `array` — one per step `order` |
| Fields | `emoji` or `url` per step |
| Purpose | Guided cooking screen |

**Placeholder convention:** Use a single representative emoji per dish (e.g. 🍲 for 찌개) until real assets exist. Never leave `heroImage` empty.

---

## 14. Future Fields

Reserved — do not require in v1.0, do not build UI yet.

| Field | Purpose |
|-------|---------|
| `nutrition` | Calories, macros, sodium per serving |
| `video` | Short step or hero video URL |
| `shopping` | Linked grocery / delivery SKU mapping |
| `chefStyle` | Voice variant (e.g. minimal, detailed, beginner) |

When these ship, they will extend — not replace — this standard.

---

## 15. Publication Checklist

Before a menu goes live:

- [ ] `type` is correct (`MAIN` only if it can be today's meal)
- [ ] `mealStyle` matches how the meal is actually eaten
- [ ] `mealTime` matches realistic eating occasions
- [ ] `cookTime` tested in a home kitchen (±5 min) or realistic for delivery/instant
- [ ] All ingredients appear **before** steps in the data file (when steps exist)
- [ ] Every step = one action, short sentence (when `steps` required)
- [ ] `aiReason` is specific, not generic
- [ ] `tags` use controlled vocabulary
- [ ] `recommendedSides` IDs exist and are all `SIDE` type (especially for `recipe` / `grill`)
- [ ] `heroImage` has at least an emoji placeholder
- [ ] Korean copy reviewed for warm, plain tone

---

## 16. Complete Example — 김치찌개

```json
{
  "id": "kr_kimchi_jjigae",
  "title": {
    "ko": "김치찌개",
    "en": "Kimchi Stew"
  },
  "subtitle": {
    "ko": "얼큰하고 든든한 국물 한 그릇",
    "en": "Spicy, hearty stew in one pot"
  },
  "description": {
    "ko": "잘 익은 김치와 돼지고기로 끓이는 대표 집밥이에요. 밥 한 공기는 기본입니다.",
    "en": "A classic Korean stew with aged kimchi and pork. Best with a bowl of rice."
  },

  "type": "MAIN",
  "mealStyle": "recipe",
  "mealTime": ["LUNCH", "DINNER", "LATE_NIGHT"],
  "cuisine": "Korean",

  "cookTime": 30,
  "difficulty": "easy",
  "servings": 2,

  "ingredients": [
    {
      "name": { "ko": "잘 익은 김치", "en": "Aged kimchi" },
      "amount": "2컵",
      "optional": false
    },
    {
      "name": { "ko": "돼지고기 앞다리살", "en": "Pork shoulder" },
      "amount": "200g",
      "optional": false
    },
    {
      "name": { "ko": "대파", "en": "Green onion" },
      "amount": "1대",
      "optional": false
    },
    {
      "name": { "ko": "양파", "en": "Onion" },
      "amount": "1/2개",
      "optional": false
    },
    {
      "name": { "ko": "고춧가루", "en": "Gochugaru" },
      "amount": "1큰술",
      "optional": false
    },
    {
      "name": { "ko": "다진 마늘", "en": "Minced garlic" },
      "amount": "1작은술",
      "optional": false
    },
    {
      "name": { "ko": "참기름", "en": "Sesame oil" },
      "amount": "1작은술",
      "optional": true
    },
    {
      "name": { "ko": "두부", "en": "Tofu" },
      "amount": "1/2모",
      "optional": true
    }
  ],

  "steps": [
    {
      "order": 1,
      "instruction": {
        "ko": "돼지고기는 한입 크기로 썰어요.",
        "en": "Cut the pork into bite-size pieces."
      },
      "guide": "이제 하나씩 만들어볼게요.",
      "imageEmoji": "🔪"
    },
    {
      "order": 2,
      "instruction": {
        "ko": "냄비에 참기름을 두르고 고기를 볶아요.",
        "en": "Heat sesame oil in a pot and stir-fry the pork."
      },
      "guide": "고기 먼저 볶으면 국물이 더 깊어져요.",
      "imageEmoji": "🍳"
    },
    {
      "order": 3,
      "instruction": {
        "ko": "김치와 양파를 넣고 3분 더 볶아요.",
        "en": "Add kimchi and onion. Stir-fry for 3 minutes."
      },
      "guide": "김치가 살짝 노릇해지면 향이 올라와요.",
      "imageEmoji": "🥘"
    },
    {
      "order": 4,
      "instruction": {
        "ko": "물 2컵과 고춧가루, 마늘을 넣고 끓여요.",
        "en": "Add 2 cups water, gochugaru, and garlic. Bring to a boil."
      },
      "guide": "센 불에서 한번 끓이면 얼큰해져요.",
      "imageEmoji": "🫕"
    },
    {
      "order": 5,
      "instruction": {
        "ko": "두부와 대파를 넣고 5분 더 끓여요.",
        "en": "Add tofu and green onion. Simmer for 5 minutes."
      },
      "guide": "거의 다 왔어요!",
      "imageEmoji": "🍲"
    }
  ],

  "aiReason": {
    "ko": "따뜻한 국물이 당길 때 잘 어울려요.",
    "en": "Perfect when you're craving something warm."
  },

  "tags": ["comfort", "spicy", "one_pot", "solo", "family"],

  "recommendedSides": [
    "side_001",
    "homemade_016",
    "side_002"
  ],

  "heroImage": {
    "emoji": "🍲",
    "url": null
  },

  "ingredientImages": [],
  "stepImages": [],

  "meta": {
    "version": "1.0.0",
    "status": "published",
    "createdAt": "2026-07-06",
    "updatedAt": "2026-07-06"
  }
}
```

**Recommended sides mapping (future UI):**

| ID | Title |
|----|-------|
| `side_001` | 계란말이 |
| `homemade_016` | 애호박볶음 |
| `side_002` | 시금치나물 |

### `mealStyle` quick-reference examples

| Menu | `mealStyle` | Post-accept path (summary) |
|------|-------------|----------------------------|
| 김치찌개 | `recipe` | 재료 → 만들기 시작 → 단계별 요리 |
| 삼겹살 | `grill` | 재료 → 추천 반찬 → 구이 가이드 |
| 샌드위치 | `assembly` | 재료 → 조립 가이드 |
| 치킨 | `delivery` | 배달 정보 → 주문 완료 |
| 컵라면 | `instant` | 준비물 확인 → 간단 준비 |

---

## 17. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-07-06 | PD-011 — `mealStyle` field; meal recommendation policy; style-specific post-accept flows |
| 1.0 | 2026-07-06 | Initial standard — Sprint 21-A |

---

*Questions or proposed field changes → open a PR against this file before updating production menu data.*
