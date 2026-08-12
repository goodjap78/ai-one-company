# HANKKI Product Bible

**Version:** 1.1  
**Status:** Official — internal reference  
**Audience:** Product, design, engineering, content  
**Companion docs:** [HANKKI Content Standard](./HANKKI_CONTENT_STANDARD.md)

---

> *This document is the north star for every feature, screen, and sentence in HANKKI.*  
> When in doubt, come back here.

---

## Vision

**HANKKI is not a recipe app.**

HANKKI helps people **decide today's meal**.

We exist for the moment someone opens the fridge, sighs, and thinks: *"뭐 먹지?"*  
That moment is ours. Not the cookbook aisle. Not the forty-step blog post. Not the infinite scroll of side dishes.

We win when the user closes the app knowing **what they are eating tonight** — not when they have read about food.

---

## Mission

**Reduce decision fatigue around meals.**

Three meals a day. Every day. The question never goes away.  
Most apps add more options. HANKKI removes the burden of choosing.

We do not ask users to become better cooks on day one.  
We ask them to make **one good decision** — and then we walk with them through whatever *kind* of meal they chose.

---

## Meal Recommendation Philosophy

**HANKKI does not recommend recipes. HANKKI recommends complete meals.**

A **meal** is a full answer to *"오늘 뭐 먹지?"* — something a person can actually sit down and eat.  
A **recipe** is only **one way** to realize a meal. It is not the product.

Every recommended item is a **complete MAIN meal**. How the user *executes* that meal depends on its style:

| Meal style | What it means | Examples |
|------------|---------------|----------|
| **Recipe Meal** | Cook from ingredients with guided steps | 김치찌개, 제육볶음, 파스타 |
| **Grill Meal** | Grill or sear at the table / stove — minimal prep, sides matter | 삼겹살, 소고기 구이, 갈비 |
| **Assembly Meal** | Combine ready components — no real cooking | 샌드위치, 샐러드 보울, 유부초밥 |
| **Delivery Meal** | Order from outside — HANKKI decides *what*, not *how to cook* | 치킨, 짜장면, 피자 |
| **Instant Meal** | Heat, soak, or open — fastest path to eating | 컵라면, 즉석밥 + 반찬, 냉동 도시락 |

```text
Recipe app logic:     "Here is how to cook X."
HANKKI logic:         "Eat X today." → then adapt the path by meal style.
```

The recommendation engine must work for **every meal style**.  
The post-accept experience adapts — not every meal has "만드는 순서."

See [Content Standard § mealStyle](./HANKKI_CONTENT_STANDARD.md) for field definitions and flows.

---

## Core Principles

These five principles override feature requests, sprint plans, and personal taste.

### 1. Recommend meals. Not recipes.

Users come to HANKKI for **"오늘 뭐 먹지?"** — not for a library of recipes.

| Concept | Role in HANKKI |
|---------|----------------|
| **Meal recommendation** | The product — what we show on Home |
| **Recipe** | One execution path (`mealStyle = recipe`) among several |

| We say | We avoid |
|--------|----------|
| 오늘의 한끼 | 레시피 모음 |
| 오늘 이걸 먹을래 | 레시피 보기 |
| 필요한 재료 | 레시피 상세 |
| 메뉴 추천 | 레시피 추천 |

Never describe Home as "recipe recommendation." Always **meal recommendation**.

### 2. Recommend MAIN dishes first. Never recommend side dishes first.

HANKKI is not a side-dish recommendation app.

**Product Decision #002:** Today's recommendation is always `type = MAIN`.

| ✅ MAIN | ❌ Not first |
|---------|--------------|
| 김치찌개, 제육볶음, 비빔밥 | 애호박볶음, 계란말이, 시금치나물 |

반찬은 나중에. 한 끼가 먼저.

---

### 3. Show what you need before what you do.

After the user accepts a meal, they see **필요한 재료** (or equivalent) **before** instructions.

The exact next screen depends on `mealStyle` — see Product Decision #011.  
Principle holds for all styles: *confirm materials first, act second.*

| mealStyle | Post-accept path (conceptual) |
|-----------|-------------------------------|
| `recipe` | 필요한 재료 → 만들기 시작 → 만드는 순서 |
| `grill` | 필요한 재료 → 추천 반찬 (future) → 구이 가이드 |
| `assembly` | 필요한 재료 → 간단 조립 가이드 |
| `delivery` | 배달 정보 (future: 추천 매장) → 주문 완료 |
| `instant` | 필요한 것 확인 → 간단 준비 가이드 |

Why: People need to know what they have *before* they commit.  
Skipping straight to steps (or ordering) creates anxiety and abandonment.

---

### 4. The experience should feel guided. Never overwhelming.

When instructions exist (`recipe`, `grill`, `assembly`, `instant`), show **one step at a time**.  
When they do not (`delivery`), keep the path equally short and clear.

The user may be in the kitchen, at the grill, or on the couch waiting for delivery.  
We are a calm voice — not a wall of text.

| Guided | Overwhelming |
|--------|--------------|
| 2 / 6 단계 | Full recipe on one scroll |
| 다음 단계 → | Twelve bullet points at once |
| 이제 하나씩 만들어볼게요. | Professional chef terminology |

`mealStyle = delivery` and `instant` may have zero or minimal steps — that is correct.

---

### 5. The app should reduce thinking. Not increase thinking.

Every tap should move the user **closer to eating** — not deeper into a rabbit hole.

If a screen makes the user pause and wonder *"What is the difference between these two buttons?"* — we have failed.

Merge duplicate actions. Remove jargon. Default to the happy path.

---

## Product Decisions

Approved decisions are binding until explicitly superseded.  
Reference by ID in PRs, specs, and sprint reports.

