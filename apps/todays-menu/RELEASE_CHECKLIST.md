# HANKKI MVP — Sprint Release-1 Checklist

**Date:** 2026-07-15  
**App:** `apps/todays-menu` (HANKKI)  
**Scope:** Release readiness only — **no new features**  
**Companions:** [FINAL_RELEASE_CHECKLIST.md](./FINAL_RELEASE_CHECKLIST.md) · [QA_REPORT.md](./QA_REPORT.md) · [UAT_REPORT.md](./UAT_REPORT.md)

> Check `[x]` only after verification on a **real device** or signed build.  
> Do not expand scope while closing this list.

---

## Current release verdict (analysis)

| | |
| --- | --- |
| **MVP store-ready now?** | **NO** |
| **Recommendation** | **Delay public store upload** |
| **Internal demo / TestFlight (after P0)?** | Conditional — see blockers |

### What is still unfinished?

| Area | Status |
| --- | --- |
| Core homemade path (Splash → Home → Detail → Favorite → 오늘 먹었어요) | Usable |
| Hero Image Factory (Gemini → review → approve → assets) | Working (IMG-4) |
| Official Hero style prompt | **v1.1** locked |
| Unique dish heroes in production (`assets/meals`) | **10** Batch 01 dishes |
| Ingredient / step images | **0** (text / dot fallback) |
| Store icon + splash image | Missing |
| Version alignment (`package.json` 0.1.0 vs `app.json` 1.0.0) | Mismatch |
| My Page legal rows (문의 / 개인정보 / 약관) | Dead taps |
| Meal reminders native schedule | Stub |
| Cooking route | Implemented, **not linked** from UI |
| `DEV_FORCE_HOME_RECIPE_ID` (Home forced to 003) | Still on in `__DEV__` — must remove before ship |
| Physical device matrix sign-off | Not done |
| Privacy / Terms hosted URLs | Not wired |

### What blocks MVP release? (must fix or honestly gate)

1. **App icon + adaptive foreground** missing in `app.json` / assets.  
2. **Dead settings rows** look tappable (문의 / 개인정보 / 약관).  
3. **Reminder UI** implies notifications that do not schedule.  
4. **Version drift** between `package.json` and `app.json`.  
5. **Remove** `DEV_FORCE_HOME_RECIPE_ID` override before any external build.  
6. **Catalog honesty:** either ship Batch 01 only in recommendations, or add more unique heroes (category fallbacks for 011+ look broken).  
7. **Store listing assets** (privacy policy URL, screenshots) incomplete.  
8. **Metro/cache diligence:** after `hero:approve`, restart Expo with `--clear` so new JPG `require()` assets appear.

### What can wait until Version 1.1?

| Item | Why OK to defer |
| --- | --- |
| Ingredient icon factory (full set) | Soft peach dots already degrade gracefully |
| Step photo factory | Text steps readable for MVP |
| Heroes 011–100 dedicated photos | Limit MVP catalog to Batch 01 instead |
| Cooking guided mode UI wiring | Live path uses Detail “오늘 먹었어요” |
| Search entry on Home | Exist but orphaned — hide until featured |
| Real `expo-notifications` scheduling | Gate reminders as “준비 중” first |
| Delivery / dine-out mode | Already labeled 준비 중 |
| Coming-soon feature cards / surveys | Product intentional |
| expo-image caching layer | Local assets sufficient for MVP pack |
| Full terminology / formality copy pass | Usable; polish not P0 if trust bugs fixed |

---

## 1. UI checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Splash | Brand animation → onboarding or tabs without white flash |
| ☐ | Onboarding | Nickname 1–12 chars; save lands on tabs; haptic OK |
| ☐ | Home (North Star) | Title, Seed, feature cards, today meal card, CTAs readable on 375px |
| ☐ | Recipe Detail (`/ingredients/[id]`) | Hero, meta, ingredients, steps, bottom actions visible |
| ☐ | Favorites / 내 메뉴 | Empty + list; heart toggle; card opens detail |
| ☐ | My Page | Profile, favorites preview, history, AI settings navigate |
| ☐ | Spacing / type / radius | No overlap; primary CTAs readable; ≥44pt touch where possible |
| ☐ | Loading / empty / error | Home retry works; Favorites empty CTA works |
| ☐ | Remove tabs Back chrome | Root Favorites / My should not feel like stack traps |

---

## 2. Image checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Batch 01 heroes (001–010) | Unique JPGs under `assets/meals/` (not blank) |
| ☐ | Recipe `003` kimchi_stew | Latest approved hero after Metro `--clear` |
| ☐ | 011+ recommendations | Disabled **or** clear category fallback accepted for MVP |
| ☐ | Ingredient chips | Missing icons → soft fallback only (no crash) |
| ☐ | Step list | Missing step images → text-only (no broken image boxes) |
| ☐ | Seed mascot | Splash / Home / loaders show Seed assets |
| ☐ | Aspect / crop | Home + Detail hero ~1.6 / cover; no ugly stretch |
| ☐ | Mascot sizing | Consistent Seed sizes; a11y not “Seed” if product = 한끼 |

---

## 3. Recipe checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Catalog source | Home homemade uses `HANKKI_RECIPES` only |
| ☐ | Required fields | name, time, difficulty, calories, ingredients, steps present for shipped IDs |
| ☐ | `heroImageKey` / `image` path | Match `assets/meals/{key}.jpg` for Batch 01 |
| ☐ | `recipeImageMap` | `001`–`010` map to local dish keys |
| ☐ | Detail open | Favorites + Home accept → correct recipe id |
| ☐ | 오늘 먹었어요 | Writes history; duplicate toast OK |
| ☐ | No cooking claim in store copy | Cooking route not in MVP happy path |

