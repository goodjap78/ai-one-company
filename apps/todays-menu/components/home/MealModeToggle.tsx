import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiMealModeLabels } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { MealMode } from '../../types/home';

type Props = {
  value: MealMode;
  onChange: (mode: MealMode) => void;
  disabled?: boolean;
  /** Limit which modes appear in the toggle (default: both). */
  availableModes?: MealMode[];
};

const labels = getHankkiMealModeLabels();
const ALL_MODES: MealMode[] = ['homemade', 'delivery'];

export function MealModeToggle({
  value,
  onChange,
  disabled,
  availableModes = ALL_MODES,
}: Props) {
  const handleSelect = (mode: MealMode) => {
    if (mode === value || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(mode);
  };

  return (
    <View style={styles.container}>
      {availableModes.map((mode) => {
        const active = value === mode;
        return (
          <Pressable
            key={mode}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => handleSelect(mode)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labels[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
    borderRadius: theme.radius.badge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
  },
  chipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
});
