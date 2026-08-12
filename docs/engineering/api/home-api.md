# docs/engineering/api/home-api.md
# Today's Menu - Home API Spec v1.0

## 0. Purpose

Home API는 사용자가 앱을 열었을 때 AI Chef가 추천한 오늘의 한 끼를 가져오고, 사용자의 선택/새 추천 요청/저장 행동을 처리하는 API이다.

Home API의 목적은 단순히 레시피 데이터를 전달하는 것이 아니다.

목적은 다음과 같다.

- 홈 화면에 추천 메뉴 1개를 안정적으로 제공한다.
- 사용자가 `좋아!! 이걸로 할게!`를 눌렀을 때 선택 이력을 저장한다.
- 사용자가 `다른 메뉴 추천해줘!`를 눌렀을 때 새 추천을 제공한다.
- AI 추천 로그를 남겨 추후 추천 품질을 개선한다.
- API 실패 시에도 홈 화면이 비어 있지 않도록 fallback을 제공한다.

---

## 1. API Design Principle

### One Recommendation First

Home API는 기본적으로 추천 메뉴 1개를 반환한다.

### Explainable Response

추천 결과에는 반드시 `chefMessage`, `reason`, `badges`가 포함되어야 한다.

### Frontend Friendly

프론트엔드가 추가 계산 없이 바로 화면에 표시할 수 있는 응답 구조를 제공한다.

### Fallback Safe

AI 또는 DB 오류가 발생해도 fallback 추천을 반환할 수 있어야 한다.

---

## 2. Base URL

MVP local:

```text
http://localhost:8000/api
```

Production:

```text
https://api.todays-menu.ai/api
```

---

## 3. Authentication

MVP에서는 인증이 없어도 동작할 수 있어야 한다.

### Anonymous User

비로그인 사용자는 `anonymousId`를 사용한다.

### Logged-in User

로그인 사용자는 `userId`를 사용한다.

Request는 둘 중 하나를 포함할 수 있다.

```json
{
  "userId": "uuid",
  "anonymousId": "device_generated_id"
}
```

MVP에서는 `anonymousId` 우선 지원 가능.

---

## 4. Endpoints Summary

```text
GET  /home/recommendation
POST /home/recommendation/refresh
POST /home/recommendation/accept
POST /home/recommendation/save
GET  /home/state
```

---

## 5. GET /home/recommendation

### Purpose

홈 화면 최초 진입 시 AI Chef 추천 메뉴 1개를 가져온다.

### Request

```http
GET /api/home/recommendation?mealType=dinner&timezone=Asia/Seoul&anonymousId=device_123
```

### Query Parameters

| Name | Type | Required | Description |
|---|---|---:|---|
| userId | string | no | 로그인 사용자 ID |
| anonymousId | string | no | 비로그인 기기 ID |
| mealType | string | yes | breakfast, lunch, dinner, late_night |
| timezone | string | yes | Asia/Seoul |
| maxCookingTimeMinutes | number | no | 최대 조리 시간 |
| hasChildren | boolean | no | 자녀 여부 |
| spicePreference | string | no | mild, normal, spicy |

### Success Response

```json
{
  "success": true,
  "data": {
    "recommendationId": "rec_001",
    "chefMessage": "오늘 저녁은 제육볶음을 추천드려요.",
    "reason": "20분이면 만들 수 있고, 가족 식사로도 든든해서 좋아요.",
    "recipe": {
      "id": "recipe_001",
      "title": "제육볶음",
      "subtitle": "20분이면 완성되는 든든한 저녁 메뉴",
      "imageUrl": null,
      "cookingTimeMinutes": 20,
      "difficulty": "easy"
    },
    "badges": [
      {
        "label": "20분",
        "type": "time"
      },
      {
        "label": "가족 식사",
        "type": "family"
      },
      {
        "label": "단백질 충분",
        "type": "nutrition"
      }
    ],
    "fallbackUsed": false,
    "confidence": 0.86
  },
  "meta": {
    "requestId": "req_001",
    "responseTimeMs": 780
  }
}
```

### Error Response

API는 가능하면 error 대신 fallback recommendation을 반환한다.

```json
{
  "success": false,
  "error": {
    "code": "RECOMMENDATION_FAILED",
    "message": "추천을 불러오지 못했습니다."
  },
  "fallback": {
    "recommendationId": "fallback_dinner_001",
    "chefMessage": "오늘 저녁은 김치볶음밥을 추천드려요.",
    "reason": "빠르게 만들 수 있고 부담 없는 저녁 메뉴예요.",
    "recipe": {
      "id": "recipe_fallback_001",
      "title": "김치볶음밥",
      "subtitle": "간단하고 든든한 기본 메뉴",
      "imageUrl": null,
      "cookingTimeMinutes": 15,
      "difficulty": "easy"
    },
    "badges": [
      {
        "label": "15분",
        "type": "time"
      }
    ],
    "fallbackUsed": true,
    "confidence": 0.5
  }
}
```

