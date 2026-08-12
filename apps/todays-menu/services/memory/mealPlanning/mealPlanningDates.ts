export const SAVED_MEAL_RETENTION_DAYS = 14;

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isSavedMealActive(savedAt: string, now = new Date()): boolean {
  const saved = new Date(savedAt);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - SAVED_MEAL_RETENTION_DAYS);
  return saved >= cutoff;
}
