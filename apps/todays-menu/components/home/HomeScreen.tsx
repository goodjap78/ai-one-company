import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComingSoonSurveyModal } from '../surveys/ComingSoonSurveyModal';
import { useComingSoonSurvey } from '../surveys/useComingSoonSurvey';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { useTabScreenPadding } from '../../hooks/useTabScreenPadding';
import { HomeComingSoonSection } from './HomeComingSoonSection';
import { HomeFavoritePopup } from './HomeFavoritePopup';
import { HomeFeatureCards } from './HomeFeatureCards';
import { HomeHeroTitles } from './HomeHeroTitles';
import { HomeRewardCard } from './HomeRewardCard';
import { TodayMealCard } from './TodayMealCard';
import { Toast } from './Toast';
import { useHomeScreen } from './useHomeScreen';
import { logHomeRootMount, logHomeRootUnmount } from '../../utils/homeDebugLog';
import type { ComingSoonFeatureId } from '../../types/featureSurvey';

type Props = {
  nickname: string;
};

/**
 * North Star Home — compact header + feature cards + food hero + coming soon + reward.
 * Coming Soon taps open priority surveys (H3-12) without changing card layout.
 */
export function HomeScreen({ nickname }: Props) {
  const router = useRouter();
  const rootMountCount = useRef(0);

  useEffect(() => {
    rootMountCount.current += 1;
    logHomeRootMount(rootMountCount.current);
    return () => {
      logHomeRootUnmount();
    };
  }, []);

  const {
    todayBrief,
    screenState,
    mealMode,
    recommendation,
    heartedIds,
    toastMessage,
    toastVisible,
    toastShowSaveMascot,
    favoriteFeedback,
    isRefreshing,
    setToastVisible,
    dismissFavoriteFeedback,
    handleRefresh,
    handleAccept,
    handleMealModeChange,
    handleHeartPress,
    handleRetry,
  } = useHomeScreen(nickname);

  const {
    activeSurvey,
    surveyVisible,
    openSurvey,
    closeSurvey,
    selectOption,
    submitVote,
  } = useComingSoonSurvey();

  const { scrollPaddingBottom } = useTabScreenPadding();
  const modeSelectorDisabled = screenState === 'loading';

  const handleComingSoonPress = useCallback(
    (featureId: ComingSoonFeatureId) => {
      if (featureId === 'fridge') {
        router.push('/fridge-raid');
        return;
      }
      openSurvey(featureId);
    },
    [openSurvey, router],
  );

  return (
    // Top only — bottom inset is owned by the tab bar.
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          bounces
          overScrollMode="never"
        >
          <View style={styles.phoneFrame}>
            <HomeHeroTitles />
            <HomeFeatureCards
              mealMode={mealMode}
              disabled={modeSelectorDisabled}
              onHomemadePress={() => handleMealModeChange('homemade')}
              onComingSoonPress={openSurvey}
            />

            <TodayMealCard
              todayBrief={todayBrief}
              recommendation={recommendation}
              mealMode={mealMode}
              screenState={screenState}
              isHearted={Boolean(recommendation && heartedIds.has(recommendation.recipe.id))}
              isRefreshing={isRefreshing}
              onAccept={handleAccept}
              onRefresh={handleRefresh}
              onHeartPress={handleHeartPress}
              onRetry={handleRetry}
            />

            <HomeComingSoonSection onComingSoonPress={handleComingSoonPress} />
            <HomeRewardCard onPress={() => openSurvey('reward')} />
          </View>
        </ScrollView>

        <View style={styles.toastHost}>
          <Toast
            message={toastMessage}
            visible={toastVisible}
            showSaveMascot={toastShowSaveMascot}
            onHide={() => setToastVisible(false)}
          />
        </View>

        <HomeFavoritePopup
          visible={favoriteFeedback !== null}
          kind={favoriteFeedback}
          onConfirm={dismissFavoriteFeedback}
        />

        <ComingSoonSurveyModal
          featureId={activeSurvey?.featureId ?? null}
          title={activeSurvey?.survey.title ?? ''}
          description={activeSurvey?.survey.description ?? ''}
          options={activeSurvey?.survey.options ?? []}
          selectedOptionId={activeSurvey?.selectedOptionId ?? null}
          phase={activeSurvey?.phase ?? 'choose'}
          visible={surveyVisible}
          onClose={closeSurvey}
          onSelectOption={selectOption}
          onSubmit={submitVote}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: ds.colors.canvas,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    /** Sprint H6 — slightly tighter top so CTA fits above tab on iPhone */
    paddingTop: 10,
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: '100%',
    gap: ds.spacing.section,
    // Visible so header Seed can attach to the kids card (H2-7).
    overflow: 'visible',
  },
  toastHost: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
