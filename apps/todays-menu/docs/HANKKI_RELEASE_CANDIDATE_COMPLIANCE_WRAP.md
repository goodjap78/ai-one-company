# HANKKI Release-Candidate Compliance Wrap

기준일: 2026-08-14  
Package: `com.aionecompany.todaysmenu`  
빌드/배포는 **실행하지 않음** (준비·감사만).

---

## PART 1 — Privacy deploy readiness

### How it deploys
- Source of truth: `apps/todays-menu/legal/privacy.html` (+ `terms.html`)
- Static host: Vercel project name **`hankki-legal`**
- Rewrites (`legal/vercel.json`):
  - `/hankki/privacy` → `/privacy.html`
  - `/hankki/terms` → `/terms.html`
- Public URLs (app `LEGAL_URLS`):
  - https://hankki-legal.vercel.app/hankki/privacy
  - https://hankki-legal.vercel.app/hankki/terms
- Documented command (`legal/README.md`):

```bash
cd apps/todays-menu/legal
npx vercel deploy --prod --yes --name hankki-legal
```

### Sync check (live vs repo)
| | Live URL | Repo `legal/privacy.html` |
|---|---|---|
| 시행일 | 2026-08-12 (구버전) | **2026-08-14** |
| Firebase Analytics 고지 | **없음** | **있음** |
| “Google Analytics SDK 없음” | **있음 (구버전)** | **제거됨** |

→ **PUBLIC_URL_SYNC: OUT_OF_DATE**

### Auto-deploy?
- Legal 폴더는 **독립 Vercel static deploy** (앱 EAS 빌드와 자동 연동 아님).
- Git push만으로 legal URL이 갱신된다는 근거 없음.
- 외부 production deploy는 **사용자 승인 후** 위 명령으로 실행.

### Terms impact
- `terms.html` / rewrite 미변경 권장. privacy만 배포해도 rewrite 구조는 유지됨.

---

## PART 2 — Production build audit (no build started)

### eas.json production
```json
"production": {
  "autoIncrement": true,
  "ios": { "image": "sdk-54" }
}
```
- Android `buildType` 미지정 → EAS 기본 **AAB (app-bundle)**
- `EXPO_PUBLIC_QA_TOOLS` **없음** → production에서 QA Meal Kit entry/env gate OFF

### QA tools in production
- **NO** — preview only (`EXPO_PUBLIC_QA_TOOLS=1`). `isInternalQaEnabled()` production false.

### Version policy
- `version` / `versionName`: **1.0.0** (`app.json`)
- local `android.versionCode`: **5**
- production `autoIncrement: true` → EAS가 remote versionCode를 **증가**시킬 수 있음
- Play에 이미 올라간 versionCode ≥5 이면 충돌 없음(자동 증가). Play 현재 값 미확인 → **CHECK_REQUIRED** (Play Console “App bundle explorer / Release”에서 확인)

### Build input scope
EAS는 워크스페이스 업로드 기준. release 후보에 반드시 포함되어야 할 것:
- `google-services.json`, `GoogleService-Info.plist`, `firebase.json`, `app.config.js`
- Firebase Analytics packages + plugins
- Coupang Dynamic Banner
- `FEATURE_FLAGS.mealKitEnabled: false`
- 수정된 `legal/privacy.html`은 **앱 번들에 직접 포함되지 않음** (공개 URL 별도 배포)

### Feature reflection (code config)
| Item | Status |
|---|---|
| Firebase plugins | ON when google-services present |
| Analytics | RNFB app+analytics 26.2.0 |
| Shopping / affiliate | ON |
| Coupang banner | Home + Ingredients |
| Meal kit UI | OFF (flag) |
| QA tools | production OFF |

### Minimal pre-build fixes
1. **필수:** public privacy 배포 (앱 AAB와 무관하지만 Play privacy URL 정합)
2. **권장:** dirty working tree에서 포함할 변경 범위 확정 (commit 또는 업로드 전 정리)
3. **권장:** Play Console에서 현재 production versionCode 확인 후 `autoIncrement` 결과 예상
4. **코드 추가 수정 불필요** (meal-kit hide / firebase / shopping 이미 RC 상태)

