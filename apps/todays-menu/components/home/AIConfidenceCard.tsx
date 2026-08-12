import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import type { MealExplanationLevel3 } from '../../types/mealExplanation';

type Props = {
  level3?: MealExplanationLevel3;
  closing?: string;
};

export function AIConfidenceCard({ level3, closing }: Props) {
  if (!level3 && !closing) return null;

  return (
    <View style={styles.card}>
      {level3?.warmMatchLabel ? (
        <Text style={styles.warmTitle}>{level3.warmMatchLabel}</Text>
      ) : null}
      {closing ? <Text style={styles.closing}>{closing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md + 6,
    paddingHorizontal: theme.spacing.md + 4,
    gap: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  warmTitle: {
    ...theme.typography.greetingTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  closing: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
