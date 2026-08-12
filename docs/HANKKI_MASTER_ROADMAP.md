# HANKKI Master Roadmap

**Version:** 1.0  
**Status:** Official — living document  
**Last updated:** 2026-07-06  
**App:** `apps/todays-menu` (Expo / React Native)

---

> HANKKI helps people **decide today's meal** — not browse recipes.  
> This roadmap tracks where we are, what ships next, and what waits.

**Companion docs:** [Product Bible](./HANKKI_BIBLE.md) · [Launch Checklist](./LAUNCH_CHECKLIST.md) · [Gold Meal TOP20 Review](./GOLD_MEAL_TOP20_REVIEW.md) · [Idea Parking](./IDEA_PARKING.md)

---

## North Star

| Metric | Target |
|--------|--------|
| Decision time | User taps **오늘 이걸 먹을래** within **10 seconds** of Home load |
| Product object | **MAIN meal** recommendation — never a side dish first |
| Post-accept | Ingredients / requirements **before** cooking or ordering |

---

## Current Status (Snapshot)

| Area | State | Notes |
|------|-------|-------|
| **Product philosophy** | ✅ Documented | Bible v1.1, Content Standard v1.1, PD-001–005, PD-011 |
| **MVP user flows** | ✅ Built | Home → accept → ingredients / delivery → cooking / order complete |
| **Recommendation engine** | ✅ Flagship | TOP5 Gold Meals via `goldMealCatalog` |
| **Meal Experience Engine** | ✅ On Home | `mealExperience` — subtitle, reasons, pairings |
| **Gold Meal Library** | 🟡 In progress | TOP20 approved; 5 flagship wired; 15 pending Sprint 25-C |
| **Today Briefing** | ✅ Built | Weather, streak, context on Home |
| **Favorites & Preference DNA** | 🟡 Partial | Favorites work; DNA influences context lightly |
| **Launch checklist** | ☐ Open | Beta gates not signed off — see [Launch Checklist](./LAUNCH_CHECKLIST.md) |
| **Content at scale** | ☐ Not started | Target 100 MAIN meals for launch catalog |

**Legend:** ✅ Done · 🟡 Partial / in progress · ☐ Not started

---

## Sprint History

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **20.1** | MVP UX finalization | Split 집에서 / 시켜 flows; ingredients → cooking / delivery |
| **20.2** | PD-002 MAIN only | `type = MAIN` filter; SIDE catalog separated |
| **21-A/B/C** | Official docs | Content Standard, Product Bible, Launch Checklist |
| **21.5** | PD-011 | Complete meals philosophy; five `mealStyle` values |
| **22-A** | Gold Menu selection | 20 MAIN meals proposed (Korean 10 · Western 4 · Japanese 3 · Chinese 3) |
| **22-B** | Meal Intelligence DB | 7-step AI decision model documented |
| **23** | Meal Experience Engine | Types + `buildMealExperience`; attached to recommendations |
| **24** | Gold Meal Library (proposal) | 20 meals approved for library; selection rules locked |
| **25** | Gold Meal content (full draft) | 20 markdown files — superseded by flagship-first approach |
| **25-A** | Flagship 5 content | Content standard for 5 meals — approved |
| **25-B** | Flagship 5 production | Published markdown + `GOLD_MEALS_FLAGSHIP` TS module |
| **26** | Flagship engine + Home | TOP5 replaces mock recommendations; meal experience on Home |

---

## Phase Map

```text
Phase 1  Foundation          ████████████████████  Done
Phase 2  MVP Core Loop       ████████████████░░░░  ~85%
Phase 3  Gold Meal Library   ████████░░░░░░░░░░░░  ~40%
Phase 4  Beta Readiness      ████░░░░░░░░░░░░░░░░  ~20%
Phase 5  Post-MVP            ░░░░░░░░░░░░░░░░░░░░  Parked
```

---

## Phase 1 — Foundation ✅

**Goal:** Shared product truth and data model.

| Item | Status |
|------|--------|
| [HANKKI_BIBLE.md](./HANKKI_BIBLE.md) v1.1 | ✅ |
| [HANKKI_CONTENT_STANDARD.md](./HANKKI_CONTENT_STANDARD.md) v1.1 | ✅ |
| [MEAL_INTELLIGENCE_DATABASE_v1.md](./MEAL_INTELLIGENCE_DATABASE_v1.md) | ✅ |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | ✅ |
| `mealStyle`, `mealPurpose`, `MealExperience` types | ✅ |
| MAIN / SIDE course policy | ✅ |

---

## Phase 2 — MVP Core Loop 🟡

**Goal:** First-time user decides and completes one meal without dead ends.

### Shipped

| Feature | Route / module |
|---------|----------------|
| Home recommendation | `app/index.tsx`, `useHomeScreen.ts` |
| Mode toggle (집에서 / 시켜) | `MealModeToggle` |
| Accept meal → ingredients | `app/ingredients/[id].tsx` |
| Guided cooking (one step at a time) | `app/cooking/[recipeId].tsx` |
| Delivery placeholder flow | `app/delivery/[id].tsx` |
| Favorites | `app/favorites.tsx` |
| Onboarding | `app/onboarding.tsx` |
| Today Briefing | `TodayMealCard`, today services |
| Legacy redirects | `recipe/[id]`, `meal-confirmed/[id]` |

