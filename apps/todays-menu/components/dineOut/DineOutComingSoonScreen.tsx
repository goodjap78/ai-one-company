import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '../../constants/designSystem';
import { DINE_OUT_COMING_SOON_COPY } from '../../constants/dineOutComingSoonCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { navigateBack } from '../../utils/navigateBack';
import { FOOTER_SCROLL_PADDING, screenLayout } from '../ui/screenLayout';
import { ScreenBackButton } from '../ui/ScreenBackButton';

const copy = DINE_OUT_COMING_SOON_COPY;

export function DineOutComingSoonScreen() {
  const router = useRouter();

  const handleBackToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateBack(router, '/(tabs)');
  };

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={screenLayout.frame}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

            <View style={styles.heroBlock}>
              <Text style={styles.heroEmoji} accessibilityLabel={copy.title}>
                {copy.emoji}
              </Text>
              <Text style={styles.heroTitle}>{copy.title}</Text>
              <Text style={styles.headline}>{copy.headline}</Text>
              <Text style={styles.body}>{copy.body}</Text>
              <View style={styles.releaseBadge}>
                <Text style={styles.releaseText}>{copy.releaseLabel}</Text>
              </View>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>{copy.previewTitle}</Text>
              {copy.previewItems.map((item) => (
                <View key={item} style={styles.previewRow}>
                  <Text style={styles.checkmark}>✅</Text>
                  <Text style={styles.previewItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={screenLayout.footer}>
          <Pressable
            style={({ pressed }) => [
              screenLayout.primaryButton,
              pressed && screenLayout.pressedPrimary,
            ]}
            onPress={handleBackToHome}
            accessibilityRole="button"
            accessibilityLabel={copy.ctaButton}
          >
            <Text style={screenLayout.primaryText}>{copy.ctaButton}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: FOOTER_SCROLL_PADDING,
  },
  heroBlock: {
    alignItems: 'center',
    gap: ds.spacing.md,
    paddingTop: ds.spacing.md,
  },
  heroEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  heroTitle: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  headline: {
    ...ds.typography.foodName,
    color: ds.colors.primary,
    textAlign: 'center',
  },
  body: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  releaseBadge: {
    marginTop: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: 8,
    borderRadius: ds.radius.badge,
    backgroundColor: ds.colors.primarySoft,
  },
  releaseText: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    padding: ds.spacing.cardInner,
    gap: ds.spacing.md,
    ...ds.shadow.card,
  },
  previewTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  checkmark: {
    fontSize: 16,
    lineHeight: 22,
  },
  previewItem: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    flex: 1,
  },
});
