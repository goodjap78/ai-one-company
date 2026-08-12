/**
 * Shared bottom-tab + safe-area layout tokens.
 * Keeps Home / 내 메뉴 / 마이 above Android system nav and iOS home indicator.
 */

/** Minimum interactive tab bar content height (above system inset). */
export const TAB_BAR_MIN_HEIGHT = 64;

/** Extra padding under tab icons/labels, on top of the system inset. */
export const TAB_BAR_BOTTOM_GAP = 8;

/** Breathing room below scroll content above the tab bar. */
export const TAB_SCROLL_EXTRA_PADDING = 24;

/** Horizontal screen padding — fixed 16 for all phone widths (320–430). */
export const SCREEN_HORIZONTAL_PADDING = 16;
export const NARROW_WIDTH_BREAKPOINT = 360;

export function getScreenHorizontalPadding(_windowWidth?: number): number {
  return SCREEN_HORIZONTAL_PADDING;
}

/** Tab bar style values from the bottom safe-area inset. */
export function getTabBarSafeStyle(insetsBottom: number): {
  height: number;
  paddingTop: number;
  paddingBottom: number;
} {
  const paddingBottom = insetsBottom + TAB_BAR_BOTTOM_GAP;
  return {
    height: TAB_BAR_MIN_HEIGHT + insetsBottom,
    paddingTop: 8,
    paddingBottom,
  };
}

/**
 * Scroll/content bottom padding for screens inside the tab navigator.
 * paddingBottom = tabBarHeight + insets.bottom + 24
 */
export function getTabScrollPaddingBottom(insetsBottom: number): number {
  return TAB_BAR_MIN_HEIGHT + insetsBottom + TAB_SCROLL_EXTRA_PADDING;
}
