import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type SegmentOption<T extends string> = {
  id: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
};

/** Compact segmented control for 2–3 filter options (store scope). */
export function ConvenienceSegmentControl<T extends string>({
  options,
  selectedId,
  onSelect,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selectedId === option.id;
        return (
          <Pressable
            key={option.id}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              option.disabled && styles.segmentDisabled,
              pressed && !option.disabled && styles.segmentPressed,
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
                styles.segmentText,
                active && styles.segmentTextActive,
                option.disabled && styles.segmentTextDisabled,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  segment: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    minHeight: 36,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentPressed: {
    opacity: 0.88,
  },
  segmentText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  segmentTextActive: {
    color: ds.colors.primaryDark,
    fontWeight: '800',
  },
  segmentTextDisabled: {
    color: ds.colors.textMuted,
  },
});
