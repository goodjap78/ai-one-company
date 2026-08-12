import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileLayout';

export const CONVENIENCE_STRIP_CARD_GAP = 8;
export const STRIP_GRID_BREAKPOINT = 768;
export const STRIP_FIT_THREE_MIN_WIDTH = 360;

export const STRIP_CARD_MIN_WIDTH = 96;
export const STRIP_CARD_MAX_WIDTH = 128;

export type StripLayoutMode = 'web-grid' | 'mobile-fit-three' | 'mobile-scroll';

export type StripCardMetrics = {
  thumbHeight: number;
  titleFontSize: number;
  titleLineHeight: number;
  titleMinHeight: number;
  metaFontSize: number;
  metaLineHeight: number;
  bodyPaddingHorizontal: number;
  bodyPaddingTop: number;
  bodyPaddingBottom: number;
  minHeight: number;
};

/** Inner width inside recommendation frame (after screen padding). */
export function resolveStripContentWidth(windowWidth: number): number {
  const shellWidth = Math.min(windowWidth, MOBILE_MAX_WIDTH);
  return shellWidth - MOBILE_SCREEN_PADDING * 2;
}

export function resolveStripLayoutMode(windowWidth: number): StripLayoutMode {
  if (windowWidth >= STRIP_GRID_BREAKPOINT) return 'web-grid';
  if (windowWidth >= STRIP_FIT_THREE_MIN_WIDTH) return 'mobile-fit-three';
  return 'mobile-scroll';
}

export function resolveStripCardWidth(windowWidth: number, mode: StripLayoutMode): number {
  const contentWidth = resolveStripContentWidth(windowWidth);
  const gap = CONVENIENCE_STRIP_CARD_GAP;
  const gapsForThree = gap * 2;

  if (mode === 'mobile-fit-three') {
    const raw = Math.floor((contentWidth - gapsForThree) / 3);
    return Math.max(STRIP_CARD_MIN_WIDTH, Math.min(STRIP_CARD_MAX_WIDTH, raw));
  }

  if (mode === 'mobile-scroll') {
    const raw = Math.floor((contentWidth - gap) / 2.4);
    return Math.max(STRIP_CARD_MIN_WIDTH, Math.min(STRIP_CARD_MAX_WIDTH, raw));
  }

  // web-grid — equal columns; width capped for metrics consistency
  const raw = Math.floor((contentWidth - gapsForThree) / 3);
  return Math.max(STRIP_CARD_MIN_WIDTH, raw);
}

export function resolveStripCardMetrics(mode: StripLayoutMode): StripCardMetrics {
  if (mode === 'web-grid') {
    return {
      thumbHeight: 120,
      titleFontSize: 14,
      titleLineHeight: 18,
      titleMinHeight: 36,
      metaFontSize: 11,
      metaLineHeight: 15,
      bodyPaddingHorizontal: 8,
      bodyPaddingTop: 8,
      bodyPaddingBottom: 10,
      minHeight: 188,
    };
  }

  if (mode === 'mobile-scroll') {
    return {
      thumbHeight: 80,
      titleFontSize: 12,
      titleLineHeight: 16,
      titleMinHeight: 32,
      metaFontSize: 10,
      metaLineHeight: 14,
      bodyPaddingHorizontal: 8,
      bodyPaddingTop: 8,
      bodyPaddingBottom: 8,
      minHeight: 164,
    };
  }

  return {
    thumbHeight: 76,
    titleFontSize: 12,
    titleLineHeight: 16,
    titleMinHeight: 32,
    metaFontSize: 10,
    metaLineHeight: 14,
    bodyPaddingHorizontal: 8,
    bodyPaddingTop: 8,
    bodyPaddingBottom: 8,
    minHeight: 156,
  };
}

export function stripRowFitsContentWidth(
  windowWidth: number,
  cardWidth: number,
  cardCount = 3,
): boolean {
  const contentWidth = resolveStripContentWidth(windowWidth);
  const total = cardWidth * cardCount + CONVENIENCE_STRIP_CARD_GAP * (cardCount - 1);
  return total <= contentWidth;
}
