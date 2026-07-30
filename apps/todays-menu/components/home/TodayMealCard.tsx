import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLoading } from '../ui/ScreenLoading';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import { ds } from '../../constants/designSystem';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import { theme } from '../../constants/theme';
import { logHomeRecommendationChange } from '../../utils/homeDebugLog';
import type { HomeRecommendationDTO, MealMode } from '../../types/home';
import type { TodayBrief } from '../../types/today';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { buildTrustReasonChips } from '../../utils/buildTrustReasonChips';
import { resolveRecipeServings } from '../../utils/resolveRecipeServings';
import { buildExplainableRecommendation, mergeRecommendationReasons } from '../../utils/recommendationDisplayReason';
import { FavoriteHeartButton } from '../favorites/FavoriteHeartButton';
import { ErrorState } from './ErrorState';
import { HomePairingChips } from './HomePairingChips';
import { HomeRecommendTip } from './HomeRecommendTip';
import { homePremiumStyles, homeRef } from './homePremiumStyles';
import { MealHeroImage } from './MealHeroImage';
import { MealQuickInfoChips } from './MealQuickInfoChips';
import { PrimaryDecisionButton } from './PrimaryDecisionButton';
import { RefreshRecommendationButton } from './RefreshRecommendationButton';
import type { HomeScreenState } from './useHomeScreen';

/** Sprint H3 — wide hero height clamped for 320–430 phone widths. */
function useHomeHeroHeight(): number {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const fromRatio = contentWidth / homeRef.hero.aspectRatio;
  return Math.round(
    Math.min(homeRef.hero.maxHeight, Math.max(homeRef.hero.minHeight, fromRatio)),
  );
}

type Props = {
  recommendation: HomeRecommendationDTO | null;
  mealMode: MealMode;
  screenState: HomeScreenState;
  isHearted: boolean;
  isRefreshing: boolean;
  todayBrief: TodayBrief | null;
  onAccept: () => void;
  onRefresh: () => void;
  onHeartPress: () => void;
  onRetry: () => void;
};

const labels = getHankkiHomeDecisionMessages();
const MAX_PAIRINGS = 3;

