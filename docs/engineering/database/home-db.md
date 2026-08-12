# docs/engineering/database/home-db.md
# Today's Menu - Home Database Design v1.0

## 0. Purpose

Home DB 설계는 Home 화면에서 AI Chef 추천, 사용자 선택, 새 추천 요청, 즐겨찾기, 추천 로그를 안정적으로 저장하기 위한 데이터 구조를 정의한다.

Home 화면의 핵심은 “추천 메뉴 1개”이지만, 그 뒤에서는 다음 데이터가 필요하다.

- 추천한 메뉴
- 사용자가 선택했는지 여부
- 다른 메뉴를 요청했는지 여부
- 즐겨찾기 저장 여부
- 추천이 성공했는지 fallback인지 여부
- 향후 추천 품질 개선을 위한 로그

---

## 1. Database Principle

### Minimal First

MVP에서는 필요한 테이블만 만든다.

### Recommendation History Matters

추천 결과와 사용자의 반응은 반드시 저장한다.

### Anonymous First

MVP에서는 로그인 없이도 사용할 수 있어야 한다.

### AI Improvement Ready

초기에는 mock 추천이지만, 나중에 AI 추천 개선에 사용할 수 있도록 로그 구조를 남긴다.

---

## 2. Core Tables

Home MVP에서 필요한 핵심 테이블은 다음과 같다.

```text
users
anonymous_users
recipes
favorites
meal_history
ai_recommendation_logs
home_recommendation_sessions
```

---

## 3. users

로그인 사용자를 저장한다.

MVP에서는 optional이다.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Notes

- MVP에서는 실제 로그인 전까지 사용하지 않아도 된다.
- 추후 Supabase Auth 또는 자체 Auth와 연결 가능.

---

## 4. anonymous_users

비로그인 사용자의 기기 기반 식별자를 저장한다.

```sql
CREATE TABLE anonymous_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Usage

- 앱 최초 실행 시 device-generated anonymousId 생성
- 추천, 저장, 선택 기록을 anonymousId 기준으로 저장
- 로그인 후 userId로 병합 가능

---

## 5. recipes

레시피 기본 정보를 저장한다.

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  cuisine_type TEXT,
  meal_types TEXT[] NOT NULL,
  cooking_time_minutes INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  spicy_level INTEGER NOT NULL DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 3),
  suitable_for_children BOOLEAN DEFAULT false,
  season_tags TEXT[] NOT NULL DEFAULT '{}',
  weather_tags TEXT[] NOT NULL DEFAULT '{}',
  nutrition_tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Required MVP Recipe Fields

- title
- meal_types
- cooking_time_minutes
- difficulty
- ingredients
- tags

---

## 6. favorites

사용자가 저장한 레시피를 관리한다.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'home_recommendation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT favorites_owner_check CHECK (
    user_id IS NOT NULL OR anonymous_user_id IS NOT NULL
  )
);
```

### Unique Indexes

```sql
CREATE UNIQUE INDEX favorites_user_recipe_unique
ON favorites(user_id, recipe_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX favorites_anonymous_recipe_unique
ON favorites(anonymous_user_id, recipe_id)
WHERE anonymous_user_id IS NOT NULL;
```

---

## 7. meal_history

사용자가 `😊 좋아!! 이걸로 할게!`를 눌렀을 때 저장한다.

```sql
CREATE TABLE meal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  recommendation_id UUID,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'late_night')),
  source TEXT NOT NULL DEFAULT 'ai_home_recommendation',
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT meal_history_owner_check CHECK (
    user_id IS NOT NULL OR anonymous_user_id IS NOT NULL
  )
);
```

### Purpose

- 최근 먹은 메뉴 제외
- 추천 품질 개선
- 사용자 식사 히스토리 제공
- 향후 건강/영양 분석 기반 데이터

---

## 8. home_recommendation_sessions

홈 화면 추천 세션을 저장한다.

하나의 홈 진입 또는 refresh는 하나의 recommendation session이 된다.

```sql
CREATE TABLE home_recommendation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'late_night')),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  chef_message TEXT NOT NULL,
  reason TEXT NOT NULL,
  badges JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC(4, 3) DEFAULT 0.500,
  fallback_used BOOLEAN DEFAULT false,
  source TEXT NOT NULL DEFAULT 'home_initial',
  previous_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT home_recommendation_owner_check CHECK (
    user_id IS NOT NULL OR anonymous_user_id IS NOT NULL
  )
);
```

### Source Values

```text
home_initial
home_refresh
fallback
```

---

## 9. ai_recommendation_logs

AI 추천 요청/응답/점수 정보를 저장한다.

```sql
CREATE TABLE ai_recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL DEFAULT 'home_recommendation',
  input JSONB NOT NULL DEFAULT '{}',
  selected_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  fallback_used BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  error_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Purpose

- 추천 품질 개선
- fallback 발생률 추적
- AI 응답 속도 측정
- 추천 알고리즘 디버깅

---

## 10. Optional Future Tables

MVP 이후 추가 가능.

```text
user_preferences
recipe_ratings
recipe_views
family_profiles
refrigerator_items
shopping_lists
nutrition_profiles
```

MVP에서는 만들지 않는다.

---

## 11. Relationships

```text
users
  └── favorites
  └── meal_history
  └── home_recommendation_sessions
  └── ai_recommendation_logs

