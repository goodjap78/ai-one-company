import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FRIDGE_SHOPPING_CONFIG } from '../../constants/fridgeShoppingConfig';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import type { ShoppingIngredientItem } from '../../types/shopping';
import { ds } from '../../constants/designSystem';
import { recipeRef } from '../recipe/recipePremiumStyles';

type Props = {
  /** Top candidate missing shopping lines — CTA hidden when empty. */
  missingItems?: ShoppingIngredientItem[];
  recipeId?: string | null;
};

/**
 * Fridge-raid → missing-only shopping entry.
 * Reuses `/shopping/[id]?mode=missing` + ShoppingScreen product cards / outbound.
 */
export function FridgeShoppingBridge({ missingItems = [], recipeId = null }: Props) {
  const router = useRouter();
  const config = FRIDGE_SHOPPING_CONFIG;

  if (!config.enabled) {
    return null;
  }

  if (!recipeId) {
    return null;
  }

  if (missingItems.length === 0) {
    return (
      <View style={styles.completeBlock}>
        <View style={styles.completeWrap} accessibilityRole="text">
          <Text style={styles.completeLabel}>{SHOPPING_COPY.missingIngredientsComplete}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.seasoningLink, pressed && styles.seasoningLinkPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/shopping/${recipeId}?mode=missing&seasonings=1`);
          }}
          accessibilityRole="button"
          accessibilityLabel={SHOPPING_COPY.checkSeasoningsCta}
        >
          <Text style={styles.seasoningLinkLabel}>{SHOPPING_COPY.checkSeasoningsCta}</Text>
        </Pressable>
      </View>
    );
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/shopping/${recipeId}?mode=missing`);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={SHOPPING_COPY.missingIngredientsCta}
      >
        <View style={styles.inner}>
          <Text style={styles.label}>{SHOPPING_COPY.missingIngredientsCta}</Text>
          <Text style={styles.chevron}>→</Text>
        </View>
        <Text style={styles.hint}>{SHOPPING_COPY.missingIngredientsCtaHint}</Text>
        <Text style={styles.count}>
          {SHOPPING_COPY.missingIngredientsCountLabel(missingItems.length)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: ds.spacing.sm,
  },
  button: {
    backgroundColor: ds.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
    justifyContent: 'center',
    gap: 4,
    ...ds.shadow.card,
  },
  pressed: {
    opacity: 0.92,
    backgroundColor: ds.colors.primaryDark,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  count: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  completeBlock: {
    gap: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
  },
  completeWrap: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: recipeRef.colors.pastelCard,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  completeLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textWarm,
    textAlign: 'center',
  },
  seasoningLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  seasoningLinkPressed: {
    opacity: 0.9,
    backgroundColor: '#FFF3E8',
  },
  seasoningLinkLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
});
