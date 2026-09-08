import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';
import { weeklyRecipeAccessCopy } from '../../constants/weeklyRecipeAccessCopy';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';
import { appChrome } from '../ui/appChrome';

type Props = {
  dayLabel: string;
  name: string;
  timeMinutes: number;
  recipeId: string;
  ingredientHint: string;
  cookTimeLabel: (minutes: number) => string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

export function ElementaryWeeklyPlanDayCard({
  dayLabel,
  name,
  timeMinutes,
  recipeId,
  ingredientHint,
  cookTimeLabel,
  disabled,
  onPress,
  accessibilityLabel,
}: Props) {
  const image = resolveMealHeroImage(recipeId, 'homemade');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && styles.cardPressed,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.dayBadge}>
        <Text style={styles.dayBadgeText}>{dayLabel}</Text>
      </View>
      <View style={styles.imageWrap}>
        <MealImageView
          image={image}
          variant="thumb"
          style={styles.image}
          containerStyle={styles.imageContainer}
          showEmojiFallback
          emojiSize={32}
          remountKey={recipeId}
          debugScreen="WeeklyPlanDayCard"
          accessibilityLabel={name}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.menuName} numberOfLines={2}>
          {name}
        </Text>
        {ingredientHint ? (
          <Text style={styles.ingredients} numberOfLines={1}>
            {ingredientHint}
          </Text>
        ) : null}
        <Text style={styles.cookTime}>{cookTimeLabel(timeMinutes)}</Text>
        <Text style={styles.recipeCta} accessibilityElementsHidden importantForAccessibility="no">
          {weeklyRecipeAccessCopy.recipeViewCta}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...appChrome.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    minHeight: 96,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
  },
  cardPressed: theme.interaction.pressed,
  cardDisabled: {
    opacity: 0.72,
  },
  dayBadge: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    ...ds.typography.caption,
    fontWeight: '800',
    fontSize: 15,
    color: ds.colors.primary,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: ds.radius.image,
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  menuName: {
    ...ds.typography.foodName,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  ingredients: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
  },
  cookTime: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  recipeCta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ds.colors.warmText,
    marginTop: 2,
  },
});
