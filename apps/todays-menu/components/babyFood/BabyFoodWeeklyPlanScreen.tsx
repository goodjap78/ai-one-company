import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BABY_FOOD_BATCH_HREF, BABY_FOOD_HREF } from '../../constants/appRoutes';
import { babyBatchCookingCopy as batchCopy } from '../../constants/babyBatchCookingCopy';
import {
  BABY_FOOD_FEED_STAGE_LABELS,
} from '../../constants/babyFoodFeedCopy';
import { babyWeeklyPlanCopy as copy, BABY_WEEKLY_PLAN_WEEKDAY_KO } from '../../constants/babyWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { theme } from '../../constants/theme';
import {
  BABY_FOOD_FEED_DEFAULT_STAGE,
  BABY_FOOD_FEED_STAGES,
  type BabyFoodFeedStage,
} from '../../data/recipes/babyFoodFeed';
import { generateBabyWeeklyPlan, type WeeklyMealPlan, type WeeklyPlanSlot } from '../../data/recipes';
import {
  setRecipeOpenSource,
  trackBabyWeeklyPlanRecipeClick,
  trackBabyWeeklyPlanRefresh,
  trackBabyWeeklyPlanSave,
  trackBabyWeeklyPlanShare,
  trackBabyWeeklyPlanStageChange,
  trackBabyWeeklyPlanView,
} from '../../services/analytics';
import { loadBabyFoodFeedStage, saveBabyFoodFeedStage } from '../../services/babyFood/babyFoodFeedStageStorage';
import { setBabyBatchCookingSession } from '../../services/babyFood/babyBatchCookingSession';
import {
  buildBabyWeeklyShareCardModel,
  resolveBabyWeeklySlotDisplay,
} from '../../services/weeklyPlan/babyWeeklyPlanDisplay';
import {
  captureBabyWeeklyShareCard,
  saveBabyWeeklyShareImage,
  shareBabyWeeklyShareImage,
} from '../../services/weeklyPlan/babyWeeklyPlanShare';
import {
  createBabyWeeklyPlanSeed,
  loadBabyWeeklyPlanState,
  saveBabyWeeklyPlanState,
} from '../../services/weeklyPlan/babyWeeklyPlanStorage';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';
import { ElementaryWeeklyPlanShareCard } from '../elementaryWeekly/ElementaryWeeklyPlanShareCard';
import { appChrome } from '../ui/appChrome';
import { HankkiHomeBrandLink } from '../ui/HankkiHomeBrandLink';
import { ScreenLoading } from '../ui/ScreenLoading';
import { FOOTER_SCROLL_PADDING, screenLayout } from '../ui/screenLayout';

