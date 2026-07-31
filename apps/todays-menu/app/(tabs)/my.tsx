import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { appChrome } from '../../components/ui/appChrome';
import { ScreenBackButton } from '../../components/ui/ScreenBackButton';
import { MyAiRecommendationSection } from '../../components/my/MyAiRecommendationSection';
import { MyAiRecommendationSettingsBanner } from '../../components/my/MyAiRecommendationSettingsBanner';
import { MyAppSettingsSection } from '../../components/my/MyAppSettingsSection';
import { MyFavoritesSection } from '../../components/my/MyFavoritesSection';
import { MyLegalSection } from '../../components/my/MyLegalSection';
import { MyProfileHeader } from '../../components/my/MyProfileHeader';
import { RecentMealHistorySection } from '../../components/my/RecentMealHistorySection';
import { useTabScreenPadding } from '../../hooks/useTabScreenPadding';

export default function MyTab() {
  const { scrollPaddingBottom } = useTabScreenPadding();

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top']}>
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            mobileShell.scrollContent,
            styles.scrollContent,
            { paddingBottom: scrollPaddingBottom },
          ]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

            <View style={styles.headerBlock}>
              <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">
                {MY_PAGE_COPY.screenTitle}
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={2} ellipsizeMode="tail">
                {MY_PAGE_COPY.screenSubtitle}
              </Text>
            </View>

            <View style={styles.compactGroup}>
              <MyProfileHeader />
            </View>

            <MyAiRecommendationSettingsBanner />
            <MyAiRecommendationSection />

            <View style={styles.compactGroup}>
              <MyFavoritesSection />
              <RecentMealHistorySection />
            </View>
            <MyAppSettingsSection />
            <MyLegalSection />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: ds.spacing.lg,
  },
  page: {
    width: '100%',
    gap: ds.spacing.md,
  },
  compactGroup: {
    gap: ds.spacing.sm,
  },
  screenTitle: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  headerBlock: {
    gap: ds.spacing.xs,
    width: '100%',
    marginBottom: ds.spacing.xs,
  },
  screenSubtitle: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
});
