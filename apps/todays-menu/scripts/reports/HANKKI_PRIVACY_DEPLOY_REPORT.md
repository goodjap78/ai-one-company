# HANKKI_PRIVACY_DEPLOY_REPORT

Sprint: Privacy Deploy + Live Verification  
Date: 2026-08-30  
App version unchanged: **1.0.0**

---

## DEPLOY_PRECHECK

**PASS**

| Check | Result |
|---|---|
| Working directory | `apps/todays-menu/legal` |
| `privacy.html` | Present |
| `vercel.json` | Present (rewrites `/hankki/privacy` → `privacy.html`) |
| `.vercel/project.json` | Present — `projectName: hankki-legal` |
| Photo save-only (쓰기/추가) | In repo |
| No read/upload of existing photos | In repo |
| Google Mobile Ads SDK scope | In repo |
| Coupang Home + general shopping | In repo |
| Baby detail / batch / grocery excluded | In repo |
| Child name/age/month not collected | In repo |
| Date | `2026-08-29` in repo |

---

## DEPLOY_RESULT

**SUCCESS** (production)

| Attempt | Command | Result |
|---|---|---|
| 1 | `npx vercel deploy --prod --yes --name hankki-legal` | **FAIL** — `Not authorized` (`--name` deprecated; auth scope issue) |
| 2 | `npx vercel deploy --prod --yes --scope goodjap78` | **SUCCESS** |

| Field | Value |
|---|---|
| Deployment ID | `dpl_76iipTzSoBounEZ8L9nqGV2dNPLG` |
| Deployment URL | `https://hankki-legal-e8hxuotn2-goodjap78.vercel.app` |
| Production alias | `https://hankki-legal.vercel.app` |
| readyState | **READY** |
| target | **production** |
| New project created | **NO** — existing `goodjap78/hankki-legal` |

**Recommended deploy command going forward:**

```bash
cd apps/todays-menu/legal
npx vercel deploy --prod --yes --scope goodjap78
```

---

## VERCEL_PROJECT

**hankki-legal** (team: `goodjap78`)

---

## PRODUCTION_URL

**https://hankki-legal.vercel.app/hankki/privacy**

---

## HTTP_STATUS

**200**

---

## HTTPS

**YES**

---

## MOBILE_VIEWPORT

**YES** — `<meta name="viewport" content="width=device-width, initial-scale=1" />` present; Korean renders correctly on live fetch.

---

## PHOTO_SAVE_WORDING

**MATCH** — Live includes:

- User-initiated save to photo library (쓰기/추가)
- App-generated PNG only
- No read/scan of existing photos
- No upload to company server

---

## ADMOB_WORDING

**MATCH** — Live includes Google AdMob / Google Mobile Ads SDK; Android Home banner scope; iOS UI off; NPA; no “AdMob 미설치” / “별도 광고 SDK는 포함되어 있지 않습니다” stale claims.

---

## COUPANG_WORDING

**MATCH** — Live includes:

- Home + 일반 레시피 재료(장보기) dynamic banner
- **Excluded:** 이유식 레시피 상세·일괄 조리·장보기 체크리스트

---

## ANALYTICS_WORDING

**MATCH** — Firebase Analytics + custom events including `query_length`, `stage`, `meal_type`, child weekly events; ADID collection disabled stated.

---

## CHILD_PRIVACY_WORDING

**MATCH** — 아이 이름/나이/월령 미수집 explicitly stated.

---

## STALE_TEXT_FOUND

**NONE**

| Stale phrase | Live present? |
|---|---|
| “사진 보관함에 접근하지 않습니다” | **NO** |
| “AdMob 미설치” | **NO** |
| “AdMob 등 별도 광고 SDK는 포함되어 있지 않습니다” | **NO** |
| “사진 라이브러리 접근 … 수행하지 않습니다” (absolute) | **NO** |

---

## STORE_PRIVACY_URL_READY

**YES**

| Criterion | Status |
|---|---|
| HTTPS | YES |
| Public (no login) | YES |
| Stable route `/hankki/privacy` | YES |
| Mobile readable | YES |
| Content matches app behavior (post-deploy) | YES |

Store form entry **not performed** (per sprint scope).

---

## FILES_CHANGED

**None** — deploy only; no app/repo code edits.

---

## TEST_RESULTS

| Test | Result |
|---|---|
| `npm run test:release-precheck-privacy` | **PASS** |
| `npm run test:legal-coupang-compliance` | **PASS** |

---

## REGRESSIONS

None.

---

## RISKS

| Risk | Notes |
|---|---|
| Deploy without `--scope goodjap78` may fail auth | Document scope in `legal/README.md` update optional (out of scope) |
| CDN/browser cache | Spot-check from fresh session if store review sees old text |
| Terms page | Not redeploy-verified this sprint (privacy only; same deployment bundle) |

---

## PRIVACY_DEPLOY_COMPLETE

**YES**

---

## READY_FOR_9_1_PREVIEW_BUILD

**YES**

Privacy URL is live, current, and store-ready. Preview APK can proceed on 9/1 per device QA package.
