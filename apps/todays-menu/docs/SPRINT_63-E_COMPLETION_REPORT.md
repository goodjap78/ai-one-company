# SPRINT 63-E — COUPANG LIVE CONNECTION REPORT

**Date:** 2026-08-11  
**Verdict:** **PARTIAL** (infrastructure LIVE-ready; live API + production enable pending local credentials)

---

## 1. Official Partners API spec used

| Item | Value |
|------|--------|
| Base URL | `https://api-gateway.coupang.com` |
| Product search | `GET /v2/providers/affiliate_open_api/apis/openapi/v1/products/search` |
| Method | `GET` |
| Auth | HMAC-SHA256 (`CEA algorithm=HmacSHA256, access-key=…, signed-date=…, signature=…`) |
| Signed-date | UTC `yyMMdd'T'HHmmss'Z'` (max validity ~5 minutes per official auth guide) |
| Message | `signed-date + METHOD + path + query` |
| Query params | `keyword` (required), `limit` (1–10), `srpLinkOnly=false`, optional `subId`, `imageSize` |
| Success | `rCode === "0"` |
| Product fields | `productId`, `productName`, `productPrice`, `productImage`, `productUrl` (partner tracking URL) |
| Affiliate / deep link | Search response `productUrl` is already a Coupang Partners tracking URL (`link.coupang.com`). Separate deeplink API not required for MVP keyword search. |

Sources: Coupang Partners Open API v1 product search (official developer documentation / affiliate_open_api v1 spec).

---

## 2. Backend architecture

```
HANKKI App (React Native)
  → CoupangProductAdapter
  → shoppingProxyClient (POST, no secrets)
  → HANKKI Shopping Proxy (Node, port 4730)
  → coupangPartnersClient (HMAC + GET)
  → Coupang Partners API
```

- **Proxy server:** `scripts/shopping-proxy/server.ts`
- **Launch:** `npm run shopping-proxy`
- **Endpoint:** `POST /api/shopping/coupang/search`
- **Health:** `GET /api/health`

No existing production API in repo — minimal Node proxy added alongside internal dev servers (content-center pattern).

---

## 3. Credential storage

| Variable | Scope |
|----------|--------|
| `COUPANG_PARTNERS_ACCESS_KEY` | Server `.env` only |
| `COUPANG_PARTNERS_SECRET_KEY` | Server `.env` only |
| `COUPANG_PARTNERS_SUB_ID` | Optional server `.env` |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | Client-safe proxy base URL |

- Not in git (`.env.example` names only)
- Not in React Native bundle
- Not logged

---

## 4. Authentication / signature

Implemented in `server/shopping/coupangHmac.ts` + `coupangPartnersClient.ts` per official HMAC spec. No guessed algorithms.

---

## 5. Product search endpoint (app proxy)

**Request**

```json
{ "keyword": "대파", "limit": 3 }
```

**Response**

```json
{ "products": [ /* ShoppingProduct[] */ ] }
```

Validation: keyword required, trimmed, max 100 chars; limit capped at 10 (proxy) and `maxProductsPerIngredient` (3) on client.

---

## 6. Affiliate / deep link

- Partners search API returns `productUrl` as affiliate tracking link.
- Mapped to `ShoppingProduct.affiliateUrl` when URL is `link.coupang.com` / `coupa.ng`.
- `resolveOutboundProductUrl` prefers `affiliateUrl` (existing Sprint 63-D policy).
- No client-side URL signing.

---

## 7. ShoppingProduct mapping

`server/shopping/mapCoupangProducts.ts` — only fields present in API response. Missing price/image → `null`. No synthetic catalog data.

---

## 8. Disclosure

Official Coupang Partners phrasing exported as:

`COUPANG_PARTNERS_OFFICIAL_DISCLOSURE` in `constants/shoppingConfig.ts`:

> 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.

**Production config:** `affiliateDisclosureText` remains `null` until `affiliateEnabled` is turned on (ShoppingScreen already renders disclosure when set).

---

## 9. Live keyword test

| Keyword | Result |
|---------|--------|
| 대파 | **SKIPPED** — credentials not in local `.env` |
| 양파 | **SKIPPED** |
| 계란 | **SKIPPED** |
| 돼지고기 | **SKIPPED** |
| 고추장 | **SKIPPED** |

