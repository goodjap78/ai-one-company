import type { StyleProp, ViewStyle } from 'react-native';
import type { HankkiAvatarSize, HankkiMood } from '../../types/hankki';
import { SeedMascot, type SeedMascotSize, type SeedMascotVariant } from '../common/SeedMascot';

type Props = {
  mood?: HankkiMood;
  size?: HankkiAvatarSize;
  showRing?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** @deprecated Use SeedMascot — Seed is the only official mascot. */
const MOOD_TO_VARIANT: Record<HankkiMood, SeedMascotVariant> = {
  happy: 'happy',
  thinking: 'think',
  excited: 'happy',
  saved: 'happy',
  sorry: 'default',
};

const SIZE_TO_PX: Record<HankkiAvatarSize, SeedMascotSize> = {
  sm: 32,
  md: 48,
  lg: 56,
};

/**
 * Compatibility shim — always renders Seed.
 * Prefer importing SeedMascot directly in new code.
 */
export function HankkiAvatar({ mood = 'happy', size = 'sm' }: Props) {
  return <SeedMascot variant={MOOD_TO_VARIANT[mood]} size={SIZE_TO_PX[size]} />;
}
