# SPRINT 64-A — SHOPPING PROXY PRODUCTION DEPLOYMENT AUDIT

**Date:** 2026-08-11  
**Verdict:** **PREP_REQUIRED**  
**Deployment performed:** No (audit only)

---

## 1. Current proxy architecture

```
HANKKI App (Expo)
  → EXPO_PUBLIC_SHOPPING_API_BASE_URL
  → POST /api/shopping/coupang/search
  → scripts/shopping-proxy/server.ts (Node http.Server)
  → server/shopping/coupangPartnersClient.ts
  → Coupang Partners API (HMAC GET)
```

| Component | Path | Role |
|-----------|------|------|
| HTTP entry | `scripts/shopping-proxy/server.ts` | `node:http` server, routes 2 endpoints |
| Coupang client | `server/shopping/coupangPartnersClient.ts` | HMAC auth, fetch, map to `ShoppingProduct` |
| Env loader | `server/shopping/loadShoppingProxyEnv.ts` | Reads `process.env` + optional `.env` file |
| Validation | `server/shopping/validateSearchInput.ts` | keyword / limit guards |
| Client config | `services/shopping/shoppingApiConfig.ts` | `EXPO_PUBLIC_SHOPPING_API_BASE_URL` only |

**Endpoints**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | `{ ok, coupangConfigured }` |
| `POST` | `/api/shopping/coupang/search` | `{ keyword, limit }` → `{ products }` |

---

## 2. Runtime requirements

| Item | Current state |
|------|----------------|
| Runtime | **Node.js** (runs via `npx tsx`) |
| HTTP framework | **None** — native `node:http` |
| Port | `HANKKI_SHOPPING_PROXY_PORT` (default **4730**), binds all interfaces (`:::4730`) |
| Env loading | `process.env` + **filesystem** `.env` at `apps/todays-menu/.env` when `APP_ROOT` passed |
| Long-running | **Yes** — `server.listen()` persistent process |
| Filesystem | **Yes** — `.env` read via `fs.readFileSync` (dev-friendly, not ideal for serverless) |
| External I/O | Outbound HTTPS to `api-gateway.coupang.com` only |
| Timeout | Coupang fetch **12s** (`COUPANG_PARTNERS_TIMEOUT_MS`) |
| Serverless fit | **Poor as-is** — long-running `http.Server` + optional `.env` file dependency |

**Local dev command (keep):** `npm run shopping-proxy`

---

## 3. Existing deployment environment

| Asset | Status | Notes |
|-------|--------|-------|
| **Vercel** | **In use** | `legal/` static site → `hankki-legal.vercel.app` (privacy/terms) |
| **EAS / Expo** | **In use** | `eas.json` — development / preview / production profiles |
| **FastAPI backend** | **Planned only** | `docs/engineering/10_Backend.md`, `api.todays-menu.ai` in specs — **not implemented** |
| Supabase / Firebase / Cloudflare Workers | **Not found** |
| Railway / Render / Fly.io | **Not found** |
| Expo Router API routes | **Not used** for backend |
| Docker / AWS | **Not found** |

**Conclusion:** The only live hosting pattern in-repo today is **Vercel (static legal)** + **EAS (mobile)**. No production API server exists yet.

---

## 4. Deployment candidates (max 3)

### Option A — Vercel Serverless (new small project)

Thin serverless handler wrapping existing `server/shopping/*` (no `http.Server`).

| Criterion | Assessment |
|-----------|------------|
| Implementation effort | **Medium** — refactor entry to `api/shopping/coupang/search.ts` handler; reuse client/mapper |
| Cost | **Low** — hobby/pro tier likely sufficient at HANKKI scale |
| Secret env | **Yes** — Vercel project env (not `EXPO_PUBLIC_*`) |
| HTTPS | **Automatic** |
| Serverless | **Native** |
| Cold start | ~100–500ms; acceptable for ingredient search |
| Maintenance | **Low** — same provider as legal site |
| Coupang API fit | **Good** — single GET per request, <12s timeout within serverless limits |
| HANKKI scale | **Strong fit** for MVP |

### Option B — Railway / Render (minimal Node service)

Deploy current long-running server with minor prod tweaks (`PORT` from platform, env-only secrets).

| Criterion | Assessment |
|-----------|------------|
| Implementation effort | **Low** — closest to current `server.ts` |
| Cost | **Low–medium** (~$5–7/mo always-on) |
| Secret env | **Yes** |
| HTTPS | **Automatic** |
| Serverless | **No** — always-on container |
| Cold start | **None** |
| Maintenance | **Medium** — separate service to monitor |
| Coupang API fit | **Good** |
| HANKKI scale | **Good**; slightly more ops than serverless |

### Option C — Cloudflare Workers

