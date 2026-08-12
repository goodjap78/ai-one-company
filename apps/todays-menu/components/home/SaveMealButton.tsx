import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const SaveMealButton = memo(function SaveMealButton({
  label,
  onPress,
  disabled,
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}. 나중에 먹을 메뉴로 기억해요.`}
    >
      <View style={styles.content}>
        <SeedMascot variant="happy" size={32} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: theme.sizes.secondaryButtonHeight,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: theme.colors.primarySoft,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...theme.typography.secondaryButton,
    color: theme.colors.textSecondary,
  },
});
