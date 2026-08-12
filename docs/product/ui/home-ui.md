# docs/product/ui/home-ui.md
# Today's Menu - Home UI Design v1.0

## 0. UI Goal

Home 화면은 사용자가 앱을 열자마자 복잡한 탐색 없이 AI Chef가 추천한 한 끼를 바로 결정하도록 만드는 화면이다.

핵심 감정은 다음과 같다.

- 따뜻함
- 편안함
- 신뢰감
- 간단함
- “생각하지 않아도 된다”는 느낌

---

## 1. Design Direction

### Style Keywords

- Warm Minimal
- AI Chef Companion
- One Tap Decision
- Family Friendly
- Soft Premium
- Clean Korean Mobile App

### Avoid

- 복잡한 메뉴 리스트
- 지나친 카드 나열
- 광고 배너
- 과한 색상
- 복잡한 필터
- 첫 화면 검색창

---

## 2. Screen Layout

```text
┌──────────────────────────────┐
│ Status Bar                   │
├──────────────────────────────┤
│ Greeting Section             │
│ 좋은 저녁이에요 😊             │
│ 오늘도 고생 많으셨어요.        │
├──────────────────────────────┤
│ AI Chef Recommendation Card  │
│                              │
│ 🍳 AI Chef                   │
│ 오늘 저녁은                  │
│ 제육볶음을 추천드려요.         │
│                              │
│ [Food Image Area]            │
│                              │
│ 20분 · 재료 92% · 단백질 충분 │
│                              │
│ 추천 이유                    │
│ 빠르게 만들 수 있고 가족 식사로│
│ 좋아요.                      │
│                              │
│ [😊 좋아!! 이걸로 할게!]      │
│ [🍳 다른 메뉴 추천해줘!]       │
├──────────────────────────────┤
│ Quick Actions                │
│ ❤️ 저장하기   📖 레시피 보기   │
├──────────────────────────────┤
│ Bottom Navigation            │
│ 홈 · 검색 · 저장 · 마이        │
└──────────────────────────────┘
```

---

## 3. Visual Hierarchy

### Priority 1

AI Chef 추천 메뉴 카드

### Priority 2

Primary CTA: `😊 좋아!! 이걸로 할게!`

### Priority 3

Secondary CTA: `🍳 다른 메뉴 추천해줘!`

### Priority 4

저장하기 / 레시피 보기

### Priority 5

Bottom Navigation

---

## 4. Color System

Use design tokens only.

```json
{
  "color.primary": "#FF6B35",
  "color.primarySoft": "#FFF4EC",
  "color.background": "#FFFFFF",
  "color.surface": "#F8F8F8",
  "color.card": "#FFFFFF",
  "color.textPrimary": "#1E1E1E",
  "color.textSecondary": "#666666",
  "color.border": "#EFEFEF",
  "color.success": "#2EBD59",
  "color.warning": "#F4B400",
  "color.error": "#E53935"
}
```

### Usage

- Primary Button: `#FF6B35`
- Background: `#FFFFFF`
- AI Chef Card Background: `#FFF4EC` or white card with soft orange accent
- Text Primary: `#1E1E1E`
- Secondary Text: `#666666`

---

## 5. Typography

Font:

```text
Pretendard
Noto Sans KR fallback
```

### Text Scale

```text
Greeting Title: 24px / Bold
Greeting Subtitle: 15px / Regular

AI Label: 15px / SemiBold
Menu Title: 32px / Bold
Menu Subtitle: 16px / Medium
Meta Text: 14px / Medium
Reason Text: 15px / Regular

Primary Button: 17px / Bold
Secondary Button: 16px / SemiBold
Bottom Nav Label: 12px / Medium
```

---

## 6. Spacing

Use 4pt grid.

```text
Screen Padding: 20px
Section Gap: 20px
Card Padding: 24px
Card Inner Gap: 16px
Button Gap: 12px
Bottom Nav Height: 72px
```

---

## 7. Radius

```text
Main Recommendation Card: 28px
Food Image: 24px
Primary Button: 18px
Secondary Button: 18px
Quick Action Button: 16px
Bottom Navigation: 24px top radius
```

---

## 8. Home Components

### 8.1 GreetingHeader

Purpose:
사용자에게 따뜻한 첫 인상을 준다.

Content:

```text
좋은 저녁이에요 😊
오늘도 고생 많으셨어요.
```

Rules:

- 화면 상단에 위치
- 너무 길지 않게 유지
- 사용자의 이름은 MVP에서는 선택 사항
- 문구는 시간대에 따라 변경 가능

---

### 8.2 AIRecommendationCard

Main Home component.

Required elements:

- AI Chef label
- Menu title
- Short recommendation message
- Food image area
- Meta badges
- Recommendation reason
- Primary CTA
- Secondary CTA

Layout:

```text
Card
├── AI Chef Label
├── Menu Title
├── Short Message
├── Food Image
├── Meta Badge Row
├── Reason Box
├── Primary CTA
└── Secondary CTA
```

---

### 8.3 Food Image Area

MVP에서는 이미지가 없어도 기본 placeholder를 사용한다.

Placeholder:

```text
🍳
```

또는 soft gradient background.

Rules:

- 이미지가 있으면 16:10 비율
- 이미지가 없으면 따뜻한 일러스트 느낌의 placeholder
- 어두운 이미지 금지
- 음식이 중앙에 크게 보여야 함

---

### 8.4 Meta Badges

