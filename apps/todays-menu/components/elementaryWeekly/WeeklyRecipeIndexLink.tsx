import { Pressable, StyleSheet, Text } from 'react-native';
import { ds } from '../../constants/designSystem';
import { weeklyRecipeAccessCopy } from '../../constants/weeklyRecipeAccessCopy';
import { appChrome } from '../ui/appChrome';

type Props = {
  disabled: boolean;
  onPress: () => void;
};

export function WeeklyRecipeIndexLink({ disabled, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && appChrome.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={weeklyRecipeAccessCopy.weeklyRecipeIndexButton}
    >
      <Text style={styles.label}>{weeklyRecipeAccessCopy.weeklyRecipeIndexButton}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ds.radius.button,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
    paddingHorizontal: ds.spacing.md,
  },
  label: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  disabled: {
    opacity: 0.6,
  },
});
