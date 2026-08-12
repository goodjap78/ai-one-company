import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiRetryMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';

type Props = {
  onRetry: () => void;
};

const retryMessages = getHankkiRetryMessages();

export function ErrorState({ onRetry }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🍳</Text>
      <Text style={styles.title}>{retryMessages.title}</Text>
      <Text style={styles.message}>{retryMessages.message}</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryMessages.button}
      >
        <Text style={styles.buttonText}>{retryMessages.button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.bubble,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...theme.typography.chefMessage,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.reasonText,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primarySoft,
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  buttonPressed: theme.interaction.pressedLight,
  buttonText: {
    ...theme.typography.secondaryButton,
    color: theme.colors.primary,
  },
});