type ScreenStatus = 'loading' | 'ready' | 'error';

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function BabyFoodWeeklyPlanScreen() {
  const router = useRouter();
  const shareCardRef = useRef<View>(null);
  const [stage, setStage] = useState<BabyFoodFeedStage>(BABY_FOOD_FEED_DEFAULT_STAGE);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inFlightRef = useRef(false);
  const viewedKeyRef = useRef<string | null>(null);

  const stageLabel = BABY_FOOD_FEED_STAGE_LABELS[stage];

  useEffect(() => {
    let cancelled = false;
    loadBabyFoodFeedStage()
      .then((stored) => {
        if (cancelled) return;
        setStage(stored);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shareModel = useMemo(
    () => (plan ? buildBabyWeeklyShareCardModel(plan, stageLabel) : null),
    [plan, stageLabel],
  );

  const shareCopy = useMemo(
    () => ({
      shareCardTitle: copy.shareCardTitle,
      shareCardTitleLine2: copy.shareCardTitleLine2,
      shareCardSubtitle: '',
      shareCardStageLine: copy.stageShareLine(stageLabel),
      shareCardBrandName: copy.shareCardBrandName,
      shareCardBrandTagline: copy.shareCardBrandTagline,
      cookTime: copy.cookTime,
    }),
    [stageLabel],
  );

  const applyPlan = useCallback(
    async (next: WeeklyMealPlan, seed: string, trackRefresh: boolean) => {
      setPlan(next);
      setStatus('ready');
      await saveBabyWeeklyPlanState({ seed, stage, plan: next });
      if (trackRefresh) {
        trackBabyWeeklyPlanRefresh({ stage, seed });
      }
    },
    [stage],
  );

  const generateAndApply = useCallback(
    async (seed: string, trackRefresh: boolean, avoidRecipeIds?: readonly string[]): Promise<boolean> => {
      const result = generateBabyWeeklyPlan(stage, seed, { avoidRecipeIds });
      if (!result.ok || !result.plan) return false;
      await applyPlan(result.plan, result.seed, trackRefresh);
      return true;
    },
    [applyPlan, stage],
  );

  const loadStagePlan = useCallback(async () => {
    setStatus('loading');
    try {
      const stored = await loadBabyWeeklyPlanState(stage);
      if (stored) {
        await applyPlan(stored.plan, stored.seed, false);
        return;
      }
      const seed = createBabyWeeklyPlanSeed();
      const ok = await generateAndApply(seed, false);
      if (!ok) setStatus('error');
    } catch {
      setStatus('error');
    }
  }, [applyPlan, generateAndApply, stage]);

  useEffect(() => {
    if (!hydrated) return;
    void loadStagePlan();
  }, [hydrated, loadStagePlan, stage]);

  useEffect(() => {
    if (status !== 'ready' || !plan?.seed) return;
    const key = `${stage}:${plan.seed}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    trackBabyWeeklyPlanView({ stage, seed: plan.seed });
  }, [plan?.seed, stage, status]);

  const handleSelectStage = useCallback(
    (next: BabyFoodFeedStage) => {
      if (inFlightRef.current || next === stage) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStage(next);
      saveBabyFoodFeedStage(next);
      trackBabyWeeklyPlanStageChange({ stage: next });
    },
    [stage],
  );

  const captureCurrentCard = useCallback(async (): Promise<string | null> => {
    try {
      await waitForNextFrame();
      return await captureBabyWeeklyShareCard(shareCardRef);
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
      const avoidRecipeIds = plan?.slots.map((slot) => slot.recipeId);
      const seed = createBabyWeeklyPlanSeed();
      const ok = await generateAndApply(seed, true, avoidRecipeIds);
      if (!ok) {
        Alert.alert(copy.errorTitle, copy.errorMessage);
      }
    } catch {
      Alert.alert(copy.errorTitle, copy.errorMessage);
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [generateAndApply, plan?.slots, refreshing, sharing, status]);

  const handleSaveImage = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await saveBabyWeeklyShareImage(uri);
      if (result === 'ok') {
        trackBabyWeeklyPlanSave({ stage, seed: plan.seed });
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
  }, [captureCurrentCard, plan, sharing, stage]);

  const handleShare = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await shareBabyWeeklyShareImage(uri);
      if (result === 'ok') {
        trackBabyWeeklyPlanShare({ stage, seed: plan.seed });
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
  }, [captureCurrentCard, plan, sharing, stage]);

  const handleOpenRecipe = useCallback(
    (slot: WeeklyPlanSlot) => {
      if (!plan || refreshing || sharing) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      trackBabyWeeklyPlanRecipeClick({
        stage,
        recipe_id: slot.recipeId,
        seed: plan.seed,
      });
      setRecipeOpenSource('baby_food_feed');
      router.push(`/recipe/${slot.recipeId}`);
    },
    [plan, refreshing, router, sharing, stage],
  );

  const busy = !hydrated || status === 'loading' || refreshing || sharing;

  const handleOpenBatchCooking = useCallback(() => {
    if (!plan || !hydrated || status === 'loading' || refreshing || sharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBabyBatchCookingSession({
      stage,
      seed: plan.seed,
      slots: plan.slots.map((slot) => ({
        recipeId: slot.recipeId,
        recipeName: slot.recipeName,
        day: slot.day,
        dayLabel: BABY_WEEKLY_PLAN_WEEKDAY_KO[slot.day],
        selected: false,
        portion: 1,
      })),
    });
    router.push(BABY_FOOD_BATCH_HREF);
  }, [hydrated, plan, refreshing, router, sharing, stage, status]);

  const footerPadding = FOOTER_SCROLL_PADDING + ds.sizes.buttonHeight + ds.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
      <View style={mobileShell.container}>
        {shareModel ? (
          <View style={styles.captureHost} pointerEvents="none" collapsable={false}>
            <View ref={shareCardRef} collapsable={false}>
              <ElementaryWeeklyPlanShareCard model={shareModel} copy={shareCopy} />
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

            <View style={styles.header}>
              <Text style={styles.title}>{copy.screenTitle}</Text>
              <Text style={styles.subtitle}>{copy.screenSubtitle}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.menuLink, pressed && styles.menuLinkPressed]}
              onPress={() => router.push(BABY_FOOD_HREF)}
              accessibilityRole="button"
            >
              <Text style={styles.menuLinkText}>{copy.menuBrowseLink}</Text>
            </Pressable>

            <View style={styles.track}>
              {BABY_FOOD_FEED_STAGES.map((slot) => {
                const isSelected = hydrated && slot === stage;
                return (
                  <Pressable
                    key={slot}
                    style={({ pressed }) => [
                      styles.tab,
                      isSelected && styles.tabSelected,
                      pressed && styles.tabPressed,
                    ]}
                    onPress={() => handleSelectStage(slot)}
                    disabled={!hydrated || busy}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: !hydrated || busy }}
                    accessibilityLabel={BABY_FOOD_FEED_STAGE_LABELS[slot]}
                  >
                    <Text
                      style={[styles.tabText, isSelected && styles.tabTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {BABY_FOOD_FEED_STAGE_LABELS[slot]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.guidance} accessibilityRole="summary">
              <Text style={styles.guidanceTitle}>{copy.guidanceTitle}</Text>
              {copy.guidanceLines.map((line) => (
                <Text key={line} style={styles.guidanceLine}>
                  {line}
                </Text>
              ))}
              <Text style={styles.guidanceSource}>{copy.guidanceSource}</Text>
            </View>

            {!hydrated || status === 'loading' ? (
              <ScreenLoading message={copy.loadingMessage} compact />
            ) : status === 'error' || !plan ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
                <Text style={styles.errorMessage}>{copy.errorMessage}</Text>
                <Pressable
                  style={({ pressed }) => [
                    appChrome.secondaryButton,
                    pressed && appChrome.pressed,
                  ]}
                  onPress={() => {
                    void loadStagePlan();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={copy.retryButton}
                >
                  <Text style={appChrome.secondaryButtonText}>{copy.retryButton}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.list}>
                {plan.slots.map((slot) => (
                  <DaySlotCard
                    key={`${slot.day}-${slot.recipeId}`}
                    slot={slot}
                    disabled={busy}
                    onPress={() => handleOpenRecipe(slot)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {status === 'ready' && plan ? (
          <View style={screenLayout.footer}>
            <Pressable
              style={({ pressed }) => [
                screenLayout.primaryButton,
                pressed && !busy && screenLayout.pressedPrimary,
                busy && styles.buttonDisabled,
                styles.batchEntryButton,
              ]}
              onPress={handleOpenBatchCooking}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={batchCopy.weeklyEntryButton}
            >
              <Text style={screenLayout.primaryText}>{batchCopy.weeklyEntryButton}</Text>
            </Pressable>
            <View style={styles.shareRow}>
              <Pressable
                style={({ pressed }) => [
                  appChrome.secondaryButton,
                  styles.shareRowButton,
                  pressed && !busy && appChrome.pressed,
                  busy && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void handleSaveImage();
                }}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={copy.saveImageButton}
              >
                <Text style={appChrome.secondaryButtonText} numberOfLines={1}>
                  {copy.saveImageButton}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  screenLayout.primaryButton,
                  styles.shareRowButton,
                  pressed && !busy && screenLayout.pressedPrimary,
                  busy && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void handleShare();
                }}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={copy.shareButton}
              >
                <Text style={screenLayout.primaryText}>
                  {sharing ? copy.sharingBusy : copy.shareButton}
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [
                appChrome.secondaryButton,
                pressed && !busy && appChrome.pressed,
                busy && styles.buttonDisabled,
              ]}
              onPress={() => {
                void handleRefresh();
              }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={copy.refreshButton}
            >
              <Text style={appChrome.secondaryButtonText}>
                {refreshing ? copy.loadingMessage : copy.refreshButton}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type DaySlotCardProps = {
  slot: WeeklyPlanSlot;
  disabled: boolean;
  onPress: () => void;
};

function DaySlotCard({ slot, disabled, onPress }: DaySlotCardProps) {
  const display = resolveBabyWeeklySlotDisplay(slot);
  const image = resolveMealHeroImage(slot.recipeId, 'homemade');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && styles.cardPressed,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={copy.recipeA11y(display.dayLabel, display.name, display.timeMinutes)}
    >
      <View style={styles.imageWrap}>
        <MealImageView
          image={image}
          variant="thumb"
          style={styles.image}
          containerStyle={styles.imageContainer}
          showEmojiFallback
          emojiSize={28}
          remountKey={slot.recipeId}
          accessibilityLabel={display.name}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.dayLabel}>{display.dayLabel}</Text>
        <Text style={styles.menuName} numberOfLines={2}>
          {display.name}
        </Text>
        <Text style={styles.cookTime}>{copy.cookTime(display.timeMinutes)}</Text>
      </View>
    </Pressable>
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
  header: {
    gap: ds.spacing.md,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  menuLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  menuLinkPressed: {
    opacity: 0.85,
  },
  menuLinkText: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  track: {
    flexDirection: 'row',
    width: '100%',
    gap: 2,
    backgroundColor: theme.colors.backgroundCream,
    borderRadius: theme.radius.badge,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: theme.radius.badge - 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  tabPressed: {
    opacity: 0.85,
  },
  tabText: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  guidance: {
    ...appChrome.card,
    gap: ds.spacing.sm,
  },
  guidanceTitle: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  guidanceLine: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  guidanceSource: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  list: {
    gap: ds.spacing.md,
  },
  card: {
    ...appChrome.card,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ds.sizes.touchTarget + ds.spacing.lg,
    gap: ds.spacing.md,
  },
  cardPressed: theme.interaction.pressed,
  cardDisabled: {
    opacity: 0.7,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: ds.radius.image,
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  dayLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  menuName: {
    ...ds.typography.foodName,
    fontSize: 20,
    lineHeight: 26,
    color: ds.colors.textPrimary,
  },
  cookTime: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  errorBox: {
    ...appChrome.card,
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  errorTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  shareRow: {
    flexDirection: 'row',
    gap: ds.spacing.md,
    marginBottom: ds.spacing.md,
    marginTop: ds.spacing.md,
  },
  batchEntryButton: {
    marginBottom: 0,
  },
  shareRowButton: {
    flex: 1,
    paddingHorizontal: ds.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
