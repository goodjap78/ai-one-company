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
import { HomePersonalSection } from './HomePersonalSection';
import { TodayMealCard } from './TodayMealCard';
import { MealTimeSlotTabs } from './MealTimeSlotTabs';
import { AlternativeMealsRow } from './AlternativeMealsRow';
import { Toast } from './Toast';
import { useHomeScreen } from './useHomeScreen';
import { CoupangDynamicBanner } from '../ads/CoupangDynamicBanner';
import { logHomeRootMount, logHomeRootUnmount } from '../../utils/homeDebugLog';
import type { ComingSoonFeatureId } from '../../types/featureSurvey';

type Props = {
  nickname: string;
};

/**
 * Sprint 61-D — tighter vertical rhythm, decision-first hero.
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
    handleSelectAlternative,
    handleSlotChange,
    selectedSlot,
    clockPrimarySlot,
    favoriteCount,
    viewedRecipeCount,
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
      openSurvey(featureId);
    },
    [openSurvey],
  );

  return (
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
            <HomeHeroTitles selectedSlot={selectedSlot} />
            <HomeFeatureCards
              mealMode={mealMode}
              disabled={modeSelectorDisabled}
              onRecommendationPress={() => handleMealModeChange('homemade')}
              onConveniencePress={() => router.push('/convenience-combos')}
              onFridgePress={() => router.push('/fridge-raid')}
            />

            <View style={styles.slotSection}>
              <MealTimeSlotTabs
                selectedSlot={selectedSlot}
                clockPrimarySlot={clockPrimarySlot}
                disabled={modeSelectorDisabled}
                onSelect={handleSlotChange}
              />
            </View>

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

            {recommendation?.alternatives && recommendation.alternatives.length > 0 ? (
              <AlternativeMealsRow
                alternatives={recommendation.alternatives}
                selectedId={recommendation.recipe.id}
                disabled={isRefreshing || screenState !== 'ready'}
                onSelect={handleSelectAlternative}
              />
            ) : null}

            <HomeComingSoonSection onComingSoonPress={handleComingSoonPress} />
            <HomePersonalSection
              favoriteCount={favoriteCount}
              recentViewedCount={viewedRecipeCount}
            />
            <CoupangDynamicBanner />
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
    paddingTop: 8,
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: '100%',
    gap: 8,
    overflow: 'visible',
  },
  slotSection: {
    width: '100%',
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
