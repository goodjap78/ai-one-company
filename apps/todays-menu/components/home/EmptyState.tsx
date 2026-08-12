import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  onSetupPreferences?: () => void;
};

export function EmptyState({ onSetupPreferences }: Props) {
  return (
    <View style={styles.card}>
      <SeedMascot variant="default" size={48} />
      <Text style={styles.title}>한끼가 첫 메뉴를 준비하고 있어요.</Text>
      <Text style={styles.message}>몇 가지만 알려주시면 더 잘 추천해드릴게요.</Text>
      {onSetupPreferences && (
        <Pressable style={styles.button} onPress={onSetupPreferences}>
          <Text style={styles.buttonText}>취향 설정하기</Text>
        </Pressable>
      )}
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
    backgroundColor: theme.colors.primary,
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  buttonText: {
    ...theme.typography.secondaryButton,
    color: theme.colors.background,
  },
});
