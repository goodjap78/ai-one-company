import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { MealKitQaEntry } from '../qa/MealKitQaEntry';
import { appChrome } from '../ui/appChrome';

function resolveAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeApplicationVersion ??
    '—'
  );
}

export function MyAppSettingsSection() {
  const version = resolveAppVersion();

  return (
    <View style={appChrome.card}>
      <Text style={styles.sectionTitle}>
        {MY_PAGE_COPY.settings.emoji} {MY_PAGE_COPY.settings.title}
      </Text>

      <View style={styles.versionRow} accessibilityRole="text">
        <Text style={styles.label}>{MY_PAGE_COPY.settings.versionLabel}</Text>
        <Text style={styles.value}>{version}</Text>
      </View>
      <MealKitQaEntry />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...appChrome.sectionTitle,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ds.sizes.touchTarget,
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.md,
  },
  label: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    fontWeight: '500',
  },
  value: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    fontWeight: '600',
  },
});
