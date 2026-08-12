# HANKKI MVP — Sprint UAT-1 Real User Flow Validation

**Date:** 2026-07-14  
**App:** `apps/todays-menu`  
**Mode:** Observe & report only — **no features, no UI redesign, no business-logic changes**  
**Method:** Cognitive walkthrough of code paths (Scenario 1 & 2), copy audit, asset coverage, timing from splash/load constants. **Not instrumented on a physical device this sprint.**

---

## Scores (top line)

| Metric | Result |
| --- | --- |
| **User Experience Score** | **58 / 100** |
| Would a new user understand the app in under 30 seconds? | **YES** (core idea: “오늘 뭐 먹지?” + one meal card) |
| Would they find dinner within 10 seconds? | **NO*** |
| Would they use the app again? | **YES** (soft) — Seed + clear CTA; trust drops if imagery / dead paths disappoint |

\*Clock-driven meal slot only: dinner appears automatically at 17–22시. Users **cannot** tap “저녁” at other hours. Even within dinner hours, splash alone is ≥1.2s before Home content mounts.

---

## Final score rationale (58)

| Dimension | Score | Notes |
| --- | ---: | --- |
| First-run clarity | 78 | Nickname onboarding is short and friendly |
| Time-to-meal decision | 55 | Current-slot reco is fast; **no meal-type picker** breaks Scenario 1 |
| Path friction (taps / scroll) | 48 | Long Recipe Detail before primary CTA; favorite modal extra tap |
| Returning-user reliability | 52 | Nickname restores; ingredient/step images empty; many heroes fallback |
| Emotional delight | 72 | Seed mascot, cream palette, haptics on key actions |
| Honesty / trust | 45 | Locked cards invite taps → surveys; reminders/settings issues (QA-1) |

---

## Test Scenario 1 — New user

### Scripted path vs actual product

| Step in brief | What actually happens | Result |
| --- | --- | --- |
| Launch app | Splash ≥ **1200ms** (`SplashScreen` `MIN_DISPLAY_MS`) + nickname read from storage | OK |
| Onboarding | Redirect `/onboarding` if no nickname | OK |
| Enter nickname | 1–12 chars → `saveNickname` → `/(tabs)` | OK |
| Home | North Star Home: titles + feature cards + `TodayMealCard` | OK |
| **Select breakfast** | **Impossible as a user action** — `getCurrentMealType()` from clock only | **BLOCK** |
| Open recipe | CTA **「레시피 보기 →」** → `/ingredients/[id]` | OK |
| Favorite recipe | Heart on Home **or** Detail favorite button | OK (+ friction) |
| Go back | Back → Home | OK |
| **Select lunch** | **Same blocker** — no UI to switch 아침/점심/저녁 | **BLOCK** |
| Open another recipe | 「다른 메뉴 추천」 refresh, then open again | Workaround only |
| Mark 「오늘 먹었어요」 | Primary CTA after long scroll; toast only (stays on Detail) | OK w/ friction |
| Close app | OS close | OK |

### Simulated tap count (happy path, homemade, clock = breakfast)

| Action | Taps |
| --- | ---: |
| Nickname + 「한끼 시작하기」 | 1 (+ keyboard) |
| 「레시피 보기 →」 | 1 |
| Favorite on Home | 1 + **확인** on modal = **2** |
| Back | 1 |
| Refresh for “another” meal | 1 |
| Open second recipe | 1 |
| Scroll to bottom + 「오늘 이 메뉴 먹었어요!」 | 1 |
| **Approx. productive taps** | **~8–9** (excl. keyboard) |

Without a meal-type control, Scenario 1 **cannot be completed as written**.

### User Journey (Scenario 1 — as product actually allows)

```
Launch
  → Splash (~1.2s+)
  → Onboarding (Seed + nickname)
  → Home (clock meal type auto)
  → Optional: tap locked 외식/아이 cards → survey modal (distraction)
  → 「레시피 보기 →」
  → Recipe Detail (hero → meta → 3 ingredient rows → all steps → completion → CTAs)
  → Favorite (Home heart → modal 「확인」 OR Detail button → toast)
  → Back
  → 「다른 메뉴 추천」 (only way to change dish for same slot)
  → Open → scroll → 「오늘 이 메뉴 먹었어요!」 → toast (no auto-home)
  → Leave app
```

---

## Test Scenario 2 — Returning user

