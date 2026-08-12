# SPRINT 64-B — VERCEL SHOPPING PROXY PREPARATION REPORT

**Date:** 2026-08-11  
**Verdict:** **READY_TO_DEPLOY**  
**Vercel deploy executed:** No (code prep only)

---

## 1. Serverless architecture

```
Shared layer (server/shopping/http/)
  dispatchShoppingProxyRequest
    ├── handleHealthRequest
    └── handleCoupangSearchRequest
          → rate limit → cache → coupangPartnersClient

Local entry:     scripts/shopping-proxy/server.ts  (server.listen)
Vercel entry:    api/health.ts
                 api/shopping/coupang/search.ts
```

Business logic is **not duplicated** — both entries call `dispatchShoppingProxyRequest`.

---

## 2. Local / serverless shared logic

| Module | Role |
|--------|------|
| `dispatchShoppingProxyRequest.ts` | Routing, method guard, CORS, error wrapper |
| `handleHealthRequest.ts` | Health JSON |
| `handleCoupangSearchRequest.ts` | Search + validation + cache + Coupang client |
| `context.ts` | Wires env, rate limit, cache, client factory |
| `coupangPartnersClient.ts` | Unchanged Coupang HMAC + mapping |

---

## 3. Health endpoint

`GET /api/health` → `{ ok: true, coupangConfigured: boolean }`  
No credentials, signatures, or upstream tokens.

---

## 4. Search endpoint

`POST /api/shopping/coupang/search`  
Body: `{ keyword, limit? }` → `{ products: ShoppingProduct[] }`  
Existing Coupang mapping reused.

---

## 5. Validation

| Field | Rule |
|-------|------|
| keyword | string, trim, non-empty, max 100 chars |
| limit | integer, min 1, **max 5** at proxy (`SHOPPING_PROXY_SEARCH_LIMIT_MAX`) |

---

## 6. Body size guard

- Max **1024 bytes** (`SHOPPING_PROXY_MAX_BODY_BYTES`)
- Enforced in local server `readBoundedBody`, Vercel handler, and `handleCoupangSearchRequest`
- Oversize → **413** `SHOPPING_PAYLOAD_TOO_LARGE`

---

## 7. Rate limit

- `ShoppingRateLimiter` interface
- `InMemoryShoppingRateLimiter` — local dev / tests (**30 req/min default**)
- `NoOpShoppingRateLimiter` — default on Vercel until KV/Upstash adapter
- Override: `SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY=true` for in-memory on Vercel (documented as unreliable)
- Exceeded → **429** `SHOPPING_RATE_LIMITED`

**Note:** In-memory limits are **per instance** on serverless — not production-safe without external store (Sprint 64-C).

---

## 8. Cache foundation

- `ShoppingCache` interface
- `InMemoryShoppingCache` — dev default (TTL **12 min**)
- `NoOpShoppingCache` — production default
- Enable local cache: `SHOPPING_PROXY_CACHE_ENABLED=true`
- Key: normalized `keyword + limit`

No Redis/KV installed in this sprint.

---

## 9. CORS

- `SHOPPING_PROXY_ALLOWED_ORIGINS` (comma-separated)
- Dev default: localhost Expo web ports when unset and `NODE_ENV !== production`
- Production: empty list = no CORS headers unless origins configured
- Native app fetch unaffected

---

## 10. Error normalization

Generic codes only — no stack traces:

| Status | Code |
|--------|------|
| 400 | `SHOPPING_INVALID_REQUEST` |
| 405 | `SHOPPING_METHOD_NOT_ALLOWED` |
| 413 | `SHOPPING_PAYLOAD_TOO_LARGE` |
| 429 | `SHOPPING_RATE_LIMITED` |
| 502 | `SHOPPING_PROVIDER_ERROR` |
| 503 | `SHOPPING_PROVIDER_UNAVAILABLE` |
| 504 | `SHOPPING_PROVIDER_TIMEOUT` |
| 500 | `SHOPPING_INTERNAL_ERROR` |

---

## 11. Env handling

