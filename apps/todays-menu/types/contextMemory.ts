/**
 * Sprint 41 — HCME (Hankki Context Memory Engine).
 * Explicit user input only — never inferred.
 */

export type DiningSituation = 'alone' | 'family' | 'partner' | 'friends' | 'work';

export type MealGoal = 'light' | 'filling' | 'quick' | 'warm' | 'refreshing';

export type ContextMood = 'good' | 'tired' | 'stressed' | 'sick' | 'special';

export type ContextMemorySelection = {
  diningSituation: DiningSituation | null;
  mealGoal: MealGoal | null;
  /** Future HCME phase — not shown in MVP UI. */
  mood: ContextMood | null;
};

/** Persisted session context (resets daily). */
export type ContextMemoryStore = {
  version: 1;
  date: string;
  diningSituation: DiningSituation | null;
  mealGoal: MealGoal | null;
  mood: ContextMood | null;
  updatedAt: string;
  extensions: ContextMemoryExtensions;
};

/** Future: calendar, grocery, meal kit, family, AI chef. */
export type ContextMemoryExtensions = {
  calendar?: Record<string, unknown>;
  grocery?: Record<string, unknown>;
  mealKit?: Record<string, unknown>;
  family?: Record<string, unknown>;
  aiChef?: Record<string, unknown>;
};

/** Read model for HMIE — attached to RecommendationContext. */
export type ContextMemorySnapshot = {
  version: 1;
  date: string;
  diningSituation: DiningSituation | null;
  mealGoal: MealGoal | null;
  mood: ContextMood | null;
  hasExplicitInput: boolean;
  extensions: ContextMemoryExtensions;
};

export type ContextMemoryPatch = Partial<ContextMemorySelection>;
