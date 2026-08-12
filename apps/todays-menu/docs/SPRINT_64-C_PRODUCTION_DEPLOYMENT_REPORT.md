# SPRINT 64-C — PRODUCTION DEPLOYMENT REPORT

**Date:** 2026-08-11  
**Verdict:** **USER_ACTION_REQUIRED**  
**Production lock:** **NOT LOCKED** (deployment and live verification pending)

---

## 1. Pre-deploy result

| Check | Status |
|-------|--------|
| `api/health.ts` | PASS |
| `api/shopping/coupang/search.ts` | PASS (import paths fixed for Vercel) |
| `vercel.json` (`maxDuration: 15`) | PASS |
| Serverless shared imports (`server/shopping/http/*`) | PASS |
| Build deps (`@upstash/ratelimit`, `@upstash/redis` added) | PASS |
| `.env` gitignore | PASS |
| Secret hardcode in client / api routes | PASS (security QA) |
| Local proxy regression | PASS |

**Fix applied in 64-C:** `api/shopping/coupang/search.ts` imports corrected from `../server/...` to `../../../server/...` (would have failed at runtime on Vercel).

---

## 2. Vercel project

| Item | Value |
|------|--------|
| Target project name | `hankki-shopping-proxy` |
| Repository | `ai-one-company` (monorepo) |
| **Root Directory** | **`apps/todays-menu`** |
| Framework | Other (serverless `api/` routes) |
| Deploy executed | **No** — Vercel CLI login required |

---

## 3. Root directory

Confirmed from repo layout: all proxy assets live under `apps/todays-menu`:

- `api/health.ts`
- `api/shopping/coupang/search.ts`
- `server/shopping/*`
- `vercel.json`

Do **not** use monorepo root as Vercel root.

---

## 4. Production URL

| Status |
|--------|
| **NOT DEPLOYED** — no live HTTPS base URL yet |

After deploy, use the **actual** Vercel assignment URL (e.g. `https://hankki-shopping-proxy.vercel.app` or custom domain). Do not guess; copy from Vercel Deployment details.

---

## 5. Server env status (SET / NOT SET only)

### Local dev (this machine)

| Variable | Status |
|----------|--------|
| `COUPANG_PARTNERS_ACCESS_KEY` | SET |
| `COUPANG_PARTNERS_SECRET_KEY` | SET |
| `UPSTASH_REDIS_REST_URL` | NOT SET |
| `UPSTASH_REDIS_REST_TOKEN` | NOT SET |
| `SHOPPING_PROXY_ALLOWED_ORIGINS` | NOT SET |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | SET |
| `SHOPPING_PROXY_PRODUCTION_BASE_URL` | NOT SET |

### Vercel Production (expected — user must configure)

| Variable | Status |
|----------|--------|
| `COUPANG_PARTNERS_ACCESS_KEY` | **NOT SET** (until Dashboard entry) |
| `COUPANG_PARTNERS_SECRET_KEY` | **NOT SET** (until Dashboard entry) |
| `UPSTASH_REDIS_REST_URL` | **NOT SET** (until Upstash linked) |
| `UPSTASH_REDIS_REST_TOKEN` | **NOT SET** (until Upstash linked) |
| `SHOPPING_PROXY_ALLOWED_ORIGINS` | Optional |

---

## 6. Production health

| Test | Status |
|------|--------|
| `GET /api/health` → 200, `ok: true`, `coupangConfigured: true` | **SKIPPED** (no production URL) |

Health response now includes (no credentials):

```json
{
  "ok": true,
  "coupangConfigured": boolean,
  "rateLimitMode": "upstash" | "in-memory" | "none" | "disabled",
  "rateLimitActive": boolean,
  "cacheMode": "in-memory" | "none"
}
```

---

## 7. Production Coupang search

| Keyword | Status |
|---------|--------|
| 대파 | **SKIPPED** |
| 계란 | **SKIPPED** |
| 고추장 | **SKIPPED** |

Run after deploy:

```bash
# Set base URL only — never commit this value with secrets
export SHOPPING_PROXY_PRODUCTION_BASE_URL=https://<your-actual-vercel-domain>
npm run test:shopping-proxy-production
```

---

## 8. Security guards

