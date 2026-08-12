import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { homePremiumStyles, homeRef } from './homePremiumStyles';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

export const PrimaryDecisionButton = memo(function PrimaryDecisionButton({
  label,
  onPress,
  disabled,
  accessibilityHint,
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        homePremiumStyles.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <Text style={homePremiumStyles.primaryButtonLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: homeRef.press.scale }],
    opacity: homeRef.press.opacity,
  },
  disabled: {
    opacity: 0.5,
  },
});
