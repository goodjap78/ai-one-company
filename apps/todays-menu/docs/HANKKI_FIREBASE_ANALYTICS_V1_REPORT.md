# HANKKI Firebase Analytics V1

출시 직후 사업 판단용 최소 이벤트만 추가했다.  
Firebase Console 설정과 `google-services.json`은 만들지 않았다.

## Phase 0 — 환경

| 항목 | 값 |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| Android package | `com.aionecompany.todaysmenu` |
| iOS bundle | `com.aionecompany.todaysmenu` |
| Native build | EAS (`development` / `preview` APK / `production`) |
| 선택 라이브러리 | `@react-native-firebase/app` + `@react-native-firebase/analytics` |

Expo Go는 사용하지 않는다. Preview/Production EAS native build 기준.

## FIREBASE_MANUAL_SETUP_REQUIRED

아래를 사용자가 Firebase Console에서 직접 해야 한다. 추측 프로젝트/config는 만들지 않았다.

### 1. Firebase 프로젝트
1. [Firebase Console](https://console.firebase.google.com) 로그인
2. Add project (또는 기존 회사 프로젝트 사용)
3. Google Analytics 사용 = 켜기 (GA4 속성 연결)

### 2. Android 앱 등록
1. Project settings → Add app → Android
2. Android package name: **`com.aionecompany.todaysmenu`** (오타 없이 동일해야 함)
3. App nickname: `한끼 Android` (선택)
4. SHA-1: Analytics V1에는 필수는 아님. Play App Check는 별도.
5. `google-services.json` 다운로드
6. 저장 위치: `apps/todays-menu/google-services.json`

### 3. iOS 앱 등록 (Android 출시만이면 나중에)
1. Add app → iOS
2. Bundle ID: **`com.aionecompany.todaysmenu`**
3. `GoogleService-Info.plist` → `apps/todays-menu/GoogleService-Info.plist`

### 4. Analytics 활성화
Firebase Console → Analytics / GA4 가 프로젝트에 연결돼 있는지 확인.

### 5. 파일 추가 후
`app.config.js`가 파일을 감지하면 `@react-native-firebase` 플러그인을 켠다.  
그다음 **EAS Preview rebuild**가 필요하다.

```bash
adb shell setprop debug.firebase.analytics.app com.aionecompany.todaysmenu
```

Firebase Console → Analytics → DebugView

## 구현된 이벤트 (12)

1. `recipe_impression` — `recipe_id`, `meal_time`, `source`
2. `recipe_open` — `recipe_id`, `source`
3. `favorite_change` — `recipe_id`, `action=add|remove`
4. `recommendation_refresh` — `meal_time`
5. `fridge_open`
6. `fridge_result` — `result_count` (pantry 내용 없음)
7. `shopping_cta_click` — `recipe_id`, `mode=all|missing`
8. `meal_kit_cta_click` — `recipe_id`
9. `shopping_screen_view` — `recipe_id`, `mode=all|missing|meal_kit`
10. `shopping_product_click` — `recipe_id`, `mode`, `merchant`, `is_affiliate` (검색어/상품명 없음)
11. `convenience_open`
12. `convenience_combo_open` — `combo_id`

## Privacy

- 닉네임/이메일/전화번호/위치/연락처/pantry/자유입력/광고ID custom param 없음
- 별도 installId 없음
- ADID/IDFV 수집 비활성 (`firebase.json` + iOS `withoutAdIdSupport`)
- 자동 screen reporting 꺼둠
- Firebase 기본 app instance ID는 SDK가 관리 (별도 유저 DB 없음)

`legal/privacy.html`은 **아직 수정하지 않음**.  
현재 문서는 “Google Analytics SDK 없음”이라고 되어 있어, Console 연결 후 배포 전에 수정 필요.

## 판정

**WAITING_FIREBASE_CONSOLE_SETUP**

코드/이벤트/테스트는 준비됨. native Analytics는 `google-services.json` + EAS rebuild 후에만 동작한다. 그 전까지 wrapper는 safe no-op.
