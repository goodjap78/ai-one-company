import { StyleSheet, Text, View } from 'react-native';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { RecipeStep } from '../../types/recipe';

type Props = {
  step: RecipeStep;
  estimatedMinutes: number | null;
};

const labels = getHankkiCookingMessages();

export function CookingStepCard({ step, estimatedMinutes }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepNumber}>{step.order}</Text>
        </View>
        {estimatedMinutes ? (
          <Text style={styles.timeEstimate}>{labels.stepTimeEstimate(estimatedMinutes)}</Text>
        ) : null}
      </View>

      <Text style={styles.instruction}>{step.instruction}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 160,
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    ...theme.typography.metaText,
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  timeEstimate: {
    ...theme.typography.metaText,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  instruction: {
    ...theme.typography.reasonText,
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 30,
  },
});
