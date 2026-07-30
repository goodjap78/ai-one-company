import { HOME_HERO_DISPLAY, type HeroFocalPoint } from '../constants/homeHeroDisplay';
import { HOME_HERO_FOCAL_OVERRIDES } from '../data/recipes/homeHeroFocalOverrides';

export function resolveHomeHeroFocalPoint(recipeId: string): HeroFocalPoint {
  return HOME_HERO_FOCAL_OVERRIDES[recipeId] ?? HOME_HERO_DISPLAY.defaultFocalPoint;
}