| Criterion | Assessment |
|-----------|------------|
| Implementation effort | **Medium–high** — HMAC must use Web Crypto; path/query signing must match spec exactly |
| Cost | **Very low** |
| Secret env | **Yes** |
| HTTPS | **Automatic** |
| Serverless | **Yes** |
| Cold start | **Minimal** |
| Maintenance | **Low** once ported |
| Coupang API fit | **Good** after port |
| HANKKI scale | **Good**; new provider vs existing Vercel habit |

**Not recommended now:** Full FastAPI stack (`docs/engineering/10_Backend.md`) — over-engineered for a single Coupang proxy MVP.

---

## 5. Candidate comparison summary

| | Vercel Serverless | Railway/Render | Cloudflare Workers |
|--|-----------------|----------------|-------------------|
| Effort | Medium | Low | Medium–High |
| Cost | Low | Low–Med | Very low |
| Reuse existing host | **Yes (Vercel)** | New | New |
| Code reuse | High (`server/shopping/*`) | **Highest** (`server.ts`) | Medium (rewrite auth) |
| Abuse protection | Add in handler or Vercel firewall | Add in server | Workers rate limit API |
| Ops burden | Lowest | Medium | Low |

---

## 6. Recommended option (1st choice)

### **Vercel Serverless — dedicated `hankki-shopping-proxy` project**

**Why**

1. **Already using Vercel** for `hankki-legal` — same account, billing, and deploy workflow.
2. Shopping proxy is **stateless request/response** — no need for a long-running Node process.
3. **HTTPS + secret env** are standard on Vercel; no VPS management.
4. `server/shopping/coupangPartnersClient.ts` and validators can be **imported unchanged**; only the HTTP entry layer changes.
5. Aligns with future `api.todays-menu.ai` direction without building FastAPI first.
6. **No new infra vendor** for a one-endpoint MVP.

**Suggested URL pattern**

`https://hankki-shopping.vercel.app` or custom subdomain e.g. `https://shopping-api.hankki.app`

**Fallback (2nd choice):** Railway/Render if team prefers zero serverless refactor and wants to ship in hours with current `server.ts`.

---

## 7. Secret management

| Variable | Storage |
|----------|---------|
| `COUPANG_PARTNERS_ACCESS_KEY` | Vercel/Railway **server env only** |
| `COUPANG_PARTNERS_SECRET_KEY` | Vercel/Railway **server env only** |
| `COUPANG_PARTNERS_SUB_ID` | Optional server env |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | EAS / Expo env — **public URL only, no secrets** |

**Forbidden:** `EXPO_PUBLIC_*` for keys, git commit, client bundle, API responses, logs.

**Prod change:** `loadShoppingProxyEnv()` should rely on **platform env only** in production (skip `.env` file read when `NODE_ENV=production` or when keys already in `process.env`).

---

## 8. Client environment config

| Environment | `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | How |
|-------------|-------------------------------------|-----|
| **Development** | `http://127.0.0.1:4730` | Local `.env` + `npm run shopping-proxy` |
| **Preview / internal EAS** | `https://<staging-proxy-domain>` | EAS `preview` profile env in Expo dashboard or `eas.json` `env` |
| **Production** | `https://<production-proxy-domain>` | EAS `production` profile env |

**Recommended approach**

- Keep `shoppingApiConfig.ts` as-is (reads `EXPO_PUBLIC_SHOPPING_API_BASE_URL`).
- Use **EAS environment variables** per build profile (`development`, `preview`, `production`).
- Optional later: `app.config.ts` to inject env at build time for clearer separation.

**Physical device local dev:** Use machine LAN IP (e.g. `http://192.168.x.x:4730`) only on trusted dev networks — not for production.

---

## 9. Endpoint security risks (public internet)

| Control | Current | Risk |
|---------|---------|------|
| Keyword validation | ✅ max 100 chars, trim, no control chars | Low |
| Limit validation | ✅ clamped 1–10 | Low |
| HTTP method | Partial — only 2 routes; others 404 | Low |
| Body size limit | ❌ **None** — `readBody` accumulates all chunks | Medium (DoS memory) |
| Arbitrary URL forward | ✅ **No** — only Coupang search | Low |
| Credential in response | ✅ None | Low |
| Error detail | ⚠️ Coupang `rMessage` may leak upstream hints | Low–medium |
| CORS | ❌ **Not set** | Low for native app; **needed if Expo Web** |
| Timeout | ✅ 12s upstream | OK |
| Rate limiting | ❌ **None** | **High** |
| Authentication on proxy | ❌ **None** — URL is the only gate | **High** |

**Abuse scenario:** Anyone who discovers the public URL can hammer `POST /search` → Coupang API calls on **your Partners credentials** → quota exhaustion, possible account flags, indirect cost/abuse.

**Verdict:** Safe enough for **localhost**; **not safe for public production without rate limits** (and optionally a lightweight shared secret header or app attestation later).

---

## 10. Rate limit recommendation (MVP)

No account system required. Suggested **Sprint 64-B** minimum:

