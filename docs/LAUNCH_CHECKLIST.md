# HANKKI Launch Checklist

**Version:** 1.0  
**Status:** Official — master gate before Beta & App Store  
**Owner:** Product  
**Companion docs:** [Product Bible](./HANKKI_BIBLE.md) · [Content Standard](./HANKKI_CONTENT_STANDARD.md)

---

> Use this document as the **single go/no-go list** before Beta and public release.  
> Every box must be checked — or explicitly deferred to **Post MVP** — before ship.

**How to use**

1. Review each section with the responsible owner (product, content, design, engineering).
2. Mark items `[x]` when verified on a **real device** (not simulator-only).
3. Log blockers in the team tracker; link PRs next to items when helpful.
4. Do not ship Beta until **MVP Release Criteria** (bottom) are met.

---

## Section 1 — Product

Core user journeys defined in the [Product Bible](./HANKKI_BIBLE.md).  
Each item must work end-to-end without dead ends.

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **Home screen completed** | Product / Design | Greeting, mode toggle, recommendation card, primary CTA |
| ☐ | **AI recommendation works** | Engineering | Loads on Home; refresh returns a different MAIN meal |
| ☐ | **MAIN meals only** | Engineering | Engine filters `type = MAIN` (PD-002) |
| ☐ | **Side dishes are never recommended first** | Engineering | Verify refresh 20× — no SIDE in recommendation slot |
| ☐ | **Home Cooking flow completed** | Product | Home → accept → ingredients → 만들기 시작 → steps → complete → home |
| ☐ | **Delivery flow completed** | Product | Home → accept → delivery placeholder → 주문 완료 → home |
| ☐ | **Ingredients shown before cooking steps** | Product | PD-004 — no skip to steps without ingredients screen |
| ☐ | **Guided cooking completed** | Product | One step per screen; prev / next; progress indicator |
| ☐ | **Cooking completion screen works** | Product | Celebration + 홈으로 돌아가기 |
| ☐ | **Favorites work** | Engineering | Heart on Home; list opens; routes by mode (homemade / delivery) |
| ☐ | **Preference DNA works** | Engineering | Favorites influence recommendation context / explainable reasons |
| ☐ | **Today Briefing works** | Product | Briefing visible on Home; weather / streak / context render |

---

## Section 2 — Content

All menus must conform to the [Content Standard](./HANKKI_CONTENT_STANDARD.md).

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **HANKKI Content Standard approved** | Product | `docs/HANKKI_CONTENT_STANDARD.md` signed off |
| ☐ | **Product Bible approved** | Product | `docs/HANKKI_BIBLE.md` signed off |
| ☐ | **100 MAIN meals completed** | Content | Published catalog: 100× `type = MAIN` with full fields |
| ☐ | **Side dish database started** | Content | SIDE entries + `recommendedSides` pairing on key MAIN meals |
| ☐ | **Images prepared** | Content / Design | `heroImage` per MAIN — URL or approved placeholder emoji |
| ☐ | **AI recommendation reasons completed** | Content | `aiReason` + explainable copy per MAIN meal |
| ☐ | **Tags completed** | Content | Controlled vocabulary applied; no empty `tags[]` on publish |

---

## Section 3 — UX

Aligned with Product Bible: warm copy, one question per screen, one primary action.

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **Consistent wording** | Product / Content | 필요한 재료, 만드는 순서, 만들기 시작 — no "레시피" in UI |
| ☐ | **Back navigation** | Design / Eng | Every screen: predictable back or home; no orphan routes |
| ☐ | **Empty states** | Design | Favorites empty, no history — friendly copy + next step |
| ☐ | **Loading states** | Design | Warm messages on Home refresh & screen fetch |
| ☐ | **Error states** | Design | Retry affordance; no white-screen crashes |
| ☐ | **Mobile spacing** | Design | Safe areas, touch targets ≥ 44pt, readable on small phones |
| ☐ | **Button consistency** | Design | Primary height, radius, shadow from design tokens |
| ☐ | **One primary CTA per screen** | Product | No competing primary buttons (PD Bible UX rules) |

---

## Section 4 — Technical

