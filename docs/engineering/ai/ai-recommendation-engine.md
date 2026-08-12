# docs/engineering/ai/ai-recommendation-engine.md
# Today's Menu - AI Chef Recommendation Engine v1.0

## 0. Purpose

AI Chef Recommendation Engine은 사용자가 앱을 열었을 때 “오늘 뭐 먹지?”라는 고민을 하지 않도록, 현재 상황에 가장 적합한 메뉴 1개를 추천하는 시스템이다.

MVP에서는 많은 메뉴를 나열하지 않는다.

AI Chef는 하나의 메뉴를 고르고, 왜 그 메뉴가 좋은지 짧고 따뜻하게 설명한다.

---

## 1. Core Principle

### AI Decides First

사용자가 검색하거나 필터를 고르기 전에 AI가 먼저 판단한다.

### One Best Meal

추천 결과는 기본적으로 1개다.

사용자에게 선택지를 많이 주지 않는다.

### Explainable Recommendation

AI는 항상 추천 이유를 말해야 한다.

예:

```text
오늘 저녁은 제육볶음을 추천드려요.
20분이면 만들 수 있고, 가족 식사로도 좋아요.
```

---

## 2. MVP Scope

### Included

- 시간대 기반 추천
- 식사 타입 기반 추천
- 사용자 선호 기반 추천
- 최근 추천/선택 이력 반영
- 알레르기/제외 재료 반영
- 조리 시간 반영
- 추천 이유 생성
- 대체 추천 요청

### Excluded

- 냉장고 이미지 인식
- 실시간 장보기 연동
- 건강 데이터 연동
- 혈당/질병 기반 전문 식단
- 여러 AI Chef Persona
- 음성 대화
- 위치 기반 맛집 추천

---

## 3. Input Signals

AI Chef는 다음 정보를 기반으로 추천한다.

### 3.1 Required Inputs

```ts
type RecommendationRequest = {
  userId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  timestamp: string;
  timezone: 'Asia/Seoul';
};
```

### 3.2 Optional Inputs

```ts
type OptionalSignals = {
  preferredCuisines?: string[];
  dislikedIngredients?: string[];
  allergies?: string[];
  maxCookingTimeMinutes?: number;
  familySize?: number;
  hasChildren?: boolean;
  spicePreference?: 'mild' | 'normal' | 'spicy';
  dietGoal?: 'none' | 'diet' | 'high_protein' | 'low_sodium' | 'balanced';
  recentRecipeIds?: string[];
  favoriteRecipeIds?: string[];
  weather?: {
    condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'hot' | 'cold';
    temperatureCelsius?: number;
  };
  season?: 'spring' | 'summer' | 'fall' | 'winter';
};
```

---

## 4. Recommendation Output

AI는 항상 아래 구조로 응답한다.

```ts
type RecommendationResponse = {
  recommendationId: string;
  chefMessage: string;
  recipe: {
    id: string;
    title: string;
    subtitle: string;
    cookingTimeMinutes: number;
    difficulty: 'easy' | 'normal' | 'hard';
    imageUrl?: string;
  };
  reason: string;
  badges: {
    label: string;
    type: 'time' | 'ingredient' | 'nutrition' | 'family' | 'season' | 'weather';
  }[];
  confidence: number;
  fallbackUsed: boolean;
};
```

---

## 5. Recommendation Logic

MVP에서는 복잡한 머신러닝 모델보다 규칙 기반 필터링 + AI 메시지 생성을 사용한다.

### Step 1. Candidate Recipe Pool 생성

기본 레시피 DB에서 후보 메뉴를 가져온다.

필터:

- mealType에 적합한 메뉴
- 조리 시간 조건 충족
- 알레르기 재료 제외
- 싫어하는 재료 제외
- 최근 3회 선택한 메뉴 제외

### Step 2. Scoring

각 후보 메뉴에 점수를 준다.

```text
score =
  mealTypeScore
+ timeScore
+ preferenceScore
+ familyScore
+ seasonScore
+ weatherScore
+ noveltyScore
- allergyPenalty
- recentMealPenalty
```