| Layer | Recommendation |
|-------|----------------|
| Per-IP | **30 requests / minute** (sliding window) |
| Per-keyword burst | Align with app: max **3 products × N ingredients**; cap **10 searches / minute / IP** |
| Global | Optional **100 req/min** ceiling on proxy |
| Body size | Reject JSON body **> 1 KB** |
| Concurrency | Keep app-side `maxConcurrentSearches: 2`; server can reject if needed |
| Timeout | Keep 12s upstream; **8s** serverless function timeout on Vercel |

**Implementation options**

- Vercel: in-handler counter + **Vercel KV** / Upstash Redis (serverless-safe)
- Railway: in-memory map per instance (weaker) or Redis sidecar
- Edge: Cloudflare rate limiting in front of any host

---

## 11. Cache recommendation (design only)

| Item | Recommendation |
|------|----------------|
| Need? | **Yes, optional** — same keyword repeated in one shopping session |
| Key | `keyword` + `limit` (normalized trim) |
| TTL | **10–15 minutes** (not 30+ for price freshness) |
| Store | Vercel KV / Redis if serverless; in-memory only for single-instance Railway |
| Invalidate | TTL only for MVP |
| Client | Do **not** cache in app bundle logic beyond existing hook behavior |

Skip cache in first production deploy if rate limits are priority; add in 64-B or 64-C.

---

## 12. Health endpoint

**Keep:** `GET /api/health`

```json
{ "ok": true, "coupangConfigured": true }
```

| Rule | |
|------|--|
| Expose | `ok`, `coupangConfigured` boolean only |
| Never expose | Keys, signatures, Coupang error bodies, upstream URLs |

Use for uptime checks and post-deploy smoke (no credentials in response).

---

## 13. Mobile E2E plan (post-deploy)

### Shopping flow (iPhone / Android, **production** `EXPO_PUBLIC_SHOPPING_API_BASE_URL`)

1. Install EAS **preview** or **production** build with prod proxy URL baked in.
2. Home → pick meal → **이 메뉴로 할게요**
3. Ingredients → **필요한 재료 장보기**
4. Shopping screen → verify **real product images, titles, prices**
5. Tap product → **Coupang opens** (`link.coupang.com`)
6. Verify disclosure text visible before outbound navigation.

### Fridge flow

1. 냉장고 털기 → select pantry items → recommendation
2. **부족한 재료 장보기** → missing-only shopping
3. Same product / affiliate checks.

### Automated pre-checks (before device test)

- `GET https://<prod>/api/health` → `coupangConfigured: true`
- `POST` smoke with `대파` → products > 0
- `npm run test:coupang-server-client` against prod URL (env override, no key logging)

---

## 14. Work required before actual deploy

| # | Task | Sprint |
|---|------|--------|
| 1 | Create **Vercel serverless project** (or Railway service) — **no credential input in chat** | 64-B |
| 2 | Production HTTP handler (not `server.listen`) reusing `server/shopping/*` | 64-B |
| 3 | Platform env: Coupang keys only on server | 64-B |
| 4 | **Rate limit** + body size cap | 64-B |
| 5 | CORS policy (allow app origins / native no-CORS) | 64-B |
| 6 | EAS env: `EXPO_PUBLIC_SHOPPING_API_BASE_URL` for preview + production | 64-B |
| 7 | Optional: short TTL cache | 64-C |
| 8 | Mobile E2E on real devices | 64-B |
| 9 | Custom domain + monitoring | 64-C |

---

## 15. Modified files (this sprint)

**None.** Audit-only — no shopping, Home, recommendation, or Coupang client logic changed.

---

## 16. Sprint 64-B readiness

| Gate | Status |
|------|--------|
| Live Coupang API | ✅ Done (Sprint 63-E) |
| Local proxy | ✅ Works |
| Production entry adapter | ⏳ Needed (serverless handler or PaaS deploy) |
| Public abuse protection | ⏳ Needed |
| EAS production URL | ⏳ Needed |
| Mobile device E2E on prod URL | ⏳ Needed |

**64-B scope suggestion:** Vercel deploy + rate limit + EAS env + device smoke.

---

## Final judgment

### **PREP_REQUIRED**

Infrastructure and Coupang integration are **production-ready at the logic layer**. Public deployment is blocked on:

1. HTTPS production host (not `127.0.0.1`)
2. Serverless/PaaS packaging of the proxy
3. Rate limiting and basic hardening
4. EAS environment separation for `EXPO_PUBLIC_SHOPPING_API_BASE_URL`

Not **BLOCKED** — path is clear; no architectural rework required.

---

## Quick reference

| Dev | Production |
|-----|------------|
| `npm run shopping-proxy` | Vercel serverless (recommended) |
| `http://127.0.0.1:4730` | `https://<production-proxy-domain>` |
| `.env` local secrets | Vercel project secrets |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` in `.env` | Same var in EAS build env |
