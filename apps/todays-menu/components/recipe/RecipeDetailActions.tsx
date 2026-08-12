import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  favorited: boolean;
  savingMeal: boolean;
  onEaten: () => void;
  onFavorite: () => void;
  onOtherMenu: () => void;
};

const labels = getHankkiRecipeMessages();

/**
 * Sprint R2 — action hierarchy inside scroll:
 * full-width primary → outlined favorite → secondary other-menu CTA.
 */
export function RecipeDetailActions({
  favorited,
  savingMeal,
  onEaten,
  onFavorite,
  onOtherMenu,
}: Props) {
  const tap = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.primary,
          pressed && recipePremiumStyles.pressedPrimary,
          savingMeal && styles.disabled,
        ]}
        onPress={() => tap(onEaten)}
        disabled={savingMeal}
        accessibilityRole="button"
        accessibilityLabel={labels.mealCompletedButton}
      >
        <Text style={styles.primaryLabel} numberOfLines={1}>
          {labels.mealCompletedButton}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondary,
          pressed && recipePremiumStyles.pressed,
        ]}
        onPress={() => tap(onFavorite)}
        accessibilityRole="button"
        accessibilityLabel={labels.favoriteButton}
        accessibilityState={{ selected: favorited }}
      >
        <Text style={styles.secondaryLabel} numberOfLines={1}>
          {favorited ? `♥ ${labels.favoriteButton}` : labels.favoriteButton}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.otherMenu, pressed && styles.otherMenuPressed]}
        onPress={() => tap(onOtherMenu)}
        accessibilityRole="button"
        accessibilityLabel={labels.otherMenuRecommendLink}
      >
        <Text style={styles.otherMenuLabel} numberOfLines={1}>
          {labels.otherMenuRecommendLink} →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingTop: 4,
  },
  primary: {
    width: '100%',
    height: recipeRef.button.height,
    borderRadius: recipeRef.button.radius,
    backgroundColor: recipeRef.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondary: {
    width: '100%',
    height: 48,
    borderRadius: recipeRef.button.radius,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E8C4A8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
  otherMenu: {
    width: '100%',
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#FFF8EF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  otherMenuPressed: {
    opacity: 0.9,
    backgroundColor: '#FFF3E8',
  },
  otherMenuLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.primaryDark,
  },
  disabled: {
    opacity: 0.6,
  },
});