Example:

```text
⏱ 20분
🥕 재료 92%
💪 단백질 충분
```

Rules:

- 최대 3개
- 한 줄 표시
- 넘치면 horizontal scroll 대신 2줄 wrap 허용
- 색상은 soft background 사용

---

### 8.5 Recommendation Reason

Example:

```text
오늘 저녁에는 빠르게 만들 수 있고 가족 식사로 좋은 제육볶음을 추천드려요.
```

Rules:

- 1~2문장만 사용
- 너무 전문적인 표현 금지
- 사용자가 바로 이해해야 함

---

### 8.6 PrimaryDecisionButton

Label:

```text
😊 좋아!! 이걸로 할게!
```

Style:

```text
Height: 56px
Radius: 18px
Background: Primary
Text: White
Font: 17px Bold
```

Behavior:

- 클릭 시 recipe detail로 이동
- 클릭 즉시 선택된 메뉴를 meal history에 저장
- haptic success feedback

---

### 8.7 RefreshRecommendationButton

Label:

```text
🍳 다른 메뉴 추천해줘!
```

Style:

```text
Height: 52px
Radius: 18px
Background: Primary Soft
Text: Primary
Border: none
```

Behavior:

- 클릭 시 AI Thinking Loader 표시
- 새로운 추천 메뉴 1개만 표시
- 연속 클릭 방지 1.5초

---

### 8.8 QuickActions

Actions:

```text
❤️ 저장하기
📖 레시피 보기
```

Rules:

- Primary CTA보다 작게
- 카드 하단 또는 카드 아래에 배치
- MVP에서는 두 개만 제공

---

### 8.9 BottomNavigation

Items:

```text
홈
검색
저장
마이
```

Rules:

- 홈이 기본 선택 상태
- 아이콘 + 텍스트
- 과한 그림자 금지
- Safe area 고려

---

## 9. Interaction States

### Default

추천 메뉴 카드가 표시된다.

### Loading

```text
🍳 AI Chef가 다시 생각하고 있어요.
🥩 영양 밸런스 확인 중...
🥦 냉장고 재료 확인 중...
🍚 오늘 시간대에 맞는 메뉴 찾는 중...
```

UI:

- Card 내부에서 표시
- 전체 화면을 막지 않음
- 부드러운 pulse animation

### Empty

```text
🍳 AI Chef가 첫 메뉴를 준비하고 있어요.
몇 가지만 알려주시면 더 잘 추천해드릴게요.
```

CTA:

```text
취향 설정하기
```

### Error

```text
AI Chef가 잠시 쉬고 있어요.
대신 오늘 인기 메뉴를 추천드릴게요.
```

CTA:

```text
다시 시도
```

---

## 10. Motion

### Initial Load

- Greeting: fade in 200ms
- Recommendation Card: slide up + fade in 300ms
- CTA Button: fade in 400ms

### Refresh

- Old card fades out
- AI Thinking Loader appears
- New card slides up

### Button Press

- Scale 0.98 for 100ms
- Haptic success on primary decision

---

## 11. Accessibility

- 모든 터치 영역 최소 48px
- 버튼 텍스트는 명확해야 함
- 색상만으로 상태를 구분하지 않음
- VoiceOver label 제공

Examples:

```text
좋아 이걸로 할게 버튼. 제육볶음 레시피로 이동합니다.
다른 메뉴 추천해줘 버튼. AI Chef가 새로운 메뉴를 추천합니다.
```

---

## 12. Mobile Breakpoints

### Small Phone

Width: 360px

- Card padding 20px
- Menu title max 30px
- Meta badges wrap 허용

### Standard Phone

Width: 390~430px

- Default layout

### Large Phone

Width: 430px+

- Card width full
- Image area slightly taller

---

## 13. Codex UI Implementation Rules

Codex must:

1. Create `components/home/` folder.
2. Split UI into reusable components.
3. Use TypeScript.
4. Use existing theme tokens.
5. Avoid inline color values.
6. Avoid inline repeated spacing values.
7. Implement loading, empty, and error UI.
8. Do not add search bar to Home.
9. Do not add menu list to Home.
10. Do not add ads to Home.
11. Keep Home focused on one recommendation.
12. Use mock data before real API.
13. Make UI mobile-first.
14. Keep copy exactly aligned with this document unless Korean grammar requires minor adjustment.

---

## 14. Visual Reference Prompt for AI Design Tools

Use this prompt if creating a visual mockup:

```text
Design a warm minimal Korean mobile app home screen for an AI food recommendation app called Today's Menu.

The screen should feel like an AI Chef is personally recommending one meal.

Use a clean white background, soft orange accent color, rounded cards, friendly Korean typography, and one large recommendation card.

Main text:
좋은 저녁이에요 😊
오늘도 고생 많으셨어요.
AI Chef
오늘 저녁은 제육볶음을 추천드려요.
20분 · 재료 92% · 단백질 충분
오늘 저녁에는 빠르게 만들 수 있고 가족 식사로 좋은 제육볶음을 추천드려요.
😊 좋아!! 이걸로 할게!
🍳 다른 메뉴 추천해줘!

Avoid search bars, ads, complex lists, and crowded UI.
```

---

## 15. Final UI Principle

Home UI must feel like this:

> “앱이 나에게 메뉴를 고르라고 하는 것이 아니라, AI Chef가 이미 나를 위해 골라준 느낌.”

That feeling is more important than adding more features.
