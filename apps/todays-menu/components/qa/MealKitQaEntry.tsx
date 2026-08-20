import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ds } from '../../constants/designSystem';
import { isMealKitFeatureEnabled } from '../../constants/featureFlags';
import { isInternalQaEnabled } from '../../utils/isInternalQaEnabled';
import { recipeRef } from '../recipe/recipePremiumStyles';

/** My-tab shortcut — renders nothing in production or when meal-kit UI is flagged off. */
export function MealKitQaEntry() {
  const router = useRouter();

  if (!isMealKitFeatureEnabled() || !isInternalQaEnabled()) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/qa/meal-kit');
      }}
      accessibilityRole="button"
      accessibilityLabel="QA Meal Kit Test"
    >
      <Text style={styles.label}>QA Meal Kit Test</Text>
      <Text style={styles.chevron}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ds.sizes.touchTarget,
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...ds.typography.body,
    color: recipeRef.colors.textWarm,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    color: ds.colors.textMuted,
  },
});
