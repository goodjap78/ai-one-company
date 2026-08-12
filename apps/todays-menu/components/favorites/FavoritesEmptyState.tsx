import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiFavoritesMessages } from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import { SeedMascot } from '../common/SeedMascot';
import { appChrome } from '../ui/appChrome';

const labels = getHankkiFavoritesMessages();

type Props = {
  onGoHome?: () => void;
};

export function FavoritesEmptyState({ onGoHome }: Props) {
  return (
    <View style={[appChrome.card, styles.card]}>
      <SeedMascot variant="default" size={48} />
      <Text style={styles.title}>{labels.emptyTitle}</Text>
      <Text style={styles.message}>{labels.emptyMessage}</Text>
      {onGoHome ? (
        <Pressable
          style={({ pressed }) => [
            appChrome.primaryButton,
            styles.homeButton,
            pressed && appChrome.primaryButtonPressed,
          ]}
          onPress={onGoHome}
          accessibilityRole="button"
          accessibilityLabel={labels.emptyGoHomeButton}
        >
          <Text style={appChrome.primaryButtonText}>{labels.emptyGoHomeButton}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  title: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  homeButton: {
    alignSelf: 'stretch',
    marginTop: ds.spacing.md,
  },
});