| Step | Result | Notes |
| --- | --- | --- |
| Launch | PASS | Splash → nickname gate skips onboarding |
| Nickname restored | PASS | `getNickname()` → Home greeting uses name |
| Home loads correctly | PASS* | Async recommend; loading placeholder then card |
| Today's recommendation | PASS | For **current clock slot** only |
| Favorite list works | PASS | Tab **「내 메뉴」** → list → `/ingredients/[id]` |
| Recipe / hero images | PARTIAL | Batch 01 dish photos OK; 011+ often **category_korean** |
| Ingredient images | FAIL soft | Registry empty → text/emoji chips, no PNGs |
| Cooking step images | FAIL soft | Registry empty → text-only steps |

\*Returning users still see Coming Soon + Reward blocks below the fold — same scroll length as new users.

---

## Observe

### Where the user hesitates

1. **Home feature row** — three cards; two locked 「준비 중」. First-timers tap 외식·포장 / 우리 아이 and land in a **survey**, not a meal path.
2. **Which meal is this?** — Label may say 아침/점심/저녁 in greeting, but there is **no control** to change it → confusion when testing “breakfast then lunch.”
3. **Recipe Detail length** — Primary 「오늘 이 메뉴 먹었어요!」 sits **after** ingredients + every cooking step + completion tip. Users must decide whether to cook first or scroll past.

### Where the user stops (drop risk)

| Moment | Risk |
| --- | --- |
| Locked feature → survey | Looks like a dead product; may abandon before meal card |
| Identical category heroes (011+) | “Is this broken?” for some recipes |
| Empty ingredient / step photos | Detail feels unfinished; confidence drop for cooks |
| After 「오늘 먹었어요」 toast only | No clear “done → home” beat; unclear that history saved |

### Extra taps required

| Extra | Cost |
| --- | --- |
| Home favorite → modal → **확인** | +1 vs silent toast |
| Reach Detail primary CTA | **Long vertical scroll** (steps not skimable without scroll) |
| Change meal dish | Must use **다른 메뉴 추천** (cooldown) — not a meal-slot picker |
| Open favorites | Home heart says 「내 메뉴」 but user may hunt tab vs remember name |

### Confusing wording

| Copy | Why |
| --- | --- |
| Tab **「내 메뉴」** vs popup **「즐겨찾기에서 삭제」** | Same feature, two names |
| Home CTA **「레시피 보기 →」** vs older mental model “오늘은 이걸로” | Fine for detail, but doesn’t say “decide now” |
| Detail badge **「오늘의 추천」** after refresh alternate | Still says “today’s pick” |
| Coming Soon **「더 많은 메뉴를 만나보세요」** | Implies browse catalog; opens surveys |
| Meal history hint vs Detail button | History copy may not match exact button string |

### Scrolling that feels too long

1. **Home:** After meal card → Coming Soon (4 cards) → Reward — pushes trust chrome under the fold; competing with decision.
2. **Recipe Detail:** Continuous scroll of **all** steps before action buttons — main friction for “I already decided; just mark eaten / favorite.”

---

## Measure (code-derived; not device profiler)

| Metric | Estimate / constant | Source |
| --- | --- | --- |
| Launch → splash dismiss | **≥ 1.2s** (+ up to ~0.4s fade) | `SplashScreen` `MIN_DISPLAY_MS`, `FADE_OUT_MS` |
| Splash → first paint of Home/Onboarding | + **~350ms** content fade | `app/index.tsx` |
| Home recommendation load | Typically **&lt; 500ms–2s** on local engine (AsyncStorage + in-memory catalog); no network CDN required | `getHomeRecommendation` → `recommendMenuWithContext` |
| Recipe Detail load | Often **near-instant** if cached `getRecipeById`; else one `fetchRecipe` | `IngredientsScreen` |
| Navigation Home ↔ Detail | Local stack push/back — expected snappy | expo-router |
| Image loading | Heroes: local require map (Batch 01 heavy files); ingredients/steps: **nothing to load** | registries empty |

**Device lab note:** Re-run with timers on iPhone 375 + Galaxy 360 before calling Score final for store UAT.

---

## Report sections

### User Journey (summary)

New users get a warm, one-question onboarding and a single dominant meal card. The product sells **“today’s meal for right now”** (clock), not **“pick breakfast then lunch.”** Returning users skip onboarding and land on the same Home, with favorites reachable via **내 메뉴**. Decision primary path is short; post-decision Detail and marketing chrome below are long.

### Pain Points