export const TodayMealCard = memo(function TodayMealCard({
  recommendation,
  mealMode,
  screenState,
  isHearted,
  isRefreshing,
  todayBrief,
  onAccept,
  onRefresh,
  onHeartPress,
  onRetry,
}: Props) {
  const heroHeight = useHomeHeroHeight();
  const isInitialLoad = screenState === 'loading';
  const previousRecipeId = useRef<string | null>(null);

  useEffect(() => {
    if (!recommendation) return;
    if (previousRecipeId.current && previousRecipeId.current !== recommendation.recipe.id) {
      logHomeRecommendationChange(recommendation.recipe.id);
    }
    previousRecipeId.current = recommendation.recipe.id;
  }, [recommendation]);

  const explainable = useMemo(
    () =>
      recommendation
        ? buildExplainableRecommendation({
            todayBrief,
            recipeId: recommendation.recipe.id,
            recipeDifficulty: recommendation.recipe.difficulty,
            fallbackReason: recommendation.reason,
            engineConfidence: recommendation.confidence,
          })
        : null,
    [recommendation, todayBrief],
  );

  const explanation = recommendation?.explanation;
  const displayReasons = useMemo(() => {
    if (explanation?.level2) return [];
    const mealSignals = recommendation?.mealExperience?.reason.signals ?? [];
    if (mealSignals.length >= 3) {
      return mealSignals.slice(0, 3);
    }
    const contextual = explainable?.reasons ?? [];
    return mergeRecommendationReasons(contextual, mealSignals);
  }, [recommendation, explainable, explanation]);

  const trustChips = useMemo(
    () =>
      buildTrustReasonChips({
        explanation,
        mealMode,
        cookingTimeMinutes: recommendation?.recipe.cookingTimeMinutes,
        fallbackReasons: explainable?.reasons ?? displayReasons,
      }),
    [explanation, mealMode, recommendation, explainable, displayReasons],
  );

  const weatherChip = useMemo(
    () => trustChips.find((chip) => chip.id === 'weather') ?? trustChips[0] ?? null,
    [trustChips],
  );

  const pairings = useMemo(
    () => (recommendation?.mealExperience?.suggestedPairings ?? []).slice(0, MAX_PAIRINGS),
    [recommendation],
  );

  const servings = useMemo(() => {
    if (!recommendation) return 2;
    return resolveRecipeServings(recommendation.recipe.id, mealMode);
  }, [recommendation, mealMode]);

  const recommendTip = recommendation?.seedMessage?.trim() || null;

  const acceptLabel =
    mealMode === 'delivery' ? labels.acceptButtonDelivery : labels.acceptButtonHomemade;
  const acceptHint =
    mealMode === 'delivery' ? labels.acceptHintDelivery : labels.acceptHintHomemade;

  const heroImage = useMemo(
    () =>
      recommendation
        ? resolveMealHeroImage(
            recommendation.recipe.id,
            recommendation.mealMode,
            recommendation.recipe.imageUrl,
          )
        : null,
    [recommendation?.recipe.id, recommendation?.mealMode, recommendation?.recipe.imageUrl],
  );

  return (
    <View style={styles.root}>
      {screenState === 'error' ? (
        <ErrorState onRetry={onRetry} />
      ) : isInitialLoad ? (
        <View style={styles.loadingWrap}>
          <View style={[styles.loadingHeroPlaceholder, { height: heroHeight }]} />
          <ScreenLoading title={labels.loadingTitle} compact calm />
        </View>
      ) : recommendation && heroImage && explainable ? (
        <View style={homePremiumStyles.sectionStack}>
          <View style={styles.heroShell}>
            <View style={[homePremiumStyles.heroImageStandalone, { height: heroHeight }]}>
              <MealHeroImage
                key={`home-hero-${recommendation.recipe.id}`}
                image={heroImage}
                calm
                homeHero
                recipeId={recommendation.recipe.id}
              />
              <LinearGradient
                colors={[
                  'transparent',
                  'transparent',
                  'rgba(35, 20, 12, 0.22)',
                  'rgba(35, 20, 12, 0.34)',
                ]}
                locations={[0, 0.45, 0.78, 1]}
                style={styles.heroGradient}
                pointerEvents="none"
              />
              <View style={styles.heroOverlay} pointerEvents="none">
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{northStarHomeCopy.hero.badge}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">
                  {recommendation.recipe.title}
                </Text>
              </View>
              {recommendTip ? <HomeRecommendTip message={recommendTip} /> : null}
            </View>
            <View style={styles.heartOverlay} pointerEvents="box-none">
              <FavoriteHeartButton isFavorite={isHearted} onPress={onHeartPress} variant="hero" />
            </View>
          </View>

          <MealQuickInfoChips
            cookingTimeMinutes={recommendation.recipe.cookingTimeMinutes}
            difficulty={recommendation.recipe.difficulty}
            servings={servings}
            weatherChip={weatherChip}
          />

          {pairings.length > 0 ? <HomePairingChips pairings={pairings} /> : null}

          <View style={homePremiumStyles.actionsRow}>
            <RefreshRecommendationButton
              label={isRefreshing ? labels.refreshingLabel : labels.refreshButton}
              onPress={onRefresh}
              disabled={isRefreshing}
              variant="outlined"
            />
            <PrimaryDecisionButton
              label={acceptLabel}
              onPress={onAccept}
              disabled={false}
              accessibilityHint={acceptHint}
            />
          </View>
        </View>
      ) : (
        <ErrorState onRetry={onRetry} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  loadingWrap: {
    gap: homeRef.spacing.section,
    paddingVertical: ds.spacing.md,
  },
  loadingHeroPlaceholder: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: homeRef.hero.imageRadius,
    backgroundColor: theme.colors.primarySoft,
  },
  heroShell: {
    width: '100%',
    maxWidth: '100%',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  heroOverlay: {
    position: 'absolute',
    top: ds.spacing.cardInner,
    left: ds.spacing.cardInner,
    right: 56,
    gap: 8,
    zIndex: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 232, 210, 0.96)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#FF6A00',
    letterSpacing: -0.2,
  },
  heroTitle: {
    ...ds.typography.foodName,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heartOverlay: {
    position: 'absolute',
    top: ds.spacing.cardInner,
    right: ds.spacing.cardInner,
    zIndex: 5,
  },
});
