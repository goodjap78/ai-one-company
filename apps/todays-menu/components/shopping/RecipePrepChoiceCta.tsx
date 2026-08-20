import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { isMealKitFeatureEnabled } from '../../constants/featureFlags';
import { isMealKitEligible } from '../../services/shopping/mealKit/mealKitEligibility';
import { trackMealKitCtaClick, trackShoppingCtaClick } from '../../services/analytics';
import { recipeRef } from '../recipe/recipePremiumStyles';

type Props = {
  recipeId: string;
};

type CardProps = {
  emoji: string;
  title: string;
  subtitle: string;
  variant: 'primary' | 'secondary';
  accessibilityLabel: string;
  onPress: () => void;
};

function PrepChoiceCard({
  emoji,
  title,
  subtitle,
  variant,
  accessibilityLabel,
  onPress,
}: CardProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isPrimary ? styles.cardPrimary : styles.cardSecondary,
        pressed && (isPrimary ? styles.cardPrimaryPressed : styles.cardSecondaryPressed),
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.emoji, isPrimary ? styles.emojiOnPrimary : styles.emojiOnSecondary]}>
        {emoji}
      </Text>
      <Text
        style={[styles.title, isPrimary ? styles.titleOnPrimary : styles.titleOnSecondary]}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        style={[styles.subtitle, isPrimary ? styles.subtitleOnPrimary : styles.subtitleOnSecondary]}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

/**
 * Ingredients CTA row — shopping always; meal-kit card only when validated eligible.
 * 2 equal cards on HIGH/validated; otherwise a single full-width shopping card.
 */
export function RecipePrepChoiceCta({ recipeId }: Props) {
  const router = useRouter();
  const showMealKit = isMealKitFeatureEnabled() && isMealKitEligible(recipeId);

  const openShopping = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackShoppingCtaClick({ recipe_id: recipeId, mode: 'all' });
    router.push(`/shopping/${recipeId}`);
  };

  const openMealKit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackMealKitCtaClick({ recipe_id: recipeId });
    router.push(`/shopping/${recipeId}?mode=meal-kit`);
  };

  return (
    <View style={styles.row} accessibilityRole="summary">
      <View style={showMealKit ? styles.half : styles.full}>
        <PrepChoiceCard
          emoji="🛒"
          title={SHOPPING_COPY.prepChoiceShoppingTitle}
          subtitle={SHOPPING_COPY.prepChoiceShoppingSubtitle}
          variant="primary"
          accessibilityLabel={SHOPPING_COPY.ingredientsCta}
          onPress={openShopping}
        />
      </View>
      {showMealKit ? (
        <View style={styles.half}>
          <PrepChoiceCard
            emoji="🍲"
            title={SHOPPING_COPY.prepChoiceMealKitTitle}
            subtitle={SHOPPING_COPY.prepChoiceMealKitSubtitle}
            variant="secondary"
            accessibilityLabel={SHOPPING_COPY.mealKitCta}
            onPress={openMealKit}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    width: '100%',
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  full: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flex: 1,
    minHeight: 82,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
    gap: 2,
  },
  cardPrimary: {
    backgroundColor: ds.colors.primary,
    ...ds.shadow.card,
  },
  cardSecondary: {
    backgroundColor: recipeRef.colors.pastelCard,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
  },
  cardPrimaryPressed: {
    opacity: 0.92,
    backgroundColor: ds.colors.primaryDark,
  },
  cardSecondaryPressed: {
    opacity: 0.92,
    backgroundColor: '#FFF3E8',
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  emojiOnPrimary: {
    color: '#FFFFFF',
  },
  emojiOnSecondary: {
    color: recipeRef.colors.textDeep,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  titleOnPrimary: {
    color: '#FFFFFF',
  },
  titleOnSecondary: {
    color: ds.colors.primaryDark,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  subtitleOnPrimary: {
    color: 'rgba(255,255,255,0.92)',
  },
  subtitleOnSecondary: {
    color: recipeRef.colors.textWarm,
  },
});
