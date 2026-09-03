import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_HOME_HREF, TODDLER_BREAKFAST_WEEK_HREF } from '../../constants/appRoutes';
import { childSearchCopy } from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';
import { mobileShell } from '../../constants/mobileShell';
import { NAV_BACK } from '../../constants/navigationCopy';
import { theme } from '../../constants/theme';
import { ChildRecipeBrowseList } from '../child/ChildRecipeBrowseList';
import { ChildSearchBar } from '../child/ChildSearchBar';
import { ToddlerChildFilters } from '../child/ToddlerChildFilters';
import {
  TODDLER_FEED_MEAL_TYPE_LABELS,
  toddlerMealFeedCopy as copy,
} from '../../constants/toddlerMealFeedCopy';
import {
  countActiveToddlerFilters,
  EMPTY_TODDLER_FILTERS,
  toddlerFilterTypeKeys,
  type ToddlerSearchFilterState,
} from '../../data/recipes/childSearchFilters';
import {
  pickToddlerMealFeed,
  TODDLER_FEED_MEAL_TYPES,
  type ToddlerFeedMealType,
  type ToddlerMealFeedPick,
} from '../../data/recipes/toddlerMealFeed';
import {
  isChildBrowseMode,
  searchToddlerFeedRecipes,
} from '../../services/search/childRecipeSearch';
import {
  setRecipeOpenSource,
  trackChildFilterChange,
  trackChildSearch,
  trackChildSearchRecipeClick,
  trackToddlerMealFeedView,
  trackToddlerMealRecipeClick,
  trackToddlerMealRefresh,
} from '../../services/analytics';
import { resolveDefaultToddlerFeedMealType } from '../../services/toddlerMeals/resolveDefaultToddlerFeedMealType';
import { saveToddlerWeeklyPlanLastMeal } from '../../services/weeklyPlan/toddlerWeeklyPlanStorage';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { FOOTER_SCROLL_PADDING, screenLayout } from '../ui/screenLayout';

