# HANKKI MVP Release TODO

**Date:** 2026-07-14  
**Project:** HANKKI (`apps/todays-menu`)  
**Rule:** Release quality only — **do not** add features, redesign screens, or expand scope.  
**Companion checklist:** [HANKKI_MVP_Release_Checklist.md](./HANKKI_MVP_Release_Checklist.md)

> Work top-down. Do not auto-fix the whole list — pick items intentionally per sprint capacity.

---

## P0 — Critical (ship / trust blockers)

| ID | Item | Why | Where |
| --- | --- | --- | --- |
| **P0-1** | Add **app icon** (+ Android adaptive foreground) to Expo config | Store / EAS build not release-ready; `app.json` has colors only, no icon image | `apps/todays-menu/app.json` |
| **P0-2** | Wrap Home **Accept / Save** in error handling (toast / safe catch) | `handleAccept` / `handleSaveMeal` await `saveMeal` with no `try/catch`; `saveMeal` can throw → uncaught rejection, no ErrorBoundary | `components/home/useHomeScreen.ts` · `services/homeService.ts` · `mealPlanningService` |
| **P0-3** | Fix or disable **dead My settings** rows (문의 / 개인정보 / 약관) | `Pressable` with chevron, **no `onPress`** — looks broken | `components/my/MyAppSettingsSection.tsx` |
| **P0-4** | Fix or gate **meal reminders** | UI toggles persist but scheduling is stub (`void scheduled`) — users will think alarms work | `services/reminder/mealReminderNotifications.ts` · `MealReminderSettings` |

**Go rule:** Do not upload to store until **P0-1** done. Do not soft-launch to strangers until **P0-2…P0-4** decided (wire, disable, or honest “준비 중”).

---

## P1 — Visual polish & MVP quality

| ID | Item | Why | Where |
| --- | --- | --- | --- |
| **P1-1** | Align or explicitly **defer splash image** | Splash is background color only | `app.json` splash |
| **P1-2** | Align **version** (`app.json` 1.0.0 vs `package.json` 0.1.0) | Confusion in builds / store metadata | `app.json`, `package.json` |
| **P1-3** | Decide MVP **catalog image policy** | 40/50 recipes share `category_korean` — recommendations look same | `recipeImageMap.ts`, batches 02–05 |
| **P1-4** | Soften or remove fake **“더보기 >”** on pairings | Non-pressable affordance | `HomePairingChips` / HankkiMessages |
| **P1-5** | Remove **Back** on root tab screens (My / 내 메뉴) or justify copy | Confusing tab chrome | `(tabs)/my.tsx`, `FavoritesScreen` tab variant |
| **P1-6** | Unify **primary button radius** enough for polish (no redesign) | DS 24 vs home/recipe 18 vs onboarding 28 | `designSystem`, `homePremiumStyles`, `OnboardingScreen` |
| **P1-7** | Tighten spacing to DS rhythm where cheap | Ad-hoc 8/10/12/14 vs 16/24/32 tokens | Home / Ingredients / Feature cards |
| **P1-8** | Typography pass: splash / onboarding titles vs Home Jua | “오늘 뭐먹지?” vs “오늘 뭐 먹지?”; missing Jua on some heroes | Splash, Onboarding, `northStarHomeCopy` |
| **P1-9** | Replace emoji profile/favorites headers with Seed **or** accept as MVP | Inconsistent mascot language | `MyProfileHeader`, Favorites header |
| **P1-10** | Wire Home **EmptyState** or delete unused component | Empty path unused | `EmptyState.tsx` vs `TodayMealCard` |
| **P1-11** | Re-encode Batch 01 **true JPEG** (optional before store binary) | PNG bytes named `.jpg` (~24MB); LESSON-0002 | `assets/meals/*.jpg` |
| **P1-12** | Tab label clarity: **내 메뉴** vs **즐겨찾기** | Naming mismatch | `(tabs)/_layout.tsx`, favorites copy |
| **P1-13** | Device QA: Favorites focus reload / nested horizontal scrolls | Possible jank, not crash | `FavoritesScreen`, `RecipeIngredientsList` |

---

## P2 — Future improvements (post-MVP quality)

| ID | Item | Why | Where |
| --- | --- | --- | --- |
| **P2-1** | Use or remove `onboarding_complete` flag | Written but gate uses nickname only | `onboardingStorage`, `app/index.tsx` |
| **P2-2** | Ingredient icon PNGs + registry | Always soft-dot fallback | `assets/ingredients`, `ingredientImageAssets` |
| **P2-3** | Recipe step images + registry | Text-only steps | `assets/recipe-steps`, `recipeStepImageAssets` |
| **P2-4** | Generate / approve heroes 011–050 (IMG-2) | Dedicated dish photos | image-factory pipeline |
| **P2-5** | ErrorBoundary / `error.tsx` | Soft-fail production crashes | `app/_layout.tsx` |
| **P2-6** | Clean unused seed / hankki placeholder PNGs | Disk clutter (cleanup report) | `assets/seed`, `assets/hankki` |
| **P2-7** | Retire unused Home legacy components | Dead chrome noise | orphan `components/home/*` |
| **P2-8** | Clarify `/recipe/[id]` vs ingredients architecture in docs | Redirect-only route | `app/recipe/[id].tsx` |
| **P2-9** | Resolve RF-2A vs `heroImageKey` naming | LESSON-0003 | `batchRecipeIds.ts` |
| **P2-10** | Catalog cutover off `core_*` / master JSON | LESSON-0001 / DEC-0003 follow-up | data + search |
| **P2-11** | Real notification scheduling | After reminder UI decision | expo-notifications |
| **P2-12** | Analytics funnel for 10s decision metric | Launch checklist Section 6 | TBD |

---

## Suggested order (quality sprint)

1. **P0-1** icon assets  
2. **P0-2** accept/save safety  
3. **P0-3 / P0-4** honesty (disable or wire)  
4. Smoke device checklist (Companion § A)  
5. Pick **3–5 P1** items only (e.g. P1-2, P1-3, P1-4, P1-5)  
6. Park all **P2** on roadmap — do not expand scope

---

## Explicitly out of scope (this release)

- New features  
- Screen redesigns / North Star Home rewrite  
- Expanding catalog to 100 meals  
- Shopping / chat / premium / community  
- Shipping IMG-2 real API generation as a launch dependency (unless Product chooses P1-3 = generate)

---

## Audit sources (2026-07-14)

- Code review: Home, Ingredients/Recipe, Favorites, My, Onboarding, Navigation  
- `app.json` store config  
- Knowledge OS: DEC-0002, DEC-0003, LESSON-0001…0003  
- Existing `docs/LAUNCH_CHECKLIST.md` (product gate — still valid; this file is the **quality work list**)
