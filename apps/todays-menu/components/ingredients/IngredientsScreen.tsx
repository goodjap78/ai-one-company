import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { resolveChildDetailContext } from '../../constants/childDetailCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import {
  classifyBabyPortionScaling,
  scaleBabyIngredientAmount,
  type BabyPortionPreset,
} from '../../data/recipes/babyPortionScaling';
import { saveMeal } from '../../services/MealHistoryService';
import { isFavorite, toggleFavorite } from '../../services/FavoriteService';
import { recordViewedRecipe } from '../../services/viewedRecipe';
import { resolveMealFoodMeta } from '../../services/memory/foodMemory';
import { fetchRecipe, getRecipeById } from '../../services/recipe';
import { getRecommendationSession } from '../../services/recommendationSession';
import {
  buildSeedMessageContext,
  pickSeedRecommendationMessage,
} from '../../services/recommendation/seedRecommendationMessage';
import type { Recipe } from '../../types/recipe';
import { getCurrentMealType } from '../../utils/mealType';
import { withResolvedHeroImage } from '../../utils/mealHeroImage';
import { resolveRecipeCalories } from '../../utils/resolveRecipeCalories';
import { Toast } from '../home/Toast';
import { RecipeCompletionSection } from '../recipe/RecipeCompletionSection';
import { RecipeDetailActions } from '../recipe/RecipeDetailActions';
import { RecipeFeedbackCard } from '../recipe/RecipeFeedbackCard';
import { RecipeHeroImage } from '../recipe/RecipeHeroImage';
import { RecipeInfoMeta } from '../recipe/RecipeInfoMeta';
import { RecipeIngredientsList } from '../recipe/RecipeIngredientsList';
import { RecipeServingAdjuster } from '../recipe/RecipeServingAdjuster';
import {
  BabyDetailSafetySections,
  BabyPortionPresetSelector,
  ChildDetailAudienceBadge,
  ElementaryDetailExtraSections,
  ToddlerDetailExtraSections,
} from '../recipe/ChildDetailSections';
import { recipePremiumStyles } from '../recipe/recipePremiumStyles';
import { RecipeStepsList } from '../recipe/RecipeStepsList';
import {
  consumeRecipeOpenSource,
  trackBabyPortionChange,
  trackChildRecipeDetailView,
  trackRecipeOpen,
} from '../../services/analytics';
import { RecipePrepChoiceCta } from '../shopping/RecipePrepChoiceCta';
import { CoupangDynamicBanner } from '../ads/CoupangDynamicBanner';
import { ScreenLoading } from '../ui/ScreenLoading';
import { ScreenBackButton } from '../ui/ScreenBackButton';

type Props = {
  recipeId: string;
};

const labels = getHankkiRecipeMessages();

/**
 * Sprint R2 — finalized Recipe Detail: continuous vertical scroll only.
 * Route: /ingredients/[id]. Favorite / eaten / recommendation logic unchanged.
 * Child audience extensions reuse this screen (no separate full-screen route).
 */
