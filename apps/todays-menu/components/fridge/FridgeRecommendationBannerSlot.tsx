import { StyleSheet, Text, View } from 'react-native';
import {
  FRIDGE_COMPACT_BANNER_DEFAULT_HEIGHT,
  FRIDGE_COMPACT_BANNER_MAX_HEIGHT,
  FRIDGE_COMPACT_BANNER_MIN_HEIGHT,
} from '../../constants/fridgeCompactLayout';
import { ds } from '../../constants/designSystem';

type Props = {
  /** Dev-only preview — production omits slot when false/undefined. */
  previewMode?: boolean;
  previewHeight?: number;
};

function clampPreviewHeight(height: number): number {
  return Math.max(
    FRIDGE_COMPACT_BANNER_MIN_HEIGHT,
    Math.min(FRIDGE_COMPACT_BANNER_MAX_HEIGHT, height),
  );
}

/**
 * Reserved space for future AdMob / promo banners below the compact recommendation feed.
 * Renders only when `previewMode` is enabled (development layout checks).
 */
export function FridgeRecommendationBannerSlot({ previewMode, previewHeight }: Props) {
  if (!previewMode) return null;

  const height = clampPreviewHeight(previewHeight ?? FRIDGE_COMPACT_BANNER_DEFAULT_HEIGHT);

  return (
    <View
      style={[styles.slot, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.previewLabel}>배너 슬롯 (개발 미리보기)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    backgroundColor: ds.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    fontWeight: '600',
  },
});
