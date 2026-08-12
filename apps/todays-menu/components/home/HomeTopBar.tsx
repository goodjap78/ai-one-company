import { StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';

type Props = {
  greeting: string;
};

/** Single quiet line above the recommendation — no competing chrome. */
export function HomeTopBar({ greeting }: Props) {
  return (
    <Text style={styles.greeting} accessibilityRole="text">
      {greeting}
    </Text>
  );
}

const styles = StyleSheet.create({
  greeting: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingBottom: theme.spacing.xs,
  },
});
