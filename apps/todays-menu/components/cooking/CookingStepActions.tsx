import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';

type Props = {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
};

const labels = getHankkiCookingMessages();

export function CookingStepActions({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onComplete,
}: Props) {
  const handlePress = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  const handlePrimary = () => {
    if (isLastStep) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
      return;
    }
    handlePress(onNext);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.secondaryButton,
          isFirstStep && styles.buttonDisabled,
          pressed && !isFirstStep && styles.pressed,
        ]}
        onPress={() => handlePress(onPrevious)}
        disabled={isFirstStep}
        accessibilityRole="button"
        accessibilityLabel={labels.prevButton}
        accessibilityState={{ disabled: isFirstStep }}
      >
        <Text style={[styles.secondaryText, isFirstStep && styles.textDisabled]}>
          {labels.prevButton}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        onPress={handlePrimary}
        accessibilityRole="button"
        accessibilityLabel={isLastStep ? labels.lastStepButton : labels.nextButton}
      >
        <Text style={styles.primaryText}>
          {isLastStep ? labels.lastStepButton : labels.nextButton}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screen,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundCream,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  button: {
    flex: 1,
    height: theme.sizes.secondaryButtonHeight,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: theme.interaction.pressed,
  primaryText: {
    ...theme.typography.primaryButton,
    color: theme.colors.background,
    fontSize: 16,
  },
  secondaryText: {
    ...theme.typography.secondaryButton,
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
});
