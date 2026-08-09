/**
 * Sprint 56-G — Phase 1 convenience illustration icon keys (production wired).
 */
export const CONVENIENCE_ILLUSTRATION_ICON_KEYS = [
  'cup_ramen',
  'cup_rice',
  'triangle_kimbap',
  'milk',
  'salad',
  'lunchbox',
  'sandwich',
  'hamburger',
  'hot_bar',
  'cup_udon',
] as const;

export type ConvenienceIllustrationIconKey =
  (typeof CONVENIENCE_ILLUSTRATION_ICON_KEYS)[number];
