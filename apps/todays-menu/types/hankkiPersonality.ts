/** Sprint 37 — HANKKI Personality Engine v1.0 */

/** How today feels — before choosing a meal. */
export type TodayMoment =
  | 'hot'
  | 'cold'
  | 'rainy'
  | 'weekend'
  | 'late_night'
  | 'weekday'
  | 'pleasant';

/** How the user might feel right now. */
export type UserFeeling =
  | 'busy'
  | 'tired'
  | 'happy'
  | 'lazy'
  | 'comfort'
  | 'family'
  | 'alone';

export type HankkiPersonalitySnapshot = {
  todayMoments: TodayMoment[];
  feelings: UserFeeling[];
  primaryMoment: TodayMoment;
  primaryFeeling: UserFeeling;
};

export type PersonalityVoice = {
  /** Level 1 — gentle suggestion, never an order */
  headline: string;
  /** Level 3 warm label */
  suggestion: string;
  /** Optional feeling-aware line for explanations */
  feelingHint: string;
};
