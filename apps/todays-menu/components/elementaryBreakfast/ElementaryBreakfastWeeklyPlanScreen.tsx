import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ELEMENTARY_DINNER_WEEK_HREF, weeklyRecipesHref } from '../../constants/appRoutes';
import { elementaryBreakfastWeeklyPlanCopy as copy } from '../../constants/elementaryBreakfastWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import {
  generateElementaryBreakfastWeek,
  type WeeklyMealPlan,
  type WeeklyPlanSlot,
} from '../../data/recipes';
import {
  setRecipeOpenSource,
  trackElementaryWeeklyPlanImageSave,
  trackElementaryWeeklyPlanRecipeClick,
  trackElementaryWeeklyPlanRefresh,
  trackElementaryWeeklyPlanShare,
  trackElementaryWeeklyPlanView,
} from '../../services/analytics';
import {
  buildElementaryBreakfastWeeklyShareCardModel,
  resolveElementaryBreakfastSlotDisplay,
} from '../../services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay';
import {
  captureElementaryBreakfastShareCard,
  saveElementaryBreakfastShareImage,
  shareElementaryBreakfastShareImage,
} from '../../services/weeklyPlan/elementaryBreakfastWeeklyPlanShare';
import {
  createElementaryBreakfastWeekSeed,
  loadElementaryBreakfastWeeklyPlanState,
  saveElementaryBreakfastWeeklyPlanState,
} from '../../services/weeklyPlan/elementaryBreakfastWeeklyPlanStorage';
import { ElementaryWeeklyMealSwitch } from '../elementaryWeekly/ElementaryWeeklyMealSwitch';
import {
  ElementaryWeeklyPlanDayCard,
} from '../elementaryWeekly/ElementaryWeeklyPlanDayCard';
import {
  ElementaryWeeklyPlanFooter,
  elementaryWeeklyPlanFooterScrollPadding,
} from '../elementaryWeekly/ElementaryWeeklyPlanFooter';
import { ElementaryWeeklyPlanHeader } from '../elementaryWeekly/ElementaryWeeklyPlanHeader';
import { WeeklyRecipeIndexLink } from '../elementaryWeekly/WeeklyRecipeIndexLink';
import { ElementaryWeeklyShareCard } from '../elementaryWeekly/ElementaryWeeklyShareCard';
import { appChrome } from '../ui/appChrome';
import { HankkiHomeBrandLink } from '../ui/HankkiHomeBrandLink';
import { ScreenLoading } from '../ui/ScreenLoading';
import { WeeklyPlanErrorPanel } from '../elementaryWeekly/WeeklyPlanErrorPanel';

type ScreenStatus = 'loading' | 'ready' | 'error';

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function ElementaryBreakfastWeeklyPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shareCardRef = useRef<View>(null);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inFlightRef = useRef(false);
  const viewedSeedRef = useRef<string | null>(null);

  const shareModel = useMemo(
    () => (plan ? buildElementaryBreakfastWeeklyShareCardModel(plan) : null),
    [plan],
  );

  const applyPlan = useCallback(async (next: WeeklyMealPlan, seed: string, trackRefresh: boolean) => {
    setPlan(next);
    setStatus('ready');
    await saveElementaryBreakfastWeeklyPlanState({ seed, plan: next });
    if (trackRefresh) {
      trackElementaryWeeklyPlanRefresh({ mode: 'breakfast', seed });
    }
  }, []);

  const generateAndApply = useCallback(
    async (seed: string, trackRefresh: boolean): Promise<boolean> => {
      const result = generateElementaryBreakfastWeek(seed);
      if (!result.ok || !result.plan) return false;
      await applyPlan(result.plan, result.seed, trackRefresh);
      return true;
    },
    [applyPlan],
  );

  const loadInitial = useCallback(async () => {
    setStatus('loading');
    try {
      const stored = await loadElementaryBreakfastWeeklyPlanState();
      if (stored) {
        await applyPlan(stored.plan, stored.seed, false);
        return;
      }
      const seed = createElementaryBreakfastWeekSeed();
      const ok = await generateAndApply(seed, false);
      if (!ok) setStatus('error');
    } catch {
      setStatus('error');
    }
  }, [applyPlan, generateAndApply]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (status !== 'ready' || !plan?.seed) return;
    if (viewedSeedRef.current === plan.seed) return;
    viewedSeedRef.current = plan.seed;
    trackElementaryWeeklyPlanView({ mode: 'breakfast', seed: plan.seed });
  }, [plan?.seed, status]);

  const captureCurrentCard = useCallback(async (): Promise<string | null> => {
    try {
      await waitForNextFrame();
      return await captureElementaryBreakfastShareCard(shareCardRef);
    } catch {
      Alert.alert(copy.captureFailedTitle, copy.captureFailedMessage);
      return null;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (inFlightRef.current || refreshing || sharing || status === 'loading') return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const seed = createElementaryBreakfastWeekSeed();
      const ok = await generateAndApply(seed, true);
      if (!ok) {
        Alert.alert(copy.errorTitle, copy.errorMessage);
      }
    } catch {
      Alert.alert(copy.errorTitle, copy.errorMessage);
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [generateAndApply, refreshing, sharing, status]);

  const handleSaveImage = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await saveElementaryBreakfastShareImage(uri);
      if (result === 'ok') {
        trackElementaryWeeklyPlanImageSave({ mode: 'breakfast', seed: plan.seed });
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
  }, [captureCurrentCard, plan, sharing]);

  const handleShare = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await shareElementaryBreakfastShareImage(uri);
      if (result === 'ok') {
        trackElementaryWeeklyPlanShare({ mode: 'breakfast', seed: plan.seed });
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
  }, [captureCurrentCard, plan, sharing]);

  const handleOpenRecipe = useCallback(
    (slot: WeeklyPlanSlot) => {
      if (!plan || refreshing || sharing) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      trackElementaryWeeklyPlanRecipeClick({
        mode: 'breakfast',
        recipe_id: slot.recipeId,
        seed: plan.seed,
      });
      setRecipeOpenSource('kids_weekly_plan');
      router.push(`/recipe/${slot.recipeId}`);
    },
    [plan, refreshing, router, sharing],
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
              mode="breakfast"
              disabled={busy}
              breakfastLabel={copy.mealSwitchBreakfast}
              dinnerLabel={copy.mealSwitchDinner}
              onSelectBreakfast={() => {}}
              onSelectDinner={() => router.replace(ELEMENTARY_DINNER_WEEK_HREF)}
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
                  const display = resolveElementaryBreakfastSlotDisplay(slot);
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
                  onPress={() => router.push(weeklyRecipesHref('elementary-breakfast'))}
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
