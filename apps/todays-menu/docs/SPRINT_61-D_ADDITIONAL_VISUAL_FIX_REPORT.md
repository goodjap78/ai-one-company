# SPRINT 61-D ADDITIONAL VISUAL FIX REPORT

## 1. Hero badge/title 위치

- `오늘의 추천 ⭐` badge → Hero 이미지 **내부 좌측 상단**
- 음식 이름 → badge **아래**, 이미지 **내부** (white text + gradient)
- favorite heart → 이미지 **우측 상단** 유지

## 2. 중복 설명 삭제

- `shortDescription` / `resolveShortHeroDescription` 제거
- "오늘 날씨에 잘 어울려요" 등 별도 추천 설명 text block **삭제**
- 추천 이유는 한끼 mascot speech bubble만 사용

## 3. Alternative card image 확대

- 원형 thumbnail 제거
- 카드 폭 100% **rectangular food image** (aspect 1.05)
- 카드 상단 대부분 = 음식 사진, 하단 = 메뉴명 + 조리시간
- 3-column 한 줄 유지

## 4. Primary button 확인

- 변경 없음 (icon + title mini buttons, subtitle 없음, 한 줄)

## 5. Meal tab full width 확인

- 변경 없음 (4등분 segmented, gap 2px)

## 6. 한끼 더하기 slim 확인

- minHeight **28px**, padding/icon 추가 축소

## 7. Modified files

- `components/home/TodayMealCard.tsx`
- `components/home/AlternativeMealsRow.tsx`
- `components/home/HomeComingSoonSection.tsx`
- `docs/sprint-61-d-additional-fix.png`

## 8. Screenshot

Reference: `docs/sprint-61-d-additional-fix.png`

### Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Badge inside Hero | ✅ |
| 2 | Title inside Hero | ✅ |
| 3 | Weather/description text removed | ✅ |
| 4 | Alt images rectangular full-width | ✅ |
| 5 | Alt 3-column one row | ✅ |

## 9. PASS / FAIL

**PASS** — visual-only changes; `test:home-navigation`, `test:cross-slot-hero-diversity` PASS.
