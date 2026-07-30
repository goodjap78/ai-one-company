import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getHankkiHomeDecisionMessages,
  getHankkiRecommendationMessage,
} from '../../constants/HankkiMessages';
import {
  acceptHomeRecommendation,
  getHomeRecommendation,
  refreshHomeRecommendation,
  saveHomeRecommendation,
  simulateErrorRecommendation,
} from '../../services/homeService';
import { getAiSettingsRevision } from '../../services/aiRecommendationSettings';
import { clearRecommendationSession } from '../../services/recommendationSession';
import { getFavoriteRecipeIds, toggleFavorite } from '../../services/FavoriteService';
import {
  getContextMemorySelection,
  toggleContextField,
} from '../../services/memory/contextMemory';
import { TASTE_TOAST_MESSAGE } from '../../services/mockHomeData';
import { promoteAlternative } from '../../services/recommendation/recommendationEngine';
import { withSeedRecommendationMessage } from '../../services/recommendation/seedRecommendationMessage';
import {
  getRecommendationSession,
  setRecommendationSession,
} from '../../services/recommendationSession';
import { getTodayBrief } from '../../services/today';
import type { HomeRecommendationDTO, MealMode } from '../../types/home';
import type { ContextMemorySelection } from '../../types/contextMemory';
import type { TodayBrief } from '../../types/today';
import { getCurrentMealType } from '../../utils/mealType';
import type { FavoriteFeedbackKind } from './HomeFavoritePopup';

export type HomeScreenState = 'loading' | 'ready' | 'refreshing' | 'error';

const DEFAULT_MEAL_MODE: MealMode = 'homemade';
/** Minimum gap between refresh taps — prevents duplicate in-flight requests only. */
const REFRESH_DEBOUNCE_MS = 300;

export function useHomeScreen(nickname: string) {
  const router = useRouter();
  const mealType = getCurrentMealType();

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
  const [contextSelection, setContextSelection] = useState<ContextMemorySelection>({
    diningSituation: null,
    mealGoal: null,
    mood: null,
  });

  const lastRefreshRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const aiSettingsRevisionRef = useRef(getAiSettingsRevision());

  const loadRecommendation = useCallback(
    async (mode: MealMode) => {
      setScreenState('loading');
      setMealMode(mode);

      try {
        const data = await getHomeRecommendation(mealType, mode);
        setRecommendation(data);
        setScreenState('ready');
        setRecommendationSession({ mealType, mealMode: mode, recommendation: data });
      } catch {
        try {
          const fallback = await simulateErrorRecommendation(mealType, mode);
          setRecommendation(fallback);
          setScreenState('ready');
          setRecommendationSession({ mealType, mealMode: mode, recommendation: fallback });
        } catch {
          setScreenState('error');
        }
      }
    },
    [mealType],
  );

  const loadHeartedIds = useCallback(async () => {
    const ids = await getFavoriteRecipeIds();
    setHeartedIds(new Set(ids));
  }, []);

  useEffect(() => {
    loadHeartedIds();
    getTodayBrief(nickname).then(setTodayBrief);
    getContextMemorySelection().then(setContextSelection);

    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const session = getRecommendationSession();
    if (
      session?.recommendation &&
      session.mealType === mealType &&
      session.mealMode !== 'delivery'
    ) {
      setMealMode(session.mealMode);
      setScreenState('ready');
      if (session.recommendation.seedMessage) {
        setRecommendation(session.recommendation);
      } else {
        void withSeedRecommendationMessage(session.recommendation, mealType).then((next) => {
          setRecommendation(next);
          setRecommendationSession({
            mealType,
            mealMode: session.mealMode,
            recommendation: next,
          });
        });
      }
      return;
    }

    loadRecommendation(DEFAULT_MEAL_MODE);
  }, [nickname, mealType, loadRecommendation, loadHeartedIds]);

  useFocusEffect(
    useCallback(() => {
      loadHeartedIds();

      const revision = getAiSettingsRevision();
      if (revision !== aiSettingsRevisionRef.current) {
        aiSettingsRevisionRef.current = revision;
        clearRecommendationSession();
        if (screenState === 'ready') {
          void loadRecommendation(mealMode);
        }
      }
    }, [loadHeartedIds, loadRecommendation, mealMode, screenState]),
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
        const next = await getHomeRecommendation(mealType, mode);
        setRecommendation(next);
        setScreenState('ready');
        setRecommendationSession({ mealType, mealMode: mode, recommendation: next });
      } catch {
        setScreenState('ready');
      }
    },
    [mealType],
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

  const handleRefresh = useCallback(async () => {
    if (!recommendation || refreshInFlightRef.current) return;

    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) return;
    lastRefreshRef.current = now;

    const previousRecipeId = recommendation.recipe.id;
    refreshInFlightRef.current = true;
    setIsRefreshing(true);

    try {
      const next = await refreshHomeRecommendation(
        mealType,
        mealMode,
        previousRecipeId,
      );
      setRecommendation(next);
      setScreenState('ready');
      setRecommendationSession({ mealType, mealMode, recommendation: next });
    } catch {
      setScreenState('ready');
    } finally {
      refreshInFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [recommendation, mealType, mealMode]);

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
        router.push(`/delivery/${recommendation.recipe.id}`);
        return;
      }

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

      const swapped = promoteAlternative(recommendation, alternativeId);
      if (!swapped) return;

      const withChef: HomeRecommendationDTO = {
        ...swapped,
        chefMessage: getHankkiRecommendationMessage(mealType, swapped.recipe.title),
      };
      const next = await withSeedRecommendationMessage(withChef, mealType);

      setRecommendation(next);
      setRecommendationSession({ mealType, mealMode, recommendation: next });
    },
    [recommendation, isRefreshing, mealType, mealMode],
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
  };
}