Unit tests + mock proxy tests **PASS**. Live section runs automatically when `COUPANG_PARTNERS_ACCESS_KEY` + `COUPANG_PARTNERS_SECRET_KEY` are set in `apps/todays-menu/.env`.

---

## 10. End-to-end recipe test

**Manual (after enable):**

1. `npm run shopping-proxy` (with credentials in `.env`)
2. Set `EXPO_PUBLIC_SHOPPING_API_BASE_URL=http://127.0.0.1:4730`
3. Enable config flags (see §17)
4. Home → 제육볶음 → Ingredients → 장보기 → select ingredients → product cards → Coupang link

**Automated:** mock proxy E2E in `test:coupang-product-adapter` **PASS**.

---

## 11. Fridge live test

`FRIDGE_SHOPPING_CONFIG.enabled` remains `false`. Enable only after Shopping E2E passes manually.

---

## 12. Security audit

| Check | Status |
|-------|--------|
| Secret Key not in mobile bundle | ✅ PASS |
| Secret Key not in tracked client files | ✅ PASS |
| No credential logging | ✅ PASS |
| Proxy does not accept arbitrary upstream URLs | ✅ PASS |
| keyword / limit validation | ✅ PASS |
| Per-ingredient error isolation (existing `searchProductsForRequests`) | ✅ PASS |

---

## 13. New tests

| Script | Result |
|--------|--------|
| `test:coupang-server-client` | PASS (live skipped) |
| `test:coupang-product-adapter` | PASS |
| `test:coupang-shopping-integration` | PASS |

---

## 14. Regression results

| Script | Result |
|--------|--------|
| `test:shopping-product-adapter` | PASS |
| `test:affiliate-link-foundation` | PASS |
| `test:fridge-shopping-bridge` | PASS |
| `test:shopping-keyword` | PASS |
| `test:recipe-shopping-list` | PASS |
| `test:shopping-screen` | PASS |
| `test:shopping-selection` | PASS |
| `smoke:rc` | PASS (15/15) |

---

## 15. Modified / new files

**Server**

- `server/shopping/coupangPartnersClient.ts`
- `server/shopping/coupangHmac.ts`
- `server/shopping/coupangPartnersTypes.ts`
- `server/shopping/mapCoupangProducts.ts`
- `server/shopping/validateSearchInput.ts`
- `server/shopping/loadShoppingProxyEnv.ts`
- `scripts/shopping-proxy/server.ts`

**Client**

- `services/shopping/productAdapter/coupangProductAdapter.ts` (implemented)
- `services/shopping/productAdapter/getShoppingProductAdapter.ts`
- `services/shopping/shoppingApiConfig.ts`
- `services/shopping/shoppingProxyClient.ts`
- `constants/shoppingConfig.ts` (disclosure constant + provider type)

**Tests / config**

- `scripts/test-coupang-server-client.ts`
- `scripts/test-coupang-product-adapter.ts`
- `scripts/test-coupang-shopping-integration.ts`
- `.env.example`
- `package.json` scripts

---

## 16. Remaining blockers

1. Add Coupang credentials to **local** `apps/todays-menu/.env` (do not commit).
2. Run `npm run test:coupang-server-client` — confirm live keyword rows.
3. Deploy proxy to production host (Vercel/FastAPI) with server env vars.
4. Set `EXPO_PUBLIC_SHOPPING_API_BASE_URL` to deployed proxy URL.
5. Enable flags in order:
   - `productProviderEnabled: true`, `provider: 'coupang'`, `purchaseCtaEnabled: true`
   - `affiliateEnabled: true`, `affiliateDisclosureText: COUPANG_PARTNERS_OFFICIAL_DISCLOSURE`
   - `FRIDGE_SHOPPING_CONFIG.enabled: true`

---

## 17. Production enable state (current)

| Flag | Value |
|------|--------|
| `productProviderEnabled` | `false` |
| `affiliateEnabled` | `false` |
| `purchaseCtaEnabled` | `false` |
| `affiliateDisclosureText` | `null` |
| `FRIDGE_SHOPPING_CONFIG.enabled` | `false` |

---

## Final judgment

**PARTIAL** — Architecture, proxy, adapter, mapping, security, and regressions complete. **LIVE_READY** after live keyword test passes with server credentials and production proxy URL is configured.
