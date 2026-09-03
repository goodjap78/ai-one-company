import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import {
  SHARE_GRID_IMAGE_FLEX,
  SHARE_GRID_TEXT_BAND_MIN_HEIGHT,
  SHARE_GRID_TEXT_FLEX,
  SHARE_SUNDAY_CARD_HEIGHT,
} from '../../constants/elementaryWeeklyShareCardLayout';
import type { ElementaryWeeklyShareCardItem } from '../../services/weeklyPlan/elementaryWeeklyShareCardModel';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';

type Props = {
  item: ElementaryWeeklyShareCardItem;
  cookTime: (minutes: number) => string;
  variant?: 'grid' | 'sunday';
};

export function ElementaryWeeklyShareMealCell({
  item,
  cookTime,
  variant = 'grid',
}: Props) {
  const image = resolveMealHeroImage(item.recipeId, 'homemade');
  const timeLabel = cookTime(item.timeMinutes);

  if (variant === 'sunday') {
    return (
      <View style={styles.sundayCard}>
        <View style={styles.sundayImageWrap}>
          <View style={styles.dayBadgeOnImage}>
            <Text style={styles.dayText}>{item.dayLabel}</Text>
          </View>
          <MealImageView
            image={image}
            variant="hero"
            style={styles.sundayImage}
            containerStyle={styles.sundayImageContainer}
            showEmojiFallback
            emojiSize={36}
            remountKey={item.recipeId}
            accessibilityLabel={item.name}
          />
        </View>
        <View style={styles.sundayTextBand}>
          <Text style={styles.sundayName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.sundayTime} numberOfLines={1}>
            {timeLabel}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridCell}>
      <View style={styles.gridImageFrame}>
        <View style={styles.dayBadgeOnImage}>
          <Text style={styles.dayText}>{item.dayLabel}</Text>
        </View>
        <MealImageView
          image={image}
          variant="hero"
          style={styles.gridImage}
          containerStyle={styles.gridImageContainer}
          showEmojiFallback
          emojiSize={28}
          remountKey={item.recipeId}
          accessibilityLabel={item.name}
        />
      </View>
      <View style={styles.gridTextBand}>
        <Text style={styles.gridName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: ds.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
  },
  gridImageFrame: {
    flex: SHARE_GRID_IMAGE_FLEX,
    flexGrow: SHARE_GRID_IMAGE_FLEX,
    flexShrink: 1,
    // Yield to text band when the row is tight — names must never clip.
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
    position: 'relative',
  },
  dayBadgeOnImage: {
    position: 'absolute',
    top: 3,
    left: 3,
    zIndex: 2,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  gridImageContainer: {
    width: '100%',
    height: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  /** Dedicated cream band — never overlaps / never yields to the photo. */
  gridTextBand: {
    flex: SHARE_GRID_TEXT_FLEX,
    flexGrow: SHARE_GRID_TEXT_FLEX,
    flexShrink: 0,
    minHeight: SHARE_GRID_TEXT_BAND_MIN_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingTop: 3,
    paddingBottom: 3,
    gap: 1,
    backgroundColor: '#FFFCF7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.borderLight,
  },
  gridName: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.25,
  },
  meta: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    alignSelf: 'flex-end',
  },
  sundayCard: {
    width: '100%',
    height: SHARE_SUNDAY_CARD_HEIGHT,
    backgroundColor: ds.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
  },
  sundayImageWrap: {
    flex: 0.7,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
    position: 'relative',
  },
  sundayImageContainer: {
    width: '100%',
    height: '100%',
  },
  sundayImage: {
    width: '100%',
    height: '100%',
  },
  sundayTextBand: {
    flex: 0.3,
    flexShrink: 0,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFCF7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.borderLight,
  },
  dayText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
  sundayName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sundayTime: {
    flexShrink: 0,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
});
