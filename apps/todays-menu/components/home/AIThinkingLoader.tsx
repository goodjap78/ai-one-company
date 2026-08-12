import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  getHankkiInitialThinkingMessages,
  getHankkiThinkingSteps,
  getHankkiThinkingTitle,
} from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Variant = 'initial' | 'refresh';

type Props = {
  variant?: Variant;
};

const REFRESH_STEPS = getHankkiThinkingSteps();
const REFRESH_TITLE = getHankkiThinkingTitle();
const INITIAL_MESSAGES = getHankkiInitialThinkingMessages();

export function AIThinkingLoader({ variant = 'refresh' }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (variant !== 'refresh') return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % REFRESH_STEPS.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [variant]);

  if (variant === 'initial') {
    return (
      <View style={styles.card}>
        <SeedMascot variant="think" size={48} />
        <Text style={styles.title}>{INITIAL_MESSAGES.title}</Text>
        <Text style={styles.message}>{INITIAL_MESSAGES.subtitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <SeedMascot variant="think" size={56} />
      <Text style={styles.title}>{REFRESH_TITLE}</Text>
      <Text style={styles.message}>{REFRESH_STEPS[messageIndex]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
    minHeight: 160,
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
});