### Step 3. Top 1 Selection

가장 높은 점수의 메뉴 1개를 선택한다.

동점이면:

1. 조리 시간이 짧은 메뉴
2. 가족 친화적인 메뉴
3. 최근 선택되지 않은 메뉴

순서로 선택한다.

### Step 4. AI Chef Message 생성

선택된 메뉴와 추천 이유를 사용해서 짧고 따뜻한 메시지를 만든다.

---

## 6. Scoring Rules

### 6.1 mealTypeScore

```text
아침 적합 메뉴: +30
점심 적합 메뉴: +30
저녁 적합 메뉴: +30
야식 적합 메뉴: +30
```

### 6.2 timeScore

```text
사용자 최대 조리시간 이내: +20
15분 이하: +10
30분 초과: -10
```

### 6.3 preferenceScore

```text
선호 카테고리 일치: +20
즐겨찾기와 유사: +10
싫어하는 재료 포함: -50
```

### 6.4 familyScore

```text
가족 식사 적합: +15
아이 반찬 적합: +15
너무 매움: -15
```

### 6.5 seasonScore

```text
계절 메뉴 적합: +10
```

### 6.6 weatherScore

```text
비/추움 + 국물/따뜻한 메뉴: +10
더움 + 시원한 메뉴: +10
```

### 6.7 noveltyScore

```text
최근 7일 내 안 먹은 메뉴: +10
최근 3회 선택 메뉴: -40
```

---

## 7. AI Chef Tone

AI Chef는 다음 말투를 사용한다.

### Tone

- 따뜻함
- 친근함
- 짧고 명확함
- 너무 전문적이지 않음
- 사용자를 혼내지 않음

### Good Example

```text
오늘 저녁은 제육볶음을 추천드려요.
20분이면 만들 수 있고, 가족 식사로도 든든해요.
```

### Bad Example

```text
귀하의 영양 프로필과 행동 데이터를 기반으로 고단백 식단을 산출했습니다.
```

---

## 8. Prompt Template

### System Prompt

```text
You are AI Chef, a warm and practical food assistant for Korean users.

Your job is to help the user decide what to eat with minimal thinking.

Recommend exactly one meal.

Be friendly, concise, and useful.

Do not overwhelm the user with many options.

Always explain why this meal is a good choice today.

Avoid medical claims.

Avoid complicated cooking terms.

Return valid JSON only.
```

### User Prompt Template

```text
User context:
- Meal type: {{mealType}}
- Timezone: {{timezone}}
- Current time: {{timestamp}}
- Weather: {{weather}}
- Season: {{season}}
- Preferred cuisines: {{preferredCuisines}}
- Disliked ingredients: {{dislikedIngredients}}
- Allergies: {{allergies}}
- Max cooking time: {{maxCookingTimeMinutes}}
- Family size: {{familySize}}
- Has children: {{hasChildren}}
- Spice preference: {{spicePreference}}
- Diet goal: {{dietGoal}}
- Recent meals: {{recentRecipeTitles}}

Candidate recipe:
{{candidateRecipe}}

Write a warm AI Chef recommendation message and reason.
Return JSON.
```

---

## 9. JSON Output Contract

AI message generation must return this format.

```json
{
  "chefMessage": "오늘 저녁은 제육볶음을 추천드려요.",
  "reason": "20분이면 만들 수 있고, 가족 식사로도 든든해서 오늘 저녁 메뉴로 좋아요.",
  "badges": [
    { "label": "20분", "type": "time" },
    { "label": "가족 식사", "type": "family" },
    { "label": "단백질 충분", "type": "nutrition" }
  ]
}
```

Rules:

- chefMessage: 40자 이내 권장
- reason: 80자 이내 권장
- badges: 최대 3개
- JSON 이외 텍스트 금지

---

## 10. Fallback Logic

AI 호출 실패 시에도 홈은 비어 있으면 안 된다.

### Fallback Priority

1. 시간대별 인기 메뉴
2. 가족 친화 메뉴
3. 20분 이하 메뉴
4. 기본 추천 메뉴

