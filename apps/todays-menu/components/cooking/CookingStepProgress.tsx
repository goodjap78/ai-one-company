import { StyleSheet, Text, View } from 'react-native';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { buildProgressBar } from '../../utils/cookingStepTime';

type Props = {
  currentStep: number;
  totalSteps: number;
};

const labels = getHankkiCookingMessages();

export function CookingStepProgress({ currentStep, totalSteps }: Props) {
  const bar = buildProgressBar(currentStep, totalSteps);

  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>{labels.progressLabel(currentStep, totalSteps)}</Text>
      <Text style={styles.bar} accessibilityLabel={`${currentStep} / ${totalSteps}`}>
        {bar}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  stepLabel: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  bar: {
    fontSize: 16,
    letterSpacing: 1,
    color: theme.colors.primary,
    lineHeight: 22,
  },
});