| Env | Scope |
|-----|--------|
| `COUPANG_PARTNERS_ACCESS_KEY` | Server only |
| `COUPANG_PARTNERS_SECRET_KEY` | Server only |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | Client-safe |
| `SHOPPING_PROXY_ALLOWED_ORIGINS` | Server |
| `SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY` | Server optional |
| `SHOPPING_PROXY_CACHE_ENABLED` | Server optional |

Production serverless: **no `.env` filesystem read** when `NODE_ENV=production`.

---

## 12. EAS env plan

| Profile | `EXPO_PUBLIC_SHOPPING_API_BASE_URL` |
|---------|-------------------------------------|
| development | `http://127.0.0.1:4730` (+ LAN for physical device) |
| preview | `https://<preview-proxy-domain>` (placeholder) |
| production | `https://<production-proxy-domain>` (placeholder) |

Set via **Expo dashboard / EAS environment** per build profile. No fabricated URLs in repo.

---

## 13. Vercel project prep

| File | Purpose |
|------|---------|
| `vercel.json` | `maxDuration: 15` for `api/**/*.ts` |
| `api/health.ts` | Serverless health entry |
| `api/shopping/coupang/search.ts` | Serverless search entry |

**Not executed:** `vercel deploy`, credential input, project ID hardcode.

---

## 14. Security audit

| Check | Result |
|-------|--------|
| Secret in client bundle paths | ✅ PASS |
| Secret in `EXPO_PUBLIC_*` | ✅ PASS |
| Secret in git tracked files | ✅ PASS (names only in `.env.example`) |
| Authorization logging | ✅ PASS |
| Arbitrary upstream URL | ✅ PASS |
| POST body limit | ✅ PASS |
| Keyword / limit validation | ✅ PASS |
| Method guard | ✅ PASS |
| Stack leak on error | ✅ PASS |

---

## 15. New tests

| Script | Result |
|--------|--------|
| `test:shopping-proxy-http` | PASS |
| `test:shopping-proxy-security` | PASS |
| `test:shopping-proxy-rate-limit` | PASS |

Covers: health 200, mock search 200, 405, 413, 400 keyword, limit clamp, 429, 500 no stack, no secrets in response.

---

## 16. Regression results

All requested regressions **PASS** including `smoke:rc` 15/15.

---

## 17. Modified files

**New**

- `server/shopping/http/*` (constants, types, errors, cors, body, rateLimit, cache, context, handlers, dispatch, nodeAdapter)
- `api/health.ts`, `api/shopping/coupang/search.ts`
- `vercel.json`
- `scripts/test-shopping-proxy-*.ts`

**Updated**

- `scripts/shopping-proxy/server.ts` (uses shared dispatch)
- `server/shopping/loadShoppingProxyEnv.ts` (prod skips `.env` file)
- `.env.example`, `package.json`

**Not changed:** Home, recommendation, personalization, shopping UI, Coupang mapping semantics, disclosure wording.

---

## 18. Remaining deployment steps (Sprint 64-C)

1. Create Vercel project `hankki-shopping-proxy` (root: `apps/todays-menu`)
2. Set server env: Coupang keys (dashboard only)
3. `vercel deploy` → obtain HTTPS URL
4. Wire EAS `EXPO_PUBLIC_SHOPPING_API_BASE_URL` for preview/production
5. Add **Upstash/Vercel KV** rate limit adapter (recommended before public launch)
6. Real iPhone/Android smoke on production URL
7. Optional: custom domain

---

## 19. Sprint 64-C readiness

| Gate | Status |
|------|--------|
| Serverless entries | ✅ Ready |
| Local `npm run shopping-proxy` | ✅ Maintained |
| Hardening (validation, body, method, errors) | ✅ Done |
| Rate limit foundation | ✅ Done (KV adapter pending) |
| Cache foundation | ✅ Done |
| CORS policy | ✅ Done |
| Tests + regression | ✅ PASS |

---

## Final judgment

### **READY_TO_DEPLOY**

Code and hardening are complete. Next sprint is **deploy + EAS env + distributed rate limit + device smoke** — no shopping logic changes required.
