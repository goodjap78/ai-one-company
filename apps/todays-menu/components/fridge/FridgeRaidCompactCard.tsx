import * as Haptics from 'expo-haptics';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
import { FRIDGE_SHOPPING_CONFIG } from '../../constants/fridgeShoppingConfig';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { ds } from '../../constants/designSystem';
import {
  formatFridgeCompactMissingLabel,
  formatFridgeCompactUtilizedLabel,
  fridgeCompactTierBadge,
} from '../../services/fridge/fridgeCompactRecommendation';
import type { FridgeRaidCandidate } from '../../services/fridge/fridgeRaidTypes';
import type { FridgeCompactCardMetrics } from '../../constants/fridgeCompactLayout';

type Props = {
  candidate: FridgeRaidCandidate;
  metrics: FridgeCompactCardMetrics;
  onPress: () => void;
  /** Missing-only shopping — does not open recipe detail. */
  onPressShopping?: (recipeId: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function FridgeRaidCompactCard({
  candidate,
  metrics,
  onPress,
  onPressShopping,
  style,
}: Props) {
  const hero = candidate.heroImage;
  const tierBadge = fridgeCompactTierBadge(candidate.starRating);
  const utilizedLabel = formatFridgeCompactUtilizedLabel(candidate.matchedSelectedIngredients);
  const missingLabel = formatFridgeCompactMissingLabel(candidate);
  const missingCount = candidate.missingCount ?? candidate.missingIngredients.length;
  const showShoppingCta =
    FRIDGE_SHOPPING_CONFIG.enabled &&
    missingCount > 0 &&
    typeof onPressShopping === 'function';
  const accessibilityLabel = `${candidate.title}, ${tierBadge}, 부족 ${missingLabel}`;

  const handleShoppingPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressShopping?.(candidate.recipeId);
  };

  return (
    <View style={[styles.card, style]}>
      <Pressable
        style={({ pressed }) => [styles.mainPress, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.imageWrap, { height: metrics.imageHeight }]}>
          {hero.url ? (
            <Image
              source={{ uri: hero.url }}
              style={styles.image}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              accessibilityLabel={hero.accessibilityLabel ?? candidate.title}
            />
          ) : hero.source ? (
            <Image
              source={hero.source}
              style={styles.image}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              accessibilityLabel={hero.accessibilityLabel ?? candidate.title}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.emoji}>{hero.emoji ?? '🍽️'}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.body,
            {
              paddingHorizontal: metrics.bodyPaddingHorizontal,
              paddingTop: metrics.bodyPaddingTop,
              paddingBottom: showShoppingCta ? 6 : metrics.bodyPaddingBottom,
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
            {candidate.title}
          </Text>

          <Text style={styles.badgeRow} numberOfLines={1}>
            <Text style={styles.stars}>{FRIDGE_RAID_COPY.starLabel(candidate.starRating)}</Text>
            <Text style={styles.badge}> {tierBadge}</Text>
          </Text>

          <Text
            style={[
              styles.meta,
              { fontSize: metrics.metaFontSize, lineHeight: metrics.metaLineHeight },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            활용: {utilizedLabel}
          </Text>
          <Text
            style={[
              styles.meta,
              { fontSize: metrics.metaFontSize, lineHeight: metrics.metaLineHeight },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            부족: {missingLabel}
          </Text>
          <Text
            style={[
              styles.meta,
              { fontSize: metrics.metaFontSize, lineHeight: metrics.metaLineHeight },
            ]}
            numberOfLines={1}
          >
            {FRIDGE_RAID_COPY.cookTime(candidate.cookTime)}
          </Text>

          {!showShoppingCta ? (
            <Text style={styles.detailHint}>{FRIDGE_RAID_COPY.compactDetailHint}</Text>
          ) : null}
        </View>
      </Pressable>

      {showShoppingCta ? (
        <View
          style={[
            styles.ctaWrap,
            {
              paddingHorizontal: metrics.bodyPaddingHorizontal,
              paddingBottom: metrics.bodyPaddingBottom,
            },
          ]}
        >
          <Text style={styles.missingCountLabel}>
            {SHOPPING_COPY.missingIngredientsCountLabel(missingCount)}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.shoppingCta, pressed && styles.shoppingCtaPressed]}
            onPress={handleShoppingPress}
            accessibilityRole="button"
            accessibilityLabel={SHOPPING_COPY.missingIngredientsCta}
          >
            <Text style={styles.shoppingCtaLabel} numberOfLines={1}>
              {SHOPPING_COPY.missingIngredientsCta} →
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    // Height follows content; overflow clips image to radius without a fixed-height trap.
    overflow: 'hidden',
    ...ds.shadow.card,
  },
  mainPress: {
    // Auto height from image + body (no flexGrow stretch that clips on Android).
  },
  cardPressed: {
    opacity: 0.92,
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F3E7DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  body: {
    gap: 3,
  },
  title: {
    fontWeight: '800',
    color: ds.colors.textPrimary,
  },
  badgeRow: {
    fontWeight: '700',
  },
  stars: {
    color: ds.colors.warmText,
    fontWeight: '800',
  },
  badge: {
    color: ds.colors.primary,
    fontWeight: '700',
  },
  meta: {
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  detailHint: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  ctaWrap: {
    gap: 6,
    paddingTop: 2,
  },
  missingCountLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
  shoppingCta: {
    width: '100%',
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shoppingCtaPressed: {
    opacity: 0.9,
    backgroundColor: ds.colors.primaryDark,
  },
  shoppingCtaLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
