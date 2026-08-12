import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { ds } from '../../constants/designSystem';

type Props = {
  recipeId: string;
};

/**
 * Sprint 64 — solid orange shopping entry (monetization CTA).
 * Route: /shopping/[recipeId] (full / selected ingredient shopping).
 */
export function IngredientsShoppingCta({ recipeId }: Props) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/shopping/${recipeId}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={SHOPPING_COPY.ingredientsCta}
    >
      <View style={styles.inner}>
        <Text style={styles.label}>{SHOPPING_COPY.ingredientsCta}</Text>
        <Text style={styles.chevron}>→</Text>
      </View>
      <Text style={styles.hint}>{SHOPPING_COPY.ingredientsCtaHint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: ds.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 58,
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
});