---

## 4. Navigation checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Cold start | Splash → nickname gate or `/(tabs)` |
| ☐ | Home → Detail | Homemade CTA → `/ingredients/[id]` |
| ☐ | Detail → Home | Back predictable |
| ☐ | Favorite flow | Heart ↔ Favorites list ↔ Detail |
| ☐ | Tabs | 홈 / 내 메뉴 / 마이 all reachable; safe area OK |
| ☐ | `/recipe/[id]` stub | Redirects cleanly (no stuck loader) |
| ☐ | Deep links unused (search/cooking) | Do not surface in MVP chrome |
| ☐ | Delivery path | Locked / coming-soon honest |

---

## 5. Performance checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Home interactive | ≤ ~3s mid-tier device after splash |
| ☐ | Hero JPG weight | Batch 01 recompress if decode jank; true JPEG preferred |
| ☐ | After approve | Restart Metro `--clear` so new assets load |
| ☐ | Scroll | Detail long scroll no freeze |
| ☐ | Favorites toggle | No hang on focus reload |
| ☐ | Accept / Save | try/catch + toast; no uncaught rejection |
| ☐ | Font gate | Jua loads; no infinite blank cream |

---

## 6. Android checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Package id | `com.aionecompany.todaysmenu` |
| ☐ | Adaptive icon | Foreground + background present |
| ☐ | Splash | Brand splash image or explicit cream-only defer note |
| ☐ | Portrait only | Confirmed |
| ☐ | Safe area / nav bar | Tabs not clipped on gesture nav |
| ☐ | Release / AAB build | EAS or local release build succeeds |
| ☐ | Device smoke | API 30+ mid-tier (360 / 412 width) |
| ☐ | Play listing stubs | Short description, screenshots, content rating prep |

---

## 7. iPhone checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Bundle id | `com.aionecompany.todaysmenu` |
| ☐ | App icon 1024 | Present in Expo config |
| ☐ | Splash | Image or deferred cream |
| ☐ | `supportsTablet: false` | Confirmed non-iPad target |
| ☐ | Notch / Dynamic Island | Safe area OK on Home / Detail |
| ☐ | TestFlight IPA | Builds after icon exists |
| ☐ | Device smoke | iPhone 375 / 390 |
| ☐ | App Store listing prep | Privacy policy URL, screenshots |

---

## 8. Data checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Nickname / onboarding flag | Persist + restore |
| ☐ | Favorites | Persist across relaunch |
| ☐ | Meal history | 오늘 먹었어요 appears in My / history |
| ☐ | Recommendation session | Detail tip matches Home when same id |
| ☐ | Context memory chips | Persist selection if featured |
| ☐ | AI recommendation settings | Load / save from My |
| ☐ | No secret commits | `.env` gitignored; no API keys in repo |
| ☐ | Remove force-003 override | `DEV_FORCE_HOME_RECIPE_ID` null / deleted for release builds |

---

## 9. AI image checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | Official style | **HANKKI Hero Image Style v1.1** in `buildHeroPrompt.ts` |
| ☐ | Provider | `IMAGE_PROVIDER=gemini` + `GEMINI_API_KEY` (local only) |
| ☐ | Pipeline | `hero:generate` → review only |
| ☐ | Approve | `npm run hero:approve -- --recipe=XXX --force` |
| ☐ | Verify | Production exists + SHA-256 match review |
| ☐ | Rollback | `npm run hero:rollback -- --recipe=XXX` when backup exists |
| ☐ | Registry | `mealImageAssets` / `recipeImageMap` preserve mapping |
| ☐ | No manual copy required | Approve is the production gate |
| ☐ | Metro after promote | `--clear` so app shows new JPG |
| ☐ | Do not ship review folder | App loads `assets/meals/` only |

---

## 10. Final release checklist

| | Check | Pass criteria |
| --- | --- | --- |
| ☐ | All **Release blockers** above closed or gated | See analysis |
| ☐ | Happy path signed off on Android + iPhone | No crash / white screen / dead primary CTA |
| ☐ | App name / version / store IDs aligned | Expo + package |
| ☐ | Privacy & Terms reachable or rows disabled | No fake chevrons |
| ☐ | Reminders honest | Working **or** marked 준비 중 / hidden |
| ☐ | Catalog policy decided | Batch 01 only **or** more heroes |
| ☐ | No DEV force-recipe in release | Override removed |
| ☐ | Screenshots for stores | Home + Detail with real hero |
| ☐ | GO / NO-GO meeting | Product + Eng + Design |

### Sign-off

| Role | Date | GO / NO-GO |
| --- | --- | --- |
| Product | | ☐ |
| Engineering | | ☐ |
| Design | | ☐ |

**MVP quality bar:** First-time user completes homemade recommend → detail → favorite or “오늘 먹었어요” without crash, white screen, or obviously broken buttons — and store packaging (icon) exists before public upload.

---

## Quick command reference (images)

```bash
# Generate review only
npm run hero:generate -- --recipe=003 --force

# Promote review → assets/meals + hash verify
npm run hero:approve -- --recipe=003 --force

# Restore previous production JPG
npm run hero:rollback -- --recipe=003

# App (after approve)
npx expo start --web --clear
```

---

## Priority order before store upload

1. Store icon + splash + version sync  
2. Remove `DEV_FORCE_HOME_RECIPE_ID`  
3. Fix or disable dead My settings + reminders honesty  
4. Decide Batch 01-only recommendation pool  
5. Device smoke Android + iPhone  
6. Privacy / Terms URLs  
7. Then reconsider public GO  

**Version 1.1 backlog:** ingredient icons, step photos, more heroes, cooking mode link, search, real notifications, full copy terminology pass.
