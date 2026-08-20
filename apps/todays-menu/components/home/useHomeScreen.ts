import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  getHankkiHomeDecisionMessages,
  getHankkiRecommendationMessage,
} from '../../constants/HankkiMessages';
import {
  acceptHomeRecommendation,
  getMealTimeSlotHomeRecommendation,
  refreshMealTimeSlotHomeRecommendation,
  persistMealTimeSlotHomeRecommendation,
  promoteMealTimeSlotAlternative,
  saveHomeRecommendation,
  simulateErrorRecommendation,
} from '../../services/homeService';
import { getAiSettingsRevision } from '../../services/aiRecommendationSettings';
import {
  addSessionHeroId,
  clearRecommendationSession,
  setRecommendationSession,
} from '../../services/recommendationSession';
import { getFavoriteRecipeIds, toggleFavorite } from '../../services/FavoriteService';
import {
  setRecipeOpenSource,
  trackRecipeImpression,
  trackRecommendationRefresh,
} from '../../services/analytics';
import { getViewedRecipeDisplayCount } from '../../services/viewedRecipe';
import {
  getContextMemorySelection,
  toggleContextField,
} from '../../services/memory/contextMemory';
import { TASTE_TOAST_MESSAGE } from '../../services/mockHomeData';
import { withSeedRecommendationMessage } from '../../services/recommendation/seedRecommendationMessage';
import {
  buildRecipeIdsFromRecommendation,
} from '../../services/recommendation/mealTime/mealTimeSlotCacheStorage';
import {
  mealTimeSlotToMealType,
  resolveClockPrimarySlot,
} from '../../services/recommendation/mealTime/mealTimeSlotMapping';
import { getTodayBrief } from '../../services/today';
import type { HomeRecommendationDTO, MealMode } from '../../types/home';
import type { MealTimeSlotKey } from '../../types/mealTimeRecommendation';
import type { ContextMemorySelection } from '../../types/contextMemory';
import type { TodayBrief } from '../../types/today';
import { getLocalDateKey, getNow } from '../../utils/dateProvider';
import type { FavoriteFeedbackKind } from './HomeFavoritePopup';

export type HomeScreenState = 'loading' | 'ready' | 'refreshing' | 'error';

const DEFAULT_MEAL_MODE: MealMode = 'homemade';
const REFRESH_DEBOUNCE_MS = 300;

