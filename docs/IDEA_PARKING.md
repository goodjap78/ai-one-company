# HANKKI Idea Parking

**Version:** 1.0  
**Status:** Official — backlog only, not scheduled  
**Last updated:** 2026-07-06

---

> Ideas live here so they **do not distract MVP**.  
> Nothing in this file ships until Beta proves the core decision loop.

**Rule:** Before moving an idea out of parking, ask: *Does this help the user decide today's meal in 10 seconds?*

**Companion:** [Master Roadmap](./HANKKI_MASTER_ROADMAP.md) · [Product Bible § MVP Rules](./HANKKI_BIBLE.md)

---

## How to use

| Action | When |
|--------|------|
| **Add** | New idea during a sprint — one line + category |
| **Promote** | Product explicitly schedules it post-Beta |
| **Reject** | Violates Bible principles — mark with reason |
| **Merge** | Duplicate of existing idea — link and archive |

---

## 🚫 Explicitly deferred (Product Bible)

These violate MVP scope or Principle 5 (reduce thinking).

| Idea | Why parked | Revisit after |
|------|------------|---------------|
| **Chat / conversational UI** | Adds thinking; not decision-critical | Beta + retention data |
| **AI Chef (full agent)** | Conversation layer before core loop validated | PMF on 10s decision metric |
| **Community / social feed** | Out of decision-first scope | Post-MVP roadmap |
| **Voice guide** | Nice-to-have; hands-free cooking | Cooking flow retention |
| **Premium / subscription** | Monetization after product-market fit | Beta cohort LTV study |
| **Shopping / grocery commerce** | Separate product surface | Partnership strategy |
| **Family Mode (multi-profile)** | Complexity before single-user PMF | Beta household feedback |

---

## 🍽 Product & UX

| Idea | Notes | Source |
|------|-------|--------|
| **반찬 추천 UI** | Data ready (`recommendedSides`); show after MAIN accept | Launch Checklist Post-MVP |
| **Grill meal sides screen** | 삼겹살 → 상추, 쌈장 flow after ingredients | PD-011 post-accept map |
| **Instant / assembly guided flows** | 짜파게티 enjoy guide; 수제버거 assembly — dedicated screens | Content Standard §9 |
| **Delivery: recommended stores** | Linked restaurants per `delivery` meal | Meal Intelligence §10 |
| **Meal completion celebration variants** | Different copy by `mealStyle` | UX polish |
| **"왜 이 메뉴?" expandable card** | Show 2–4 confidence reasons on Home | Sprint 25 content |
| **Meal history timeline** | Visual 7-day eaten meals | Recent meals penalty UX |
| **Household size inference** | Boost family servings / party meals | Intelligence Step 4 |
| **Explicit mood picker** | "오늘 위로받고 싶어요" → `mealPurpose` | Risk: adds a tap — test carefully |
| **Search / browse catalog** | Legacy MVP doc mentioned search — conflicts with decision-first Home | Reject unless secondary entry |

---

## 🤖 AI & Intelligence

| Idea | Notes | Source |
|------|-------|--------|
| **7-step decision flow in code** | Documented in Meal Intelligence DB; engine still weighted-random lite | Sprint 22-B |
| **Weather → meal scoring** | `weatherTags` on meals; Today context exists | Partially built |
| **Hard exclude disliked ingredients** | Preference DNA future | Intelligence §8 |
| **Popularity priors from aggregate favorites** | Boost well-tested Gold menus | Intelligence §7 |
| **Diversity refresh on "다시 추천"** | Penalize current pick + cuisine cluster | Intelligence §9 |
| **LLM-generated `aiReason` per session** | Template fallback exists; dynamic phrasing | Content + Eng |
| **Confidence score on Home** | 0.0–1.0 — avoid showing raw numbers to users | Content Standard §10 |

---

## 📦 Content & Data

| Idea | Notes | Source |
|------|-------|--------|
| **100 MAIN meal catalog** | Launch target; Gold 20 is seed set | Launch Checklist |
| **SIDE dish database at scale** | Pairings reference SIDE `id`s | Content Standard §12 |
| **Localized EN copy** | Master DB uses `{ ko, en }` in standard | Content Standard |
| **Hero photography** | Replace emoji placeholders | Launch Checklist §2 |
| **Markdown → TS content pipeline** | Single source of truth for Gold Meals | Sprint 25-A |
| **CMS / Supabase menu publish** | Remote catalog vs in-app JSON | Engineering future |
| **Nutrition object** | Calories, macros per serving | Content Standard §14 |
| **Step / ingredient images** | Visual prep guide | Content Standard §13 |
| **Video per meal** | Short hero or step clips | Content Standard §14 |
| **Chef style voice** | minimal / detailed / beginner variants | Future field |

---

## 🛠 Engineering

| Idea | Notes | Source |
|------|-------|--------|
| **Fridge image recognition** | Excluded from old MVP doc | Reject for MVP |
| **Supabase auth + sync favorites** | Multi-device | Post-Beta |
| **Push: "오늘 저녁 뭐 먹지?"** | Re-engagement | Growth — after habit |
| **Offline catalog cache** | Fast Home on poor network | Launch Checklist §4 |
| **Analytics funnel** | home_view → accept → flow_complete | Launch Checklist §6 |
| **A/B meal card layout** | One CTA vs reason density | Post-Beta experiment |
| **Web PWA polish** | Expo web responsive at 375px | Checklist §4 |

---

## 💰 Business (parked)

| Idea | Notes | Source |
|------|-------|--------|
| **Delivery affiliate / order deep links** | Revenue on `delivery` meals | Business docs |
| **Ingredient → SKU mapping** | Shopping list commerce | Content Standard §14 |
| **Brand partnerships (라면, 소스)** | Sponsored Gold Meals? | Policy TBD |
| **B2B workplace lunch** | Office `situationTag` | New segment |

---

## 🧪 Experiments (hypothesis backlog)

| Hypothesis | Metric |
|------------|--------|
| Showing pairings on Home increases accept rate | accept / home_view |
| Natural-language `aiReason` beats template | time-to-accept |
| Flagship 20 only (no long tail) is enough for Beta | 7-day repeat rate |
| Delivery mode % of users | mode split at accept |

---

## Rejected / merged

| Idea | Status | Reason |
|------|--------|--------|
| Recipe-catalog-first Home | **Rejected** | PD-001, PD-003 |
| Recommend SIDE as today's meal | **Rejected** | PD-002 |
| Alcohol pairings | **Rejected** | Product decision — official |
| Build all 20 Gold Meals before flagship approval | **Merged** → flagship-first | Sprint 25-A sequencing |

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-06 | Initial idea parking from Bible, Launch Checklist, sprints |

---

*To promote an idea: open a PR that moves it into [Master Roadmap](./HANKKI_MASTER_ROADMAP.md) with a sprint assignment.*
