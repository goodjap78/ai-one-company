import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';

type Props = {
  summary: string;
};

export function MealExplanationSummary({ summary }: Props) {
  if (!summary) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
  },
  summary: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
});
