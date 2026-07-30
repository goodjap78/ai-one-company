import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { ds } from '../../constants/designSystem';
import { homePremiumStyles, homeRef } from './homePremiumStyles';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'outlined' | 'text';
};

export const RefreshRecommendationButton = memo(function RefreshRecommendationButton({
  label,
  onPress,
  disabled,
  fullWidth = false,
  variant = 'outlined',
}: Props) {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'text' ? styles.buttonText : homePremiumStyles.secondaryButton,
        fullWidth && styles.buttonFullWidth,
        pressed && (variant === 'text' ? styles.pressedText : styles.pressed),
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}. 다른 메뉴를 보여드려요.`}
    >
      <Text
        style={[homePremiumStyles.secondaryButtonLabel, variant === 'text' && styles.labelText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    minHeight: theme.sizes.touchTarget,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  buttonFullWidth: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: homeRef.press.scale }],
    opacity: homeRef.press.opacity,
  },
  pressedText: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.5,
  },
  labelText: {
    ...ds.typography.body,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
});
