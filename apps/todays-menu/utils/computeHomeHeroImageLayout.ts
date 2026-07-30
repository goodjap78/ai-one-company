import { HOME_HERO_DISPLAY, type HeroFocalPoint } from '../constants/homeHeroDisplay';

export type FocalCoverLayout = {
  width: '100%';
  height: `${number}%`;
  top: `${number}%`;
  left: '0%';
};

/**
 * Oversized cover image layout so a focal point aligns near the visual anchor.
 * Home hero only — does not affect recipe detail.
 */
export function computeHomeHeroImageLayout(
  focal: HeroFocalPoint,
  scale = HOME_HERO_DISPLAY.focalScale,
): FocalCoverLayout {
  const anchorY = 0.42;
  const heightPct = scale * 100;
  const topPct = ((anchorY - focal.y) * (scale - 1) * 100) / scale;
  const leftPct = ((0.5 - focal.x) * (scale - 1) * 100) / scale;

  return {
    width: '100%',
    height: `${heightPct}%`,
    top: `${topPct}%`,
    left: `${leftPct}%`,
  };
}
