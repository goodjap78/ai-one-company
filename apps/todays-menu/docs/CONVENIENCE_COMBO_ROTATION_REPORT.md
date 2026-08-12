# CONVENIENCE_COMBO_ROTATION_REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## 1. Current recommendation source

- Route: Home `router.push('/convenience-combos')` → `ConvenienceComboRecommendationScreen`
- Catalog: `listAllConvenienceCombos` / `filterConvenienceCombos` (situation tags)
- Scoring: `scoreComboForRecommendation` (hack_combo + imageKey + favorite boost)
- Pick: `pickPrimaryRecommendation` (deterministic sort, first eligible)

## 2. Root cause

`pickPrimaryRecommendation` always returns the same top-scored combo when `excludeIds` is empty.

On screen entry, `useState` initializer called it with `[]` every time. Session history existed only as component state for the in-screen “다른 추천” button, and was discarded on unmount. Re-entering from Home therefore always showed the same featured combo (and the same alternate strip).

## 3. Existing entry behavior

- First mount: always situation `hearty` #1
- Re-render: same state (correct)
- Leave Home + re-enter: same #1 again (bug)
- “다른 추천” button: already rotated via `pickNextRecommendation`

## 4. New rotation trigger

`useFocusEffect` on the recommendation screen:

- Home → 편의점 꿀조합 진입: `pickEntryRecommendation` (exclude session-recent)
- 화면 보는 동안 / 단순 re-render: 유지 (`useFocusEffect` deps `[]`)
- 상세 / 전체 목록 다녀오기: `skipRotationOnFocusRef`로 현재 추천 유지
- “다른 추천” 버튼: 기존 `pickNextRecommendation` + session history

## 5. Recent-history policy

In-memory session list (not AsyncStorage), last **3** IDs.

- Survives screen unmount within the app process
- Resets when the app process restarts
- Shared by entry pick, situation change, and “다른 추천”

## 6. Repeat prevention behavior

New entry excludes the last 1–3 shown IDs, then picks the next highest-scored eligible combo. Alternates also exclude session-recent IDs when the pool is large enough.

## 7. Candidate shortage fallback

If every candidate is in the exclude set, `pickPrimaryRecommendation` returns `sorted[0]` (no crash, reuse oldest/top). Alternates fall back to “exclude current only” if the extra-exclude pool is too small.

## 8. Modified files

- `services/convenience/convenienceComboRecommendation.ts`
- `components/convenience/ConvenienceComboRecommendationScreen.tsx`
- `scripts/test-convenience-combo-recommendation.ts`
- `docs/CONVENIENCE_COMBO_ROTATION_REPORT.md`

## 9. Tests

- `test:convenience-combo-recommendation` — Scenario A–D + wiring
- `test:convenience-combos` — catalog regression
- `smoke:rc`

## 10. Regression

No changes to Home main recommendation, Fridge Raid, personalization, recipe ranking, 최근 본 메뉴, 저장한 메뉴. Combo catalog / scoring weights unchanged.

## 11. Android rebuild required

**Yes** — JS bundle change. Include in the in-progress Preview APK (or rebuild if that build already bundled older JS).
