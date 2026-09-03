import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type ChipOption<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  label: string;
  options: readonly ChipOption<T>[];
  selectedId: T | null;
  onToggle: (id: T) => void;
};

export function ChildToggleFilterRow<T extends string>({
  label,
  options,
  selectedId,
  onToggle,
}: Props<T>) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
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
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(option.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type BooleanProps = {
  label: string;
  options: readonly { id: string; label: string }[];
  activeIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
};

export function ChildBooleanFilterRow({ label, options, activeIds, onToggle }: BooleanProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {options.map((option) => {
          const active = activeIds.has(option.id);
          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(option.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    minHeight: 34,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  chipTextActive: {
    color: ds.colors.primaryDark,
    fontWeight: '800',
  },
});