1. **No meal-type (아침/점심/저녁) selector** — Scenario 1 fails as written.  
2. **Primary Detail action buried** under full recipe.  
3. **Locked cards steal attention** into surveys.  
4. **Ingredient / step imagery absent** — Scenario 2 imagery checks fail.  
5. **Favorite success requires dismiss tap** on Home.  
6. **「오늘 먹었어요」 does not route home** — weak closure ritual.

### Extra Clicks

- Favorite modal confirm  
- Refresh as meal-type substitute  
- Scroll past full recipe to mark eaten  
- Accidental Coming Soon surveys (recovery: close modal)

### Confusing Text

- 내 메뉴 vs 즐겨찾기  
- 준비 중 cards that still open something  
- 「오늘의 추천」 on any refreshed dish  

### Delight Moments

- Seed wave on onboarding + Home presence  
- Clear app promise: **「오늘 뭐 먹지?」**  
- Soft hero gradient + heart haptic  
- Favorite Seed popup (emotionally nice; costs a tap)  
- Toast on meal saved / favorite  
- Homemade card as the only unlocked path — once understood, simple

### Suggestions (observe-only; do not implement in this sprint)

| Priority | Suggestion |
| --- | --- |
| P0 | **Product decision:** either add meal-slot UI *or* rewrite UAT to “current meal only”; document clock windows for QA |
| P0 | Soft-gate locked feature cards (disable open / show badge only) so first 30s stay on homemade reco |
| P1 | Elevate 「오늘 먹었어요」 / Favorite closer to top of Detail (sticky bar or after meta) — without redesigning whole screen, only action placement |
| P1 | Replace Home favorite modal with toast (match Detail) to remove +1 tap |
| P1 | After meal-complete toast, optional soft “홈으로” affordance |
| P1 | Limit Home scroll chrome for MVP (Coming Soon / Reward below decision or collapse) |
| P2 | Ship ingredient + step assets for Batch 01 before claiming image completeness |
| P2 | Align「내 메뉴」/「즐겨찾기」 wording |

---

## Classify

### P0 — blocks realistic first-session success

| ID | Issue |
| --- | --- |
| **UAT-P0-1** | Scenario “Select breakfast / lunch” **unsupported** — clock-only `getCurrentMealType` |
| **UAT-P0-2** | First-session attention leak: locked cards → surveys before meal accept |
| **UAT-P0-3** | Scenario 2 image completeness fails: **0** ingredient PNGs, **0** step JPGs; heroes incomplete beyond Batch 01 |

### P1 — should fix before broad UAT / soft launch

| ID | Issue |
| --- | --- |
| **UAT-P1-1** | Recipe Detail: eat / favorite CTAs after full step list → long hesitation |
| **UAT-P1-2** | Home favorite modal requires **확인** (+1 tap vs toast) |
| **UAT-P1-3** | 「오늘 먹었어요」 has no clear next beat (stay on Detail) |
| **UAT-P1-4** | Naming drift: 내 메뉴 vs 즐겨찾기 |
| **UAT-P1-5** | Home below-fold Coming Soon + Reward lengthens scroll past decision |

### P2 — polish / post-MVP

| ID | Issue |
| --- | --- |
| **UAT-P2-1** | Splash minimum 1.2s slows “dinner in 10s” marketing claim |
| **UAT-P2-2** | Pairings 「더보기 >」 non-interactive (prior QA) |
| **UAT-P2-3** | Category-hero sameness for 011+ |
| **UAT-P2-4** | Tab Back chrome on 내 메뉴 / 마이 |

---

## YES / NO checklist

| Question | Answer |
| --- | --- |
| New user understands app in **&lt; 30s**? | **YES** — onboarding + title + one meal card communicate the job |
| Find **dinner** within **10s**? | **NO** — no dinner picker; splash ≥1.2s; only auto if hour ∈ [17,22) |
| Use the app again? | **YES** (soft) — delightful Seed + simple homemade path; risk if images / locked cards frustrate |

---

## Cross-links

- Production blockers: [`QA_REPORT.md`](./QA_REPORT.md)  
- Release checklist: `AI_Company_OS/08_Roadmaps/HANKKI_MVP_Release_Checklist.md`

---

## Sign-off

| Role | Result |
| --- | --- |
| UAT-1 (this report) | **Conditional fail** on Scenario 1 as written; Scenario 2 imagery fail; core homemade loop workable |
| Product | ☐ Re-scope meal-slot UX or accept clock-only |
| Device lab | ☐ Timed run on 375 / 390 / 360 / 412 |
