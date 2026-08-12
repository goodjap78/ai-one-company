import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import { formatEstimatedPriceRange } from '../../services/convenience/convenienceComboCatalog';
import { resolveConvenienceComboImage } from '../../services/images/resolveConvenienceComboImage';
import type { StripCardMetrics } from './convenienceStripLayout';

type Props = {
  combo: ConvenienceCombo;
  accentColor: string;
  onPress: () => void;
  metrics: StripCardMetrics;
  style?: StyleProp<ViewStyle>;
};

export function ConvenienceComboStripCard({
  combo,
  accentColor,
  onPress,
  metrics,
  style,
}: Props) {
  const heroImage = resolveConvenienceComboImage(combo);
  const priceLabel = formatEstimatedPriceRange(combo.estimatedPriceRange);
  const prepLabel = convenienceCombosCopy.prepMinutes(combo.prepTimeMinutes);
  const metaLine = [priceLabel, prepLabel].filter(Boolean).join(' · ');
  const isHack = combo.comboKind === 'hack_combo';
  const hasDistinctTransformation =
    isHack &&
    combo.transformationName &&
    combo.transformationName.trim() !== combo.title.trim();
  const displayTitle = hasDistinctTransformation ? combo.transformationName! : combo.title;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          minHeight: metrics.minHeight,
        },
        style,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {heroImage ? (
        <Image
          source={heroImage}
          style={[styles.thumb, { height: metrics.thumbHeight }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbFallback,
            { height: metrics.thumbHeight, backgroundColor: accentColor },
          ]}
        />
      )}
      <View
        style={[
          styles.body,
          {
            paddingHorizontal: metrics.bodyPaddingHorizontal,
            paddingTop: metrics.bodyPaddingTop,
            paddingBottom: metrics.bodyPaddingBottom,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              fontSize: metrics.titleFontSize,
              lineHeight: metrics.titleLineHeight,
              minHeight: metrics.titleMinHeight,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayTitle}
        </Text>
        {metaLine ? (
          <Text
            style={[
              styles.meta,
              {
                fontSize: metrics.metaFontSize,
                lineHeight: metrics.metaLineHeight,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {metaLine}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
    ...ds.shadow.card,
  },
  cardPressed: {
    opacity: 0.9,
  },
  thumb: {
    width: '100%',
    backgroundColor: '#F3E7DB',
  },
  thumbFallback: {
    opacity: 0.88,
  },
  body: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontWeight: '800',
    color: '#3A2417',
  },
  meta: {
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
});
