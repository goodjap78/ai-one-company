# HANKKI MVP Release Checklist

**Date:** 2026-07-14  
**Project:** HANKKI (`apps/todays-menu`)  
**Scope:** Release **quality** only — no new features, no screen redesigns, no scope expansion  
**Companion:** [HANKKI_MVP_Release_TODO.md](./HANKKI_MVP_Release_TODO.md) · [docs/LAUNCH_CHECKLIST.md](../../docs/LAUNCH_CHECKLIST.md)

> Use this list on a **real device**. Check `[x]` only after verification.  
> Do not auto-fix everything — follow TODO priorities (P0 → P1 → P2).

---

## Surfaces in scope

| Surface | Route / entry | Primary code |
| --- | --- | --- |
| Splash / gate | `/` | `app/index.tsx` |
| Onboarding | `/onboarding` | `components/onboarding/OnboardingScreen.tsx` |
| Home | `/(tabs)` | `components/home/HomeScreen.tsx` |
| Recipe Detail (live) | `/ingredients/[id]` | `components/ingredients/IngredientsScreen.tsx` + `components/recipe/*` |
| Favorites | `/(tabs)/menu` + `/favorites` | `components/favorites/FavoritesScreen.tsx` |
| My Page | `/(tabs)/my` | `components/my/*` |
| Navigation | Stack + Tabs | `app/_layout.tsx`, `app/(tabs)/_layout.tsx` |

---

## A. Critical path (happy flow)

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Cold start | Splash → nickname gate or Home without white screen |
| ☐ | Onboarding | Nickname validates, saves, lands on tabs |
| ☐ | Home recommend | MAIN meal card loads; refresh works; error has retry |
| ☐ | Accept homemade | CTA → ingredients → cooking → complete → Home |
| ☐ | Accept delivery | CTA → delivery placeholder → order complete → Home |
| ☐ | Favorites | Heart toggles; list opens; opens detail; empty state OK |
| ☐ | My Page | Profile greeting, history, AI settings navigate |
| ☐ | Tab navigation | 홈 / 내 메뉴 / 마이 all reachable; safe area OK |

---

## B. Store / build readiness

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | App icon | `app.json` + 1024 master + Android adaptive foreground exist |
| ☐ | Splash image | Brand splash beyond solid cream (or explicit defer) |
| ☐ | Version aligned | `app.json` ↔ `package.json` versions match |
| ☐ | Production build | Expo / EAS build succeeds on target platforms |
| ☐ | Bundle IDs | `com.aionecompany.todaysmenu` confirmed |

---

## C. Honesty / dead controls (trust)

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | My settings rows | 문의 / 개인정보 / 약관 either open URLs **or** disabled (not fake tap) |
| ☐ | Meal reminders | Either schedule natively **or** UI hidden / marked “준비 중” |
| ☐ | Pairings “더보기” | Removed or linked (not decorative chrome) |
| ☐ | Privacy / Terms | Hosted URLs exist before store listing |

---

## D. Visual QA (no redesign)

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Spacing | No overlapping text/buttons; ≥44pt touch targets |
| ☐ | Typography | Titles readable; no cut-off on 375px width |
| ☐ | Icons | No missing Material icons; Seed loads on splash/home |
| ☐ | Heroes Batch 01 | 001–010 show dish photos (not blank) |
| ☐ | Heroes 011–050 | Accept category fallback **or** limit catalog for MVP |
| ☐ | Ingredient / steps | Empty icons acceptable for MVP **or** soft note deferred |
| ☐ | Radius/buttons | Primary CTAs feel consistent enough across Home / Onboarding / Detail |
| ☐ | Tab chrome | Root tabs without confusing Back buttons (or intentional) |

---

## E. Stability / performance

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Accept / Save | No uncaught rejection on Home CTAs |
| ☐ | ErrorBoundary | Soft failure UI if needed for production |
| ☐ | Home load | Interactive ≤ ~3s on mid device |
| ☐ | Favorites reload | No freeze on toggle / focus |
| ☐ | Font gate | Jua loads; no infinite blank cream |

---

## F. Navigation

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | `/recipe/[id]` | Redirects cleanly (no stuck loading) |
| ☐ | Deep back | Back from detail / history / settings is predictable |
| ☐ | Tab labels | 내 메뉴 ↔ 즐겨찾기 naming not confusing (or deferred copy fix) |

---

## Sign-off

| Role | Date | GO / NO-GO |
| --- | --- | --- |
| Product | | ☐ |
| Engineering | | ☐ |
| Design | | ☐ |

**MVP quality bar:** First-time user completes homemade **or** delivery path without crash, white screen, or obviously broken buttons. Store assets (icon) present before public store upload.