### Remaining

| Item | Priority | Owner |
|------|----------|-------|
| Display `mealExperience` on Home (reason + pairings) | P0 | Product / Eng | ✅ Sprint 26 |
| Explainable AI reasons (2–3 lines from intelligence signals) | P0 | Eng |
| Grill / instant / assembly post-accept UX (not recipe steps) | P1 | Product / Eng |
| Real-device QA on Launch Checklist §1–3 | P0 | Product |
| Remove or hide non-MVP surfaces (search if present) | P2 | Eng |

---

## Phase 3 — Gold Meal Library 🟡

**Goal:** 20 canonical reference meals that define HANKKI content quality.

### Done

| Asset | Location |
|-------|----------|
| TypeScript library (20 records) | `apps/todays-menu/library/gold-meals/` |
| `GoldMealRecord` type | `apps/todays-menu/types/goldMeal.ts` |
| `goldMealService` adapter | `apps/todays-menu/services/goldMeal/` |
| Flagship 5 content (standard) | `apps/todays-menu/content/gold-meals/flagship/` |
| TOP20 review packet | [GOLD_MEAL_TOP20_REVIEW.md](./GOLD_MEAL_TOP20_REVIEW.md) |

### Next (in order)

| Step | Sprint | Blocker |
|------|--------|---------|
| **Approve flagship 5** content standard | 25-A | ✅ Approved |
| **Publish flagship 5** production content | 25-B | ✅ Done |
| Author remaining **15** meals using flagship template | 25-C | Explicit go-ahead required |
| **26** | Wire flagship TOP5 → engine + Home | ✅ Done |
| **25-C** | Author remaining 15 Gold Meals (when approved) | Explicit go-ahead required |
| SIDE dish IDs for `recommendedSides` / pairings | 27 | SIDE catalog growth |
| Sync markdown ↔ TypeScript (single source of truth) | 27 | Tooling decision |

**Do not expand beyond 20 until TOP20 is approved and flagship template is signed off.**

---

## Phase 4 — Beta Readiness ☐

**Goal:** [MVP Release Criteria](./LAUNCH_CHECKLIST.md#mvp-release-criteria) met on real devices.

| Workstream | Key deliverables |
|------------|------------------|
| **Content** | 100 published MAIN meals (Gold 20 + extended catalog); `aiReason` per meal; hero images |
| **Product** | 10-second decision metric instrumented; no SIDE-first recommendations in 20× refresh test |
| **UX** | Consistent copy (필요한 재료, 만드는 순서); empty / loading / error states on device |
| **Engineering** | `tsc` clean; Expo production build; Home ≤ 3s on mid-range device |
| **Beta ops** | 20–50 households; feedback form; bug template; analytics funnel |
| **App Store prep** | Icon, splash, screenshots, privacy policy, terms (Section 5 of checklist) |

---

## Phase 5 — Post-MVP (Parked)

See [IDEA_PARKING.md](./IDEA_PARKING.md). Not scheduled until Beta validates the core loop.

High-level themes: AI Chef, Family Mode, Shopping, Nutrition, Voice Guide, Premium, Community, Chat, 반찬 추천 UI.

---

## Engineering Architecture (Current)

```text
Home
  └── homeService
        └── recommendationEngine
              ├── menuCatalog (mock ~37 MAIN)
              ├── mealCoursePolicy (MAIN filter)
              ├── recommendationContext (weather, DNA, recent)
              └── buildMealExperience → HomeRecommendationDTO

Gold Meal Library (not wired yet)
  └── library/gold-meals → goldMealService

Post-accept
  ├── homemade: ingredients → cooking
  ├── delivery: delivery screen
  └── (future) grill / instant / assembly guides
```

---

## Decision Log (Roadmap-relevant)

| ID | Decision | Roadmap impact |
|----|----------|----------------|
| PD-001 | Meal decision assistant | No recipe-catalog-first UX |
| PD-002 | MAIN meals only | Engine + content filter |
| PD-004 | Ingredients before steps | All post-accept flows |
| PD-005 | Homemade ≠ delivery | Mode toggle + separate screens |
| PD-011 | Complete meals, five styles | Gold library + future UX per style |
| — | No alcohol in pairings | Content rule for all Gold Meals |
| — | Flagship 5 before remaining 15 | Content sprint sequencing |

---

## Recommended Next 4 Sprints

| Sprint | Mission |
|--------|---------|
| **26** | Wire `GOLD_MEALS_FLAGSHIP` → recommendation engine; Home shows meal experience | ✅ Done |
| **25-C** | Author remaining 15 Gold Meals (when approved) |
| **27** | Launch Checklist §1–4 on device; extended catalog toward 100 MAIN |

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-06 | Initial master roadmap from project status through Sprint 25-A |

---

*Update this file when a phase completes or a sprint changes priority.*