### Production build command (do not run until approved)

```bash
cd "d:\000.AI ONE Project\ai-one-company\apps\todays-menu"
npx eas build --platform android --profile production
```

---

## PART 3 — Manifest audit checklist (after AAB)

AAB 받은 뒤:

```bash
# example — adjust bundletool / path
bundletool dump manifest --bundle=*.aab --xpath=/manifest/@package
bundletool dump manifest --bundle=*.aab --xpath=/manifest/@android:versionCode
bundletool dump manifest --bundle=*.aab --xpath=/manifest/@android:versionName
bundletool dump manifest --bundle=*.aab | findstr /I "permission AD_ID LOCATION INTERNET QUERY_ALL Firebase"
```

| Check | Expectation (code-based) | If unexpected |
|---|---|---|
| package | `com.aionecompany.todaysmenu` | FIX |
| versionName | `1.0.0` | CHECK |
| versionCode | ≥5 (autoIncrement) | Play conflict CHECK |
| `INTERNET` | YES (normal) | — |
| `AD_ID` | Prefer **absent** (`google_analytics_adid_collection_enabled: false`) | If present → Data Safety Advertising ID YES or strip permission |
| `ACCESS_FINE/COARSE/BACKGROUND_LOCATION` | Prefer **absent** | FIX if present |
| `QUERY_ALL_PACKAGES` | Prefer **absent** | FIX if present |
| Firebase provider/service | Present (Analytics) | Expected |
| Other sensitive perms | None expected | Investigate |

---

## PART 4 — Data Safety decision map (AAB-dependent)

| Play field | If AAB matches expectation | If AAB shows AD_ID | If AAB shows location perms |
|---|---|---|---|
| **App interactions** | **YES** collected+shared (Google), purpose Analytics | same | same |
| **Device or other IDs** | **YES** (app-instance ID), Analytics | same | same |
| **Advertising ID** | **NO** | **YES** (Analytics) — update privacy/Data Safety | NO unless also AD_ID |
| **Approximate location** | **CHECK_REQUIRED** (Firebase Geography / IP; no GPS). Prefer declare YES Analytics if Play requires geo for Firebase, else NO if legal advises IP-only not declared | same | If GPS perms → YES Precise/Approx as appropriate |
| **In-app search history** | Prefer **NO** for Analytics. Shopping keywords = App functionality; declare Search history **only if** Play maps merchant keyword proxy to that type (**CHECK_REQUIRED** label) | same | same |
| **Web browsing history** | Prefer **NO** (affiliate WebView widget, not general browsing). **CHECK_REQUIRED** if Play treats partner WebView as browsing | same | same |
| **Diagnostics** | **NO** (no Crashlytics) | same | same |
| **Contains ads** | **YES** (Coupang banner) | same | same |

---

## USER_ACTION_REQUIRED (exact commands)

### 1) Deploy privacy (승인 후)

```bash
cd "d:\000.AI ONE Project\ai-one-company\apps\todays-menu\legal"
npx vercel deploy --prod --yes --name hankki-legal
```

검증:

```bash
# expect 2026-08-14 + Firebase Analytics in HTML
curl -sL "https://hankki-legal.vercel.app/hankki/privacy" | findstr /I "Firebase 2026-08-14 Google Analytics SDK"
cd "d:\000.AI ONE Project\ai-one-company\apps\todays-menu"
npm run smoke:rc
```

### 2) Build production AAB (승인 후; 이번 세션에서 미실행)

```bash
cd "d:\000.AI ONE Project\ai-one-company\apps\todays-menu"
npx eas build --platform android --profile production
```

### 3) After AAB — manifest audit + Play Data Safety update
- AD_ID / location / QUERY_ALL_PACKAGES 확인
- Data Safety map 위 표에 따라 입력
- Contains ads = YES
