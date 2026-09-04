import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import {
  SHARE_CARD_CELL_BG,
  SHARE_CARD_IMAGE_BG,
  SHARE_CARD_TEXT_BAND,
  SHARE_CELL_RADIUS,
  SHARE_GRID_IMAGE_FLEX,
  SHARE_GRID_TEXT_BAND_MIN_HEIGHT,
  SHARE_GRID_TEXT_FLEX,
  SHARE_SUNDAY_CARD_HEIGHT,
  SHARE_SUNDAY_IMAGE_FLEX,
  SHARE_SUNDAY_TEXT_FLEX,
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
            resizeMode="cover"
            showEmojiFallback
            emojiSize={40}
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
          resizeMode="cover"
          showEmojiFallback
          emojiSize={30}
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
    backgroundColor: SHARE_CARD_CELL_BG,
    borderRadius: SHARE_CELL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
  },
  gridImageFrame: {
    flex: SHARE_GRID_IMAGE_FLEX,
    flexGrow: SHARE_GRID_IMAGE_FLEX,
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: SHARE_CARD_IMAGE_BG,
    position: 'relative',
  },
  dayBadgeOnImage: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 2,
    backgroundColor: ds.colors.primary,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridImageContainer: {
    width: '100%',
    height: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
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
    backgroundColor: SHARE_CARD_TEXT_BAND,
  },
  gridName: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    alignSelf: 'flex-end',
  },
  sundayCard: {
    width: '100%',
    height: SHARE_SUNDAY_CARD_HEIGHT,
    backgroundColor: SHARE_CARD_CELL_BG,
    borderRadius: SHARE_CELL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
  },
  sundayImageWrap: {
    flex: SHARE_SUNDAY_IMAGE_FLEX,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: SHARE_CARD_IMAGE_BG,
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
    flex: SHARE_SUNDAY_TEXT_FLEX,
    flexShrink: 0,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: SHARE_CARD_TEXT_BAND,
  },
  dayText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sundayName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.25,
  },
  sundayTime: {
    flexShrink: 0,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
});