---

## 6. POST /home/recommendation/refresh

### Purpose

사용자가 `🍳 다른 메뉴 추천해줘!`를 눌렀을 때 새로운 추천 메뉴 1개를 반환한다.

### Request

```http
POST /api/home/recommendation/refresh
```

### Body

```json
{
  "userId": null,
  "anonymousId": "device_123",
  "previousRecommendationId": "rec_001",
  "previousRecipeId": "recipe_001",
  "mealType": "dinner",
  "timezone": "Asia/Seoul",
  "reason": "user_requested_another"
}
```

### Success Response

GET /home/recommendation과 동일한 구조를 반환한다.

### Rules

- 이전 recipeId와 같은 메뉴를 반환하지 않는다.
- 새 추천도 반드시 1개만 반환한다.
- refresh 요청은 1.5초 내 중복 호출 방지.
- MVP에서는 프론트엔드에서 debounce 처리 가능.
- 서버에서도 최근 refresh 메뉴를 제외할 수 있어야 한다.

---

## 7. POST /home/recommendation/accept

### Purpose

사용자가 `😊 좋아!! 이걸로 할게!`를 눌렀을 때 선택 기록을 저장한다.

### Request

```http
POST /api/home/recommendation/accept
```

### Body

```json
{
  "userId": null,
  "anonymousId": "device_123",
  "recommendationId": "rec_001",
  "recipeId": "recipe_001",
  "mealType": "dinner",
  "acceptedAt": "2026-07-03T11:30:00+09:00"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "mealHistoryId": "meal_001",
    "recipeId": "recipe_001",
    "nextRoute": "/recipe/recipe_001"
  }
}
```

### Frontend Behavior

성공 시 레시피 상세 화면으로 이동한다.

```text
/recipe/:recipeId
```

### Failure Behavior

저장 실패 시에도 사용자는 레시피 화면으로 이동할 수 있다.

단, 클라이언트에서 retry queue에 저장한다.

---

## 8. POST /home/recommendation/save

### Purpose

사용자가 홈에서 추천 메뉴를 즐겨찾기에 저장한다.

### Request

```http
POST /api/home/recommendation/save
```

### Body

```json
{
  "userId": null,
  "anonymousId": "device_123",
  "recipeId": "recipe_001",
  "source": "home_recommendation"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_001",
    "recipeId": "recipe_001",
    "saved": true
  }
}
```

### Duplicate Save Response

이미 저장된 경우에도 성공으로 처리한다.

```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_001",
    "recipeId": "recipe_001",
    "saved": true,
    "alreadySaved": true
  }
}
```

---

## 9. GET /home/state

### Purpose

홈 화면에 필요한 최소 상태 정보를 가져온다.

MVP에서는 optional이다.

### Request

```http
GET /api/home/state?anonymousId=device_123&timezone=Asia/Seoul
```

### Response

```json
{
  "success": true,
  "data": {
    "mealType": "dinner",
    "greeting": "좋은 저녁이에요 😊",
    "subtitle": "오늘도 고생 많으셨어요.",
    "hasCompletedPreferenceSetup": false,
    "unreadNotificationCount": 0
  }
}
```

---

## 10. Shared Types

### MealType

```ts
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'late_night';
```

### BadgeType

```ts
type BadgeType =
  | 'time'
  | 'ingredient'
  | 'nutrition'
  | 'family'
  | 'season'
  | 'weather';
```

### Difficulty

```ts
type Difficulty = 'easy' | 'normal' | 'hard';
```

### HomeRecommendationDTO

```ts
type HomeRecommendationDTO = {
  recommendationId: string;
  chefMessage: string;
  reason: string;
  recipe: {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string | null;
    cookingTimeMinutes: number;
    difficulty: Difficulty;
  };
  badges: {
    label: string;
    type: BadgeType;
  }[];
  fallbackUsed: boolean;
  confidence: number;
};
```

---

## 11. Error Codes

```text
RECOMMENDATION_FAILED
INVALID_MEAL_TYPE
INVALID_TIMEZONE
USER_NOT_FOUND
RECIPE_NOT_FOUND
ACCEPT_FAILED
SAVE_FAILED
RATE_LIMITED
INTERNAL_SERVER_ERROR
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MEAL_TYPE",
    "message": "지원하지 않는 식사 타입입니다."
  }
}
```

---

## 12. Rate Limit

MVP 기준:

