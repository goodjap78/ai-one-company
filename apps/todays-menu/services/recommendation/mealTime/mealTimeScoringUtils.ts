import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

export function textBlob(parts: string[]): string {
  return parts.join(' ').toLowerCase();
}

export function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function primaryMealTimeFromFit(
  fit: Record<MealTimeSlotKey, number>,
): MealTimeSlotKey {
  let best: MealTimeSlotKey = 'dinner';
  let bestScore = -1;
  for (const slot of ['breakfast', 'lunch', 'dinner', 'lateNight'] as MealTimeSlotKey[]) {
    if (fit[slot] > bestScore) {
      bestScore = fit[slot];
      best = slot;
    }
  }
  return best;
}

export type ScoreAccumulator = {
  score: number;
  reasons: string[];
};

export function bump(acc: ScoreAccumulator, delta: number, reason: string): void {
  acc.score += delta;
  acc.reasons.push(reason);
}

export function finalize(acc: ScoreAccumulator): { score: number; reasons: string[] } {
  return { score: clampScore(acc.score), reasons: acc.reasons };
}
