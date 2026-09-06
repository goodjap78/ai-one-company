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
  SHARE_HERO_IMAGE_FLEX,
  SHARE_HERO_TEXT_BAND_MIN_HEIGHT,
  SHARE_HERO_TEXT_FLEX,
} from '../../constants/elementaryWeeklyShareCardLayout';
import type { ElementaryWeeklyShareCardItem } from '../../services/weeklyPlan/elementaryWeeklyShareCardModel';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';

type Props = {
  item: ElementaryWeeklyShareCardItem;
  cookTime: (minutes: number) => string;
  /** hero = Mon lead; grid = standard; featured = Sunday accent in grid */
  variant?: 'hero' | 'grid' | 'featured' | 'sunday';
};

export function ElementaryWeeklyShareMealCell({
  item,
  cookTime,
  variant = 'grid',
}: Props) {
  const image = resolveMealHeroImage(item.recipeId, 'homemade');
  const timeLabel = cookTime(item.timeMinutes);
  const isHero = variant === 'hero';
  const isFeatured = variant === 'featured' || variant === 'sunday';

  if (isHero) {
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroImageWrap}>
          <View style={[styles.dayBadgeOnImage, styles.dayBadgeHero]}>
            <Text style={styles.dayTextHero}>{item.dayLabel}</Text>
          </View>
          <MealImageView
            image={image}
            variant="hero"
            style={styles.heroImage}
            containerStyle={styles.heroImageContainer}
            resizeMode="cover"
            showEmojiFallback
            emojiSize={48}
            remountKey={item.recipeId}
            accessibilityLabel={item.name}
          />
        </View>
        <View style={styles.heroTextBand}>
          <Text style={styles.heroName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.heroTime} numberOfLines={1}>
            {timeLabel}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.gridCell, isFeatured && styles.featuredCell]}>
      <View style={styles.gridImageFrame}>
        <View style={[styles.dayBadgeOnImage, isFeatured && styles.dayBadgeFeatured]}>
          <Text style={styles.dayText}>{item.dayLabel}</Text>
        </View>
        <MealImageView
          image={image}
          variant="hero"
          style={styles.gridImage}
          containerStyle={styles.gridImageContainer}
          resizeMode="cover"
          showEmojiFallback
          emojiSize={28}
          remountKey={item.recipeId}
          accessibilityLabel={item.name}
        />
      </View>
      <View style={styles.gridTextBand}>
        <Text style={[styles.gridName, isFeatured && styles.featuredName]} numberOfLines={2}>
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
  heroCard: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    backgroundColor: SHARE_CARD_CELL_BG,
    borderRadius: SHARE_CELL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
  },
  heroImageWrap: {
    flex: SHARE_HERO_IMAGE_FLEX,
    flexGrow: SHARE_HERO_IMAGE_FLEX,
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: SHARE_CARD_IMAGE_BG,
    position: 'relative',
  },
  heroImageContainer: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTextBand: {
    flex: SHARE_HERO_TEXT_FLEX,
    flexGrow: SHARE_HERO_TEXT_FLEX,
    flexShrink: 0,
    minHeight: SHARE_HERO_TEXT_BAND_MIN_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: SHARE_CARD_TEXT_BAND,
  },
  heroName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.35,
  },
  heroTime: {
    flexShrink: 0,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
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
  featuredCell: {
    borderColor: ds.colors.primary,
    borderWidth: 1.5,
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
  dayBadgeHero: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayBadgeFeatured: {
    backgroundColor: ds.colors.primaryDark,
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
    paddingTop: 2,
    paddingBottom: 2,
    gap: 0,
    backgroundColor: SHARE_CARD_TEXT_BAND,
  },
  gridName: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.28,
  },
  featuredName: {
    fontSize: 12.5,
    lineHeight: 15,
  },
  meta: {
    fontSize: 7.5,
    lineHeight: 9,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    alignSelf: 'flex-end',
  },
  dayText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dayTextHero: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
