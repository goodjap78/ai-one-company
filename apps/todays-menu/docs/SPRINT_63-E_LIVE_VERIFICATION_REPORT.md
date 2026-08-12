# SPRINT 63-E LIVE VERIFICATION REPORT

**Date:** 2026-08-11  
**Verdict:** **LIVE_READY**

---

## 1. ENV status

| Variable | Status |
|----------|--------|
| `COUPANG_PARTNERS_ACCESS_KEY` | SET |
| `COUPANG_PARTNERS_SECRET_KEY` | SET |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | SET |

Values not logged or copied.

---

## 2. Proxy status

| Check | Result |
|-------|--------|
| `npm run shopping-proxy` | **RUNNING** on `http://127.0.0.1:4730` |
| `GET /api/health` | `ok: true`, `coupangConfigured: true` |
| `POST /api/shopping/coupang/search` | **200**, 3 products for `대파` |

**Fix applied during verification:** proxy import path corrected (`scripts/shopping-proxy` → `server/shopping`). Credential sanitizer strips angle brackets from portal copy-paste.

---

## 3. Live API authentication

| Check | Result |
|-------|--------|
| Initial failure | HTTP 400 — invalid characters in access key path (portal copy-paste `<…>` wrapping) |
| Resolution | `sanitizePartnerCredential()` in `loadShoppingProxyEnv.ts` |
| HMAC vs official spec | signed-date UTC `yyMMdd'T'HHmmss'Z'`, message = date + GET + path + query |
| Post-fix | **All 5 keywords HTTP success** (`rCode: 0`) |

No Authorization header or key values logged.

---

## 4–8. Live keyword results

| Keyword | HTTP | Products | Title | Image | Price | Product URL | Affiliate URL |
|---------|------|----------|-------|-------|-------|-------------|---------------|
| 대파 | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 양파 | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 계란 | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 돼지고기 | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 고추장 | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |

Affiliate URLs are official API `productUrl` (`link.coupang.com`) — no client-side URL fabrication.

---

## 9. ShoppingProduct mapping

| Field | Source | Fake data |
|-------|--------|-----------|
| `id` | `productId` | None |
| `title` | `productName` | None |
| `imageUrl` | `productImage` | None when absent |
| `price` | `productPrice` | None when absent |
| `productUrl` | API `productUrl` | None |
| `affiliateUrl` | tracking URL when `link.coupang.com` | None |
| `merchant` | `'coupang'` | Provider label only |

---

## 10. Shopping E2E

| Layer | Result |
|-------|--------|
| `searchProductsForRequests` → live proxy | **PASS** (양파, success, products > 0) |
| `getShoppingProductAdapter` → `coupang` | **PASS** when API base SET |
| Config enabled | `productProviderEnabled`, `provider: 'coupang'`, `purchaseCtaEnabled` |

Automated live adapter path verified. UI flow wiring unchanged (Ingredients CTA → Shopping screen).

---

## 11. Affiliate URL

| Check | Result |
|-------|--------|
| Source | Official search API `productUrl` (Partners tracking) |
| `affiliateEnabled` | `true` |
| `resolveOutboundProductUrl` | Prefers `affiliateUrl` |
| `isAffiliateTracking` | **true** (`link.coupang.com`) |
| Client URL signing | **None** (`createAffiliateLink` returns null) |

---

## 12. Disclosure status

| Item | Status |
|------|--------|
| Text | `COUPANG_PARTNERS_OFFICIAL_DISCLOSURE` |
| Source | Coupang Partners program / 공정위 대가성 문구 가이드 (official Partners guidance) |
| Config | `affiliateDisclosureText` **enabled** |
| UI | `ShoppingScreen` renders disclosure when text set |

---

## 13. Product outbound test

| Check | Result |
|-------|--------|
| `hasOutbound` | true |
| `canOpen` | true |
| Tracking host | `link.coupang.com` |
| Full URL | Not logged |

---

## 14. Fridge missing-only E2E

| Check | Result |
|-------|--------|
| `FRIDGE_SHOPPING_CONFIG.enabled` | `true` |
| Bridge wiring tests | **PASS** |
| Fridge raid regression | **PASS** (bridge production config) |
| Missing-only route | `mode=missing` wired |

---

## 15. Security audit

| Check | Result |
|-------|--------|
| Access Key in client bundle | **None** |
| Secret Key in client bundle | **None** |
| Secrets in git tracked files | **None** (`.env.example` names only) |
| `.env` in `.gitignore` | **Yes** |
| Authorization in logs | **None** |
| Proxy accepts arbitrary upstream | **No** |

---

## 16. Regression tests

| Script | Result |
|--------|--------|
| `test:coupang-server-client` | PASS (live 5 keywords) |
| `test:coupang-product-adapter` | PASS |
| `test:coupang-shopping-integration` | PASS |
| `test:shopping-product-adapter` | PASS (live batch) |
| `test:affiliate-link-foundation` | PASS |
| `test:fridge-shopping-bridge` | PASS |
| `test:shopping-keyword` | PASS |
| `test:recipe-shopping-list` | PASS |
| `test:shopping-screen` | PASS |
| `test:shopping-selection` | PASS |
| `test:fridge-raid` | PASS |
| `test:home-final-qa` | PASS |
| `test:recommendation-personalization` | PASS |
| `test:personalization-production-qa` | PASS |
| `smoke:rc` | PASS (15/15) |

---

## 17. Enabled config

```text
SHOPPING_CONFIG.productProviderEnabled = true
SHOPPING_CONFIG.provider = 'coupang'
SHOPPING_CONFIG.affiliateEnabled = true
SHOPPING_CONFIG.purchaseCtaEnabled = true
SHOPPING_CONFIG.affiliateDisclosureText = COUPANG_PARTNERS_OFFICIAL_DISCLOSURE
FRIDGE_SHOPPING_CONFIG.enabled = true
FRIDGE_SHOPPING_CONFIG.provider = 'coupang'
FRIDGE_SHOPPING_CONFIG.isAffiliate = true
```

---

## 18. Remaining issues

1. **Production proxy deploy:** `EXPO_PUBLIC_SHOPPING_API_BASE_URL` currently points to localhost — physical devices need a deployed proxy URL with server-only env vars.
2. **Keep `npm run shopping-proxy` running** during local web QA.
3. **Portal copy-paste:** if API returns 400, verify keys are not wrapped in `<…>` in `.env` (sanitizer handles this automatically).

---

## Final judgment

**LIVE_READY**

---

## SPRINT 63 COUPANG SHOPPING V1 PRODUCTION READY
