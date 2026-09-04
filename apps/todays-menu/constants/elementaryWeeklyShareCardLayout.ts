/**
 * Sprint 5.3 / 14.1 — photo-first share card (360×450 → 1080×1350).
 */
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from './elementaryBreakfastShareCard';

export const SHARE_CARD_PADDING_H = 8;
export const SHARE_CARD_PADDING_TOP = 6;
export const SHARE_CARD_PADDING_BOTTOM = 5;

export const SHARE_GRID_GAP = 3;

/**
 * Image area target ~70–75% of Mon–Sat cell.
 * Text band is flexShrink:0 so names never clip under the photo.
 */
export const SHARE_GRID_IMAGE_FLEX = 0.73;
export const SHARE_GRID_TEXT_FLEX = 0.27;

/** Soft floor for food photo when row is tall enough. */
export const SHARE_GRID_IMAGE_MIN_HEIGHT = 56;

/** Reserved text band — fits 2-line name + small cook time. */
export const SHARE_GRID_TEXT_BAND_MIN_HEIGHT = 30;

/** Prefer a less-wide crop than a thin strip (≈5:4 food frame). */
export const SHARE_GRID_IMAGE_ASPECT_RATIO = 5 / 4;

/** Sunday full-width card — image-forward, isolated from footer. */
export const SHARE_SUNDAY_CARD_HEIGHT = 92;

/** QA browser preview — does not affect capture resolution. */
export const SHARE_CARD_QA_PREVIEW_MAX_WIDTH = 560;

export const SHARE_CARD_INNER_WIDTH =
  WEEKLY_PLAN_SHARE_CARD_WIDTH - SHARE_CARD_PADDING_H * 2;

export const SHARE_CARD_INNER_HEIGHT =
  WEEKLY_PLAN_SHARE_CARD_HEIGHT - SHARE_CARD_PADDING_TOP - SHARE_CARD_PADDING_BOTTOM;
