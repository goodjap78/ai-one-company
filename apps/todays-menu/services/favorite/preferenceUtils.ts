import type { RecipeEmotionId, RecipeTagId } from '../../recipes/types';
import type { PreferenceSeason } from '../../types/preference';

const SEASON_BADGE_TO_PREFERENCE: Record<string, PreferenceSeason> = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  fall: 'autumn',
  winter: 'winter',
  봄: 'spring',
  여름: 'summer',
  가을: 'autumn',
  겨울: 'winter',
};

export function resolveSeasonFromDate(date: Date): PreferenceSeason {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function resolveSeasonFromBadgeLabel(label: string): PreferenceSeason | null {
  const normalized = label.toLowerCase();

  for (const [key, season] of Object.entries(SEASON_BADGE_TO_PREFERENCE)) {
    if (normalized.includes(key)) {
      return season;
    }
  }

  return null;
}

export function uniqueTags(tags: RecipeTagId[]): RecipeTagId[] {
  return [...new Set(tags)];
}

export function uniqueEmotions(emotions: RecipeEmotionId[]): RecipeEmotionId[] {
  return [...new Set(emotions)];
}
