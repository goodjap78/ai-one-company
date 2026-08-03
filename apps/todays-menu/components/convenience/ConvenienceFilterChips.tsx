import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type ChipOption<T extends string> = {
  id: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  label?: string;
  options: ChipOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  compact?: boolean;
};

export function ConvenienceFilterChips<T extends string>({
  label,
  options,
  selectedId,
  onSelect,
  compact = false,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {label ? <Text style={styles.rowLabel}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {options.map((option) => {
          const active = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.chip,
                compact && styles.chipCompact,
                active && styles.chipActive,
                option.disabled && styles.chipDisabled,
                pressed && !option.disabled && styles.chipPressed,
              ]}
              onPress={() => {
                if (option.disabled) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.id);
              }}
              disabled={option.disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: Boolean(option.disabled) }}
            >
              <Text
                style={[
                  styles.chipText,
                  compact && styles.chipTextCompact,
                  active && styles.chipTextActive,
                  option.disabled && styles.chipTextDisabled,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
  },
  rowLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  chipScroll: {
    gap: 8,
    paddingRight: ds.spacing.screen,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  chipActive: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  chipTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipTextActive: {
    color: ds.colors.primaryDark,
    fontWeight: '800',
  },
  chipTextDisabled: {
    color: ds.colors.textMuted,
  },
});