export function useHomeScreen(nickname: string) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<MealTimeSlotKey>(() =>
    resolveClockPrimarySlot(getNow()),
  );
  const mealType = mealTimeSlotToMealType(selectedSlot);
  const clockPrimarySlot = resolveClockPrimarySlot(getNow());

  const [todayBrief, setTodayBrief] = useState<TodayBrief | null>(null);
  const [screenState, setScreenState] = useState<HomeScreenState>('loading');
  const [mealMode, setMealMode] = useState<MealMode>(DEFAULT_MEAL_MODE);
  const [recommendation, setRecommendation] = useState<HomeRecommendationDTO | null>(null);
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState(TASTE_TOAST_MESSAGE);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastShowSaveMascot, setToastShowSaveMascot] = useState(false);
  const [favoriteFeedback, setFavoriteFeedback] = useState<FavoriteFeedbackKind | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewedRecipeCount, setViewedRecipeCount] = useState(0);
  const [contextSelection, setContextSelection] = useState<ContextMemorySelection>({
    diningSituation: null,
    mealGoal: null,
    mood: null,
  });

  const lastRefreshRef = useRef(0);
  const lastHeroImpressionKeyRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef(false);
  const loadedDateKeyRef = useRef<string | null>(null);
  const loadedSlotRef = useRef<MealTimeSlotKey | null>(null);
  const clockSlotRef = useRef<MealTimeSlotKey>(resolveClockPrimarySlot(getNow()));
  const aiSettingsRevisionRef = useRef(getAiSettingsRevision());

  const applySession = useCallback(
    (slot: MealTimeSlotKey, mode: MealMode, data: HomeRecommendationDTO) => {
      const dateKey = getLocalDateKey(getNow());
      const slotMealType = mealTimeSlotToMealType(slot);
      setMealMode(mode);
      setRecommendation(data);
      setScreenState('ready');
      loadedDateKeyRef.current = dateKey;
      loadedSlotRef.current = slot;
      clockSlotRef.current = resolveClockPrimarySlot(getNow());
      setRecommendationSession({
        dateKey,
        mealType: slotMealType,
        mealMode: mode,
        recommendation: data,
      });
      const heroId = data.recipe?.id?.trim();
      if (heroId && !data.noCandidatesAvailable) {
        addSessionHeroId(heroId);
        const impressionKey = `${dateKey}:${slot}:${heroId}`;
        if (lastHeroImpressionKeyRef.current !== impressionKey) {
          lastHeroImpressionKeyRef.current = impressionKey;
          trackRecipeImpression({
            recipe_id: heroId,
            meal_time: slotMealType,
            source: 'home',
          });
        }
      }
    },
    [],
  );

  const syncSlotRecommendation = useCallback(
    async (options: {
      silent?: boolean;
      forceGenerate?: boolean;
      slot?: MealTimeSlotKey;
      mode?: MealMode;
    } = {}) => {
      const slot = options.slot ?? selectedSlot;
      const mode = options.mode ?? mealMode;
      const dateKey = getLocalDateKey(getNow());
      const useClockWeights = slot === resolveClockPrimarySlot(getNow());

      if (
        !options.forceGenerate &&
        loadedDateKeyRef.current === dateKey &&
        loadedSlotRef.current === slot &&
        recommendation
      ) {
        return;
      }

      const showLoading = !options.silent && screenState !== 'ready';
      if (showLoading) {
        setScreenState('loading');
      }

      try {
        const data = await getMealTimeSlotHomeRecommendation(slot, mode, {
          useClockWeights,
          forceGenerate: options.forceGenerate,
        });
        applySession(slot, mode, data);
      } catch {
        try {
          const fallback = await simulateErrorRecommendation(
            mealTimeSlotToMealType(slot),
            mode,
          );
          applySession(slot, mode, fallback);
        } catch {
          setScreenState('error');
        }
      }
    },
    [selectedSlot, mealMode, screenState, recommendation, applySession],
  );

  const checkDateAndSlotRefresh = useCallback(() => {
    const dateKey = getLocalDateKey(getNow());
    const clockSlot = resolveClockPrimarySlot(getNow());
    const dateChanged =
      loadedDateKeyRef.current !== null && loadedDateKeyRef.current !== dateKey;
    const clockChanged = clockSlotRef.current !== clockSlot;

    if (dateChanged) {
      setSelectedSlot(clockSlot);
      void syncSlotRecommendation({ silent: true, slot: clockSlot });
      return;
    }

    if (clockChanged) {
      clockSlotRef.current = clockSlot;
      setSelectedSlot(clockSlot);
      void syncSlotRecommendation({ silent: true, slot: clockSlot });
    }
  }, [syncSlotRecommendation]);

  const loadRecommendation = useCallback(
    async (mode: MealMode) => {
      setScreenState('loading');
      setMealMode(mode);
      try {
        const data = await getMealTimeSlotHomeRecommendation(selectedSlot, mode, {
          useClockWeights: selectedSlot === resolveClockPrimarySlot(getNow()),
          forceGenerate: true,
        });
        applySession(selectedSlot, mode, data);
      } catch {
        try {
          const fallback = await simulateErrorRecommendation(mealType, mode);
          applySession(selectedSlot, mode, fallback);
        } catch {
          setScreenState('error');
        }
      }
    },
    [selectedSlot, mealType, applySession],
  );

  const loadHeartedIds = useCallback(async () => {
    const ids = await getFavoriteRecipeIds();
    setHeartedIds(new Set(ids));
  }, []);

  const loadViewedRecipeCount = useCallback(async () => {
    const count = await getViewedRecipeDisplayCount();
    setViewedRecipeCount(count);
  }, []);

  useEffect(() => {
    loadHeartedIds();
    loadViewedRecipeCount();
    getTodayBrief(nickname).then(setTodayBrief);
    getContextMemorySelection().then(setContextSelection);
    void syncSlotRecommendation();
  }, [nickname, syncSlotRecommendation, loadHeartedIds, loadViewedRecipeCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkDateAndSlotRefresh();
      }
    });
    return () => subscription.remove();
  }, [checkDateAndSlotRefresh]);

  useFocusEffect(
    useCallback(() => {
      loadHeartedIds();
      loadViewedRecipeCount();
      checkDateAndSlotRefresh();

      const revision = getAiSettingsRevision();
      if (revision !== aiSettingsRevisionRef.current) {
        aiSettingsRevisionRef.current = revision;
        clearRecommendationSession();
        void syncSlotRecommendation({
          silent: screenState === 'ready',
          forceGenerate: true,
        });
      }
    }, [
      loadHeartedIds,
      loadViewedRecipeCount,
      checkDateAndSlotRefresh,
      syncSlotRecommendation,
      screenState,
    ]),
  );

  const handleMealModeChange = useCallback(
    (mode: MealMode) => {
      if (mode === 'delivery') {
        router.push('/dine-out-coming-soon');
        return;
      }
      if (mode === mealMode && recommendation) return;
      loadRecommendation(mode);
    },
    [mealMode, recommendation, loadRecommendation, router],
  );

  const refreshRecommendation = useCallback(
    async (mode: MealMode) => {
      try {
        const next = await getMealTimeSlotHomeRecommendation(selectedSlot, mode, {
          useClockWeights: selectedSlot === resolveClockPrimarySlot(getNow()),
          forceGenerate: true,
        });
        applySession(selectedSlot, mode, next);
      } catch {
        setScreenState('ready');
      }
    },
    [selectedSlot, applySession],
  );

  const handleContextToggle = useCallback(
    async <K extends keyof ContextMemorySelection>(
      field: K,
      value: NonNullable<ContextMemorySelection[K]>,
    ) => {
      if (screenState === 'loading' || isRefreshing) return;

      const next = await toggleContextField(field, value);
      setContextSelection({
        diningSituation: next.diningSituation,
        mealGoal: next.mealGoal,
        mood: next.mood,
      });
      await refreshRecommendation(mealMode);
    },
    [screenState, isRefreshing, mealMode, refreshRecommendation],
  );

  const handleSlotChange = useCallback(
    (slot: MealTimeSlotKey) => {
      if (slot === selectedSlot && recommendation) return;
      setSelectedSlot(slot);
      void syncSlotRecommendation({ slot, silent: screenState === 'ready' });
    },
    [selectedSlot, recommendation, syncSlotRecommendation, screenState],
  );

  const handleRefresh = useCallback(async () => {
    if (!recommendation || refreshInFlightRef.current) return;

    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) return;
    lastRefreshRef.current = now;

    const previousIds = buildRecipeIdsFromRecommendation(recommendation);
    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    trackRecommendationRefresh({ meal_time: mealType });

    try {
      const next = await refreshMealTimeSlotHomeRecommendation(
        selectedSlot,
        mealMode,
        previousIds,
      );
      applySession(selectedSlot, mealMode, next);
    } catch {
      setScreenState('ready');
    } finally {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [recommendation, selectedSlot, mealMode, mealType, applySession]);

  const handleAccept = useCallback(async () => {
    if (!recommendation) return;

    const labels = getHankkiHomeDecisionMessages();

    try {
      await acceptHomeRecommendation(
        recommendation.recommendationId,
        recommendation.recipe.id,
        mealType,
        mealMode,
      );

      if (mealMode === 'delivery') {
        setRecipeOpenSource('delivery');
        router.push(`/delivery/${recommendation.recipe.id}`);
        return;
      }

      setRecipeOpenSource('home');
      router.push(`/ingredients/${recommendation.recipe.id}`);
    } catch {
      setToastMessage(labels.acceptErrorToast);
      setToastShowSaveMascot(false);
      setToastVisible(true);
    }
  }, [recommendation, mealType, mealMode, router]);

  const handleSaveMeal = useCallback(async () => {
    if (!recommendation || isRefreshing) return;

    const labels = getHankkiHomeDecisionMessages();
    await saveHomeRecommendation(
      recommendation.recommendationId,
      recommendation.recipe.id,
      mealType,
      mealMode,
    );
    setToastMessage(labels.saveMealToast);
    setToastShowSaveMascot(true);
    setToastVisible(true);
  }, [recommendation, isRefreshing, mealType, mealMode]);

  const handleHeartPress = useCallback(async () => {
    if (!recommendation) return;

    const recipeId = recommendation.recipe.id;
    const result = await toggleFavorite(recipeId, mealType);

    setHeartedIds((prev) => {
      const next = new Set(prev);
      if (result.isFavorite) {
        next.add(recipeId);
      } else {
        next.delete(recipeId);
      }
      return next;
    });

    if (result.added) {
      setFavoriteFeedback('saved');
    } else if (!result.isFavorite) {
      setFavoriteFeedback('removed');
    }
  }, [recommendation, mealType]);

  const dismissFavoriteFeedback = useCallback(() => {
    setFavoriteFeedback(null);
  }, []);

  const handleRetry = useCallback(() => {
    loadRecommendation(mealMode);
  }, [loadRecommendation, mealMode]);

  const handleSelectAlternative = useCallback(
    async (alternativeId: string) => {
      if (!recommendation || isRefreshing) return;

      const swapped = promoteMealTimeSlotAlternative(recommendation, alternativeId);
      if (!swapped) return;

      const withChef: HomeRecommendationDTO = {
        ...swapped,
        chefMessage: getHankkiRecommendationMessage(mealType, swapped.recipe.title),
      };
      const next = await withSeedRecommendationMessage(withChef, mealType);

      setRecommendation(next);
      loadedDateKeyRef.current = getLocalDateKey(getNow());
      loadedSlotRef.current = selectedSlot;
      setRecommendationSession({
        dateKey: getLocalDateKey(getNow()),
        mealType,
        mealMode,
        recommendation: next,
      });
      await persistMealTimeSlotHomeRecommendation(selectedSlot, next);

      const altHeroId = next.recipe?.id?.trim();
      if (altHeroId && !next.noCandidatesAvailable) {
        const impressionKey = `${getLocalDateKey(getNow())}:${selectedSlot}:${altHeroId}`;
        lastHeroImpressionKeyRef.current = impressionKey;
        trackRecipeImpression({
          recipe_id: altHeroId,
          meal_time: mealType,
          source: 'alternative',
        });
      }
    },
    [recommendation, isRefreshing, mealType, mealMode, selectedSlot],
  );

  const setToastVisibleStable = useCallback((visible: boolean) => {
    setToastVisible(visible);
  }, []);

  const greeting =
    todayBrief?.greeting ?? `${nickname}님, 오늘 뭐 드실래요?`;
  const recentMealSummary =
    todayBrief?.recentMealSummary ?? '아직 기록이 없어요';

  return {
    todayBrief,
    greeting,
    recentMealSummary,
    favoriteCount: heartedIds.size,
    viewedRecipeCount,
    screenState,
    mealMode,
    recommendation,
    heartedIds,
    toastMessage,
    toastVisible,
    toastShowSaveMascot,
    favoriteFeedback,
    isRefreshing,
    contextSelection,
    selectedSlot,
    clockPrimarySlot,
    setToastVisible: setToastVisibleStable,
    dismissFavoriteFeedback,
    handleMealModeChange,
    handleContextToggle,
    handleSaveMeal,
    handleRefresh,
    handleAccept,
    handleSelectAlternative,
    handleHeartPress,
    handleRetry,
    handleSlotChange,
  };
}
