/** Home hero card — display-only constants (detail screens unchanged). */
export type HeroFocalPoint = {
  readonly x: number;
  readonly y: number;
};

export const HOME_HERO_DISPLAY = {
  /** Matches `homeRef.hero.aspectRatio`. */
  aspectRatio: 1.6,
  minHeight: 188,
  maxHeight: 220,
  /**
   * Default visual anchor — food center ~42–44% from top of crop.
   * Shifts cover crop upward slightly to clear bottom Seed + tip card.
   */
  defaultFocalPoint: { x: 0.5, y: 0.46 } satisfies HeroFocalPoint,
  /** Extra image height (%) for focal repositioning without changing container. */
  focalScale: 1.28,
  /** Bottom ~22% reserved for Seed mascot + cream tip card. */
  bottomOverlaySafeRatio: 0.22,
  /** Top ~18% reserved for badge + title overlay. */
  topOverlaySafeRatio: 0.18,
} as const;
