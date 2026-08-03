import { ds } from '../../constants/designSystem';

/** Convenience combo list grid breakpoints — Sprint 48-B.1 */
export const CONVENIENCE_GRID_BREAKPOINTS = {
  twoCol: 560,
  threeCol: 900,
  fourCol: 1280,
} as const;

export const CONVENIENCE_MOBILE_MAX_WIDTH = 430;
export const CONVENIENCE_DESKTOP_MAX_WIDTH = 1280;
export const CONVENIENCE_MIN_CARD_WIDTH = 260;

export function resolveConvenienceGridColumns(width: number): number {
  if (width < CONVENIENCE_GRID_BREAKPOINTS.twoCol) return 1;
  if (width < CONVENIENCE_GRID_BREAKPOINTS.threeCol) return 2;
  if (width < CONVENIENCE_GRID_BREAKPOINTS.fourCol) return 3;
  return 4;
}

/**
 * Widen content frame on tablet/web so multi-column grids use available width.
 * Mobile stays within the phone shell (~430px).
 */
export function resolveConvenienceContentMaxWidth(width: number, columns: number): number {
  if (columns <= 1) {
    return Math.min(width, CONVENIENCE_MOBILE_MAX_WIDTH);
  }
  const gap = ds.spacing.cardInner;
  const padding = ds.spacing.screen * 2;
  const minContent =
    columns * CONVENIENCE_MIN_CARD_WIDTH + gap * (columns - 1) + padding;
  const viewportCap = Math.min(width, CONVENIENCE_DESKTOP_MAX_WIDTH);
  return Math.max(minContent, viewportCap);
}

export function resolveConvenienceCardWidth(
  windowWidth: number,
  columns: number,
): number {
  const frameMax = resolveConvenienceContentMaxWidth(windowWidth, columns);
  const contentWidth = Math.min(windowWidth, frameMax) - ds.spacing.screen * 2;
  const gap = ds.spacing.cardInner;
  if (columns <= 1) return Math.max(0, contentWidth);
  return Math.max(
    0,
    (contentWidth - gap * (columns - 1)) / columns,
  );
}
