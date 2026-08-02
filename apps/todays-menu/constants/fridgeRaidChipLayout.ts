import { ds } from './designSystem';
import { NARROW_WIDTH_BREAKPOINT } from './tabBarLayout';

/** Gap between popular-ingredient chips (uniform). */
export const FRIDGE_CHIP_GAP = 8;

/** Fixed chip height — fits two centered label lines without clipping. */
export const FRIDGE_CHIP_MIN_HEIGHT = 48;

export const FRIDGE_CHIP_COLUMNS_DEFAULT = 5;
export const FRIDGE_CHIP_COLUMNS_NARROW = 4;

export function resolveFridgeChipColumnCount(windowWidth: number): number {
  return windowWidth < NARROW_WIDTH_BREAKPOINT
    ? FRIDGE_CHIP_COLUMNS_NARROW
    : FRIDGE_CHIP_COLUMNS_DEFAULT;
}

export function resolveFridgeChipContentWidth(windowWidth: number): number {
  const framePadding = ds.spacing.screen * 2;
  return Math.min(windowWidth, ds.sizes.maxContentWidth) - framePadding;
}

export function resolveFridgeChipItemWidth(
  windowWidth: number,
  gap: number = FRIDGE_CHIP_GAP,
): number {
  const columns = resolveFridgeChipColumnCount(windowWidth);
  const contentWidth = resolveFridgeChipContentWidth(windowWidth);
  return Math.floor((contentWidth - gap * (columns - 1)) / columns);
}
