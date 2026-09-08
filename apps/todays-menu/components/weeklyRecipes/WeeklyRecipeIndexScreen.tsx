import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileShell } from '../../constants/mobileShell';
import { ds } from '../../constants/designSystem';
import { weeklyRecipeAccessCopy } from '../../constants/weeklyRecipeAccessCopy';
import type { WeeklyMealPlan, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import {
  setRecipeOpenSource,
  trackElementaryWeeklyPlanRecipeClick,
  trackToddlerWeeklyPlanRecipeClick,
} from '../../services/analytics';
import {
  loadCurrentWeeklyPlanForIndex,
  parseWeeklyRecipeIndexSource,
  resolveWeeklyIndexSlotDisplay,
  weeklyRecipeIndexEyebrow,
  weeklyRecipeIndexFallbackHref,
} from '../../services/weeklyPlan/weeklyRecipeIndex';
import { ElementaryWeeklyPlanDayCard } from '../elementaryWeekly/ElementaryWeeklyPlanDayCard';
import { ElementaryWeeklyPlanHeader } from '../elementaryWeekly/ElementaryWeeklyPlanHeader';
import { WeeklyPlanErrorPanel } from '../elementaryWeekly/WeeklyPlanErrorPanel';
import { appChrome } from '../ui/appChrome';
import { HankkiHomeBrandLink } from '../ui/HankkiHomeBrandLink';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import {
  logWeeklyRecipePressQa,
  weeklyRecipeDetailHref,
  type WeeklyRecipeQaAudience,
  type WeeklyRecipeQaMealType,
} from '../../utils/weeklyRecipeNavigation';

type Status = 'loading' | 'ready' | 'error';

export function WeeklyRecipeIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = parseWeeklyRecipeIndexSource(params.source);
  const fallbackHref = source
    ? weeklyRecipeIndexFallbackHref(source)
    : weeklyRecipeIndexFallbackHref('elementary-breakfast');

  const [status, setStatus] = useState<Status>('loading');
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);

  const loadPlan = useCallback(async () => {
    if (!source) {
      setPlan(null);
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const next = await loadCurrentWeeklyPlanForIndex(source);
      if (!next) {
        setPlan(null);
        setStatus('error');
        return;
      }
      setPlan(next);
      setStatus('ready');
    } catch {
      setPlan(null);
      setStatus('error');
    }
  }, [source]);

  useFocusEffect(
    useCallback(() => {
      void loadPlan();
    }, [loadPlan]),
  );

  const handleOpenRecipe = useCallback(
    (slot: WeeklyPlanSlot) => {
      if (!source || !plan) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (source === 'elementary-breakfast' || source === 'elementary-dinner') {
        trackElementaryWeeklyPlanRecipeClick({
          mode: source === 'elementary-breakfast' ? 'breakfast' : 'dinner',
          recipe_id: slot.recipeId,
          seed: plan.seed,
        });
      } else {
        trackToddlerWeeklyPlanRecipeClick({
          meal_type: source === 'toddler-breakfast' ? 'breakfast' : 'dinner',
          recipe_id: slot.recipeId,
          seed: plan.seed,
        });
      }
      setRecipeOpenSource('kids_weekly_plan');
      const targetRoute = weeklyRecipeDetailHref(slot.recipeId);
      const audience: WeeklyRecipeQaAudience =
        source === 'elementary-breakfast' || source === 'elementary-dinner'
          ? 'elementary'
          : 'toddler';
      const mealType: WeeklyRecipeQaMealType =
        source === 'elementary-breakfast' || source === 'toddler-breakfast'
          ? 'breakfast'
          : 'dinner';
      logWeeklyRecipePressQa({
        recipeId: slot.recipeId,
        audience,
        mealType,
        targetRoute,
      });
      router.push(targetRoute);
    },
    [plan, router, source],
  );

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top']}>
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[mobileShell.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <HankkiHomeBrandLink />
            <ScreenBackButton
              label={weeklyRecipeAccessCopy.weeklyRecipeIndexBack}
              fallbackHref={fallbackHref}
            />
            <ElementaryWeeklyPlanHeader
              eyebrow={source ? weeklyRecipeIndexEyebrow(source) : ''}
              title={weeklyRecipeAccessCopy.weeklyRecipeIndexTitle}
              subtitle={weeklyRecipeAccessCopy.weeklyRecipeIndexSubtitle}
            />

            {status === 'loading' ? (
              <ScreenLoading compact />
            ) : status === 'error' || !source || !plan ? (
              <WeeklyPlanErrorPanel
                title={weeklyRecipeAccessCopy.emptyTitle}
                message={weeklyRecipeAccessCopy.emptyMessage}
                retryLabel={weeklyRecipeAccessCopy.weeklyRecipeIndexBack}
                onRetry={() => router.replace(fallbackHref)}
              />
            ) : (
              <View style={styles.list}>
                {plan.slots.map((slot) => {
                  const display = resolveWeeklyIndexSlotDisplay(source, slot);
                  return (
                    <ElementaryWeeklyPlanDayCard
                      key={`${slot.day}-${slot.recipeId}`}
                      dayLabel={display.dayLabel}
                      name={display.name}
                      timeMinutes={display.timeMinutes}
                      recipeId={display.recipeId}
                      ingredientHint={display.ingredientHint}
                      cookTimeLabel={weeklyRecipeAccessCopy.cookTime}
                      disabled={false}
                      onPress={() => handleOpenRecipe(slot)}
                      accessibilityLabel={`${display.dayLabel}요일, ${display.name}, ${display.timeMinutes}분. 레시피 보기`}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: ds.spacing.md,
    paddingBottom: ds.spacing.xl,
  },
  frame: {
    width: '100%',
    gap: ds.spacing.section,
  },
  list: {
    gap: ds.spacing.md,
  },
});
