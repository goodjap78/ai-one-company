import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TODDLER_MEALS_HREF } from '../../constants/appRoutes';
import {
  TODDLER_FEED_MEAL_TYPE_LABELS,
} from '../../constants/toddlerMealFeedCopy';
import { toddlerWeeklyPlanCopy as copy } from '../../constants/toddlerWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { theme } from '../../constants/theme';
import {
  TODDLER_FEED_MEAL_TYPES,
  type ToddlerFeedMealType,
} from '../../data/recipes/toddlerMealFeed';
import { generateToddlerWeeklyPlan } from '../../data/recipes/toddlerWeeklyPlan';
import type { WeeklyMealPlan, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import {
  setRecipeOpenSource,
  trackToddlerWeeklyPlanMealChange,
  trackToddlerWeeklyPlanRecipeClick,
  trackToddlerWeeklyPlanRefresh,
  trackToddlerWeeklyPlanSave,
  trackToddlerWeeklyPlanShare,
  trackToddlerWeeklyPlanView,
} from '../../services/analytics';
import { resolveDefaultToddlerFeedMealType } from '../../services/toddlerMeals/resolveDefaultToddlerFeedMealType';
import {
  buildToddlerWeeklyShareCardModel,
  resolveToddlerWeeklySlotDisplay,
} from '../../services/weeklyPlan/toddlerWeeklyPlanDisplay';
import {
  captureToddlerWeeklyShareCard,
  saveToddlerWeeklyShareImage,
  shareToddlerWeeklyShareImage,
} from '../../services/weeklyPlan/toddlerWeeklyPlanShare';
import {
  createToddlerWeeklyPlanSeed,
  loadToddlerWeeklyPlanLastMeal,
  loadToddlerWeeklyPlanState,
  saveToddlerWeeklyPlanLastMeal,
  saveToddlerWeeklyPlanState,
} from '../../services/weeklyPlan/toddlerWeeklyPlanStorage';
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

export function ToddlerWeeklyPlanScreen() {
  const router = useRouter();
  const shareCardRef = useRef<View>(null);
  const [mealType, setMealType] = useState<ToddlerFeedMealType>(() =>
    resolveDefaultToddlerFeedMealType(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inFlightRef = useRef(false);
  const viewedKeyRef = useRef<string | null>(null);

  const mealLabel = TODDLER_FEED_MEAL_TYPE_LABELS[mealType];

  useEffect(() => {
    let cancelled = false;
    loadToddlerWeeklyPlanLastMeal()
      .then((stored) => {
        if (cancelled) return;
        if (stored) setMealType(stored);
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
    () => (plan ? buildToddlerWeeklyShareCardModel(plan, mealLabel) : null),
    [mealLabel, plan],
  );

  const shareCopy = useMemo(
    () => ({
      shareCardTitle: copy.shareCardTitle,
      shareCardTitleLine2: copy.shareCardTitleLine2,
      shareCardSubtitle: '',
      shareCardStageLine: copy.mealShareLine(mealLabel),
      shareCardBrandName: copy.shareCardBrandName,
      shareCardBrandTagline: copy.shareCardBrandTagline,
      cookTime: copy.cookTime,
    }),
    [mealLabel],
  );

  const applyPlan = useCallback(
    async (next: WeeklyMealPlan, seed: string, trackRefresh: boolean) => {
      setPlan(next);
      setStatus('ready');
      await saveToddlerWeeklyPlanState({ seed, mealType, plan: next });
      if (trackRefresh) {
        trackToddlerWeeklyPlanRefresh({ meal_type: mealType, seed });
      }
    },
    [mealType],
  );

  const generateAndApply = useCallback(
    async (seed: string, trackRefresh: boolean, avoidRecipeIds?: readonly string[]): Promise<boolean> => {
      const result = generateToddlerWeeklyPlan(mealType, seed, { avoidRecipeIds });
      if (!result.ok || !result.plan) return false;
      await applyPlan(result.plan, result.seed, trackRefresh);
      return true;
    },
    [applyPlan, mealType],
  );

  const loadMealPlan = useCallback(async () => {
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
    if (!hydrated) return;
    void loadMealPlan();
  }, [hydrated, loadMealPlan, mealType]);

  useEffect(() => {
    if (status !== 'ready' || !plan?.seed) return;
    const key = `${mealType}:${plan.seed}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    trackToddlerWeeklyPlanView({ meal_type: mealType, seed: plan.seed });
  }, [mealType, plan?.seed, status]);

  const handleSelectMealType = useCallback(
    (next: ToddlerFeedMealType) => {
      if (inFlightRef.current || next === mealType) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMealType(next);
      saveToddlerWeeklyPlanLastMeal(next);
      trackToddlerWeeklyPlanMealChange({ meal_type: next });
    },
    [mealType],
  );

  const captureCurrentCard = useCallback(async (): Promise<string | null> => {
    try {
      await waitForNextFrame();
      return await captureToddlerWeeklyShareCard(shareCardRef);
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
      const seed = createToddlerWeeklyPlanSeed();
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
  }, [captureCurrentCard, mealType, plan, sharing]);

  const handleShare = useCallback(async () => {
    if (!plan || inFlightRef.current || sharing) return;
    inFlightRef.current = true;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureCurrentCard();
      if (!uri) return;
      const result = await shareToddlerWeeklyShareImage(uri);
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
  }, [captureCurrentCard, mealType, plan, sharing]);

  const handleOpenRecipe = useCallback(
    (slot: WeeklyPlanSlot) => {
      if (!plan || refreshing || sharing) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      trackToddlerWeeklyPlanRecipeClick({
        meal_type: mealType,
        recipe_id: slot.recipeId,
        seed: plan.seed,
      });
      setRecipeOpenSource('toddler_meal_feed');
      router.push(`/recipe/${slot.recipeId}`);
    },
    [mealType, plan, refreshing, router, sharing],
  );

  const busy = !hydrated || status === 'loading' || refreshing || sharing;
  const footerPadding = FOOTER_SCROLL_PADDING + ds.sizes.buttonHeight * 2 + ds.spacing.md;

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
              onPress={() => router.push(TODDLER_MEALS_HREF)}
              accessibilityRole="button"
            >
              <Text style={styles.menuLinkText}>{copy.menuBrowseLink}</Text>
            </Pressable>

            <View style={styles.track}>
              {TODDLER_FEED_MEAL_TYPES.map((slot) => {
                const isSelected = hydrated && slot === mealType;
                return (
                  <Pressable
                    key={slot}
                    style={({ pressed }) => [
                      styles.tab,
                      isSelected && styles.tabSelected,
                      pressed && styles.tabPressed,
                    ]}
                    onPress={() => handleSelectMealType(slot)}
                    disabled={!hydrated || busy}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: !hydrated || busy }}
                    accessibilityLabel={TODDLER_FEED_MEAL_TYPE_LABELS[slot]}
                  >
                    <Text
                      style={[styles.tabText, isSelected && styles.tabTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {TODDLER_FEED_MEAL_TYPE_LABELS[slot]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.guidance} accessibilityRole="summary">
              <Text style={styles.guidanceTitle}>{copy.guidanceTitle}</Text>
              <Text style={styles.guidanceLine}>{copy.guidanceLine}</Text>
            </View>

            {!hydrated || status === 'loading' ? (
              <ScreenLoading message={copy.loadingMessage} compact />
            ) : status === 'error' || !plan ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
                <Text style={styles.errorMessage}>{copy.errorMessage}</Text>
                <Pressable
                  style={({ pressed }) => [appChrome.secondaryButton, pressed && appChrome.pressed]}
                  onPress={() => {
                    void loadMealPlan();
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
  const display = resolveToddlerWeeklySlotDisplay(slot);
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
  safeArea: { flex: 1, width: '100%' },
  captureHost: { position: 'absolute', top: 0, left: 0, opacity: 1, zIndex: 0 },
  scroll: { flex: 1, width: '100%', zIndex: 1, backgroundColor: ds.colors.canvas },
  scrollContent: { paddingTop: ds.spacing.md },
  frame: { width: '100%', gap: ds.spacing.section },
  header: { gap: ds.spacing.md },
  title: { ...ds.typography.pageTitle, color: ds.colors.textPrimary },
  subtitle: { ...ds.typography.body, color: ds.colors.textSecondary },
  menuLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  menuLinkPressed: { opacity: 0.85 },
  menuLinkText: { ...ds.typography.caption, fontWeight: '700', color: ds.colors.primary },
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
  tabSelected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  tabPressed: { opacity: 0.85 },
  tabText: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextSelected: { color: theme.colors.primary, fontWeight: '700' },
  guidance: { ...appChrome.card, gap: ds.spacing.sm },
  guidanceTitle: { ...ds.typography.caption, fontWeight: '700', color: ds.colors.primary },
  guidanceLine: { ...ds.typography.body, color: ds.colors.textPrimary },
  list: { gap: ds.spacing.md },
  card: {
    ...appChrome.card,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ds.sizes.touchTarget + ds.spacing.lg,
    gap: ds.spacing.md,
  },
  cardPressed: theme.interaction.pressed,
  cardDisabled: { opacity: 0.7 },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: ds.radius.image,
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
  },
  imageContainer: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  cardText: { flex: 1, minWidth: 0, gap: 4 },
  dayLabel: { ...ds.typography.caption, fontWeight: '700', color: ds.colors.primary },
  menuName: {
    ...ds.typography.foodName,
    fontSize: 20,
    lineHeight: 26,
    color: ds.colors.textPrimary,
  },
  cookTime: { ...ds.typography.caption, color: ds.colors.textSecondary },
  errorBox: { ...appChrome.card, alignItems: 'center', gap: ds.spacing.md },
  errorTitle: { ...ds.typography.sectionTitle, color: ds.colors.textPrimary, textAlign: 'center' },
  errorMessage: { ...ds.typography.body, color: ds.colors.textSecondary, textAlign: 'center' },
  shareRow: { flexDirection: 'row', gap: ds.spacing.md, marginBottom: ds.spacing.md },
  shareRowButton: { flex: 1, paddingHorizontal: ds.spacing.md },
  buttonDisabled: { opacity: 0.6 },
});