anonymous_users
  └── favorites
  └── meal_history
  └── home_recommendation_sessions
  └── ai_recommendation_logs

recipes
  └── favorites
  └── meal_history
  └── home_recommendation_sessions
  └── ai_recommendation_logs
```

---

## 12. Index Strategy

### recipes

```sql
CREATE INDEX recipes_meal_types_idx ON recipes USING GIN (meal_types);
CREATE INDEX recipes_tags_idx ON recipes USING GIN (tags);
CREATE INDEX recipes_cooking_time_idx ON recipes(cooking_time_minutes);
CREATE INDEX recipes_active_idx ON recipes(is_active);
```

### meal_history

```sql
CREATE INDEX meal_history_user_selected_idx
ON meal_history(user_id, selected_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX meal_history_anonymous_selected_idx
ON meal_history(anonymous_user_id, selected_at DESC)
WHERE anonymous_user_id IS NOT NULL;
```

### home_recommendation_sessions

```sql
CREATE INDEX home_sessions_user_created_idx
ON home_recommendation_sessions(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX home_sessions_anonymous_created_idx
ON home_recommendation_sessions(anonymous_user_id, created_at DESC)
WHERE anonymous_user_id IS NOT NULL;
```

### ai_recommendation_logs

```sql
CREATE INDEX ai_logs_request_id_idx ON ai_recommendation_logs(request_id);
CREATE INDEX ai_logs_created_idx ON ai_recommendation_logs(created_at DESC);
CREATE INDEX ai_logs_fallback_idx ON ai_recommendation_logs(fallback_used);
```

---

## 13. MVP Seed Data

MVP 개발용으로 최소 10개 레시피를 seed 한다.

```text
아침:
- 계란토스트
- 오트밀 바나나볼

점심:
- 김치볶음밥
- 닭가슴살 샐러드

저녁:
- 제육볶음
- 된장찌개
- 닭볶음탕
- 소고기무국

야식:
- 계란찜
- 간장비빔국수
```

---

## 14. Example Seed Recipe

```json
{
  "title": "제육볶음",
  "subtitle": "20분이면 완성되는 든든한 저녁 메뉴",
  "cuisine_type": "korean",
  "meal_types": ["dinner", "lunch"],
  "cooking_time_minutes": 20,
  "difficulty": "easy",
  "ingredients": ["돼지고기", "양파", "대파", "고추장", "간장"],
  "allergens": ["soy"],
  "tags": ["집밥", "고기", "빠른요리", "가족식사"],
  "spicy_level": 2,
  "suitable_for_children": false,
  "season_tags": ["all"],
  "weather_tags": ["cloudy", "cold"],
  "nutrition_tags": ["protein"]
}
```

---

## 15. Data Flow

### Home Initial Load

```text
anonymousId 생성 또는 조회
→ anonymous_users upsert
→ recipes 후보 조회
→ recommendation engine 점수 계산
→ home_recommendation_sessions 저장
→ ai_recommendation_logs 저장
→ HomeRecommendationDTO 반환
```

### Accept Flow

```text
사용자 CTA 클릭
→ meal_history insert
→ recipe detail 이동
```

### Refresh Flow

```text
사용자 refresh 클릭
→ 이전 recipe 제외
→ 새 추천 계산
→ home_recommendation_sessions 저장
→ ai_recommendation_logs 저장
→ 새 recommendation 반환
```

### Save Flow

```text
사용자 저장 클릭
→ favorites upsert
→ saved state 반환
```

---

## 16. Privacy Rules

- anonymousId는 개인식별정보로 취급하지 않지만 최소한으로 저장한다.
- 건강 관련 민감 데이터는 MVP에서 저장하지 않는다.
- 알레르기 정보는 추후 저장 시 별도 user_preferences 테이블에서 관리한다.
- 삭제 요청 시 anonymousId 기준 데이터 삭제 가능해야 한다.

---

## 17. Migration Order

Codex or backend developer should create migrations in this order.

1. users
2. anonymous_users
3. recipes
4. favorites
5. home_recommendation_sessions
6. meal_history
7. ai_recommendation_logs
8. indexes
9. seed recipes

---

## 18. Codex Implementation Instructions

Codex should not create production DB migration yet unless explicitly requested.

For Home MVP frontend implementation:

1. Use mock data based on this schema.
2. Create TypeScript types that mirror DB fields only where needed.
3. Keep database field names compatible with backend API.
4. Do not implement user login yet.
5. Use anonymousId mock value.
6. Keep meal_history, favorites, and ai_logs as mock service actions.

For backend implementation later:

1. Create SQLAlchemy models based on this document.
2. Create Alembic migrations.
3. Seed MVP recipes.
4. Implement repository layer.
5. Implement service layer.
6. Implement API endpoints from Home API Spec.

---

## 19. Acceptance Criteria

- Home recommendation can be represented by DB schema.
- Anonymous user can receive and accept recommendations.
- Favorite save can be represented.
- Meal history can be stored.
- AI recommendation logs can be stored.
- Refresh sessions can avoid previous recipe.
- Schema supports MVP without login.
- Schema can later support login and data migration.

---

## 20. Final Rule

Do not overbuild the database.

The Home MVP database should support one simple promise:

AI Chef recommends one meal, and we remember what the user did with it.
