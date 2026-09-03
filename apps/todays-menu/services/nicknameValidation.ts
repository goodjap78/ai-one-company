import { ONBOARDING_COPY } from '../constants/onboardingCopy';

export const NICKNAME_MAX_LENGTH = 12;

export type NicknameValidationError = 'empty' | 'too_long';

export function validateNicknameInput(raw: string): {
  ok: true;
  value: string;
} | {
  ok: false;
  error: NicknameValidationError;
} {
  const trimmed = raw.trim();
  if (trimmed.length < 1) {
    return { ok: false, error: 'empty' };
  }
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return { ok: false, error: 'too_long' };
  }
  return { ok: true, value: trimmed };
}

export function nicknameValidationMessage(error: NicknameValidationError): string {
  if (error === 'empty') return ONBOARDING_COPY.errorEmpty;
  return ONBOARDING_COPY.errorTooLong;
}

/** Flush IME composition — blur then wait two frames before reading submit value. */
export function waitForImeCommit(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
