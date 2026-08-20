/**
 * Central product feature flags for release toggles.
 * Flip values here — do not scatter hard-coded booleans across UI.
 */

export const FEATURE_FLAGS = {
  /**
   * Meal Kit pilot UI (CTA / shopping mode / QA entry).
   * Data, eligibility, search helpers, and analytics schemas stay in place.
   * Set true to restore user-facing meal-kit surfaces.
   */
  mealKitEnabled: false,
} as const;

export function isMealKitFeatureEnabled(): boolean {
  return FEATURE_FLAGS.mealKitEnabled === true;
}
