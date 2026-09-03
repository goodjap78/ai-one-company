import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  APP_HOME_HREF,
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
} from '../../constants/appRoutes';
import { childSearchCopy } from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { NAV_BACK } from '../../constants/navigationCopy';
import {
  countActiveElementaryFilters,
  elementaryFilterTypeKeys,
  EMPTY_ELEMENTARY_FILTERS,
  type ElementarySearchFilterState,
} from '../../data/recipes/childSearchFilters';
import {
  isChildBrowseMode,
  searchElementaryBrowseRecipes,
} from '../../services/search/childRecipeSearch';
import {
  setRecipeOpenSource,
  trackChildFilterChange,
  trackChildSearch,
  trackChildSearchRecipeClick,
} from '../../services/analytics';
import { ChildRecipeBrowseList } from '../child/ChildRecipeBrowseList';
import { ChildSearchBar } from '../child/ChildSearchBar';
import { ElementaryChildFilters } from '../child/ElementaryChildFilters';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';

export function ElementaryBrowseScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ElementarySearchFilterState>(EMPTY_ELEMENTARY_FILTERS);
  const lastAnalyticsKeyRef = useRef('');

  const activeFilterCount = countActiveElementaryFilters(filters);
  const browseMode = isChildBrowseMode(query, activeFilterCount);
  const recipes = useMemo(
    () => searchElementaryBrowseRecipes(query, filters),
    [filters, query],
  );

  useEffect(() => {
    const key = `${query.trim().length}:${elementaryFilterTypeKeys(filters).join(',')}:${recipes.length}`;
    if (lastAnalyticsKeyRef.current === key) return;
    lastAnalyticsKeyRef.current = key;
    if (!browseMode && query.trim().length === 0 && activeFilterCount === 0) return;
    trackChildSearch({
      audience: 'elementary',
      query_length: query.trim().length,
      filter_types: elementaryFilterTypeKeys(filters).join(','),
      result_count: recipes.length,
    });
  }, [activeFilterCount, browseMode, filters, query, recipes.length]);

  const handleFiltersChange = useCallback(
    (next: ElementarySearchFilterState) => {
      setFilters(next);
      trackChildFilterChange({
        audience: 'elementary',
        filter_types: elementaryFilterTypeKeys(next).join(','),
        result_count: searchElementaryBrowseRecipes(query, next).length,
      });
    },
    [query],
  );

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (browseMode) {
        trackChildSearchRecipeClick({ recipe_id: recipeId, audience: 'elementary' });
      }
      setRecipeOpenSource('kids_weekly_plan');
      router.push(`/recipe/${recipeId}`);
    },
    [browseMode, router],
  );

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[mobileShell.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref={APP_HOME_HREF} />

            <View style={styles.header}>
              <Text style={styles.title}>{childSearchCopy.elementaryBrowseTitle}</Text>
              <Text style={styles.subtitle}>{childSearchCopy.elementaryBrowseSubtitle}</Text>
            </View>

            <View style={styles.weeklyRow}>
              <Pressable
                style={({ pressed }) => [styles.weeklyChip, pressed && styles.weeklyChipPressed]}
                onPress={() => router.push(ELEMENTARY_BREAKFAST_WEEK_HREF)}
                accessibilityRole="button"
              >
                <Text style={styles.weeklyChipText}>{childSearchCopy.elementaryBreakfastWeeklyLink}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.weeklyChip, pressed && styles.weeklyChipPressed]}
                onPress={() => router.push(ELEMENTARY_DINNER_WEEK_HREF)}
                accessibilityRole="button"
              >
                <Text style={styles.weeklyChipText}>{childSearchCopy.elementaryDinnerWeeklyLink}</Text>
              </Pressable>
            </View>

            <ChildSearchBar value={query} onChangeText={setQuery} />

            <View style={styles.filters}>
              <ElementaryChildFilters filters={filters} onChange={handleFiltersChange} />
            </View>

            <Text style={styles.resultCount}>{childSearchCopy.resultCount(recipes.length)}</Text>

            <ChildRecipeBrowseList
              recipes={recipes}
              cookTimeLabel={(minutes) => `${minutes}분`}
              onPressRecipe={handleOpenRecipe}
            />
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
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
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
  weeklyChipPressed: {
    opacity: 0.88,
  },
  weeklyChipText: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
  filters: {
    gap: ds.spacing.sm,
  },
  resultCount: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
});
