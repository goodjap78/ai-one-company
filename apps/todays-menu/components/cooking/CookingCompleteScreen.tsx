import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  mealTitle: string;
  onGoHome: () => void;
};

const labels = getHankkiCookingMessages();

export function CookingCompleteScreen({ mealTitle, onGoHome }: Props) {
  const handleGoHome = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onGoHome();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <SeedMascot variant="happy" size={56} />
        <Text style={styles.message}>{labels.completionMessage}</Text>
        <Text style={styles.subMessage}>{labels.completionSub}</Text>
        <Text style={styles.mealTitle}>{mealTitle}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        onPress={handleGoHome}
        accessibilityRole="button"
        accessibilityLabel={labels.goHomeButton}
      >
        <Text style={styles.primaryText}>{labels.goHomeButton}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.section,
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  message: {
    ...theme.typography.greetingTitle,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  subMessage: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  mealTitle: {
    ...theme.typography.metaText,
    color: theme.colors.primary,
    fontSize: 15,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    height: theme.sizes.primaryButtonHeight,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  pressed: theme.interaction.pressed,
  primaryText: {
    ...theme.typography.primaryButton,
    color: theme.colors.background,
  },
});
