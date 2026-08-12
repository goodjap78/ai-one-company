# SPRINT 61-D VISUAL CORRECTION REPORT

## 1. Primary feature mini button 변경

- `HomeFeatureCards` → horizontal mini buttons (icon left + title right).
- Subtitle 제거, gradient card 제거, height ~34px.
- `adjustsFontSizeToFit`로 **편의점 꿀조합** 한 줄 유지 (360px).

## 2. Meal time full-width 변경

- Segmented track: gap **2px**, padding **2px**, tab `flex: 1` 4등분.
- minHeight 32px, full container width.

## 3. Hero title position restore

- **오늘의 추천 badge + 메뉴 제목 + 짧은 설명** → 음식 이미지 **위쪽** 별도 텍스트 영역.
- 이미지 overlay / 이미지 아래 제목 구조 제거.

## 4. Mascot Hero 내부 복원

- `HomeRecommendTip` `compact` mode: mascot 28px, hero 이미지 **내부 하단** overlay.
- 제목·설명은 이미지 밖 상단에만 표시.

## 5. Alternative 3-column 변경

- 3-column 한 줄 유지, thumb 32px, minHeight 76px, hairline border.

## 6. 한끼 더하기 slim 변경

- Primary와 동일 언어: icon + title horizontal mini buttons.
- minHeight 32px, subtitle UI 제거, 작은 준비 중 badge.

## 7. Spacing 조정

- `phoneFrame` gap **12 → 8px**.
- recommendation header → hero 간격 6px.

## 8. Responsive 결과

| Check | Status |
|-------|--------|
| Primary 3 한 줄 | Implemented |
| 편의점 꿀조합 1줄 | `adjustsFontSizeToFit` |
| Meal tabs full width | Implemented |
| Alternative 3 한 줄 | Implemented |
| Title above image | Implemented |
| Mascot inside hero | Implemented |
| 한끼 더하기 slim | Implemented |

Manual QA at 360 / 390 / 430px recommended.

## 9. Modified files

- `components/home/HomeFeatureCards.tsx`
- `components/home/TodayMealCard.tsx`
- `components/home/HomeRecommendTip.tsx`
- `components/home/MealTimeSlotTabs.tsx`
- `components/home/AlternativeMealsRow.tsx`
- `components/home/HomeComingSoonSection.tsx`
- `components/home/HomeScreen.tsx`
- `docs/sprint-61-d-final-home.png`

## 10. Regression 결과

| Test | Result |
|------|--------|
| `test:meal-time-recommendation-engine` | PASS |
| `test:cross-slot-hero-diversity` | PASS |
| `test:home-navigation` | PASS |
| `smoke:rc` | PASS (15/15) |

Engine, routes, handlers — **no changes**.

## 11. 발견된 이슈

- 실기기 스크린샷은 시뮬레이터/디바이스에서 최종 확인 필요.
- Hero heart는 이미지 우측 상단 overlay 유지 (기존 behavior).

## 12. Final screenshots

Reference mock: `docs/sprint-61-d-final-home.png`

---

## Final verdict: **PASS**

Visual structure matches approved design direction. Confirm on device for final sign-off.
