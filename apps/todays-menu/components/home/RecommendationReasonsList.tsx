import { StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { MealExplanationLevel2Reason } from '../../types/mealExplanation';
import type { AiRecommendationReason } from '../../utils/recommendationDisplayReason';

type Props = {
  level2?: MealExplanationLevel2Reason[];
  reasons?: AiRecommendationReason[];
  maxItems?: number;
  hideLabel?: boolean;
};

const labels = getHankkiHomeDecisionMessages();

export function RecommendationReasonsList({
  level2,
  reasons = [],
  maxItems = 3,
  hideLabel = false,
}: Props) {
  if (level2 && level2.length > 0) {
    return (
      <View style={styles.container}>
        {!hideLabel ? (
          <Text style={styles.label}>{labels.explanationLevel2Label}</Text>
        ) : null}
        <View style={styles.list}>
          {level2.map((item) => (
            <View key={item.category} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.text}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const visible = reasons.slice(0, maxItems);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      {!hideLabel ? (
        <Text style={styles.label}>{labels.explanationSectionLabel}</Text>
      ) : null}
      <View style={styles.list}>
        {visible.map((reason, index) => (
          <View key={`${reason.emoji}-${index}`} style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.emoji}>{reason.emoji}</Text>
              <Text style={styles.text}>{reason.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  label: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  list: {
    gap: theme.spacing.md + 2,
  },
  row: {
    gap: 4,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm + 2,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 26,
    width: 24,
    textAlign: 'center',
  },
  text: {
    ...theme.typography.reasonText,
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 24,
  },
});
