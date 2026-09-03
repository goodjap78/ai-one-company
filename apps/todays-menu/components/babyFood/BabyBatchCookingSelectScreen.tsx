import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BABY_FOOD_BATCH_RESULT_HREF, BABY_FOOD_WEEKLY_HREF } from '../../constants/appRoutes';
import { babyBatchCookingCopy as copy } from '../../constants/babyBatchCookingCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { theme } from '../../constants/theme';
import type { BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import {
  BABY_PORTION_UI_PRESETS,
  classifyBabyBatchCooking,
  classifyBabyPortionScaling,
  type BabyPortionPreset,
} from '../../data/recipes/babyPortionScaling';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import {
  trackBabyBatchCookingOpen,
  trackBabyBatchPortionChange,
  trackBabyBatchRecipeToggle,
} from '../../services/analytics';
import {
  buildBabyBatchGroceryList,
  validateBabyBatchSelections,
} from '../../services/babyFood/buildBabyBatchGroceryList';
import {
  getBabyBatchCookingSession,
  setBabyBatchCookingResult,
  setBabyBatchCookingSession,
  type BabyBatchSlotState,
} from '../../services/babyFood/babyBatchCookingSession';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { FOOTER_SCROLL_PADDING, screenLayout } from '../ui/screenLayout';

type ScreenStatus = 'ready' | 'empty';

export function BabyBatchCookingSelectScreen() {
  const router = useRouter();
  const openedRef = useRef(false);
  const [status, setStatus] = useState<ScreenStatus>('empty');
  const [stage, setStage] = useState<BabyFoodFeedStage>('early');
  const [seed, setSeed] = useState('');
  const [slots, setSlots] = useState<BabyBatchSlotState[]>([]);

  useEffect(() => {
    const session = getBabyBatchCookingSession();
    if (!session) {
      setStatus('empty');
      return;
    }
    setStage(session.stage);
    setSeed(session.seed);
    setSlots(session.slots);
    setStatus('ready');
  }, []);

  const selectedCount = useMemo(() => slots.filter((slot) => slot.selected).length, [slots]);

  useEffect(() => {
    if (status !== 'ready' || openedRef.current) return;
    openedRef.current = true;
    trackBabyBatchCookingOpen({ stage, selected_count: selectedCount });
  }, [selectedCount, stage, status]);

  const persistSlots = useCallback(
    (next: BabyBatchSlotState[]) => {
      setSlots(next);
      setBabyBatchCookingSession({ stage, seed, slots: next });
    },
    [seed, stage],
  );

  const handleToggle = useCallback(
    (recipeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = slots.map((slot) =>
        slot.recipeId === recipeId ? { ...slot, selected: !slot.selected } : slot,
      );
      const count = next.filter((slot) => slot.selected).length;
      persistSlots(next);
      trackBabyBatchRecipeToggle({ stage, recipe_id: recipeId, selected_count: count });
    },
    [persistSlots, slots, stage],
  );

  const handlePortionChange = useCallback(
    (recipeId: string, portion: BabyPortionPreset) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = slots.map((slot) =>
        slot.recipeId === recipeId ? { ...slot, portion } : slot,
      );
      persistSlots(next);
      trackBabyBatchPortionChange({ stage, recipe_id: recipeId, portion });
    },
    [persistSlots, slots, stage],
  );

  const handleViewIngredients = useCallback(() => {
    const selected = slots.filter((slot) => slot.selected);
    if (selected.length === 0) return;

    const selections = selected.map((slot) => ({
      recipeId: slot.recipeId,
      portion: slot.portion,
    }));

    if (!validateBabyBatchSelections(selections, stage)) return;

    const menus = selected.map((slot) => ({
      recipeId: slot.recipeId,
      name: slot.recipeName,
      dayLabel: slot.dayLabel,
      portion: slot.portion,
    }));

    const result = buildBabyBatchGroceryList(selections, menus, stage);
    setBabyBatchCookingResult(result);
    router.push(BABY_FOOD_BATCH_RESULT_HREF);
  }, [router, slots, stage]);

  const footerPadding = FOOTER_SCROLL_PADDING + ds.sizes.buttonHeight + ds.spacing.md;

  if (status === 'empty') {
    return (
      <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
        <View style={mobileShell.container}>
          <View style={[mobileShell.scrollContent, styles.frame]}>
            <ScreenBackButton label={copy.backToWeekly} fallbackHref={BABY_FOOD_WEEKLY_HREF} />
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{copy.emptyPlanTitle}</Text>
              <Text style={styles.emptyMessage}>{copy.emptyPlanMessage}</Text>
              <Pressable
                style={({ pressed }) => [appChrome.secondaryButton, pressed && appChrome.pressed]}
                onPress={() => router.replace(BABY_FOOD_WEEKLY_HREF)}
                accessibilityRole="button"
              >
                <Text style={appChrome.secondaryButtonText}>{copy.backToWeekly}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
      <View style={mobileShell.container}>
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
            <ScreenBackButton label={copy.backToWeekly} fallbackHref={BABY_FOOD_WEEKLY_HREF} />

            <View style={styles.header}>
              <Text style={styles.title}>{copy.selectTitle}</Text>
              <Text style={styles.subtitle}>{copy.selectSubtitle}</Text>
              <Text style={styles.count}>{copy.selectedCount(selectedCount)}</Text>
            </View>

            <View style={styles.list}>
              {slots.map((slot) => (
                <BatchMenuRow
                  key={slot.recipeId}
                  slot={slot}
                  onToggle={() => handleToggle(slot.recipeId)}
                  onPortionChange={(portion) => handlePortionChange(slot.recipeId, portion)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={screenLayout.footer}>
          <Pressable
            style={({ pressed }) => [
              screenLayout.primaryButton,
              pressed && selectedCount > 0 && screenLayout.pressedPrimary,
              selectedCount === 0 && styles.buttonDisabled,
            ]}
            onPress={handleViewIngredients}
            disabled={selectedCount === 0}
            accessibilityRole="button"
            accessibilityLabel={copy.viewIngredientsButton}
            accessibilityState={{ disabled: selectedCount === 0 }}
          >
            <Text style={screenLayout.primaryText}>{copy.viewIngredientsButton}</Text>
          </Pressable>
          {selectedCount === 0 ? (
            <Text style={styles.footerHint}>{copy.noSelectionHint}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

type BatchMenuRowProps = {
  slot: BabyBatchSlotState;
  onToggle: () => void;
  onPortionChange: (portion: BabyPortionPreset) => void;
};

function BatchMenuRow({ slot, onToggle, onPortionChange }: BatchMenuRowProps) {
  const recipe = getHankkiRecipeById(slot.recipeId);
  const scaling = recipe ? classifyBabyPortionScaling(recipe) : 'review_required';
  const batchFriendly = recipe ? classifyBabyBatchCooking(recipe) === 'friendly' : false;

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.checkboxRow, pressed && styles.rowPressed]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: slot.selected }}
        accessibilityLabel={`${slot.dayLabel} ${slot.recipeName}`}
      >
        <View style={[styles.checkbox, slot.selected && styles.checkboxSelected]}>
          {slot.selected ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.rowText}>
          <Text style={styles.dayLabel}>{slot.dayLabel}</Text>
          <Text style={styles.menuName} numberOfLines={2}>
            {slot.recipeName}
          </Text>
          {batchFriendly ? (
            <Text style={styles.friendlyBadge}>{copy.batchFriendlyBadge}</Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.portionRow}>
        {scaling === 'scalable' ? (
          BABY_PORTION_UI_PRESETS.map((preset) => {
            const selected = slot.portion === preset;
            return (
              <Pressable
                key={preset}
                style={[styles.portionChip, selected && styles.portionChipSelected]}
                onPress={() => onPortionChange(preset)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={copy.portionPreset(preset)}
              >
                <Text style={[styles.portionText, selected && styles.portionTextSelected]}>
                  {copy.portionPreset(preset)}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.portionFixed}>{copy.portionFixed}</Text>
        )}
      </View>
    </View>
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
    backgroundColor: ds.colors.canvas,
  },
  scrollContent: {
    paddingTop: ds.spacing.md,
  },
  frame: {
    width: '100%',
    gap: ds.spacing.section,
    paddingTop: ds.spacing.md,
  },
  header: {
    gap: ds.spacing.sm,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  count: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  list: {
    gap: ds.spacing.md,
  },
  row: {
    ...appChrome.card,
    gap: ds.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.md,
  },
  rowPressed: {
    opacity: 0.9,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  checkmark: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dayLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  menuName: {
    ...ds.typography.foodName,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  friendlyBadge: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  portionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
    paddingLeft: 36,
  },
  portionChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  portionChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  portionText: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  portionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  portionFixed: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  emptyBox: {
    ...appChrome.card,
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  emptyTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  emptyMessage: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  footerHint: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginTop: ds.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
