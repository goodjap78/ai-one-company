import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_HOME_HREF, BABY_FOOD_HREF, BABY_FOOD_WEEKLY_HREF } from '../../constants/appRoutes';
import {
  BABY_FOOD_FEED_ALLERGY_LABELS,
  BABY_FOOD_FEED_STAGE_LABELS,
  babyFoodFeedCopy as copy,
} from '../../constants/babyFoodFeedCopy';
import { childSearchCopy } from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { NAV_BACK } from '../../constants/navigationCopy';
import { theme } from '../../constants/theme';
import { BabyChildFilters } from '../child/BabyChildFilters';
import { ChildRecipeBrowseList } from '../child/ChildRecipeBrowseList';
import { ChildSearchBar } from '../child/ChildSearchBar';
import {
  BABY_FOOD_FEED_DEFAULT_STAGE,
  BABY_FOOD_FEED_STAGES,
  type BabyFoodFeedStage,
} from '../../data/recipes/babyFoodFeed';
import {
  babyFilterTypeKeys,
  countActiveBabyFilters,
  EMPTY_BABY_FILTERS,
  type BabySearchFilterState,
} from '../../data/recipes/childSearchFilters';
import type { StandardAllergyTag } from '../../data/recipes/recipeStandardMetadataTypes';
import {
  isChildBrowseMode,
  searchBabyFeedRecipes,
} from '../../services/search/childRecipeSearch';
import {
  setRecipeOpenSource,
  trackBabyFoodFeedView,
  trackBabyFoodRecipeClick,
  trackBabyFoodStageChange,
  trackBabyFoodTransitionView,
  trackChildFilterChange,
  trackChildSearch,
  trackChildSearchRecipeClick,
} from '../../services/analytics';
import {
  loadBabyFoodFeedStage,
  saveBabyFoodFeedStage,
} from '../../services/babyFood/babyFoodFeedStageStorage';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { appChrome } from '../ui/appChrome';

function allergyLabels(tags: readonly StandardAllergyTag[]): string[] {
  return tags.map((tag) => BABY_FOOD_FEED_ALLERGY_LABELS[tag]).filter(Boolean);
}

export function BabyFoodFeedScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<BabyFoodFeedStage>(BABY_FOOD_FEED_DEFAULT_STAGE);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<BabySearchFilterState>(EMPTY_BABY_FILTERS);
  const inFlightRef = useRef(false);
  const viewedStageRef = useRef<BabyFoodFeedStage | null>(null);
  const lastAnalyticsKeyRef = useRef('');

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

  useEffect(() => {
    if (!hydrated) return;
    if (viewedStageRef.current === stage) return;
    viewedStageRef.current = stage;
    trackBabyFoodFeedView({ stage });
    if (stage === 'completion') {
      trackBabyFoodTransitionView({ stage: 'completion' });
    }
  }, [hydrated, stage]);

  const activeFilterCount = countActiveBabyFilters(filters);
  const browseMode = isChildBrowseMode(query, activeFilterCount);
  const recipes = useMemo(
    () => searchBabyFeedRecipes(stage, query, filters),
    [stage, query, filters],
  );

  useEffect(() => {
    if (!hydrated || !browseMode) return;
    const key = `${stage}:${query.trim().length}:${babyFilterTypeKeys(filters).join(',')}:${recipes.length}`;
    if (lastAnalyticsKeyRef.current === key) return;
    lastAnalyticsKeyRef.current = key;
    const payload = {
      audience: 'baby' as const,
      query_length: query.trim().length,
      filter_types: babyFilterTypeKeys(filters).join(','),
      result_count: recipes.length,
    };
    trackChildSearch(payload);
  }, [browseMode, filters, hydrated, query, recipes.length, stage]);

  const handleFiltersChange = useCallback(
    (next: BabySearchFilterState) => {
      setFilters(next);
      trackChildFilterChange({
        audience: 'baby',
        filter_types: babyFilterTypeKeys(next).join(','),
        result_count: searchBabyFeedRecipes(stage, query, next).length,
      });
    },
    [query, stage],
  );

  const handleSelectStage = useCallback(
    (next: BabyFoodFeedStage) => {
      if (inFlightRef.current || next === stage) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStage(next);
      saveBabyFoodFeedStage(next);
      trackBabyFoodStageChange({ stage: next });
    },
    [stage],
  );

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      if (inFlightRef.current) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (browseMode) {
        trackChildSearchRecipeClick({ recipe_id: recipeId, audience: 'baby' });
      } else {
        trackBabyFoodRecipeClick({ recipe_id: recipeId, stage });
      }
      setRecipeOpenSource('baby_food_feed');
      router.push(`/recipe/${recipeId}`);
    },
    [browseMode, router, stage],
  );

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[mobileShell.scrollContent, styles.scrollContent]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref={APP_HOME_HREF} />

            <View style={styles.header}>
              <Text style={styles.title}>{copy.screenTitle}</Text>
              <Text style={styles.subtitle}>{copy.screenSubtitle}</Text>
            </View>

            <View style={styles.weeklyRow}>
              <Pressable
                style={({ pressed }) => [styles.weeklyChip, styles.weeklyChipSelected, pressed && styles.weeklyChipPressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
              >
                <Text style={[styles.weeklyChipText, styles.weeklyChipTextSelected]}>{copy.menuBrowseLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.weeklyChip, pressed && styles.weeklyChipPressed]}
                onPress={() => router.push(BABY_FOOD_WEEKLY_HREF)}
                accessibilityRole="button"
              >
                <Text style={styles.weeklyChipText}>{copy.weeklyPlanLink}</Text>
              </Pressable>
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
                    disabled={!hydrated}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: !hydrated }}
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

            <ChildSearchBar value={query} onChangeText={setQuery} />

            <View style={styles.filters}>
              <BabyChildFilters filters={filters} onChange={handleFiltersChange} />
            </View>

            {browseMode ? (
              <Text style={styles.resultCount}>{childSearchCopy.resultCount(recipes.length)}</Text>
            ) : null}

            {!hydrated ? (
              <View style={styles.list} accessibilityLabel="loading" />
            ) : (
              <ChildRecipeBrowseList
                recipes={recipes}
                cookTimeLabel={copy.cookTime}
                onPressRecipe={handleOpenRecipe}
                allergyLine={copy.allergyLine}
                allergyLabels={(tags) => allergyLabels(tags)}
              />
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
    backgroundColor: ds.colors.canvas,
  },
  scrollContent: {
    paddingTop: ds.spacing.md,
    paddingBottom: ds.spacing.xl,
  },
  frame: {
    width: '100%',
    gap: ds.spacing.section,
  },
  header: {
    gap: ds.spacing.md,
  },
  weeklyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  weeklyChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: ds.colors.primarySoft,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  weeklyChipSelected: {
    backgroundColor: theme.colors.primarySoft,
  },
  weeklyChipPressed: {
    opacity: 0.88,
  },
  weeklyChipText: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  weeklyChipTextSelected: {
    color: theme.colors.primary,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
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
  filters: {
    gap: ds.spacing.sm,
  },
  resultCount: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  list: {
    gap: ds.spacing.md,
  },
});
