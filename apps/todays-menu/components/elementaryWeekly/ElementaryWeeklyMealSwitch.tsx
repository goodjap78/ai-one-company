import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';

export type ElementaryWeeklyMealMode = 'breakfast' | 'dinner';

type Props = {
  mode: ElementaryWeeklyMealMode;
  disabled?: boolean;
  onSelectBreakfast: () => void;
  onSelectDinner: () => void;
  breakfastLabel: string;
  dinnerLabel: string;
};

/** Compact 아침 / 저녁 segmented switch for elementary weekly plans. */
export function ElementaryWeeklyMealSwitch({
  mode,
  disabled = false,
  onSelectBreakfast,
  onSelectDinner,
  breakfastLabel,
  dinnerLabel,
}: Props) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      <Pressable
        style={({ pressed }) => [
          styles.tab,
          mode === 'breakfast' && styles.tabSelected,
          pressed && !disabled && styles.tabPressed,
          disabled && styles.tabDisabled,
        ]}
        onPress={onSelectBreakfast}
        disabled={disabled || mode === 'breakfast'}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'breakfast' }}
        accessibilityLabel={breakfastLabel}
      >
        <Text
          style={[styles.tabText, mode === 'breakfast' && styles.tabTextSelected]}
          numberOfLines={1}
        >
          {breakfastLabel}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.tab,
          mode === 'dinner' && styles.tabSelected,
          pressed && !disabled && styles.tabPressed,
          disabled && styles.tabDisabled,
        ]}
        onPress={onSelectDinner}
        disabled={disabled || mode === 'dinner'}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'dinner' }}
        accessibilityLabel={dinnerLabel}
      >
        <Text
          style={[styles.tabText, mode === 'dinner' && styles.tabTextSelected]}
          numberOfLines={1}
        >
          {dinnerLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    gap: 2,
    backgroundColor: ds.colors.primarySoft,
    borderRadius: ds.radius.button,
    padding: 3,
    borderWidth: 1,
    borderColor: ds.colors.border,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.button - 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: ds.colors.card,
    ...ds.shadow.card,
  },
  tabPressed: theme.interaction.pressedLight,
  tabDisabled: {
    opacity: 0.65,
  },
  tabText: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  tabTextSelected: {
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
});
