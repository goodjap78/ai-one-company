import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

export type SeedMascotVariant = 'default' | 'happy' | 'wave' | 'think' | 'recommend' | 'save';

/** Preferred sizes; header 42–48; recipe hero ~64; onboarding hero 112–120. */
export type SeedMascotSize =
  | 32
  | 36
  | 40
  | 42
  | 44
  | 48
  | 56
  | 64
  | 70
  | 73
  | 80
  | 85
  | 112
  | 116
  | 120;

type Props = {
  variant?: SeedMascotVariant;
  size?: SeedMascotSize;
  style?: StyleProp<ImageStyle>;
};

/** Official Seed PNGs only — do not use legacy placeholders. */
const SEED_ASSETS: Record<SeedMascotVariant, number> = {
  default: require('../../assets/seed/seed_wave.png'),
  wave: require('../../assets/seed/seed_wave.png'),
  think: require('../../assets/seed/seed_think.png'),
  recommend: require('../../assets/seed/seed_recommend.png'),
  happy: require('../../assets/seed/seed_happy.png'),
  save: require('../../assets/seed/seed_happy.png'),
};

const VARIANT_LABELS: Record<SeedMascotVariant, string> = {
  default: 'Seed',
  happy: '기분 좋은 Seed',
  wave: '인사하는 Seed',
  think: '생각 중인 Seed',
  recommend: '추천하는 Seed',
  save: '저장한 Seed',
};

/**
 * Official AI ONE COMPANY mascot — Seed.
 */
export function SeedMascot({ variant = 'default', size = 40, style }: Props) {
  return (
    <Image
      source={SEED_ASSETS[variant]}
      style={[styles.image, { width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessibilityRole="image"
      accessibilityLabel={VARIANT_LABELS[variant]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
});
