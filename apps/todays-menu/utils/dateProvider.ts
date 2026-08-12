/**
 * Sprint 57 — injectable clock for daily recommendation + tests.
 * Production uses real local time; tests swap provider without UI controls.
 */
export type DateProvider = () => Date;

let dateProvider: DateProvider = () => new Date();

export function getNow(): Date {
  return dateProvider();
}

export function setDateProviderForTests(provider: DateProvider | null): void {
  dateProvider = provider ?? (() => new Date());
}

/** User-local calendar date YYYY-MM-DD (not UTC). */
export function getLocalDateKey(now = getNow()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
