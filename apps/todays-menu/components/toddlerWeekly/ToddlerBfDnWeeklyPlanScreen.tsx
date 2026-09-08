/**
 * Sprint 12 — toddler breakfast | dinner weekly plan screen.
 * Reuses elementary weekly shell + Sprint 5.3 share card. Generators from Sprint 11.
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TODDLER_BREAKFAST_WEEK_HREF,
  TODDLER_DINNER_WEEK_HREF,
  weeklyRecipesHref,
} from '../../constants/appRoutes';
import { toddlerBreakfastWeeklyPlanCopy } from '../../constants/toddlerBreakfastWeeklyPlanCopy';
import { toddlerDinnerWeeklyPlanCopy } from '../../constants/toddlerDinnerWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import {
  generateToddlerBreakfastWeek,
  generateToddlerDinnerWeek,
  type WeeklyMealPlan,
  type WeeklyPlanSlot,
} from '../../data/recipes';
import {
  setRecipeOpenSource,
  trackToddlerWeeklyPlanMealChange,
  trackToddlerWeeklyPlanRecipeClick,
  trackToddlerWeeklyPlanRefresh,
  trackToddlerWeeklyPlanSave,
  trackToddlerWeeklyPlanShare,
  trackToddlerWeeklyPlanView,
} from '../../services/analytics';
import {
  buildToddlerBreakfastWeeklyShareCardModel,
  buildToddlerDinnerWeeklyShareCardModel,
  resolveToddlerBfDnSlotDisplay,
} from '../../services/weeklyPlan/toddlerBfDnWeeklyPlanDisplay';
import {
  captureToddlerWeeklyShareCard,
  saveToddlerWeeklyShareImage,
  shareToddlerWeeklyShareImage,
} from '../../services/weeklyPlan/toddlerWeeklyPlanShare';
import {
  createToddlerWeeklyPlanSeed,
  loadToddlerWeeklyPlanState,
  saveToddlerWeeklyPlanLastMeal,
  saveToddlerWeeklyPlanState,
} from '../../services/weeklyPlan/toddlerWeeklyPlanStorage';
import { ElementaryWeeklyMealSwitch } from '../elementaryWeekly/ElementaryWeeklyMealSwitch';
import { ElementaryWeeklyPlanDayCard } from '../elementaryWeekly/ElementaryWeeklyPlanDayCard';
import {
  ElementaryWeeklyPlanFooter,
  elementaryWeeklyPlanFooterScrollPadding,
} from '../elementaryWeekly/ElementaryWeeklyPlanFooter';
import { ElementaryWeeklyPlanHeader } from '../elementaryWeekly/ElementaryWeeklyPlanHeader';
import { WeeklyRecipeIndexLink } from '../elementaryWeekly/WeeklyRecipeIndexLink';
import { ElementaryWeeklyShareCard } from '../elementaryWeekly/ElementaryWeeklyShareCard';
import { WeeklyPlanErrorPanel } from '../elementaryWeekly/WeeklyPlanErrorPanel';
import { appChrome } from '../ui/appChrome';
import { HankkiHomeBrandLink } from '../ui/HankkiHomeBrandLink';
import { ScreenLoading } from '../ui/ScreenLoading';

type MealMode = 'breakfast' | 'dinner';
type ScreenStatus = 'loading' | 'ready' | 'error';

type Props = {
  mealType: MealMode;
};

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function ToddlerBfDnWeeklyPlanScreen({ mealType }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shareCardRef = useRef<View>(null);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inFlightRef = useRef(false);
  const viewedSeedRef = useRef<string | null>(null);

  const copy = mealType === 'breakfast' ? toddlerBreakfastWeeklyPlanCopy : toddlerDinnerWeeklyPlanCopy;

  const shareModel = useMemo(() => {
    if (!plan) return null;
    return mealType === 'breakfast'
      ? buildToddlerBreakfastWeeklyShareCardModel(plan)
      : buildToddlerDinnerWeeklyShareCardModel(plan);
  }, [mealType, plan]);

  const applyPlan = useCallback(
    async (next: WeeklyMealPlan, seed: string, trackRefresh: boolean) => {
      setPlan(next);
      setStatus('ready');
      await saveToddlerWeeklyPlanState({ seed, mealType, plan: next });
      await saveToddlerWeeklyPlanLastMeal(mealType);
      if (trackRefresh) {
        trackToddlerWeeklyPlanRefresh({ meal_type: mealType, seed });
      }
    },
    [mealType],
  );

  const generateAndApply = useCallback(
    async (
      seed: string,
      trackRefresh: boolean,
      avoidRecipeIds?: readonly string[],
    ): Promise<boolean> => {
      const result =
        mealType === 'breakfast'
          ? generateToddlerBreakfastWeek(seed, undefined, { avoidRecipeIds })
          : generateToddlerDinnerWeek(seed, undefined, { avoidRecipeIds });
      if (!result.ok || !result.plan) return false;
      await applyPlan(result.plan, result.seed, trackRefresh);
      return true;
    },
    [applyPlan, mealType],
  );

  const loadInitial = useCallback(async () => {
    setStatus('loading');
    try {
      const stored = await loadToddlerWeeklyPlanState(mealType);
      if (stored) {
        await applyPlan(stored.plan, stored.seed, false);
        return;
      }
      const seed = createToddlerWeeklyPlanSeed();
      const ok = await generateAndApply(seed, false);
      if (!ok) setStatus('error');
    } catch {
      setStatus('error');
    }
  }, [applyPlan, generateAndApply, mealType]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (status !== 'ready' || !plan?.seed) return;
    const viewKey = `${mealType}:${plan.seed}`;
    if (viewedSeedRef.current === viewKey) return;
    viewedSeedRef.current = viewKey;
    trackToddlerWeeklyPlanView({ meal_type: mealType, seed: plan.seed });
  }, [mealType, plan?.seed, status]);

  const captureCurrentCard = useCallback(async (): Promise<string | null> => {
    try {
      await waitForNextFrame();
      return await captureToddlerWeeklyShareCard(shareCardRef);
    } catch {
      Alert.alert(copy.captureFailedTitle, copy.captureFailedMessage);
      return null;
    }
  }, [copy.captureFailedMessage, copy.captureFailedTitle]);

  const handleRefresh = useCallback(async () => {
    if (inFlightRef.current || refreshing || sharing || status === 'loading') return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const avoid = plan?.slots.map((slot) => slot.recipeId) ?? [];
      const seed = createToddlerWeeklyPlanSeed();
      const ok = await generateAndApply(seed, true, avoid.length > 0 ? avoid : undefined);
      if (!ok) {
        Alert.alert(copy.errorTitle, copy.errorMessage);
      }
    } catch {
      Alert.alert(copy.errorTitle, copy.errorMessage);
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [copy.errorMessage, copy.errorTitle, generateAndApply, plan, refreshing, sharing, status]);

  const handleSaveImage = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await saveToddlerWeeklyShareImage(uri);
      if (result === 'ok') {
        trackToddlerWeeklyPlanSave({ meal_type: mealType, seed: plan.seed });
        Alert.alert(copy.saveSuccess);
        return;
      }
      if (result === 'permission_denied') {
        Alert.alert(copy.savePermissionTitle, copy.savePermissionMessage);
        return;
      }
      if (result === 'cancelled') return;
      Alert.alert(copy.saveFailedTitle, copy.saveFailedMessage);
    } catch {
      Alert.alert(copy.saveFailedTitle, copy.saveFailedMessage);
    } finally {
      inFlightRef.current = false;
      setSharing(false);
    }
  }, [captureCurrentCard, copy, mealType, plan, sharing]);

  const handleShare = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await shareToddlerWeeklyShareImage(uri, copy.shareText);
      if (result === 'ok') {
        trackToddlerWeeklyPlanShare({ meal_type: mealType, seed: plan.seed });
        return;
      }
      if (result === 'cancelled') return;
      if (result === 'unavailable') {
        Alert.alert(copy.shareUnavailableTitle, copy.shareUnavailableMessage);
        return;
      }
      Alert.alert(copy.shareFailedTitle, copy.shareFailedMessage);
    } catch {
      Alert.alert(copy.shareFailedTitle, copy.shareFailedMessage);
    } finally {
      inFlightRef.current = false;
      setSharing(false);
    }
  }, [captureCurrentCard, copy, mealType, plan, sharing]);

  const handleOpenRecipe = useCallback(
    (slot: WeeklyPlanSlot) => {
      if (!plan || refreshing || sharing) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      trackToddlerWeeklyPlanRecipeClick({
        meal_type: mealType,
        recipe_id: slot.recipeId,
        seed: plan.seed,
      });
      setRecipeOpenSource('kids_weekly_plan');
      router.push(`/recipe/${slot.recipeId}`);
    },
    [mealType, plan, refreshing, router, sharing],
  );

  const busy = status === 'loading' || refreshing || sharing;
  const footerPadding = elementaryWeeklyPlanFooterScrollPadding(insets.bottom);

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top']}>
      <View style={mobileShell.container}>
        {shareModel ? (
          <View style={styles.captureHost} pointerEvents="none" collapsable={false}>
            <View ref={shareCardRef} collapsable={false}>
              <ElementaryWeeklyShareCard model={shareModel} copy={copy} />
            </View>
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            mobileShell.scrollContent,
            styles.scrollContent,
            { paddingBottom: footerPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <HankkiHomeBrandLink />

            <ElementaryWeeklyPlanHeader
              eyebrow={copy.screenEyebrow}
              title={copy.screenTitle}
              subtitle={copy.screenSubtitle}
            />

            <ElementaryWeeklyMealSwitch
              mode={mealType}
              disabled={busy}
              breakfastLabel={copy.mealSwitchBreakfast}
              dinnerLabel={copy.mealSwitchDinner}
              onSelectBreakfast={() => {
                if (mealType === 'breakfast') return;
                trackToddlerWeeklyPlanMealChange({
                  meal_type: 'breakfast',
                  seed: plan?.seed ?? 'switch',
                });
                router.replace(TODDLER_BREAKFAST_WEEK_HREF);
              }}
              onSelectDinner={() => {
                if (mealType === 'dinner') return;
                trackToddlerWeeklyPlanMealChange({
                  meal_type: 'dinner',
                  seed: plan?.seed ?? 'switch',
                });
                router.replace(TODDLER_DINNER_WEEK_HREF);
              }}
            />

            {status === 'loading' ? (
              <ScreenLoading message={copy.loadingMessage} compact />
            ) : status === 'error' || !plan ? (
              <WeeklyPlanErrorPanel
                title={copy.errorTitle}
                message={copy.errorMessage}
                retryLabel={copy.retryButton}
                onRetry={() => {
                  void loadInitial();
                }}
              />
            ) : (
              <View style={styles.list}>
                {plan.slots.map((slot) => {
                  const display = resolveToddlerBfDnSlotDisplay(slot, mealType);
                  return (
                    <ElementaryWeeklyPlanDayCard
                      key={`${slot.day}-${slot.recipeId}`}
                      dayLabel={display.dayLabel}
                      name={display.name}
                      timeMinutes={display.timeMinutes}
                      recipeId={display.recipeId}
                      ingredientHint={display.ingredientHint}
                      cookTimeLabel={copy.cookTime}
                      disabled={busy}
                      onPress={() => handleOpenRecipe(slot)}
                      accessibilityLabel={copy.recipeA11y(
                        display.dayLabel,
                        display.name,
                        display.timeMinutes,
                      )}
                    />
                  );
                })}
                <WeeklyRecipeIndexLink
                  disabled={busy}
                  onPress={() =>
                    router.push(
                      weeklyRecipesHref(
                        mealType === 'breakfast' ? 'toddler-breakfast' : 'toddler-dinner',
                      ),
                    )
                  }
                />
              </View>
            )}
          </View>
        </ScrollView>

        {status === 'ready' && plan ? (
          <ElementaryWeeklyPlanFooter
            saveLabel={copy.saveImageButton}
            shareLabel={copy.shareButton}
            refreshLabel={copy.refreshButton}
            refreshBusyLabel={copy.loadingMessage}
            sharingBusyLabel={copy.sharingBusy}
            busy={busy}
            sharing={sharing}
            refreshing={refreshing}
            onSave={() => {
              void handleSaveImage();
            }}
            onShare={() => {
              void handleShare();
            }}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  captureHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 1,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    width: '100%',
    zIndex: 1,
    backgroundColor: ds.colors.canvas,
  },
  scrollContent: {
    paddingTop: ds.spacing.md,
  },
  frame: {
    width: '100%',
    gap: ds.spacing.section,
  },
  list: {
    gap: ds.spacing.md,
  },
});