```text
GET /home/recommendation: 60 requests / hour / user
POST /home/recommendation/refresh: 30 requests / hour / user
POST /home/recommendation/accept: 120 requests / hour / user
POST /home/recommendation/save: 120 requests / hour / user
```

Refresh API는 남용 가능성이 있으므로 제한한다.

---

## 13. Caching

### Recommendation Cache

- 동일 사용자 + 동일 mealType 기준 10분 캐시 가능
- refresh 요청은 캐시를 우회한다.
- accept/save 요청은 캐시 대상이 아니다.

### Fallback Cache

- 시간대별 fallback 메뉴는 서버 메모리 캐시 가능
- MVP에서는 mock data로 시작 가능

---

## 14. Performance Requirements

```text
GET /home/recommendation: 1.5초 이내 목표
POST /refresh: 2.0초 이내 목표
POST /accept: 500ms 이내 목표
POST /save: 500ms 이내 목표
```

AI 호출이 3초를 초과하면 fallback을 반환한다.

---

## 15. Security

- 클라이언트에서 userId를 신뢰하지 않는다.
- 로그인 이후에는 JWT에서 userId를 가져온다.
- anonymousId는 민감정보가 아니지만 추적 가능성을 고려해 최소 저장한다.
- API Key는 클라이언트에 노출하지 않는다.
- AI API 호출은 반드시 backend를 통해 수행한다.

---

## 16. Logging

각 API는 requestId를 생성한다.

### Recommendation Log

```json
{
  "requestId": "req_001",
  "anonymousId": "device_123",
  "userId": null,
  "mealType": "dinner",
  "selectedRecipeId": "recipe_001",
  "fallbackUsed": false,
  "responseTimeMs": 780,
  "createdAt": "2026-07-03T11:30:00+09:00"
}
```

### Accept Log

```json
{
  "requestId": "req_002",
  "recommendationId": "rec_001",
  "recipeId": "recipe_001",
  "event": "home_recommendation_accepted"
}
```

---

## 17. Analytics Mapping

| API | Analytics Event |
|---|---|
| GET /home/recommendation | home_recommendation_loaded |
| POST /refresh | home_recommendation_refreshed |
| POST /accept | home_recommendation_accepted |
| POST /save | home_recipe_saved |
| GET /home/state | home_state_loaded |

---

## 18. Frontend Integration Flow

### Initial Home Load

```text
HomeScreen mounted
→ GET /home/state
→ GET /home/recommendation
→ Show recommendation card
```

MVP에서는 `/home/state` 없이 클라이언트에서 greeting 계산 가능.

### Accept Flow

```text
User taps "😊 좋아!! 이걸로 할게!"
→ POST /home/recommendation/accept
→ Navigate to /recipe/:recipeId
```

### Refresh Flow

```text
User taps "🍳 다른 메뉴 추천해줘!"
→ Show AI Thinking Loader
→ POST /home/recommendation/refresh
→ Replace recommendation card
```

### Save Flow

```text
User taps "❤️ 저장하기"
→ POST /home/recommendation/save
→ Show saved state
```

---

## 19. Mock API Strategy

MVP 개발 초기에는 실제 backend 없이 mock service를 사용한다.

Frontend mock service path:

```text
apps/todays-menu/services/homeService.ts
```

Mock functions:

```ts
getHomeRecommendation()
refreshHomeRecommendation()
acceptHomeRecommendation()
saveHomeRecommendation()
```

Mock data path:

```text
apps/todays-menu/services/mockHomeData.ts
```

---

## 20. Codex Implementation Instructions

Codex must:

1. Create API DTO types in `apps/todays-menu/types/home.ts`.
2. Create mock data in `apps/todays-menu/services/mockHomeData.ts`.
3. Create mock service in `apps/todays-menu/services/homeService.ts`.
4. Connect HomeScreen to mock service.
5. Implement loading, empty, and error states.
6. Implement refresh flow.
7. Implement accept flow with navigation placeholder.
8. Implement save flow with local saved state.
9. Do not call real backend yet.
10. Keep API contract compatible with this document.

---

## 21. Acceptance Criteria

- Home screen can load one recommendation from mock API.
- Refresh returns a different recommendation.
- Accept action triggers navigation placeholder.
- Save action updates UI state.
- API DTO types exist.
- All error states can be simulated.
- Fallback response can be simulated.
- No real AI API key is used in frontend.

---

## 22. Future Extension

Later versions may add:

- Real authentication
- User preference sync
- Real AI API call
- Weather API
- Refrigerator ingredient API
- Family profile API
- Nutrition analysis API
- Subscription-based AI Chef Persona API

---

## 23. Final Rule

Home API should not make the user wait for intelligence.

If AI is slow, return a good fallback fast.
