import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { appChrome } from '../ui/appChrome';

type Props = {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

export function WeeklyPlanErrorPanel({ title, message, retryLabel, onRetry }: Props) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        style={({ pressed }) => [appChrome.secondaryButton, pressed && appChrome.pressed]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={appChrome.secondaryButtonText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    ...appChrome.card,
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  errorTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
});
