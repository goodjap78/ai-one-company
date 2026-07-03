# docs/product/prd/home.md
# Today's Menu - Home Screen PRD v1.0

## 0. Decision Summary

- Product: Today's Menu
- Core Brand: AI Chef
- Screen: Home
- MVP Principle: 사용자가 생각하기 전에 AI가 먼저 결정한다.
- Primary Goal: 앱 실행 후 5초 안에 사용자가 오늘 먹을 메뉴를 결정하게 만든다.
- Home Rule: 홈에서는 메뉴를 많이 보여주지 않는다. AI Chef가 추천한 하나의 메뉴만 강하게 보여준다.

---

## 1. Purpose

Home 화면은 사용자가 앱을 열자마자 오늘 먹을 메뉴를 빠르게 결정하도록 돕는 첫 화면이다.

사용자는 검색하거나 필터를 고르는 것이 아니라, AI Chef가 먼저 추천한 메뉴를 보고 바로 선택한다.

---

## 2. Core UX Principle

### One Tap Decision

사용자가 홈에서 해야 할 행동은 최대 1번의 탭이다.

1. 앱 실행
2. AI Chef 추천 확인
3. `좋아!! 이걸로 할게!` 버튼 선택
4. 레시피 상세 화면으로 이동

---

## 3. Home Screen Wireframe

```text
┌──────────────────────────────┐
│  좋은 저녁이에요 😊            │
│  오늘도 고생 많으셨어요.       │
│                              │
│  🍳 AI Chef                  │
│                              │
│  오늘 저녁은                  │
│  제육볶음을 추천드려요.        │
│                              │
│  ⭐ 4.8   ⏱ 20분              │
│  🥕 냉장고 재료 92% 사용 가능 │
│  💪 단백질 충분               │
│                              │
│  [😊 좋아!! 이걸로 할게!]     │
│                              │
│  [🍳 다른 메뉴 추천해줘!]      │
│                              │
│  ─────────────────────       │
│  ❤️ 저장하기                  │
│  📖 레시피 먼저 보기          │
│                              │
│  🏠      🔍      ❤️      👤   │
└──────────────────────────────┘
```

---

## 4. Primary Content

### Greeting

시간대에 따라 문구가 바뀐다.

- 아침: 좋은 아침이에요 😊
- 점심: 맛있는 점심 시간이에요 😊
- 저녁: 좋은 저녁이에요 😊
- 밤: 출출한 밤이네요 😊

### AI Chef Message

AI Chef는 따뜻하고 친근한 말투를 사용한다.

예시:

> 오늘 저녁은 제육볶음을 추천드려요.  
> 20분이면 만들 수 있고, 냉장고 재료도 대부분 활용할 수 있어요.

---

## 5. Main Recommendation Card

### Required Data

```ts
type HomeRecommendation = {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  title: string;
  subtitle: string;
  imageUrl?: string;
  rating?: number;
  cookingTimeMinutes: number;
  ingredientMatchPercent?: number;
  nutritionHighlight?: string;
  reason: string;
};
```

### Example

```json
{
  "id": "recipe_001",
  "mealType": "dinner",
  "title": "제육볶음",
  "subtitle": "20분이면 완성되는 든든한 저녁 메뉴",
  "rating": 4.8,
  "cookingTimeMinutes": 20,
  "ingredientMatchPercent": 92,
  "nutritionHighlight": "단백질 충분",
  "reason": "저녁 시간이고 빠르게 만들 수 있으며 가족 식사로 적합합니다."
}
```

---

## 6. Buttons

### Primary CTA

Label:

```text
😊 좋아!! 이걸로 할게!
```

Action:

- 선택된 추천 메뉴를 `meal_history`에 저장
- 레시피 상세 화면으로 이동

Route:

```text
/recipe/:recipeId
```

### Secondary CTA

Label:

```text
🍳 다른 메뉴 추천해줘!
```

Action:

- AI 추천 API 재호출
- 로딩 상태 표시
- 새로운 메뉴 1개만 표시

### Tertiary Actions

- 저장하기
- 레시피 먼저 보기

---

## 7. Loading State

AI 추천을 다시 요청할 때 단순 로딩 스피너만 보여주지 않는다.

### Loading Copy

```text
🍳 AI Chef가 다시 생각하고 있어요.

🥩 영양 밸런스 확인 중...
🥦 냉장고 재료 확인 중...
🍚 오늘 시간대에 맞는 메뉴 찾는 중...
```

### Loading Rules

- 최소 표시 시간: 800ms
- 최대 대기 시간: 10초
- 10초 초과 시 fallback 추천 표시

---

## 8. Empty State

신규 사용자이거나 추천 데이터가 없을 때:

```text
🍳 AI Chef가 첫 메뉴를 준비하고 있어요.

몇 가지만 알려주시면 더 잘 추천해드릴게요.
```