Ship-quality build — stable, fast, maintainable.

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **No runtime errors** | Engineering | Clean console on happy path + edge cases |
| ☐ | **No broken navigation** | Engineering | All routes resolve; legacy routes redirect correctly |
| ☐ | **Stable build** | Engineering | `tsc --noEmit` clean; Expo production build succeeds |
| ☐ | **Fast loading** | Engineering | Home interactive ≤ 3s on mid-range device / 4G |
| ☐ | **Responsive layout** | Engineering | Web + iOS + Android — no layout overflow on 375px width |
| ☐ | **Code cleanup completed** | Engineering | Dead screens removed or redirected; no unused MVP experiments in prod |

---

## Section 5 — App Store

Required for public listing (prepare before Beta if using TestFlight / internal track first).

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **App icon** | Design | 1024×1024 master; adaptive icon (Android) |
| ☐ | **Splash screen** | Design | Brand + warm copy; matches cream background |
| ☐ | **Store screenshots** | Design / Product | Home, recommendation, ingredients, cooking — 6.7" + 5.5" |
| ☐ | **Privacy Policy** | Legal / Product | Hosted URL; linked in app and store |
| ☐ | **Terms of Service** | Legal / Product | Hosted URL |
| ☐ | **Contact email** | Product | Support address live and monitored |
| ☐ | **App description** | Product | Korean + English; emphasizes *meal decision*, not recipe app |
| ☐ | **Keywords** | Product | 식단, 오늘뭐먹지, 메뉴추천, 집밥, 배달 — store ASO set |

---

## Section 6 — Beta

Operational readiness for real users.

| | Item | Owner | Notes |
|---|------|-------|-------|
| ☐ | **Beta users recruited** | Product | 20–50 households; mix of 집밥 / 배달 users |
| ☐ | **Feedback collection ready** | Product | Form or in-app link; structured questions (decision time, clarity) |
| ☐ | **Bug reporting process ready** | Engineering | Template: steps, device, screenshot, route |
| ☐ | **Analytics installed** | Engineering | Funnel: home_view → accept → flow_complete; 10s decision metric |

---

## Section 7 — Post MVP

**Do not build before MVP ship.** Track here for roadmap visibility only.

| | Item | Rationale |
|---|------|-----------|
| ☐ | **AI Chef** | Full conversational agent — after core loop validated |
| ☐ | **Family Mode** | Multi-profile / kid preferences — after single-user PMF |
| ☐ | **Shopping** | Grocery / ingredient commerce — separate product surface |
| ☐ | **Nutrition** | Macros / calories — requires content pipeline |
| ☐ | **Voice Guide** | Hands-free cooking — nice-to-have post-MVP |
| ☐ | **Premium** | Monetization after retention proof |
| ☐ | **Community** | Social / sharing — out of decision-first scope |
| ☐ | **Chat** | Violates "reduce thinking" for MVP (Product Bible) |
| ☐ | **반찬 추천 UI** | Data ready (`recommendedSides`); UI after MAIN loop ships |

---

## MVP Release Criteria

HANKKI is **officially ready for Beta** when all of the following are true:

**Product:** A first-time user can open the app, see one MAIN meal recommendation on Home, tap **오늘 이걸 먹을래**, and complete either the Home Cooking path (ingredients → guided steps → completion) or the Delivery path (placeholder → 주문 완료) without errors, dead ends, or side-dish-first recommendations.

**Content:** The Content Standard and Product Bible are approved; the catalog contains enough published MAIN meals (target: 100) that repeat users do not see the same dish daily within a normal week.

**UX & quality:** Copy is consistent with the Bible; each screen has one clear question and one primary action; loading, empty, and error states are handled on real devices.

**Beta ops:** Feedback and bug channels exist; basic analytics can measure whether users decide a meal within **10 seconds** of landing on Home.

Beta is not App Store launch. Beta proves the decision loop. App Store release adds Section 5 completeness, broader content, and stability at scale.

---

## Sign-off

| Role | Name | Date | Beta GO |
|------|------|------|---------|
| Product | | | ☐ |
| Design | | | ☐ |
| Engineering | | | ☐ |
| Content | | | ☐ |

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-07-06 | Initial launch checklist — Sprint 21-C |

---

*Check boxes in Git when verified: `[ ]` → `[x]` in PR that proves the item.*
