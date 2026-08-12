# SPRINT 64 ANDROID DEVICE QA FIX REPORT

**Date:** 2026-08-12  
**Verdict:** **READY_FOR_DEVICE_RETEST**  
**Sprint 64 status:** **WAITING_DEVICE_QA** (not COMPLETE)

---

## 1. Card overflow root cause

`HomeComingSoonSection` used `PEEK_VISIBLE_CARDS = 3.5`, making each card too narrow on 360–390px Android widths so titles clipped. Kids card also used `baseCardWidth - 8`, breaking even alignment.  
`AlternativeMealsRow` lacked strict `maxWidth` / `flexBasis` constraints, so columns could visually spill on some Android layouts.

## 2. Card responsive fix

- Coming soon: **3 full cards + ~18px peek** (`FULL_VISIBLE_CARDS` + `PEEK_PX`)
- Removed kids width hack
- Added `overflow: 'hidden'` on cards
- Alternative row: `flexBasis: 0`, `maxWidth: '33.33%'`, row `overflow: 'hidden'`

## 3. Shopping CTA before/after

| Before | After |
|--------|--------|
| Underlined muted text link | Compact orange-border primary card button |
| Easy to miss | Full-width entry with chevron + hint |

Copy: still **「필요한 재료 장보기」** (no Coupang brand in CTA). Hint: 「선택한 재료의 상품을 바로 찾아보세요」. Route unchanged: `/shopping/[recipeId]`.

## 4. Shopping Hero before/after

| Before | After |
|--------|--------|
| Full-width hero `aspectRatio: 2.2` | Compact **72×72** thumb + text row |
| Dominated first viewport | Products reachable with little/no scroll |

Image not deleted — still rendered via `MealImageView` thumb.

## 5. Product tap root cause

**BLOCKING:** `openShoppingProduct` called `Linking.canOpenURL(url)` then returned `false` when unsupported.

On **Android 11+**, `canOpenURL('https://…')` commonly returns **false** without AndroidManifest `<queries>`, even though `Linking.openURL` works. Pressable/onPress/affiliateUrl delivery were fine; the gate swallowed the open.

## 6. Outbound fix

- `http(s)` URLs: skip `canOpenURL` gate → call `openURL` directly
- Custom schemes: still use `canOpenURL`
- `__DEV__` diagnostics only: `PRODUCT_CARD_PRESS`, `OUTBOUND_URL_PRESENT`, `CAN_OPEN`, `OPEN_RESULT` — **no secrets / no full URLs**

## 7. Affiliate URL behavior

Unchanged: `affiliateUrl` first → else `productUrl` unless `affiliateOnly`. No client-side affiliate generation.

## 8. Android Linking behavior

Root cause = package-visibility `canOpenURL` false negative on https. Fix treats https as openable and relies on `openURL`.

## 9. Disclosure visibility

Official Coupang Partners text **unchanged**. Moved from list bottom to **below header** (before product sections), with soft background so it is visible on entry without long scroll.

## 10. Modified files

- `services/shopping/openShoppingProduct.ts`
- `components/shopping/IngredientsShoppingCta.tsx`
- `components/shopping/ShoppingScreen.tsx`
- `constants/shoppingCopy.ts`
- `components/home/HomeComingSoonSection.tsx`
- `components/home/AlternativeMealsRow.tsx`
- `scripts/test-shopping-outbound-android.ts` (new)
- `scripts/test-home-final-qa.ts` (peek assertion update)
- `package.json` (test script)

**Not modified:** proxy production, Upstash, Coupang server mapping, assets, recommendation/personalization.

## 11. Tests

| Script | Result |
|--------|--------|
| `test:shopping-outbound-android` | PASS |
| `test:shopping-screen` | PASS |
| `test:shopping-selection` | PASS |
| `test:affiliate-link-foundation` | PASS |
| `test:coupang-product-adapter` | PASS |
| `test:coupang-shopping-integration` | PASS |
| `test:home-final-qa` | PASS |
| `test:fridge-raid` | PASS |
| `smoke:rc` | PASS (15/15) |

## 12. Regression

PASS — shopping / affiliate / home / fridge / smoke. Proxy production code untouched.

## 13. New Android preview build required

**YES** — interaction + layout fixes are client-side; need new EAS preview install.

## 14. Device retest checklist

1. Home — alternative cards + coming-soon cards: no bad clipping; peek intentional  
2. Ingredients — 「필요한 재료 장보기」 orange CTA visible  
3. Shopping — compact recipe thumb; products early on screen  
4. Disclosure visible near top  
5. Tap Coupang product → browser/Coupang app opens  
6. Price/image/title still OK  
7. Home recommend / favorites / recently viewed still OK  

---

## Fridge shopping (J/K)

| Field | Status |
|-------|--------|
| FRIDGE_SHOPPING_CTA | PASS (code) — orange compact CTA after primary feed; subtitle 「없는 재료만 한 번에 찾아봐요」 |
| MISSING_ONLY_LOGIC | PASS — `mode=missing` + pantry excludes owned; bridge uses `buildMissingShoppingListFromNames` |
| FRIDGE_PRODUCT_RESULTS | PASS (wiring) — same `ShoppingScreen` / `ShoppingProductResults` (no fake screen) |
| FRIDGE_OUTBOUND | PASS (wiring) — shared `openShoppingProduct` (Android https fix) |

**Device retest (after Android preview rebuild):**  
냉장고 털기 → 재료 2~3개 → 추천 → 「부족한 재료 장보기」 → Coupang 상품 → 탭 → 쿠팡 이동

제로 부족: CTA 대신 「지금 있는 재료로 바로 만들 수 있어요」 표시.

---

**Final verdict:** READY_FOR_DEVICE_RETEST  
**Not:** SPRINT 64 COMPLETE / PRODUCTION COMPLETE
