import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isMealKitFeatureEnabled } from '../../constants/featureFlags';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { ds } from '../../constants/designSystem';
import { isMealKitEligible } from '../../services/shopping/mealKit/mealKitEligibility';
import { trackMealKitCtaClick } from '../../services/analytics';
import { recipeRef } from '../recipe/recipePremiumStyles';

type Props = {
  recipeId: string;
  /** Fridge: secondary under missing CTA. Ingredients: sibling section. */
  variant?: 'section' | 'secondary';
};

/**
 * Sprint 66-A — HIGH-only meal kit entry. Renders nothing when not eligible.
 */
export function MealKitShoppingCta({ recipeId, variant = 'section' }: Props) {
  const router = useRouter();

  if (!isMealKitFeatureEnabled() || !isMealKitEligible(recipeId)) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackMealKitCtaClick({ recipe_id: recipeId });
    router.push(`/shopping/${recipeId}?mode=meal-kit`);
  };

  if (variant === 'secondary') {
    return (
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={SHOPPING_COPY.mealKitCta}
      >
        <Text style={styles.secondaryLabel}>{SHOPPING_COPY.mealKitCta}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.section} accessibilityRole="summary">
      <Text style={styles.title}>{SHOPPING_COPY.mealKitSectionTitle}</Text>
      <Text style={styles.body}>{SHOPPING_COPY.mealKitSectionBody}</Text>
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={SHOPPING_COPY.mealKitCta}
      >
        <Text style={styles.secondaryLabel}>{SHOPPING_COPY.mealKitCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: recipeRef.colors.pastelCard,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: recipeRef.colors.textWarm,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.9,
    backgroundColor: '#FFF3E8',
  },
  secondaryLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: ds.colors.primaryDark,
    textAlign: 'center',
  },
});
