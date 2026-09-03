import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function ElementaryWeeklyPlanHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: ds.spacing.sm,
  },
  eyebrow: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
    letterSpacing: 0.2,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
});
