# HANKKI 9/1 Device QA Package

기준일: 2026-08-29  
**이 문서는 실행 가이드만 제공합니다. Sprint 중 EAS build / store submit / production AAB 는 실행하지 않습니다.**

---

## Prerequisites

- Android 실기기 (USB debugging 또는 internal install)
- Expo/EAS CLI 로그인
- `google-services.json` present (Firebase)
- Preview profile: `EXPO_PUBLIC_QA_TOOLS=1` (AdMob test unit 가능)

---

## A. Preview APK build command

```bash
cd apps/todays-menu
eas build --platform android --profile preview --non-interactive
```

- **profile:** `preview` → APK (`eas.json` `buildType: apk`)
- **금지:** `--profile production`, AAB-only production build

---

## B. Install 방법

1. EAS build 완료 후 dashboard에서 APK 다운로드
2. 실기기에 sideload:

```bash
adb install -r path/to/downloaded.apk
```

또는 기기에서 APK 파일 직접 설치 (unknown sources 허용)

---

## C. Android permission 확인 (실기기)

| Permission / feature | Expected |
|---|---|
| Photo save (weekly plan) | 사용자 「저장」 탭 시에만 미디어 추가 권한 프롬프트 |
| Photo read | **없음** |
| Location | **없음** |
| AD_ID | merged manifest에서 blocked 여부 확인 (아래 D) |

**수동 QA:** Baby/Toddler/Elementary weekly → 저장 → 권한 허용/거부 각각

---

## D. Merged manifest 확인

Preview APK/AAB 산출물에서:

```bash
# bundletool 또는 aapt (로컬에 도구 있을 때)
aapt dump permissions preview.apk
```

Check:

- `com.google.android.gms.permission.AD_ID` — **absent** (intended)
- `ACCESS_ADSERVICES_*` — **absent** (intended)
- Media: save/add only (no broad READ_MEDIA_IMAGES if save-only config holds)

---

## E. Child full-flow QA

| Flow | Path | Checks |
|---|---|---|
| Baby feed | Home → 이유식 → stage tabs → search/filter → recipe | scroll, FlatList, back |
| Baby weekly | Feed → 이번 주 → stage → refresh/save/share | PNG save, share sheet |
| Baby batch | Weekly → 일괄 조리 → select → result → checklist | empty direct-open fallback |
| Toddler feed | Home → 유아 → meal tabs → browse/search | |
| Toddler weekly | Feed → 이번 주 메뉴 → meal tab → 7 days | save/share |
| Elementary browse | Home → 초등 → search/filter | FlatList scroll |
| Elementary weekly | Browse → 아침/저녁 주간 | save/share |

**Cross-state:** stage/meal 변경 후 AsyncStorage isolation (앱 재시작)

---

## F. Weekly save / share

All four weekly screens:

- [ ] Share opens OS sheet (cancel = no crash)
- [ ] Save requests permission once; success toast/feedback
- [ ] Denied permission → graceful message
- [ ] Saved PNG appears in gallery (spot check one audience)

---

## G. Grocery checklist

Baby batch result:

- [ ] Checkbox toggle + progress `n / total`
- [ ] Reset clears checks
- [ ] Share exports text (no crash)
- [ ] Persistence after app restart (same fingerprint)

---

## H. Coupang

- [ ] Home: dynamic banner loads or fails closed (no blank gap)
- [ ] General recipe ingredients: banner visible
- [ ] Baby recipe detail: **no** Coupang banner
- [ ] Batch / grocery: **no** ads
- [ ] Tap → external Coupang / disclosure visible on shopping

---

## I. AdMob test banner

Preview/QA env (`EXPO_PUBLIC_QA_TOOLS=1`):

- [ ] Android Home: test adaptive banner may show
- [ ] Load failure → component hidden (no reserved gap)
- [ ] iOS Home: **no** AdMob banner
- [ ] NPA request (non-personalized) — no crash

**금지:** `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS=true` without approval

---

## J. Analytics

Firebase DebugView (optional):

- [ ] `child_search` with `query_length` only (no raw query)
- [ ] Weekly plan view/save/share events
- [ ] Baby grocery checklist events
- [ ] No nickname/email in custom params

---

## K. Image crop / performance

- [ ] Child browse scroll 70–78 rows: no jank (FlatList nested)
- [ ] Hero images load; emoji fallback on missing
- [ ] Deferred step slots (recipe_0484 step_02, recipe_0498 step_04): **text-only fallback**, no crash
- [ ] Weekly share card 1080×1350 renders correctly

---

## L. APK size

After preview build:

- [ ] Record APK download size
- [ ] Compare to static estimate ~158 MB bundled meals+steps (actual APK will differ)
- [ ] **Production AAB only after preview PASS**

---

## Pass / fail gate

| Gate | Rule |
|---|---|
| Preview PASS | Sections C–L critical paths OK |
| Production AAB | Preview PASS + privacy URL deploy sync + version bump approval |
| Store submit | All compliance drafts applied in consoles |

---

## Rollback

- Reinstall previous preview APK
- No server-side rollback (local AsyncStorage only)
