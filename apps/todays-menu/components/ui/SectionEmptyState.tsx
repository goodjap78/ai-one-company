import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  message: string;
  title?: string;
  emoji?: string;
  /** Inline inside a section card — no extra padding shell. */
  compact?: boolean;
  /** Use Seed mascot instead of emoji. */
  showAvatar?: boolean;
};

export function SectionEmptyState({
  message,
  title,
  emoji = '🍽️',
  compact = false,
  showAvatar = true,
}: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showAvatar ? (
        <SeedMascot variant="default" size={32} />
      ) : (
        <Text style={styles.emoji} accessibilityLabel="빈 상태">
          {emoji}
        </Text>
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  wrapCompact: {
    paddingVertical: theme.spacing.sm,
  },
  emoji: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.greetingTitle,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
