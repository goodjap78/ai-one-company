import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BABY_FOOD_BATCH_HREF, BABY_FOOD_WEEKLY_HREF } from '../../constants/appRoutes';
import { babyBatchCookingCopy as copy } from '../../constants/babyBatchCookingCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { theme } from '../../constants/theme';
import type { BabyBatchGroceryItem } from '../../services/babyFood/buildBabyBatchGroceryList';
import { buildBabyGroceryShareText } from '../../services/babyFood/babyGroceryChecklist';
import {
  loadBabyGroceryChecklistCheckedIds,
  saveBabyGroceryChecklistCheckedIds,
} from '../../services/babyFood/babyGroceryChecklistStorage';
import {
  setRecipeOpenSource,
  trackBabyBatchIngredientView,
  trackBabyGroceryChecklistItemToggle,
  trackBabyGroceryChecklistReset,
  trackBabyGroceryChecklistShare,
  trackBabyGroceryChecklistView,
} from '../../services/analytics';
import {
  getBabyBatchCookingResult,
  getBabyBatchCookingSession,
} from '../../services/babyFood/babyBatchCookingSession';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { FOOTER_SCROLL_PADDING } from '../ui/screenLayout';

export function BabyBatchCookingResultScreen() {
  const router = useRouter();
  const viewedRef = useRef(false);
  const checklistViewedRef = useRef(false);
  const session = getBabyBatchCookingSession();
  const result = getBabyBatchCookingResult();
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [checksReady, setChecksReady] = useState(false);

  const itemCount = result?.items.length ?? 0;
  const validRowKeys = useMemo(
    () => result?.items.map((item) => item.rowKey) ?? [],
    [result?.items],
  );

  useEffect(() => {
    if (!session || !result) return;
    if (!viewedRef.current) {
      viewedRef.current = true;
      trackBabyBatchIngredientView({
        stage: session.stage,
        selected_count: result.selectedMenus.length,
      });
    }
  }, [result, session]);

  useEffect(() => {
    if (!result) return;
    let cancelled = false;

    void (async () => {
      const loaded = await loadBabyGroceryChecklistCheckedIds(
        result.fingerprint,
        validRowKeys,
      );
      if (cancelled) return;
      setCheckedRowIds(loaded);
      setChecksReady(true);
      if (!checklistViewedRef.current) {
        checklistViewedRef.current = true;
        trackBabyGroceryChecklistView({
          stage: session!.stage,
          item_count: itemCount,
          checked_count: loaded.size,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemCount, result, session, validRowKeys]);

  const checkedCount = useMemo(() => {
    if (!result) return 0;
    return result.items.filter((item) => checkedRowIds.has(item.rowKey)).length;
  }, [checkedRowIds, result]);

  const persistChecked = useCallback(
    async (next: Set<string>) => {
      if (!result) return;
      setCheckedRowIds(next);
      await saveBabyGroceryChecklistCheckedIds(result.fingerprint, next);
    },
    [result],
  );

  const handleToggleItem = useCallback(
    (item: BabyBatchGroceryItem) => {
      if (!session || !result) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = new Set(checkedRowIds);
      if (next.has(item.rowKey)) {
        next.delete(item.rowKey);
      } else {
        next.add(item.rowKey);
      }
      void persistChecked(next);
      trackBabyGroceryChecklistItemToggle({
        stage: session.stage,
        item_count: itemCount,
        checked_count: next.size,
      });
    },
    [checkedRowIds, itemCount, persistChecked, result, session],
  );

  const handleResetChecks = useCallback(() => {
    if (!session || !result || checkedCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set<string>();
    void persistChecked(next);
    trackBabyGroceryChecklistReset({
      stage: session.stage,
      item_count: itemCount,
      checked_count: 0,
    });
  }, [checkedCount, itemCount, persistChecked, result, session]);

  const handleShare = useCallback(async () => {
    if (!session || !result || itemCount === 0) return;
    try {
      await Share.share({
        message: buildBabyGroceryShareText(result),
        title: copy.shareDialogTitle,
      });
      trackBabyGroceryChecklistShare({
        stage: session.stage,
        item_count: itemCount,
        checked_count: checkedCount,
      });
    } catch {
      // User dismissed share sheet — no crash.
    }
  }, [checkedCount, itemCount, result, session]);

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRecipeOpenSource('baby_food_feed');
      router.push(`/recipe/${recipeId}`);
    },
    [router],
  );

  if (!result || !session) {
    return (
      <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
        <View style={mobileShell.container}>
          <View style={styles.frame}>
            <ScreenBackButton label={copy.backToWeekly} fallbackHref={BABY_FOOD_WEEKLY_HREF} />
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{copy.emptyPlanTitle}</Text>
              <Text style={styles.emptyMessage}>{copy.emptyPlanMessage}</Text>
              <Pressable
                style={({ pressed }) => [appChrome.secondaryButton, pressed && appChrome.pressed]}
                onPress={() => router.replace(BABY_FOOD_BATCH_HREF)}
                accessibilityRole="button"
              >
                <Text style={appChrome.secondaryButtonText}>{copy.selectTitle}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const footerPadding = FOOTER_SCROLL_PADDING + ds.spacing.xl;
  const allChecked = itemCount > 0 && checkedCount === itemCount;

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
            <ScreenBackButton label={copy.selectTitle} fallbackHref={BABY_FOOD_BATCH_HREF} />

            <View style={styles.header}>
              <Text style={styles.title}>{copy.resultTitle}</Text>
              <Text style={styles.subtitle}>{copy.resultSubtitle}</Text>
            </View>

            <View style={styles.selectedBox}>
              <Text style={styles.selectedTitle}>
                {copy.selectedMenusTitle(result.selectedMenus.length)}
              </Text>
              {result.selectedMenus.map((menu) => (
                <Pressable
                  key={menu.recipeId}
                  style={({ pressed }) => [styles.selectedLine, pressed && styles.linePressed]}
                  onPress={() => handleOpenRecipe(menu.recipeId)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.selectedMenuLine(menu.name, menu.portion)}
                >
                  <Text style={styles.selectedLineText}>
                    · {copy.selectedMenuLine(menu.name, menu.portion)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {itemCount === 0 ? (
              <View style={styles.emptyIngredientsBox}>
                <Text style={styles.emptyIngredientsText}>{copy.noIngredientsMessage}</Text>
              </View>
            ) : (
              <>
                <View style={styles.checklistHeader}>
                  <Text style={styles.progressText}>
                    {copy.checklistProgress(checkedCount, itemCount)}
                  </Text>
                  {allChecked ? (
                    <Text style={styles.completeText}>{copy.checklistComplete}</Text>
                  ) : null}
                </View>

                {result.groups.map((group) => (
                  <View key={group.category} style={styles.group}>
                    <Text style={styles.groupTitle}>{group.label}</Text>
                    {group.items.map((item) => (
                      <ChecklistIngredientRow
                        key={item.rowKey}
                        item={item}
                        checked={checkedRowIds.has(item.rowKey)}
                        disabled={!checksReady}
                        onToggle={() => handleToggleItem(item)}
                      />
                    ))}
                  </View>
                ))}

                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      appChrome.secondaryButton,
                      styles.actionButton,
                      pressed && checkedCount > 0 && appChrome.pressed,
                      checkedCount === 0 && styles.actionDisabled,
                    ]}
                    onPress={handleResetChecks}
                    disabled={checkedCount === 0}
                    accessibilityRole="button"
                    accessibilityLabel={copy.resetChecksButton}
                    accessibilityState={{ disabled: checkedCount === 0 }}
                  >
                    <Text style={appChrome.secondaryButtonText}>{copy.resetChecksButton}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      appChrome.secondaryButton,
                      styles.actionButton,
                      pressed && appChrome.pressed,
                    ]}
                    onPress={() => void handleShare()}
                    accessibilityRole="button"
                    accessibilityLabel={copy.shareIngredientsButton}
                  >
                    <Text style={appChrome.secondaryButtonText}>{copy.shareIngredientsButton}</Text>
                  </Pressable>
                </View>
              </>
            )}

            <View style={styles.guidance} accessibilityRole="summary">
              {copy.guidanceLines.map((line) => (
                <Text key={line} style={styles.guidanceLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type ChecklistIngredientRowProps = {
  item: BabyBatchGroceryItem;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

function ChecklistIngredientRow({
  item,
  checked,
  disabled,
  onToggle,
}: ChecklistIngredientRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ingredientRow,
        checked && styles.ingredientRowChecked,
        pressed && !disabled && styles.linePressed,
      ]}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={item.displayLine}
    >
      <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <View style={styles.ingredientCopy}>
        <Text style={[styles.ingredientLine, checked && styles.ingredientLineChecked]}>
          {item.displayLine}
        </Text>
        {item.separateUnitNote ? (
          <Text style={[styles.unitNote, checked && styles.unitNoteChecked]}>
            {item.separateUnitNote}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  selectedBox: {
    ...appChrome.card,
    gap: ds.spacing.sm,
  },
  selectedTitle: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  selectedLine: {
    paddingVertical: 2,
  },
  linePressed: {
    opacity: 0.85,
  },
  selectedLineText: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  checklistHeader: {
    gap: ds.spacing.xs,
  },
  progressText: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  completeText: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.primary,
  },
  group: {
    gap: ds.spacing.sm,
  },
  groupTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  ingredientRow: {
    ...appChrome.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.md,
  },
  ingredientRowChecked: {
    opacity: 0.72,
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
    flexShrink: 0,
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
  ingredientCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  ingredientLine: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
  },
  ingredientLineChecked: {
    textDecorationLine: 'line-through',
    color: ds.colors.textSecondary,
  },
  unitNote: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  unitNoteChecked: {
    textDecorationLine: 'line-through',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 140,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  emptyIngredientsBox: {
    ...appChrome.card,
  },
  emptyIngredientsText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  guidance: {
    ...appChrome.card,
    gap: ds.spacing.sm,
  },
  guidanceLine: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
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
});
