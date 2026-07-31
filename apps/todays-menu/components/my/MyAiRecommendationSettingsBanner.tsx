import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { ds } from '../../constants/designSystem';
import { getAiRecommendationSettings } from '../../services/aiRecommendationSettings';
import { hasUserConfiguredAiRecommendationSettings } from '../../services/aiRecommendationSettings/hasUserConfiguredAiRecommendationSettings';
import { appChrome } from '../ui/appChrome';
import { MyCompactRow } from './MyCompactRow';

const SETTINGS_ROUTE = '/ai-recommendation-settings' as const;

export function MyAiRecommendationSettingsBanner() {
  const router = useRouter();
  const copy = MY_PAGE_COPY.aiSettingsPrompt;
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const loadStatus = useCallback(async () => {
    const settings = await getAiRecommendationSettings();
    setIsConfigured(hasUserConfiguredAiRecommendationSettings(settings));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStatus();
    }, [loadStatus]),
  );

  const openSettings = useCallback(() => {
    router.push(SETTINGS_ROUTE);
  }, [router]);

  if (isConfigured === null) {
    return null;
  }

  if (isConfigured) {
    return (
      <MyCompactRow
        title={copy.completeTitle}
        detail={copy.completeBody}
        trailingLabel={copy.editAction}
        onPress={openSettings}
        accessibilityLabel={`${copy.completeTitle}. ${copy.completeBody}. ${copy.editAction}`}
      />
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [appChrome.card, styles.promptCard, pressed && appChrome.pressed]}
      onPress={openSettings}
      accessibilityRole="button"
      accessibilityLabel={`${copy.promptTitle}. ${copy.promptBody}. ${copy.promptAction}`}
    >
      <Text style={styles.promptTitle}>{copy.promptTitle}</Text>
      <Text style={styles.promptBody}>{copy.promptBody}</Text>
      <View style={styles.checklist}>
        {copy.promptItems.map((item) => (
          <Text key={item} style={styles.checklistItem} numberOfLines={2}>
            ✔ {item}
          </Text>
        ))}
      </View>
      <View style={styles.promptButton}>
        <Text style={appChrome.primaryButtonText}>{copy.promptAction}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    gap: ds.spacing.sm,
    backgroundColor: '#FFF8F2',
    borderColor: 'rgba(255, 106, 0, 0.14)',
  },
  promptTitle: {
    ...ds.typography.sectionTitle,
    fontSize: 17,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  promptBody: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    lineHeight: 22,
  },
  checklist: {
    gap: 4,
    marginTop: 2,
  },
  checklistItem: {
    ...ds.typography.caption,
    color: ds.colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  promptButton: {
    ...appChrome.primaryButton,
    marginTop: ds.spacing.xs,
    minHeight: 44,
  },
});
