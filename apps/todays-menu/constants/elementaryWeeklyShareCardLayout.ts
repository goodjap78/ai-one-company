/**
 * Sprint 15 — card-news share layout (360×450 → 1080×1350).
 */
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from './elementaryBreakfastShareCard';

/** Warm cream canvas — matches design-system canvas. */
export const SHARE_CARD_CANVAS = '#FFF8EF';
export const SHARE_CARD_CELL_BG = '#FFFFFF';
export const SHARE_CARD_TEXT_BAND = '#FFFCF7';
export const SHARE_CARD_IMAGE_BG = '#FFF0E6';

export const SHARE_CARD_PADDING_H = 12;
export const SHARE_CARD_PADDING_TOP = 10;
export const SHARE_CARD_PADDING_BOTTOM = 8;

export const SHARE_GRID_GAP = 5;
export const SHARE_CELL_RADIUS = 10;

/**
 * Mon–Sat cell: photo ~72–75%, text ~25–28%.
 */
export const SHARE_GRID_IMAGE_FLEX = 0.74;
export const SHARE_GRID_TEXT_FLEX = 0.26;

export const SHARE_GRID_IMAGE_MIN_HEIGHT = 58;
export const SHARE_GRID_TEXT_BAND_MIN_HEIGHT = 32;

export const SHARE_GRID_IMAGE_ASPECT_RATIO = 5 / 4;

/** Sunday full-width — photo ~75–78%. */
export const SHARE_SUNDAY_CARD_HEIGHT = 98;
export const SHARE_SUNDAY_IMAGE_FLEX = 0.76;
export const SHARE_SUNDAY_TEXT_FLEX = 0.24;

/** QA browser preview — min(90vw, 560). */
export const SHARE_CARD_QA_PREVIEW_MAX_WIDTH = 560;

export const SHARE_CARD_INNER_WIDTH =
  WEEKLY_PLAN_SHARE_CARD_WIDTH - SHARE_CARD_PADDING_H * 2;

export const SHARE_CARD_INNER_HEIGHT =
  WEEKLY_PLAN_SHARE_CARD_HEIGHT - SHARE_CARD_PADDING_TOP - SHARE_CARD_PADDING_BOTTOM;
