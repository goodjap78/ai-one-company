# HANKKI FINAL RELEASE CHECKLIST

**Sprint:** RELEASE-1 — MVP Final Polish  
**Date:** 2026-07-15  
**App:** `apps/todays-menu` (HANKKI)  
**Mode:** Quality & consistency audit only — no new features, no redesign  
**Method:** Static code + asset inventory + screen/copy/nav review  
**Companions:** [QA_REPORT.md](./QA_REPORT.md) · [UAT_REPORT.md](./UAT_REPORT.md) · [AI_Company_OS checklist](../../AI_Company_OS/08_Roadmaps/HANKKI_MVP_Release_Checklist.md)

---

## Release score

| | |
| --- | ---: |
| **Score** | **56 / 100** |
| **Recommendation** | **Delay** |

### Why Delay

Core homemade path (Splash → Onboarding → Home → Recipe Detail → Favorite) works and brand voice is warm. Public MVP is still blocked by **store packaging** (no app icon), **trust bugs** (dead settings rows, reminder stub, inert “더보기”), and **production imagery honesty** (10 unique heroes; 0 ingredient / 0 step images). Shipping now would look unfinished and create App Store / Play listing risk.

**GO condition:** Fix all Critical (C1–C6) below, then re-score. Soft-limited catalog (Batch 01 only) may lift imagery without new factories.

---

## Score breakdown

| Dimension | Weight | Score | Weighted |
| --- | ---: | ---: | ---: |
| Critical path (splash → home → detail → favorite) | 20 | 74 | 14.8 |
| Visual polish / consistency | 15 | 62 | 9.3 |
| Text / terminology | 15 | 68 | 10.2 |
| Image consistency | 15 | 32 | 4.8 |
| Navigation / flow honesty | 15 | 52 | 7.8 |
| Performance | 10 | 58 | 5.8 |
| Store / build readiness | 10 | 28 | 2.8 |
| **Total** | **100** | | **≈ 56** |

---

## Screen inspection summary

| Surface | Route | Verdict | Notes |
| --- | --- | --- | --- |
| Splash | `/` + `SplashScreen` | Good | Brand sequence OK; headline spacing vs Home drifts |
| Onboarding | `/onboarding` | Good | Nickname → tabs; button radius/height not aligned with Home |
| Home | `/(tabs)` | Good* | Recommend / refresh / error OK; coming-soon noise; inert pairings |
| Recipe Detail | `/ingredients/[id]` | Good* | Live detail path; ingredient dots + text-only steps; cooking unwired |
| Favorites | `/(tabs)/menu` | Good | Empty + list + open detail OK; toast formality drift |
| My Page | `/(tabs)/my` | Fail trust | Dead 문의/개인정보/약관; reminders UI without real schedule |
| Cooking | `/cooking/[id]` | Orphan | Implemented, **never linked** from Home/Detail |
| Search | `/search` | Orphan | Works if deep-linked; not on Home |

\* = usable with polish debt listed below.

---

## 1. Critical fixes (must before public release)

| ID | Issue | Action | Owner hint |
| --- | --- | --- | --- |
| **C1** | No app icon / adaptive foreground in `app.json` | Add 1024 icon + Android adaptive foreground; wire `expo.icon` / `adaptiveIcon.foregroundImage` | Store |
| **C2** | My settings rows look tappable, do nothing | Wire Privacy/Terms/Inquiry URLs **or** remove chevron and disable press | Trust |
| **C3** | Meal reminders UI is live; `syncMealReminderNotifications` is a stub (`void scheduled`) | Hide / mark “준비 중” **or** implement `expo-notifications` | Trust |
| **C4** | Pairings header “더보기 >” is non-interactive | Remove chevron text **or** link to real surface | Trust |
| **C5** | Version drift: `app.json` `1.0.0` vs `package.json` `0.1.0` | Align versions before any build | Store |
| **C6** | Catalog image honesty | Either limit MVP reco pool to Batch 01 (`001`–`010`) **or** ship unique heroes for any meal that can appear | Product |

**Accept path note:** Live path is Home → `/ingredients/[id]` → 「오늘 먹었어요」. Do **not** claim cooking in store copy until `/cooking/[id]` is wired.

---

## 2. Visual polish

### Tokens today (`constants/designSystem.ts`)

| Token | Spec |
| --- | --- |
| Spacing | 16 / 24 / 32 / 48 |
| Button height | 52 |
| Button / card radius | 24 |
| Touch target | 48 |
| Canvas | `#FFF8EF` · Primary `#FF6B35` |

### Gaps found

