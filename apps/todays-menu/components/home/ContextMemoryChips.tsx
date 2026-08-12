import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CONTEXT_MEMORY_SECTION_LABELS,
  DINING_SITUATION_CHIPS,
  MEAL_GOAL_CHIPS,
} from '../../constants/contextMemoryChips';
import { theme } from '../../constants/theme';
import type { ContextMemorySelection } from '../../types/contextMemory';

type Props = {
  selection: ContextMemorySelection;
  disabled?: boolean;
  onToggle: <K extends keyof ContextMemorySelection>(
    field: K,
    value: NonNullable<ContextMemorySelection[K]>,
  ) => void;
};

function ChipRow<T extends string>({
  label,
  options,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string; emoji: string }[];
  selected: T | null;
  disabled?: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => {
                if (disabled) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.value);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.chipEmoji}>{option.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ContextMemoryChips({ selection, disabled, onToggle }: Props) {
  return (
    <View style={styles.container}>
      <ChipRow
        label={CONTEXT_MEMORY_SECTION_LABELS.dining}
        options={DINING_SITUATION_CHIPS}
        selected={selection.diningSituation}
        disabled={disabled}
        onSelect={(value) => onToggle('diningSituation', value)}
      />
      <ChipRow
        label={CONTEXT_MEMORY_SECTION_LABELS.goal}
        options={MEAL_GOAL_CHIPS}
        selected={selection.mealGoal}
        disabled={disabled}
        onSelect={(value) => onToggle('mealGoal', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  chipScroll: {
    gap: 6,
    paddingRight: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: theme.sizes.touchTarget,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.badge,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
});