### Default Fallbacks

```json
{
  "breakfast": "계란토스트",
  "lunch": "김치볶음밥",
  "dinner": "제육볶음",
  "late_night": "계란찜"
}
```

---

## 11. Safety Rules

AI Chef는 다음을 하지 않는다.

- 질병 치료를 약속하지 않는다.
- 특정 음식이 병을 고친다고 말하지 않는다.
- 알레르기 재료를 추천하지 않는다.
- 유아/임산부/질환자에게 전문 의료 조언을 하지 않는다.
- 위험한 조리법을 권하지 않는다.

알레르기 정보가 있으면 가장 높은 우선순위로 제외한다.

---

## 12. Data Needed From Recipe DB

각 레시피는 최소한 아래 필드를 가져야 한다.

```ts
type Recipe = {
  id: string;
  title: string;
  mealTypes: string[];
  cuisineType: string;
  cookingTimeMinutes: number;
  difficulty: 'easy' | 'normal' | 'hard';
  ingredients: string[];
  allergens?: string[];
  tags: string[];
  suitableForChildren?: boolean;
  spicyLevel: 0 | 1 | 2 | 3;
  seasonTags?: string[];
  weatherTags?: string[];
  nutritionTags?: string[];
  imageUrl?: string;
};
```

---

## 13. Recommendation Examples

### Dinner Example

Input:

```json
{
  "mealType": "dinner",
  "maxCookingTimeMinutes": 30,
  "familySize": 4,
  "hasChildren": true,
  "spicePreference": "normal"
}
```

Output:

```json
{
  "chefMessage": "오늘 저녁은 제육볶음을 추천드려요.",
  "reason": "20분이면 만들 수 있고, 가족 식사로도 든든해서 좋아요.",
  "badges": [
    { "label": "20분", "type": "time" },
    { "label": "가족 식사", "type": "family" },
    { "label": "든든한 저녁", "type": "nutrition" }
  ]
}
```

### Rainy Day Example

Input:

```json
{
  "mealType": "dinner",
  "weather": { "condition": "rainy", "temperatureCelsius": 12 },
  "season": "fall"
}
```

Output:

```json
{
  "chefMessage": "비 오는 저녁엔 된장찌개가 좋아요.",
  "reason": "따뜻한 국물 메뉴라 몸도 편하고 집밥 느낌으로 먹기 좋아요.",
  "badges": [
    { "label": "따뜻한 메뉴", "type": "weather" },
    { "label": "집밥", "type": "family" },
    { "label": "30분", "type": "time" }
  ]
}
```

---

## 14. Performance Requirement

- 추천 API 응답 목표: 1.5초 이내
- AI 메시지 생성 포함 최대: 3초 이내
- 3초 초과 시 fallback message 사용
- 홈 화면은 API 실패에도 반드시 표시되어야 함

---

## 15. Logging

추천 요청마다 아래 데이터를 저장한다.

```ts
type AIRecommendationLog = {
  id: string;
  userId?: string;
  requestInput: object;
  selectedRecipeId: string;
  scoreBreakdown?: object;
  aiOutput: object;
  fallbackUsed: boolean;
  createdAt: string;
};
```

---

## 16. Success Metrics

### Primary Metric

- home_recommendation_accepted rate

### Secondary Metrics

- refresh rate
- recipe detail click rate
- favorite click rate
- fallback usage rate
- recommendation response time

---

## 17. Codex Implementation Notes

Codex should implement the MVP engine in this order.

1. Create mock recipe dataset.
2. Create recommendation scoring function.
3. Create recommendation response type.
4. Create AI Chef message generator using mock template first.
5. Connect Home screen refresh action to the mock recommendation engine.
6. Add fallback logic.
7. Add logging placeholder.
8. Do not call real AI API until backend/API spec is complete.

---

## 18. Final Principle

AI Chef의 목표는 똑똑해 보이는 것이 아니다.

사용자가 메뉴 고민을 하지 않게 만드는 것이다.
