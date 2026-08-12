import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from './mobileLayout';

export const FRIDGE_COMPACT_CARD_GAP = 11;
export const FRIDGE_COMPACT_WEB_BREAKPOINT = 768;
export const FRIDGE_COMPACT_WINDOW_SIZE = 3;

export const FRIDGE_COMPACT_CARD_MIN_WIDTH = 144;
export const FRIDGE_COMPACT_CARD_MAX_WIDTH = 176;

export const FRIDGE_COMPACT_BANNER_MIN_HEIGHT = 72;
export const FRIDGE_COMPACT_BANNER_MAX_HEIGHT = 96;
export const FRIDGE_COMPACT_BANNER_DEFAULT_HEIGHT = 84;

export type FridgeCompactLayoutMode = 'web-grid' | 'mobile-scroll';

export type FridgeCompactCardMetrics = {
  imageHeight: number;
  titleFontSize: number;
  titleLineHeight: number;
  titleMinHeight: number;
  metaFontSize: number;
  metaLineHeight: number;
  bodyPaddingHorizontal: number;
  bodyPaddingTop: number;
  bodyPaddingBottom: number;
  /** Soft layout hint only — cards use content height (not a clipping fixed height). */
  minHeight: number;
};

export function resolveFridgeCompactContentWidth(windowWidth: number): number {
  const shellWidth = Math.min(windowWidth, MOBILE_MAX_WIDTH);
  return shellWidth - MOBILE_SCREEN_PADDING * 2;
}

export function resolveFridgeCompactLayoutMode(windowWidth: number): FridgeCompactLayoutMode {
  return windowWidth >= FRIDGE_COMPACT_WEB_BREAKPOINT ? 'web-grid' : 'mobile-scroll';
}

/**
 * Card width for horizontal peek scroll.
 * At 360/390/430: keep 2 cards visible with a small next peek — never exceed content width.
 */
export function resolveFridgeCompactCardWidth(windowWidth: number): number {
  const contentWidth = resolveFridgeCompactContentWidth(windowWidth);
  const gap = FRIDGE_COMPACT_CARD_GAP;
  const mode = resolveFridgeCompactLayoutMode(windowWidth);

  if (mode === 'web-grid') {
    const raw = Math.floor((contentWidth - gap * 2) / 3);
    return Math.max(FRIDGE_COMPACT_CARD_MIN_WIDTH, Math.min(FRIDGE_COMPACT_CARD_MAX_WIDTH, raw));
  }

  // Prefer ~2.15 cards visible so the trailing edge is not a harsh clip.
  const raw = Math.floor((contentWidth - gap) / 2.15);
  return Math.max(FRIDGE_COMPACT_CARD_MIN_WIDTH, Math.min(FRIDGE_COMPACT_CARD_MAX_WIDTH, raw));
}

export function resolveFridgeCompactCardMetrics(mode: FridgeCompactLayoutMode): FridgeCompactCardMetrics {
  if (mode === 'web-grid') {
    return {
      imageHeight: 132,
      titleFontSize: 14,
      titleLineHeight: 18,
      titleMinHeight: 36,
      metaFontSize: 11,
      metaLineHeight: 15,
      bodyPaddingHorizontal: 8,
      bodyPaddingTop: 8,
      bodyPaddingBottom: 10,
      minHeight: 248,
    };
  }

  return {
    imageHeight: 104,
    titleFontSize: 13,
    titleLineHeight: 17,
    titleMinHeight: 34,
    metaFontSize: 10,
    metaLineHeight: 14,
    bodyPaddingHorizontal: 8,
    bodyPaddingTop: 8,
    bodyPaddingBottom: 10,
    // Hint for tests / layout docs — CTA cards grow beyond this.
    minHeight: 280,
  };
}

export function fridgeCompactSnapInterval(cardWidth: number): number {
  return cardWidth + FRIDGE_COMPACT_CARD_GAP;
}
