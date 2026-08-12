import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MEAL_TIME_SLOT_KEYS, MEAL_TIME_SLOT_LABELS } from '../../types/mealTimeRecommendation';
import type { MealTimeSlotKey } from '../../types/mealTimeRecommendation';
import { theme } from '../../constants/theme';

type Props = {
  selectedSlot: MealTimeSlotKey;
  clockPrimarySlot: MealTimeSlotKey;
  disabled?: boolean;
  onSelect: (slot: MealTimeSlotKey) => void;
};

/** Sprint 61-D — full-width segmented meal-time control. */
export function MealTimeSlotTabs({
  selectedSlot,
  clockPrimarySlot,
  disabled = false,
  onSelect,
}: Props) {
  return (
    <View style={styles.track}>
      {MEAL_TIME_SLOT_KEYS.map((slot) => {
        const isSelected = slot === selectedSlot;
        const isClock = slot === clockPrimarySlot;
        return (
          <Pressable
            key={slot}
            style={({ pressed }) => [
              styles.tab,
              isSelected && styles.tabSelected,
              isClock && !isSelected && styles.tabClockHint,
              pressed && !disabled && styles.tabPressed,
              disabled && styles.tabDisabled,
            ]}
            onPress={() => onSelect(slot)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${MEAL_TIME_SLOT_LABELS[slot]} 추천`}
          >
            <Text
              style={[styles.tabText, isSelected && styles.tabTextSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {MEAL_TIME_SLOT_LABELS[slot]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    gap: 2,
    backgroundColor: theme.colors.backgroundCream,
    borderRadius: theme.radius.badge,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: theme.radius.badge - 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  tabClockHint: {
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  tabPressed: {
    opacity: 0.85,
  },
  tabDisabled: {
    opacity: 0.55,
  },
  tabText: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export function mealTimeSlotHeadline(slot: MealTimeSlotKey): string {
  return `오늘 ${MEAL_TIME_SLOT_LABELS[slot]} 뭐 먹지?`;
}