export function ToddlerMealFeedScreen() {
  const router = useRouter();
  const [mealType, setMealType] = useState<ToddlerFeedMealType>(() =>
    resolveDefaultToddlerFeedMealType(),
  );
  const [pick, setPick] = useState<ToddlerMealFeedPick | null>(() => pickToddlerMealFeed(mealType));
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ToddlerSearchFilterState>(EMPTY_TODDLER_FILTERS);
  const inFlightRef = useRef(false);
  const viewedMealRef = useRef<ToddlerFeedMealType | null>(null);
  const lastAnalyticsKeyRef = useRef('');

  useEffect(() => {
    if (viewedMealRef.current === mealType) return;
    viewedMealRef.current = mealType;
    trackToddlerMealFeedView({ meal_type: mealType });
  }, [mealType]);

  const activeFilterCount = countActiveToddlerFilters(filters);
  const browseMode = isChildBrowseMode(query, activeFilterCount);
  const browseRecipes = useMemo(
    () => searchToddlerFeedRecipes(mealType, query, filters),
    [filters, mealType, query],
  );

  useEffect(() => {
    if (!browseMode) return;
    const key = `${mealType}:${query.trim().length}:${toddlerFilterTypeKeys(filters).join(',')}:${browseRecipes.length}`;
    if (lastAnalyticsKeyRef.current === key) return;
    lastAnalyticsKeyRef.current = key;
    trackChildSearch({
      audience: 'toddler',
      query_length: query.trim().length,
      filter_types: toddlerFilterTypeKeys(filters).join(','),
      result_count: browseRecipes.length,
    });
  }, [browseMode, browseRecipes.length, filters, mealType, query]);

  const handleFiltersChange = useCallback(
    (next: ToddlerSearchFilterState) => {
      setFilters(next);
      trackChildFilterChange({
        audience: 'toddler',
        filter_types: toddlerFilterTypeKeys(next).join(','),
        result_count: searchToddlerFeedRecipes(mealType, query, next).length,
      });
    },
    [mealType, query],
  );

  const handleSelectMealType = useCallback((next: ToddlerFeedMealType) => {
    if (inFlightRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMealType(next);
    setPick(pickToddlerMealFeed(next));
  }, []);

  const handleRefresh = useCallback(() => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = pickToddlerMealFeed(mealType, pick?.main.id);
    setPick(next);
    trackToddlerMealRefresh({ meal_type: mealType });
    inFlightRef.current = false;
  }, [mealType, pick?.main.id]);

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      if (inFlightRef.current) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (browseMode) {
        trackChildSearchRecipeClick({ recipe_id: recipeId, audience: 'toddler' });
      } else {
        trackToddlerMealRecipeClick({
          recipe_id: recipeId,
          meal_type: mealType,
        });
      }
      setRecipeOpenSource('toddler_meal_feed');
      router.push(`/recipe/${recipeId}`);
    },
    [browseMode, mealType, router],
  );

  const clockMealType = useMemo(() => resolveDefaultToddlerFeedMealType(), []);
  const footerPadding = FOOTER_SCROLL_PADDING + ds.sizes.buttonHeight + ds.spacing.md;
  const canRefresh = (pick?.alternatives.length ?? 0) > 0;

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
                style={({ pressed }) => [
                  styles.weeklyChip,
                  styles.weeklyChipSelected,
                  pressed && styles.weeklyChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
              >
                <Text style={[styles.weeklyChipText, styles.weeklyChipTextSelected]}>
                  {copy.menuBrowseLabel}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.weeklyChip, pressed && styles.weeklyChipPressed]}
                onPress={() => {
                  void saveToddlerWeeklyPlanLastMeal(mealType);
                  router.push(TODDLER_BREAKFAST_WEEK_HREF);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.weeklyChipText}>{copy.weeklyPlanLink}</Text>
              </Pressable>
            </View>

            <View style={styles.track}>
              {TODDLER_FEED_MEAL_TYPES.map((slot) => {
                const isSelected = slot === mealType;
                const isClock = slot === clockMealType;
                return (
                  <Pressable
                    key={slot}
                    style={({ pressed }) => [
                      styles.tab,
                      isSelected && styles.tabSelected,
                      isClock && !isSelected && styles.tabClockHint,
                      pressed && styles.tabPressed,
                    ]}
                    onPress={() => handleSelectMealType(slot)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${TODDLER_FEED_MEAL_TYPE_LABELS[slot]} 추천`}
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

            <ChildSearchBar value={query} onChangeText={setQuery} />

            <View style={styles.filters}>
              <ToddlerChildFilters filters={filters} onChange={handleFiltersChange} />
            </View>

            {browseMode ? (
              <>
                <Text style={styles.resultCount}>
                  {childSearchCopy.resultCount(browseRecipes.length)}
                </Text>
                <ChildRecipeBrowseList
                  recipes={browseRecipes}
                  cookTimeLabel={copy.cookTime}
                  onPressRecipe={handleOpenRecipe}
                />
              </>
            ) : !pick ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>{copy.emptyTitle}</Text>
                <Text style={styles.errorMessage}>{copy.emptyMessage}</Text>
              </View>
            ) : (
              <View style={styles.list}>
                <Text style={styles.sectionLabel}>{copy.mainEyebrow}</Text>
                <RecipeCard
                  recipeId={pick.main.id}
                  name={pick.main.name}
                  timeMinutes={pick.main.time}
                  featured
                  onPress={() => handleOpenRecipe(pick.main.id)}
                />
                {pick.alternatives.length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>{copy.otherMenus}</Text>
                    {pick.alternatives.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipeId={recipe.id}
                        name={recipe.name}
                        timeMinutes={recipe.time}
                        onPress={() => handleOpenRecipe(recipe.id)}
                      />
                    ))}
                  </>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>

        {!browseMode && pick ? (
          <View style={screenLayout.footer}>
            <Pressable
              style={({ pressed }) => [
                appChrome.secondaryButton,
                pressed && canRefresh && appChrome.pressed,
                !canRefresh && styles.buttonDisabled,
              ]}
              onPress={handleRefresh}
              disabled={!canRefresh}
              accessibilityRole="button"
              accessibilityLabel={copy.refreshButton}
              accessibilityState={{ disabled: !canRefresh }}
            >
              <Text style={appChrome.secondaryButtonText}>{copy.refreshButton}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type RecipeCardProps = {
  recipeId: string;
  name: string;
  timeMinutes: number;
  featured?: boolean;
  onPress: () => void;
};

function RecipeCard({ recipeId, name, timeMinutes, featured = false, onPress }: RecipeCardProps) {
  const image = resolveMealHeroImage(recipeId, 'homemade');
  const imageSize = featured ? 112 : 80;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, featured && styles.cardFeatured, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.recipeA11y(name, timeMinutes)}
    >
      <View style={[styles.imageWrap, { width: imageSize, height: imageSize }]}>
        <MealImageView
          image={image}
          variant="thumb"
          style={styles.image}
          containerStyle={styles.imageContainer}
          showEmojiFallback
          emojiSize={featured ? 36 : 28}
          remountKey={recipeId}
          accessibilityLabel={name}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.menuName} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.cookTime}>{copy.cookTime(timeMinutes)}</Text>
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
  tabClockHint: {
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
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
  sectionLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  card: {
    ...appChrome.card,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ds.sizes.touchTarget + ds.spacing.lg,
    gap: ds.spacing.md,
  },
  cardFeatured: {
    minHeight: ds.sizes.touchTarget + ds.spacing.xl,
  },
  cardPressed: theme.interaction.pressed,
  imageWrap: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
