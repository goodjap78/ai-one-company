import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  title?: string;
  message?: string;
  compact?: boolean;
  /** Calm loading — Seed think + text, no spinner (home hero). */
  calm?: boolean;
};

/** Consistent loading state — fixed height to avoid layout jumps. */
export function ScreenLoading({ title, message, compact = false, calm = false }: Props) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <SeedMascot variant="think" size={compact ? 40 : 48} />
      {title ? (
        <Text style={[styles.title, calm && styles.titleCalm]} maxFontSizeMultiplier={1.25}>
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text style={styles.message} maxFontSizeMultiplier={1.25}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    minHeight: theme.sizes.heroMinHeight,
  },
  boxCompact: {
    minHeight: 80,
    paddingVertical: theme.spacing.md,
  },
  title: {
    ...theme.typography.greetingTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  titleCalm: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  message: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
