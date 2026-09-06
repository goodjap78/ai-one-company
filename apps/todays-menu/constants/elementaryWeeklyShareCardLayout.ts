/**
 * Sprint 16 — hero + 6-grid card-news share (360×450 → 1080×1350).
 */
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from './elementaryBreakfastShareCard';

export const SHARE_CARD_CANVAS = '#FFF8EF';
export const SHARE_CARD_CELL_BG = '#FFFFFF';
export const SHARE_CARD_TEXT_BAND = '#FFFCF7';
export const SHARE_CARD_IMAGE_BG = '#FFF0E6';

export const SHARE_CARD_PADDING_H = 11;
export const SHARE_CARD_PADDING_TOP = 9;
export const SHARE_CARD_PADDING_BOTTOM = 7;

export const SHARE_GRID_GAP = 4;
export const SHARE_CELL_RADIUS = 11;

/**
 * Grid / featured cells — photo ~78–82%, text ~18–22%.
 */
export const SHARE_GRID_IMAGE_FLEX = 0.8;
export const SHARE_GRID_TEXT_FLEX = 0.2;

export const SHARE_GRID_IMAGE_MIN_HEIGHT = 50;
export const SHARE_GRID_TEXT_BAND_MIN_HEIGHT = 28;

export const SHARE_GRID_IMAGE_ASPECT_RATIO = 5 / 4;

/** Large hero (Mon) — photo ~80–82%. */
export const SHARE_HERO_IMAGE_FLEX = 0.82;
export const SHARE_HERO_TEXT_FLEX = 0.18;
export const SHARE_HERO_TEXT_BAND_MIN_HEIGHT = 34;

/**
 * Body flex split: hero vs 3-row grid of remaining 6 days.
 * Higher hero flex = larger lead photo.
 */
export const SHARE_BODY_HERO_FLEX = 1.2;
export const SHARE_BODY_GRID_FLEX = 2.55;

/** @deprecated kept for regression imports — featured uses grid flex now. */
export const SHARE_SUNDAY_CARD_HEIGHT = 0;
export const SHARE_SUNDAY_IMAGE_FLEX = SHARE_GRID_IMAGE_FLEX;
export const SHARE_SUNDAY_TEXT_FLEX = SHARE_GRID_TEXT_FLEX;

/** QA browser preview — min(90vw, 560). */
export const SHARE_CARD_QA_PREVIEW_MAX_WIDTH = 560;

export const SHARE_CARD_INNER_WIDTH =
  WEEKLY_PLAN_SHARE_CARD_WIDTH - SHARE_CARD_PADDING_H * 2;

export const SHARE_CARD_INNER_HEIGHT =
  WEEKLY_PLAN_SHARE_CARD_HEIGHT - SHARE_CARD_PADDING_TOP - SHARE_CARD_PADDING_BOTTOM;
