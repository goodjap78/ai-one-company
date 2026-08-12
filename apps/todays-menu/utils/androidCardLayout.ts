import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../constants/mobileLayout';
import {
  FRIDGE_COMPACT_CARD_GAP,
  resolveFridgeCompactCardWidth,
  resolveFridgeCompactContentWidth,
} from '../constants/fridgeCompactLayout';

/** Home "이것도 괜찮아요" — equal 3-column width inside padded shell. */
export const ALTERNATIVE_MEALS_COL_GAP = 8;
export const ALTERNATIVE_MEALS_COL_COUNT = 3;

export function resolveHomeContentWidth(windowWidth: number): number {
  return Math.min(windowWidth, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
}

export function resolveAlternativeColumnWidth(
  windowWidth: number,
  columns = ALTERNATIVE_MEALS_COL_COUNT,
  gap = ALTERNATIVE_MEALS_COL_GAP,
): number {
  const content = resolveHomeContentWidth(windowWidth);
  return Math.floor((content - gap * (columns - 1)) / columns);
}

/** True when N equal columns + gaps fit in content width (no horizontal clip). */
export function alternativeRowFits(windowWidth: number): boolean {
  const content = resolveHomeContentWidth(windowWidth);
  const col = resolveAlternativeColumnWidth(windowWidth);
  return col * ALTERNATIVE_MEALS_COL_COUNT + ALTERNATIVE_MEALS_COL_GAP * (ALTERNATIVE_MEALS_COL_COUNT - 1) <= content;
}

export function fridgeCardsVisibleSpan(windowWidth: number, visibleCount = 2): number {
  const width = resolveFridgeCompactCardWidth(windowWidth);
  return width * visibleCount + FRIDGE_COMPACT_CARD_GAP * (visibleCount - 1);
}

export function fridgeCardFitsContent(windowWidth: number): boolean {
  const content = resolveFridgeCompactContentWidth(windowWidth);
  const card = resolveFridgeCompactCardWidth(windowWidth);
  return card <= content && fridgeCardsVisibleSpan(windowWidth, 2) <= content;
}