| Check | Status | Detail |
| --- | --- | --- |
| Spacing | Warn | Home/Recipe use ad-hoc 8–14; Home section gap reduced to 16 vs `ds.spacing.lg` 24 |
| Typography | Warn | Title scales: Home meal 28 / overlay 22 / recipe 26 / `ds.foodName` 24; Jua only on Home brand title |
| Corner radius | Warn | DS 24 · Home/Recipe CTAs ~18 · Onboarding ~28 |
| Button height | Warn | DS/Home 52 · Onboarding ~56 |
| Icon size | Warn | Hero heart ~42 (under 48 target; `hitSlop` helps); Seed sizes 32–120 OK |
| Image ratio | Warn | Home/Recipe hero AR **1.6** clamp 188–220; unused theme AR 4/3; `MealHeroImage` default 1.25 orphan |
| Animation | Pass* | Splash sequence, meal refresh spring, haptics on key actions; no stack transitions |
| Loading | Pass | `ScreenLoading` + Seed; font gate cream blank brief |
| Empty state | Pass* | Favorites empty solid; Home empty component unused (errors mapped to ErrorState) |

### Polish backlog (no redesign)

- [ ] Align primary CTA radius/height: Onboarding ↔ Home ↔ Recipe Detail to `ds` (52h / 24r) **or** document one premium exception and apply everywhere
- [ ] Unify title text color (`#1E1E1E` vs hardcoded `#3A2417`)
- [ ] Root Favorites / My tabs: remove Back-to-Home chrome (already on tabs)
- [ ] Hero heart: visual size ≥ 44pt (or keep 42 + ensure hitSlop ≥ 48)
- [ ] Soft-remove unused `EmptyState` / `AIThinkingLoader` from mental inventory (or wire)

---

## 3. Text improvements

### Terminology lock (recommended)

| Concept | Use | Avoid in chrome |
| --- | --- | --- |
| App headline | **오늘 뭐 먹지?** (space) | 오늘 뭐먹지? |
| Today’s pick noun | **메뉴** | 식사 / 한 끼 (brand voice only) |
| Saved list | **즐겨찾기** | 찜 / 취향 / 나중에 먹기 (unless distinct action) |
| Profile | **내 한끼** | Tab label **마이** |
| Time meta | **조리 시간** | 준비 시간 |
| Ate CTA | **오늘 먹었어요** | 오늘 이 메뉴 먹었어요! / 오늘 이 메뉴로 먹었어요 |
| Refresh | **다른 메뉴** | 다른 메뉴 추천 / 다른 메뉴 볼래요? |

### Before → after (highest impact)

| Before | After | Where |
| --- | --- | --- |
| 오늘 뭐먹지? | 오늘 뭐 먹지? | `SplashScreen.tsx` |
| 마이 (tab) | 내 한끼 | `(tabs)/_layout.tsx` |
| ❤️ 즐겨찾기에 저장되었습니다. | 즐겨찾기에 담았어요 | `HankkiMessages.favorites` |
| 즐겨찾기에서 제거되었습니다. | 즐겨찾기에서 뺐어요 | same |
| 이미 기록되어 있습니다. | 이미 기록돼 있어요 | mealCompletedDuplicateToast |
| 다시 해볼게 | 다시 시도할게요 | retry.button |
| 아직 저장한 메뉴가 없습니다. | 아직 저장한 메뉴가 없어요 | favorites.empty |
| 요즘 채소 좀 드세요. | 요즘 채소도 챙기기 좋아요 | reasonNeedVegetables |
| Tip / STEP / Seed (a11y) | 팁 / 단계 / 한끼 | recipe steps, mascot labels |
| Release 1.1 예정 | 곧 만나요 | dine-out copy |

### Formality

- Prefer **해요체** everywhere in user chrome.
- Audit leaks of 습니다/합니다 in toasts, accept hints, dine-out body, intel sentences.

### Checklist

- [ ] Splash ↔ Home headline spacing unified
- [ ] Favorite toasts use one voice (popup + detail + list)
- [ ] Tab labels match screen titles
- [ ] Delivery CTA while locked does not say “어디서 먹을지 보기 →”

---

## 4. Consistency improvements

### Images

| Asset | Coverage | Consistency note |
| --- | ---: | --- |
| Hero JPG (Batch 01) | **10** dish photos | OK unique; large / possible PNG-bytes-as-`.jpg` |
| Heroes beyond Batch 01 | Category fallbacks | Same image for many meals — feels broken if catalog open |
| Ingredient images | **0** | Soft peach dots in chips |
| Step images | **0** | Text-only steps |
| Seed mascot | Live `seed_*.png` | Placement OK splash/home/loaders; size typed 32–120 |
| Cropping | `cover` on heroes | AR 1.6 consistent Home/Detail |

