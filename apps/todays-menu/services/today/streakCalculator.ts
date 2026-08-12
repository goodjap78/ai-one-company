import type { MealHistoryEntry } from '../../types/mealHistory';

export function calculateCookingStreak(
  entries: MealHistoryEntry[],
  referenceDate = new Date(),
): number {
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map((entry) => entry.cookedDate));
  const today = formatDate(referenceDate);
  const yesterday = formatDate(addDays(referenceDate, -1));

  let cursor: Date;
  if (dates.has(today)) {
    cursor = startOfDay(referenceDate);
  } else if (dates.has(yesterday)) {
    cursor = startOfDay(addDays(referenceDate, -1));
  } else {
    return 0;
  }

  let streak = 0;
  while (dates.has(formatDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
