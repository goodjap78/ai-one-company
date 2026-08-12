import { StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { TodayBrief } from '../../types/today';

type Props = {
  brief: TodayBrief;
};

const labels = getHankkiHomeDecisionMessages();

export function HomeBriefingCompact({ brief }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{labels.supportingSectionLabel}</Text>
      <Text style={styles.summary}>{brief.todaySummary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  label: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.textSecondary,
  },
  summary: {
    ...theme.typography.tipBody,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
