import type { ImageSourcePropType } from 'react-native';
import type { ConvenienceIllustrationIconKey } from '../../types/convenienceIllustrationIcon';
import { CONVENIENCE_ILLUSTRATION_ICON_KEYS } from '../../types/convenienceIllustrationIcon';

/**
 * Sprint 56-G — static production registry for convenience illustration icons.
 * Files: assets/convenience-illustration-icons/{key}.png (1024×1024, byte-identical to masters).
 */
export const CONVENIENCE_ILLUSTRATION_ICON_ASSETS: Record<
  ConvenienceIllustrationIconKey,
  ImageSourcePropType
> = {
  cup_ramen: require('../../assets/convenience-illustration-icons/cup_ramen.png'),
  cup_rice: require('../../assets/convenience-illustration-icons/cup_rice.png'),
  triangle_kimbap: require('../../assets/convenience-illustration-icons/triangle_kimbap.png'),
  milk: require('../../assets/convenience-illustration-icons/milk.png'),
  salad: require('../../assets/convenience-illustration-icons/salad.png'),
  lunchbox: require('../../assets/convenience-illustration-icons/lunchbox.png'),
  sandwich: require('../../assets/convenience-illustration-icons/sandwich.png'),
  hamburger: require('../../assets/convenience-illustration-icons/hamburger.png'),
  hot_bar: require('../../assets/convenience-illustration-icons/hot_bar.png'),
  cup_udon: require('../../assets/convenience-illustration-icons/cup_udon.png'),
};

export function isKnownConvenienceIllustrationIconKey(
  key: string,
): key is ConvenienceIllustrationIconKey {
  return (CONVENIENCE_ILLUSTRATION_ICON_KEYS as readonly string[]).includes(key);
}

export function getConvenienceIllustrationIconSource(
  key: ConvenienceIllustrationIconKey,
): ImageSourcePropType {
  return CONVENIENCE_ILLUSTRATION_ICON_ASSETS[key];
}

export function listConvenienceIllustrationIconKeys(): ConvenienceIllustrationIconKey[] {
  return [...CONVENIENCE_ILLUSTRATION_ICON_KEYS];
}