CTA:

```text
취향 설정하기
```

---

## 9. Error State

### Network Error

```text
인터넷 연결이 불안정해요.
잠시 후 다시 시도해 주세요.
```

CTA:

```text
다시 시도
```

### AI Error

```text
AI Chef가 잠시 쉬고 있어요.
대신 오늘 인기 메뉴를 추천드릴게요.
```

Fallback:

- 인기 레시피 1개 표시

---

## 10. API Requirements

### GET Home Recommendation

```http
GET /api/home/recommendation
```

Query:

```json
{
  "userId": "string",
  "mealType": "dinner",
  "timezone": "Asia/Seoul"
}
```

Response:

```json
{
  "recommendation": {
    "id": "recipe_001",
    "title": "제육볶음",
    "subtitle": "20분이면 완성되는 든든한 저녁 메뉴",
    "cookingTimeMinutes": 20,
    "ingredientMatchPercent": 92,
    "nutritionHighlight": "단백질 충분",
    "reason": "저녁 시간이고 빠르게 만들 수 있으며 가족 식사로 적합합니다."
  }
}
```

### POST Refresh Recommendation

```http
POST /api/home/recommendation/refresh
```

Body:

```json
{
  "userId": "string",
  "previousRecipeId": "recipe_001",
  "reason": "user_requested_another"
}
```

---

## 11. Database Impact

### meal_history

사용자가 `좋아!! 이걸로 할게!`를 누르면 저장한다.

```sql
meal_history
- id uuid primary key
- user_id uuid
- recipe_id uuid
- meal_type text
- selected_at timestamp
- source text -- ai_home_recommendation
```

### ai_logs

AI 추천 요청과 응답을 저장한다.

```sql
ai_logs
- id uuid primary key
- user_id uuid
- request_type text
- input jsonb
- output jsonb
- created_at timestamp
```

---

## 12. Analytics Events

### home_viewed

사용자가 홈 화면을 봄.

### home_recommendation_accepted

`좋아!! 이걸로 할게!` 클릭.

### home_recommendation_refreshed

`다른 메뉴 추천해줘!` 클릭.

### home_recipe_saved

저장하기 클릭.

### home_recipe_preview_clicked

레시피 먼저 보기 클릭.

---

## 13. Component List

```text
HomeScreen
GreetingHeader
AIRecommendationCard
RecommendationMeta
PrimaryDecisionButton
RefreshRecommendationButton
HomeQuickActions
BottomNavigation
AIThinkingLoader
ErrorState
EmptyState
```

---

## 14. UI Rules

- 추천 메뉴는 홈에서 1개만 보여준다.
- 첫 화면에는 광고를 보여주지 않는다.
- 첫 화면에는 긴 리스트를 보여주지 않는다.
- 검색은 홈의 주 행동이 아니다.
- 버튼 문구는 사용자가 AI에게 대답하는 느낌이어야 한다.
- 모든 색상과 간격은 Design Token을 사용한다.

---

## 15. Codex Implementation Instructions

Codex는 아래 순서로 구현한다.

1. `apps/todays-menu/app/index.tsx`에 HomeScreen 연결
2. `components/home/` 폴더 생성
3. HomeScreen 컴포넌트 작성
4. Mock recommendation 데이터 생성
5. Primary CTA 클릭 시 `/recipe/[id]` 이동 준비
6. Refresh CTA 클릭 시 로딩 후 Mock 데이터 교체
7. Empty/Error/Loading 상태 구현
8. Design Token 사용
9. 하드코딩 색상 금지
10. TypeScript 타입 정의 필수

---

## 16. Acceptance Criteria

- 앱을 열면 추천 메뉴 1개가 보여야 한다.
- Primary CTA 문구는 `😊 좋아!! 이걸로 할게!`이어야 한다.
- Secondary CTA 문구는 `🍳 다른 메뉴 추천해줘!`이어야 한다.
- 추천 메뉴 카드에는 메뉴명, 조리 시간, 추천 이유가 있어야 한다.
- 로딩 상태에서 AI Chef가 생각하는 메시지가 보여야 한다.
- Empty/Error 상태가 있어야 한다.
- 홈 화면에는 메뉴 리스트가 없어야 한다.
- 홈 화면에는 광고가 없어야 한다.
- 모든 UI는 모바일 기준으로 자연스럽게 보여야 한다.

---

## 17. MVP Out of Scope

이번 Home MVP에서는 제외한다.

- 여러 AI Chef Persona
- 냉장고 이미지 인식
- 음성 대화
- 가족 계정
- 결제
- 장보기 제휴
- 영양 상세 분석
- 위치 기반 맛집 추천

---

## 18. Final Product Principle

Home은 사용자가 탐색하는 화면이 아니다.

Home은 AI Chef가 사용자를 대신해 오늘의 한 끼를 결정해주는 화면이다.