| Guard | Local QA | Production live |
|-------|----------|-----------------|
| GET search → 405 | PASS | SKIPPED |
| Empty keyword → 400 | PASS | SKIPPED |
| Oversized body → 413 | PASS | SKIPPED |
| Excessive limit → clamp to 5 | PASS | SKIPPED |
| Malformed JSON → 400 | PASS | SKIPPED |
| No stack / secrets in JSON | PASS | SKIPPED |
| No arbitrary upstream URL | PASS | SKIPPED |

---

## 9. Rate limit status

### Decision (64-C)

**Primary (recommended): Upstash Redis via Vercel Marketplace**

- Code: `UpstashShoppingRateLimiter` in `server/shopping/http/rateLimitUpstash.ts`
- Activates when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are SET
- Policy: **30 requests / 60 seconds** per client IP (sliding window)
- Health: `rateLimitMode: "upstash"`, `rateLimitActive: true`

**Alternative: Vercel Firewall / WAF (Dashboard — no code)**

1. Vercel project → **Firewall** (or Security)
2. Add rate limit rule for path `POST /api/shopping/coupang/search`
3. Limit: ~30 requests per minute per IP
4. If using Firewall only without Upstash, health will show `rateLimitMode: "none"` until Upstash is linked — verify abuse protection via Firewall logs

**Weak fallback (not recommended for production):**

- `SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY=true` on Vercel — per-instance only, not global

| Environment | Rate limit | Status |
|-------------|------------|--------|
| Local `npm run shopping-proxy` | In-memory 30/min | ACTIVE |
| Vercel (default, no Upstash) | NoOp | **NOT ACTIVE** |
| Vercel + Upstash env | Upstash distributed | ACTIVE (after user setup) |

---

## 10. Cache status

| Environment | Mode | Notes |
|-------------|------|-------|
| Local dev | in-memory (12 min TTL) | Default |
| Vercel production | **none** (NoOp) | Intentional — no new KV service for cache-only |
| Optional | `SHOPPING_PROXY_CACHE_ENABLED=true` | In-memory on serverless (weak); not recommended |

---

## 11. EAS preview env

| Item | Status |
|------|--------|
| EAS account | Logged in (`mymy1004`) |
| `eas.json` profiles | `development`, `preview`, `production` (no inline `env` block) |
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` for **preview** | **NOT CONFIGURED** in EAS (likely still localhost in local `.env`) |

**After proxy deploy:** Expo dashboard → Project → **Environment variables** → profile **preview** → set:

`EXPO_PUBLIC_SHOPPING_API_BASE_URL` = `https://<actual-production-proxy-domain>` (public HTTPS only)

---

## 12. EAS production env

| Item | Status |
|------|--------|
| `EXPO_PUBLIC_SHOPPING_API_BASE_URL` for **production** | **NOT CONFIGURED** |

Same public HTTPS proxy URL as preview unless you intentionally split environments later.

---

## 13. Local dev status

| Item | Value |
|------|--------|
| Local proxy | `npm run shopping-proxy` → `http://127.0.0.1:4730` |
| Local `.env` | `EXPO_PUBLIC_SHOPPING_API_BASE_URL=http://127.0.0.1:4730` |
| Production/preview builds | Must use deployed HTTPS URL via EAS env |

Local regression: **PASS**

---

## 14. Mobile Shopping E2E

| Flow | Status |
|------|--------|
| Home → menu → ingredients → 장보기 → Coupang products → outbound | **USER DEVICE REQUIRED** |

Cannot complete on physical iPhone/Android until EAS env points to HTTPS proxy and a preview/production build is installed.

---

## 15. Fridge E2E

| Flow | Status |
|------|--------|
| Fridge raid → missing-only shopping → products → outbound | **USER DEVICE REQUIRED** |

Bridge wiring QA: **PASS** (automated).

---

## 16. Failure handling

| Scenario | Automated | Device |
|----------|-----------|--------|
| Proxy unreachable — no crash, controlled UI | Code paths exist | USER VERIFY |
| Shopping failure does not block Home/recipe | Regression PASS | USER VERIFY |

---

## 17. Regression tests

| Script | Result |
|--------|--------|
| `test:shopping-proxy-http` | PASS |
| `test:shopping-proxy-security` | PASS |
| `test:shopping-proxy-rate-limit` | PASS |
| `test:coupang-server-client` | PASS |
| `test:coupang-product-adapter` | PASS |
| `test:coupang-shopping-integration` | PASS |
| `test:shopping-product-adapter` | PASS |
| `test:affiliate-link-foundation` | PASS |
| `test:fridge-shopping-bridge` | PASS |
| `test:shopping-keyword` | PASS |
| `test:recipe-shopping-list` | PASS |
| `test:shopping-screen` | PASS |
| `test:shopping-selection` | PASS |
| `test:fridge-raid` | PASS |
| `test:home-final-qa` | PASS |
| `test:personalization-production-qa` | PASS |
| `smoke:rc` | PASS (15/15) |
| `test:shopping-proxy-production` | SKIPPED (no `SHOPPING_PROXY_PRODUCTION_BASE_URL`) |

