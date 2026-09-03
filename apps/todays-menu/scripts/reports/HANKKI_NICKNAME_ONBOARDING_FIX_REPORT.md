# HANKKI_NICKNAME_ONBOARDING_FIX_REPORT

Date: 2026-09-02  
Scope: First-launch nickname onboarding input / save bug  
Project: `apps/todays-menu`

---

## ONBOARDING_SCREEN

| Item | Value |
|---|---|
| Route | `/onboarding` → `app/onboarding.tsx` → `OnboardingScreen` |
| Bootstrap | `app/index.tsx` — splash 후 `getNickname()` 없으면 `/onboarding` redirect |
| Edit mode | `/onboarding?mode=edit` (마이페이지에서 진입) |

---

## NICKNAME_INPUT

| Item | State |
|---|---|
| Component | `TextInput` in `OnboardingScreen.tsx` |
| `value` / `onChangeText` | Controlled via `nickname` state + **`nicknameRef`** sync |
| Initial value | `''` (first launch) / `getNickname()` trim (edit mode) |
| `maxLength` | **12** (`NICKNAME_MAX_LENGTH`) |
| Validation | `validateNicknameInput()` — empty + >12 only (no min-length block on button) |
| Button disabled | **`saving` only** (not disabled when empty — shows error on submit) |

---

## STORAGE_KEY

| Key | Purpose |
|---|---|
| `@todays_menu/nickname` | **Primary** — `getNickname()` / `saveNickname()` — used by home, my page, bootstrap |
| `@hankki/user_profile` | Profile JSON — `saveUserProfile({ nickname })` on submit |
| `@hankki/onboarding_complete` | Set `true` after save — **not used for routing** (nickname gate only) |

Read/write for display: **home + my page both use `getNickname()`** — same key.

---

## COMPLETION_FLAG

`setOnboardingComplete(true)` runs **after** `saveNickname` and `saveUserProfile` (correct order).

---

## ROOT_CAUSE

**Two confirmed interaction bugs (not storage key mismatch):**

### 1. Keyboard / button tap swallowing (Tests D)

`TouchableWithoutFeedback` wrapped the entire `ScrollView` including the submit button, with `keyboardShouldPersistTaps="handled"`.

**Symptom:** With keyboard open, first tap on “한끼 시작하기” often only dismissed the keyboard; submit felt like it didn’t work or needed a second tap.

### 2. Korean IME composition lag (Test C)

Submit read `nickname` React state immediately on button press. During Hangul composition, the final syllable may not yet be in state when `handleStart` runs.

**Symptom:** Last character missing, or empty submit right after typing.

**Not the cause:** Storage key mismatch (home/my/bootstrap all use `@todays_menu/nickname`), onboarding flag order, or button disabled on empty nickname.

---

## FILES_CHANGED

| File | Change |
|---|---|
| `components/onboarding/OnboardingScreen.tsx` | Ref sync, IME flush, remove `TouchableWithoutFeedback`, `keyboardShouldPersistTaps="always"`, `onEndEditing`, `finally` reset `saving` |
| `services/nicknameValidation.ts` | **Added** — trim/length validation + `waitForImeCommit()` |
| `scripts/test-nickname-onboarding.ts` | **Added** — static + validation QA |

---

## IME_KOREAN_INPUT

**Fixed** — `nicknameRef` updated on every `onChangeText` + `onEndEditing`; submit calls `blur()` + `waitForImeCommit()` (2× `requestAnimationFrame`) before reading ref.

---

## BUTTON_DISABLED_LOGIC

**Unchanged intent** — disabled only while `saving` (and `!editReady` in edit mode). Not disabled when empty (validation error on submit).

---

## KEYBOARD_TAP

**Fixed** — removed outer `TouchableWithoutFeedback`; `keyboardShouldPersistTaps="always"` on `ScrollView`.

---

## TRIM

**Yes** — `validateNicknameInput()` trims; `saveNickname()` also trims before `AsyncStorage.setItem`.

Test B: `"순석 "` → `"순석"` ✅

---

## PERSISTENCE

`saveNickname(trimmed)` → `@todays_menu/nickname`  
Bootstrap `app/index.tsx` and `app/(tabs)/index.tsx` read same key on load.

---

## RELAUNCH_TEST

Static verification: bootstrap + home tab both call `getNickname()` on mount. Manual device test E recommended.

---

## MY_PAGE_SYNC

`MyProfileHeader` uses `getNickname()` on `useFocusEffect` — same storage as onboarding save. Edit flow returns via `router.back()` → refocus reloads nickname.

---

## WEB_TEST

`npx expo export --platform web` — **PASS**

---

## ANDROID_STATIC_TEST

`scripts/test-nickname-onboarding.ts` — **PASS** (validation + source assertions).  
`scripts/test-home-navigation.ts` — **PASS**

---

## REGRESSION

| Test | Result |
|---|---|
| `test-nickname-onboarding.ts` | **PASS** |
| `test-home-navigation.ts` | **PASS** |
| Web export | **PASS** |

---

## REPRODUCTION MATRIX (post-fix)

| Case | Expected |
|---|---|
| A. 순석 → 완료 → 마이 | Saved + displayed |
| B. "순석 " trailing space | Trimmed to 순석 |
| C. 한글 입력 직후 완료 | Ref + IME flush — no missing final jamo |
| D. 키보드 열린 상태 완료 | Single tap reaches `Pressable` |
| E. 재실행 | `getNickname()` persists via AsyncStorage |

---

## RESULT

**PASS** (code fix + static QA; manual screenshot/device QA for A–E still recommended)

---

## Test command

```bash
cd apps/todays-menu
npx tsx scripts/test-nickname-onboarding.ts
```

---

*Other v1.1 sprints untouched. Next sprint on hold.*