### Actions

- [ ] Decide MVP catalog = Batch 01 only (preferred for honest release) **or** generate more heroes
- [ ] Accept ingredient/step emptiness for MVP **or** ship minimal icon set (even generic categories)
- [ ] Re-encode Batch 01 as true JPEG if still PNG payload
- [ ] Keep mascot size tokens; replace a11y “Seed” → “한끼”
- [ ] Do not ship remote URL path without `expo-image` cache policy

### Design system

- [ ] One radius/button contract across Splash chrome exceptions vs interactive CTAs
- [ ] Stop spreading hard-coded cream/coral hex outside `ds` / theme bridge

---

## 5. Navigation

| Flow | Status | Gap |
| --- | --- | --- |
| Cold start → Splash → Onboarding / Home | Pass | — |
| Home recommend → Detail (`/ingredients/[id]`) | Pass | Route name “ingredients” is historical |
| Favorite heart → list → detail | Pass | Home popup vs toast inconsistency |
| Today Ate → history | Pass* | Marks history; stays on Detail (no meal-confirmed screen) |
| Recommendation refresh | Pass | Cooldown present |
| Back button | Warn | Predictable via `navigateBack`; root tabs still show Back |
| Cooking flow | Fail vs older docs | `/cooking/[id]` never reached |
| Meal confirmed / recipe stubs | Redirect only | OK if not promised in marketing |
| Search | Orphan | Not discoverable from Home |
| My → AI settings / history | Pass | Settings legal rows fail (C2) |

### Actions

- [ ] Update all release copy/checklists to match **live** path (no cooking claim)
- [ ] Remove tab-root Back buttons
- [ ] Hide Search until featured **or** add one entry point

---

## 6. Performance

| Check | Status | Detail |
| --- | --- | --- |
| Large images | Warn | Batch 01 heroes heavy; PNG-as-JPG risk |
| Lazy loading | N/A / weak | Local `require()` maps; list thumbs not deferred |
| Image cache | Weak | RN `Image` only — **no `expo-image` / cachePolicy** |
| Render speed | Likely OK | Local data, no network catalog; needs device smoke |
| Nested scroll | Warn | Home / Detail horizontals — device jank check required |
| Accept / Save errors | Warn | Prior QA: save path can throw without catch / no ErrorBoundary |

### Actions

- [ ] Device smoke: Home interactive ≤ ~3s mid-tier
- [ ] Recompress heroes; consider `expo-image` before any remote assets
- [ ] Guard Accept / Save handlers with try/catch + toast
- [ ] Optional: ErrorBoundary soft UI for production

---

## 7. Release readiness

### Store / build

| Item | Ready? |
| --- | --- |
| Bundle IDs `com.aionecompany.todaysmenu` | Yes |
| App icon asset | **No** |
| Native splash image (beyond color) | **No** (cream only) |
| Version aligned | **No** |
| Privacy / Terms URLs | **No** (rows dead) |
| Production EAS build signed off | **Not verified this sprint** |
| Physical device matrix (375 / 390 / 360 / 412) | **Not signed off** |

### Channel gates

| Channel | Ready? | Why |
| --- | --- | --- |
| Closed TestFlight (internal) | Soft maybe after C1 | Icon still required for credible packaging |
| Public TestFlight / Play internal | **No** | C1–C6 |
| App Store / Play Store public | **No** | Packaging + trust + imagery honesty |

### MVP quality bar (pass when…)

1. First-time user completes homemade path without crash, white screen, or dead controls.  
2. Store icon present; versions aligned.  
3. Settings / reminders / pairings are honest.  
4. Every meal that can appear has a **unique** hero **or** catalog is explicitly Batch 01.

---

## Prioritized execution order (polish only)

1. **C1–C5** trust + store blockers  
2. **C6** catalog policy (Batch 01 limit is fastest)  
3. Terminology + formality pass (~1 day copy)  
4. Radius/button + tab Back chrome alignment  
5. Image recompress + optional `expo-image`  
6. Device matrix smoke → update this score  

**Do not:** add features, redesign screens, open cooking/search unless fixing honesty/docs, expand recipe count for store screenshots.

---

## Sign-off

| Role | Date | GO / NO-GO |
| --- | --- | --- |
| Product | | ☐ Delay |
| Engineering | | ☐ Delay |
| Design | | ☐ Delay |

**Current decision: Delay (56/100).** Re-run this checklist after Critical fixes; target ship bar ≥ **75** with all C1–C6 closed.