| ID | Decision | Implication |
|----|----------|-------------|
| **PD-001** | HANKKI is a **meal decision assistant**. | Home optimizes for choosing, not browsing. No recipe-catalog-first UX. |
| **PD-002** | Always recommend **MAIN meals**. | Recommendation engine filters `type = MAIN` only. SIDE never appears as today's pick. |
| **PD-003** | **Menu** is the core content object — not recipe. | Data model, copy, and navigation center on *메뉴* / *한끼*. Recipe is an implementation detail. |
| **PD-004** | **Ingredients appear before cooking steps**. | Post-accept flow: ingredients screen → 만들기 시작 → guided steps. |
| **PD-005** | **Delivery and Home Cooking are different experiences**. | User chooses ① 집에서 먹기 or ② 시켜 먹기 at Home. Delivery has no cooking steps. |
| **PD-011** | HANKKI recommends **complete meals**, not just recipes. | Every menu has `mealStyle`. Recommendation works for all styles; post-accept UX adapts per style. Recipes are one meal type among five. |

When proposing a feature, state which principle it serves — or which decision it might violate.

---

## Writing Style

All user-facing copy — Korean first — follows this voice.

| Attribute | Guideline | Example |
|-----------|-----------|---------|
| **Warm** | Like a friend in the kitchen | 오늘도 맛있는 한 끼를 준비해볼까요? |
| **Friendly** | Casual `-요` endings, light emoji sparingly | 좋은 아침이에요 😊 |
| **Simple** | Short clauses. No compound sentences. | 필요한 재료를 먼저 확인해볼까요? |
| **Never technical** | No engine terms, no JSON, no "AI model" | 왜 이 메뉴일까요? ✓ / confidence score ✗ |

**Banned in UI copy:** 레시피, algorithm, recommendation engine, metadata, schema.

**Preferred:** 메뉴, 한끼, 오늘의 메뉴, 필요한 재료, 만드는 순서, 만들기 시작.

---

## UX Rules

### One screen. One question.

Every screen answers **exactly one question**. Nothing else is primary.

| Screen | The one question |
|--------|------------------|
| Home | **What should I eat?** |
| Ingredients / requirements | **What do I need?** |
| Cooking / assembly / prep (step view) | **What do I do next?** |
| Grill sides (future) | **What goes well with this?** |
| Delivery | **What can I order?** |
| Complete | **Did I finish?** (celebration → home) |

If a screen tries to answer two questions, split it or demote the second to supporting UI.

### Supporting rules

- **One main action** per screen — visually dominant, bottom or center.
- Secondary actions are text links or ghost buttons — never competing primaries.
- **Back** always means "go up one decision level," not "lose my meal."
- Loading states use warm copy — never bare spinners without context.

---

## MVP Rules

Until MVP ships and validates, **do not build**:

| Feature | Why deferred |
|---------|--------------|
| Chat | Adds thinking; violates Principle 5 |
| Community | Out of scope for decision core loop |
| Voice | Nice-to-have; not decision-critical |
| Premium | Monetization after product-market fit |
| Shopping | Separate product surface; not MVP |

**Allowed in MVP:** Meal recommendation (all `mealStyle` values in data), accept meal, ingredients/requirements, guided steps where applicable, delivery placeholder, favorites, onboarding, today briefing.

When tempted to add a deferred feature, ask: *Does this help the user decide today's meal in 10 seconds?*

---

## Design Rules

Visual design serves clarity and appetite — not decoration.

| Rule | Application |
|------|-------------|
| **Large food photo** | Hero image dominates the recommendation card. Food sells the decision. |
| **Short text** | Title + one reason line + meta. No paragraphs on Home. |
| **One main action** | `오늘 이걸 먹을래` — single primary CTA. |
| **No clutter** | No badge walls, no feature grids, no "explore" noise on Home. |

**Hierarchy on Home (top → bottom):**

1. Greeting + mode (집에서 / 시켜)
2. Food image
3. Meal name
4. Why this meal (confidence + reasons)
5. Accept or refresh

Whitespace is a feature. Cream backgrounds, soft cards, one focal point per viewport.

---

## Success Metric

> **A user should decide today's meal within 10 seconds.**

Measurement intent (MVP):

| Signal | Target |
|--------|--------|
| Time from Home load → tap **오늘 이걸 먹을래** | ≤ 10 s (median) |
| Screens before decision | ≤ 1 (Home only) |
| Drop-off on Home without action | Decrease sprint over sprint |

We do not optimize for time-on-app. We optimize for **decision completed**.

---

## Future Vision

One day, **HANKKI becomes the personal AI chef for every family.**

Not a search engine for recipes. Not a social feed. A trusted presence that knows:

- what you ate yesterday
- what your kids will actually eat
- what's in season and what's in your pantry
- when you want comfort vs. something light

Today's MVP is the first step: **one good meal, decided fast, made doable.**

Everything we build now — MAIN-first, meal-style-aware paths, ingredients-first, guided when needed, warm copy — is scaffolding for that future.

We earn the right to be someone's family chef by **never wasting their time today**.

---

## How to Use This Document

| Role | Use it to… |
|------|------------|
| **Product** | Scope sprints, write PRDs, reject scope creep |
| **Design** | Critique mockups against one-question-per-screen |
| **Engineering** | Resolve implementation forks (e.g. menu vs. recipe naming) |
| **Content** | Align with [Content Standard](./HANKKI_CONTENT_STANDARD.md) and voice |

**Changing this bible** requires explicit product approval and a version bump at the top of this file.

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.1 | 2026-07-06 | PD-011 — Meal Recommendation Philosophy; complete meals vs. recipes; `mealStyle` concept |
| 1.0 | 2026-07-06 | Initial Product Bible — Sprint 21-B |

---

*HANKKI — 오늘 뭐 먹지, 같이 정해요.*