---

## 18. Remaining user actions

### Step 1 — Vercel login & project

```powershell
cd "d:\000.AI ONE Project\ai-one-company\apps\todays-menu"
npx vercel login
npx vercel link
```

When linking: project name `hankki-shopping-proxy`, root `apps/todays-menu`.

### Step 2 — Upstash Redis (rate limit)

1. Vercel project → **Storage** → **Marketplace** → **Upstash Redis**
2. Create database and **Connect to Project**
3. Confirm env vars appear (names only): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Step 3 — Coupang secrets (Vercel Dashboard only)

Project → **Settings** → **Environment Variables** → **Production**:

| Name | You enter value in Dashboard |
|------|------------------------------|
| `COUPANG_PARTNERS_ACCESS_KEY` | Coupang Partners portal |
| `COUPANG_PARTNERS_SECRET_KEY` | Coupang Partners portal |

Optional: `COUPANG_PARTNERS_SUB_ID`, `SHOPPING_PROXY_ALLOWED_ORIGINS`

**Do not paste keys into chat, git, or CLI arguments.**

### Step 4 — Deploy production

```powershell
npx vercel --prod
```

Copy the **actual** deployment URL from the CLI output.

### Step 5 — Verify production

```powershell
$env:SHOPPING_PROXY_PRODUCTION_BASE_URL="https://<actual-domain>"
npm run test:shopping-proxy-production
```

Confirm health shows `coupangConfigured: true` and `rateLimitActive: true` (with Upstash).

### Step 6 — EAS environment variables

Expo dashboard → HANKKI project → Environment variables:

| Profile | Variable | Value |
|---------|----------|-------|
| preview | `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | `https://<actual-proxy-domain>` |
| production | `EXPO_PUBLIC_SHOPPING_API_BASE_URL` | same (unless split later) |

Rebuild preview APK/IPA:

```powershell
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Step 7 — Device smoke (iPhone / Android)

1. Install preview build
2. Home → 메뉴 → 이 메뉴로 할게요 → Ingredients → 필요한 재료 장보기
3. Confirm Coupang products load and outbound link opens
4. Fridge raid → missing-only shopping → same checks
5. Temporarily block proxy (airplane mode / firewall) → confirm graceful error, Home still works

---

## 19. Production Lock status

| Lock condition | Status |
|----------------|--------|
| HTTPS production proxy ACTIVE | BLOCKED |
| Coupang server credentials on Vercel | BLOCKED |
| Production search PASS | BLOCKED |
| No credentials in client | PASS (code QA) |
| Rate limit ACTIVE on production | BLOCKED (needs Upstash or Firewall) |
| Request security guards PASS | PASS (local QA) |
| EAS public proxy URL configured | BLOCKED |
| Mobile Shopping E2E PASS | BLOCKED |
| Regression PASS | PASS |

---

## Final verdict

**USER_ACTION_REQUIRED**

Deployment blocked at **Vercel authentication** (CLI prompted device login; no credentials on this machine).

After you complete Steps 1–7 above, re-run:

```powershell
npm run test:shopping-proxy-production
```

When all lock conditions are green:

**SPRINT 64 SHOPPING PROXY V1 PRODUCTION LOCKED**

---

## 64-C code changes (this sprint)

| Change | Purpose |
|--------|---------|
| `rateLimitUpstash.ts` + `rateLimit.ts` async Upstash adapter | Production-safe distributed rate limit |
| `handleHealthRequest.ts` | `rateLimitMode`, `rateLimitActive`, `cacheMode` |
| `handleCoupangSearchRequest.ts` | Await async rate limiter |
| `api/shopping/coupang/search.ts` | Fix server import paths |
| `scripts/test-shopping-proxy-production.ts` | Live HTTPS smoke (no URL/credential leak) |
| `scripts/check-shopping-env.ts` | Extended SET/NOT SET checks |
| `@upstash/ratelimit`, `@upstash/redis` | Dependencies |
