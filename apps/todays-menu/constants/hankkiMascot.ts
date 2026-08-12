import type { ImageSourcePropType } from 'react-native';
import type { HankkiMood } from '../types/hankki';

/**
 * Official mascot is Seed (`components/common/SeedMascot` + `assets/seed/seed_*.png`).
 */

export const HANKKI_MOOD_EMOJI: Record<HankkiMood, string> = {
  happy: '🍙',
  thinking: '🤔',
  excited: '🤩',
  saved: '❤️',
  sorry: '😅',
};

export const HAS_OFFICIAL_HANKKI_MASCOT = true;

export const HANKKI_CHARACTER_IMAGE: ImageSourcePropType = require('../assets/seed/seed_wave.png');

export const HANKKI_MOOD_ASSETS: Partial<Record<HankkiMood, ImageSourcePropType>> = {
  happy: require('../assets/seed/seed_happy.png'),
  thinking: require('../assets/seed/seed_think.png'),
  excited: require('../assets/seed/seed_happy.png'),
  saved: require('../assets/seed/seed_happy.png'),
  sorry: require('../assets/seed/seed_wave.png'),
};

export const HANKKI_MOOD_LABELS: Record<HankkiMood, string> = {
  happy: '기분 좋은 Seed',
  thinking: '생각 중인 Seed',
  excited: '신난 Seed',
  saved: '저장한 Seed',
  sorry: 'Seed',
};