export function IngredientsScreen({ recipeId }: Props) {
  const router = useRouter();
  const mealType = getCurrentMealType();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [targetServings, setTargetServings] = useState(2);
  const [babyPortion, setBabyPortion] = useState<BabyPortionPreset>(1);
  const childDetailTrackedRef = useRef<string | null>(null);

  const hankki = useMemo(() => getHankkiRecipeById(recipeId), [recipeId]);
  const childContext = useMemo(
    () => resolveChildDetailContext(hankki?.familyAudience.audiences ?? ['general']),
    [hankki],
  );
  const babyScaling = useMemo(
    () => (hankki && childContext === 'baby' ? classifyBabyPortionScaling(hankki) : null),
    [hankki, childContext],
  );
  const isBaby = childContext === 'baby';
  const isToddler = childContext === 'toddler';
  const isElementary = childContext === 'elementary';
  const hideCoupang = isBaby;
  const deferShopping = isBaby;

  useEffect(() => {
    if (!recipeId) {
      setLoading(false);
      setRecipe(null);
      return;
    }

    let cancelled = false;

    const cached = getRecipeById(recipeId);
    if (cached) {
      setRecipe(withResolvedHeroImage(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchRecipe(recipeId).then((data) => {
      if (cancelled) return;
      if (data) setRecipe(data);
      setLoading(false);
    });

    void isFavorite(recipeId).then((value) => {
      if (!cancelled) setFavorited(value);
    });

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!recipeId || !recipe) return;
    void recordViewedRecipe(recipeId);
    trackRecipeOpen({
      recipe_id: recipeId,
      source: consumeRecipeOpenSource(),
    });
  }, [recipeId, recipe?.id]);

  useEffect(() => {
    if (!recipeId || !recipe || !hankki) return;
    if (childContext === 'general') return;
    if (childDetailTrackedRef.current === recipeId) return;
    childDetailTrackedRef.current = recipeId;
    trackChildRecipeDetailView({
      recipe_id: recipeId,
      audience: childContext,
      ...(childContext === 'baby' && hankki.familyAudience.babyFood?.stage
        ? { stage: hankki.familyAudience.babyFood.stage }
        : {}),
    });
  }, [recipeId, recipe?.id, hankki, childContext]);

  useEffect(() => {
    if (recipe?.servings) {
      setTargetServings(recipe.servings);
    }
    setBabyPortion(1);
  }, [recipeId, recipe?.servings]);

  useEffect(() => {
    let cancelled = false;

    async function loadSeedTip() {
      // Prefer Home session tip so Detail matches the recommendation the user accepted.
      const session = getRecommendationSession();
      if (
        session?.recommendation.recipe.id === recipeId &&
        session.recommendation.seedMessage?.trim()
      ) {
        if (!cancelled) {
          setSeedMessage(session.recommendation.seedMessage.trim());
        }
        return;
      }

      const hankkiRecipe = getHankkiRecipeById(recipeId);
      const context = buildSeedMessageContext(hankkiRecipe, mealType);
      const picked = await pickSeedRecommendationMessage(recipeId, context);
      if (cancelled) return;

      if (picked) {
        setSeedMessage(picked);
        return;
      }

      const pool = hankkiRecipe?.recommendationMessages ?? recipe?.recommendationMessages ?? [];
      setSeedMessage(pool[0]?.trim() || labels.warmSentence);
    }

    void loadSeedTip();
    return () => {
      cancelled = true;
    };
  }, [recipeId, mealType, recipe?.recommendationMessages]);

  const calories = useMemo(() => resolveRecipeCalories(recipeId), [recipeId]);

  const displayIngredients = useMemo(() => {
    if (!recipe) return [];
    if (!isBaby || !babyScaling) return recipe.ingredients;
    return recipe.ingredients.map((ing) => ({
      ...ing,
      amount: scaleBabyIngredientAmount(ing.amount, babyPortion, babyScaling),
    }));
  }, [recipe, isBaby, babyScaling, babyPortion]);

  const handleBabyPortionChange = useCallback(
    (portion: BabyPortionPreset) => {
      setBabyPortion(portion);
      trackBabyPortionChange({
        recipe_id: recipeId,
        audience: 'baby',
        portion,
      });
    },
    [recipeId],
  );

  const handleFeedbackSubmitted = useCallback(() => {
    setToastMessage(labels.feedbackThankYouToast);
    setToastVisible(true);
  }, []);

  const handleMealCompleted = useCallback(async () => {
    if (!recipe || savingMeal) return;

    setSavingMeal(true);

    try {
      const meta = resolveMealFoodMeta(recipeId);
      const result = await saveMeal({
        recipeId,
        recipeName: recipe.title,
        category: meta.category,
        mealType,
      });

      if (result.saved) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setToastMessage(labels.mealCompletedToast);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setToastMessage(labels.mealCompletedDuplicateToast);
      }
      setToastVisible(true);
    } finally {
      setSavingMeal(false);
    }
  }, [recipe, recipeId, savingMeal, mealType]);

  const handleFavorite = useCallback(async () => {
    if (!recipe) return;
    const result = await toggleFavorite(recipeId, mealType);
    setFavorited(result.isFavorite);
    setToastMessage(
      result.isFavorite ? labels.favoriteSavedToast : labels.favoriteRemovedToast,
    );
    setToastVisible(true);
  }, [recipe, recipeId, mealType]);

  const handleOtherMenu = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  if (loading && !recipe) {
    return (
      <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
        <ScreenLoading message={labels.loadingMessage} />
      </SafeAreaView>
    );
  }

  if (!recipe || recipe.mode === 'delivery') {
    return (
      <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{labels.notFoundMessage}</Text>
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />
        </View>
      </SafeAreaView>
    );
  }

  const shoppingCta = <RecipePrepChoiceCta recipeId={recipeId} />;
  const coupangBanner = hideCoupang ? null : <CoupangDynamicBanner />;

  return (
    <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <View style={styles.frame}>
            {/* 1–2 Header + title */}
            <View style={recipePremiumStyles.headerBlock}>
              <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />
              {hankki && childContext !== 'general' ? (
                <ChildDetailAudienceBadge context={childContext} hankki={hankki} />
              ) : (
                <View style={recipePremiumStyles.badge}>
                  <Text style={recipePremiumStyles.badgeText}>
                    {labels.todayRecommendationBadge}
                  </Text>
                </View>
              )}
              <Text
                style={recipePremiumStyles.mealTitle}
                accessibilityRole="header"
                numberOfLines={2}
              >
                {recipe.title}
              </Text>
            </View>

            {/* 3 Hero + Seed mascot tip */}
            <RecipeHeroImage image={recipe.image} recipeId={recipeId} seedMessage={seedMessage} />

            {/* Baby portion presets (1 / 3 / 6) */}
            {isBaby && babyScaling ? (
              <BabyPortionPresetSelector
                scaling={babyScaling}
                portion={babyPortion}
                onChange={handleBabyPortionChange}
              />
            ) : null}

            {/* 4 Quick info — elementary keeps total time visible */}
            {!isBaby ? (
              <RecipeInfoMeta
                cookingTimeMinutes={recipe.cookTime}
                difficulty={recipe.difficulty}
                servings={recipe.servings}
                calories={calories}
              />
            ) : null}

            {!deferShopping ? shoppingCta : null}

            {/* 5–7 주재료 / 부재료 / 양념 */}
            {!isBaby ? (
              <RecipeServingAdjuster
                baseServings={recipe.servings}
                targetServings={targetServings}
                onChange={(servings) =>
                  setTargetServings(Math.min(8, Math.max(1, servings)))
                }
                onReset={() => setTargetServings(recipe.servings)}
              />
            ) : null}
            <RecipeIngredientsList
              ingredients={displayIngredients}
              baseServings={isBaby ? 1 : recipe.servings}
              targetServings={isBaby ? 1 : targetServings}
            />

            {/* 9 만드는 방법 — text + optional step images (canonical step image path) */}
            <RecipeStepsList steps={recipe.steps} />

            {/* Child audience extension sections */}
            {isBaby && hankki ? <BabyDetailSafetySections hankki={hankki} /> : null}
            {isToddler && hankki ? <ToddlerDetailExtraSections hankki={hankki} /> : null}
            {isElementary && hankki ? <ElementaryDetailExtraSections hankki={hankki} /> : null}

            {/* 10 완성 */}
            <RecipeCompletionSection tip={recipe.tip} mealTitle={recipe.title} />

            {/* Baby: shopping after cook/safety */}
            {deferShopping ? shoppingCta : null}

            {/* 11 Actions: 오늘 먹었어요! → 즐겨찾기 → 다른 메뉴 추천 */}
            <RecipeDetailActions
              favorited={favorited}
              savingMeal={savingMeal}
              onEaten={handleMealCompleted}
              onFavorite={handleFavorite}
              onOtherMenu={handleOtherMenu}
            />

            <RecipeFeedbackCard recipeId={recipeId} onSubmitted={handleFeedbackSubmitted} />

            {/* After shopping CTA + body — scroll bottom only (hidden for baby) */}
            {coupangBanner}
          </View>
        </ScrollView>

        <View style={styles.toastWrap} pointerEvents="box-none">
          <Toast
            message={toastMessage}
            visible={toastVisible}
            onHide={() => setToastVisible(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  frame: {
    width: '100%',
    maxWidth: ds.sizes.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: ds.spacing.screen,
    paddingTop: 8,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.md,
    padding: ds.spacing.screen,
  },
  errorText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
});
