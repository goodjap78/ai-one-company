import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import {
  SHOPPING_CONFIG,
  type ShoppingListMode,
} from '../../constants/shoppingConfig';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { useShoppingProductResults } from '../../hooks/useShoppingProductResults';
import { getPantry } from '../../services/pantry/pantryService';
import { buildRecipeSeasoningShoppingItems } from '../../services/shopping/buildRecipeShoppingList';
import { resolveRecipeShoppingList } from '../../services/shopping/resolveRecipeShoppingList';
import {
  buildDefaultSelectedKeys,
  isCommonStapleMatchKey,
  shoppingItemSelectionKey,
} from '../../services/shopping/shoppingSelection';
import type { ShoppingIngredientGroup, ShoppingIngredientItem } from '../../types/shopping';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';
import { recipePremiumStyles, recipeRef } from '../recipe/recipePremiumStyles';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { MealKitShoppingPanel } from './MealKitShoppingPanel';
import {
  setShoppingAnalyticsContext,
  toAnalyticsShoppingMode,
  trackShoppingScreenView,
} from '../../services/analytics';
import { ShoppingIngredientRow } from './ShoppingIngredientRow';
import { ShoppingProductResults } from './ShoppingProductResults';

const GROUP_LABEL: Record<ShoppingIngredientGroup, string> = {
  main: SHOPPING_COPY.groupMain,
  sub: SHOPPING_COPY.groupSub,
  seasoning: SHOPPING_COPY.groupSeasoning,
};

const GROUP_ORDER: ShoppingIngredientGroup[] = ['main', 'sub', 'seasoning'];

type SectionModel = {
  key: string;
  title: string;
  hint?: string;
  items: ShoppingIngredientItem[];
};

function buildSections(items: ShoppingIngredientItem[]): SectionModel[] {
  const staples = items.filter((item) => isCommonStapleMatchKey(item.matchKey));
  const regular = items.filter((item) => !isCommonStapleMatchKey(item.matchKey));

  const sections: SectionModel[] = [];

  for (const group of GROUP_ORDER) {
    const groupItems = regular.filter((item) => item.group === group);
    if (groupItems.length === 0) continue;
    sections.push({
      key: group,
      title: GROUP_LABEL[group],
      items: groupItems,
    });
  }

  if (staples.length > 0) {
    sections.push({
      key: 'staples',
      title: SHOPPING_COPY.staplesSectionTitle,
      hint: SHOPPING_COPY.staplesSectionHint,
      items: staples,
    });
  }

  return sections;
}

type Props = {
  recipeId: string;
  mode: ShoppingListMode;
  /** Fridge missing mode — expand optional seasoning checklist on entry. */
  showSeasoningsInitially?: boolean;
};

/**
 * Sprint 63-C — contextual shopping list (no product API / affiliate links).
 */
export function ShoppingScreen({
  recipeId,
  mode,
  showSeasoningsInitially = false,
}: Props) {
  useEffect(() => {
    if (!recipeId) return;
    const analyticsMode = toAnalyticsShoppingMode(mode);
    setShoppingAnalyticsContext(recipeId, analyticsMode);
    trackShoppingScreenView({
      recipe_id: recipeId,
      mode: analyticsMode,
    });
  }, [recipeId, mode]);

  if (mode === 'meal-kit') {
    return <MealKitShoppingPanel recipeId={recipeId} />;
  }

  return (
    <IngredientShoppingScreen
      recipeId={recipeId}
      mode={mode}
      showSeasoningsInitially={showSeasoningsInitially}
    />
  );
}

function IngredientShoppingScreen({
  recipeId,
  mode,
  showSeasoningsInitially = false,
}: Props) {
  const recipe = getHankkiRecipeById(recipeId);
  const heroImage = recipe ? resolveMealHeroImage(recipeId, 'homemade') : null;

  const [loading, setLoading] = useState(true);
  const [coreItems, setCoreItems] = useState<ShoppingIngredientItem[]>([]);
  const [found, setFound] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showSeasoningPanel, setShowSeasoningPanel] = useState(showSeasoningsInitially);

  useEffect(() => {
    setShowSeasoningPanel(showSeasoningsInitially);
  }, [recipeId, mode, showSeasoningsInitially]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const pantry = mode === 'missing' ? await getPantry() : null;
      const list = resolveRecipeShoppingList(recipeId, mode, pantry);
      if (cancelled) return;

      setFound(list.found);
      setCoreItems(list.items);
      setSelectedKeys(buildDefaultSelectedKeys(list.items, mode));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [recipeId, mode]);

  const optionalSeasonings = useMemo(
    () => (mode === 'missing' ? buildRecipeSeasoningShoppingItems(recipeId) : []),
    [mode, recipeId],
  );

  const visibleItems = useMemo(() => {
    if (mode !== 'missing' || !showSeasoningPanel) return coreItems;
    const coreKeySet = new Set(coreItems.map((item) => shoppingItemSelectionKey(item)));
    const extra = optionalSeasonings.filter(
      (item) => !coreKeySet.has(shoppingItemSelectionKey(item)),
    );
    return [...coreItems, ...extra];
  }, [mode, coreItems, optionalSeasonings, showSeasoningPanel]);

  const sections = useMemo(() => buildSections(visibleItems), [visibleItems]);
  const { results: productResults } = useShoppingProductResults(visibleItems, selectedKeys);

  const canShowSeasoningToggle =
    mode === 'missing' && optionalSeasonings.length > 0 && !showSeasoningPanel;

  const productResultByKey = useMemo(() => {
    const map = new Map<string, typeof productResults[number]>();
    for (const result of productResults) {
      map.set(`${result.request.matchKey}::${result.request.shoppingKeyword}`, result);
    }
    return map;
  }, [productResults]);

  const toggleItem = useCallback((item: ShoppingIngredientItem) => {
    const key = shoppingItemSelectionKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const screenTitle =
    mode === 'missing' ? SHOPPING_COPY.screenTitleMissing : SHOPPING_COPY.screenTitleAll;

  const disclosureText = SHOPPING_CONFIG.affiliateDisclosureText?.trim() ?? '';

  if (!recipeId) {
    return (
      <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.empty}>{SHOPPING_COPY.invalidRecipe}</Text>
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              {heroImage ? (
                <MealImageView
                  image={heroImage}
                  containerStyle={styles.heroThumb}
                  style={styles.heroThumbInner}
                  variant="thumb"
                />
              ) : null}
              <View style={styles.headerCopy}>
                <Text style={styles.screenTitle} accessibilityRole="header">
                  {screenTitle}
                </Text>
                {recipe ? (
                  <Text style={styles.recipeName} numberOfLines={2}>
                    {recipe.name}
                  </Text>
                ) : null}
                <Text style={styles.hint}>{SHOPPING_COPY.listHint}</Text>
              </View>
            </View>
          </View>

          {disclosureText.length > 0 ? (
            <Text style={styles.disclosure}>{disclosureText}</Text>
          ) : null}

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={ds.colors.primary} />
            </View>
          ) : !found ? (
            <Text style={styles.empty}>{SHOPPING_COPY.invalidRecipe}</Text>
          ) : coreItems.length === 0 && !showSeasoningPanel ? (
            <View style={styles.zeroMissingWrap}>
              <Text style={styles.completeLabel}>{SHOPPING_COPY.missingIngredientsComplete}</Text>
              {canShowSeasoningToggle ? (
                <Pressable
                  style={({ pressed }) => [styles.seasoningToggle, pressed && styles.seasoningTogglePressed]}
                  onPress={() => setShowSeasoningPanel(true)}
                  accessibilityRole="button"
                  accessibilityLabel={SHOPPING_COPY.checkSeasoningsCta}
                >
                  <Text style={styles.seasoningToggleLabel}>{SHOPPING_COPY.checkSeasoningsCta}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : visibleItems.length === 0 ? (
            <Text style={styles.empty}>{SHOPPING_COPY.emptyList}</Text>
          ) : (
            <View style={styles.list}>
              {mode === 'missing' && coreItems.length === 0 ? (
                <Text style={styles.completeLabel}>{SHOPPING_COPY.missingIngredientsComplete}</Text>
              ) : null}
              {sections.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.hint ? <Text style={styles.sectionHint}>{section.hint}</Text> : null}
                  <View style={styles.sectionItems}>
                    {section.items.map((item) => {
                      const itemKey = shoppingItemSelectionKey(item);
                      const isSelected = selectedKeys.has(itemKey);
                      const productResult = productResultByKey.get(itemKey);

                      return (
                        <View key={itemKey} style={styles.itemBlock}>
                          <ShoppingIngredientRow
                            item={item}
                            selected={isSelected}
                            onToggle={() => toggleItem(item)}
                          />
                          {isSelected && productResult ? (
                            <ShoppingProductResults result={productResult} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
              {showSeasoningPanel && mode === 'missing' ? (
                <Text style={styles.sectionHint}>{SHOPPING_COPY.checkSeasoningsHint}</Text>
              ) : null}
              {canShowSeasoningToggle ? (
                <Pressable
                  style={({ pressed }) => [styles.seasoningToggle, pressed && styles.seasoningTogglePressed]}
                  onPress={() => setShowSeasoningPanel(true)}
                  accessibilityRole="button"
                  accessibilityLabel={SHOPPING_COPY.checkSeasoningsCta}
                >
                  <Text style={styles.seasoningToggleLabel}>{SHOPPING_COPY.checkSeasoningsCta}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.sm,
    paddingBottom: ds.spacing.xl,
    gap: ds.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  headerCard: {
    backgroundColor: recipeRef.colors.card,
    borderRadius: 16,
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroThumbInner: {
    borderRadius: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  screenTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  recipeName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textWarm,
  },
  hint: {
    ...ds.typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: recipeRef.colors.textMuted,
    fontWeight: '600',
  },
  loadingWrap: {
    paddingVertical: ds.spacing.xl,
    alignItems: 'center',
  },
  empty: {
    ...ds.typography.body,
    color: recipeRef.colors.textMuted,
    textAlign: 'center',
  },
  list: {
    gap: ds.spacing.lg,
  },
  section: {
    gap: ds.spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  sectionHint: {
    ...ds.typography.caption,
    color: recipeRef.colors.textMuted,
    fontWeight: '600',
  },
  sectionItems: {
    gap: 8,
  },
  itemBlock: {
    gap: 6,
  },
  disclosure: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    textAlign: 'left',
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  zeroMissingWrap: {
    gap: ds.spacing.md,
    alignItems: 'stretch',
  },
  completeLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textWarm,
    textAlign: 'center',
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  seasoningToggle: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  seasoningTogglePressed: {
    opacity: 0.9,
    backgroundColor: '#FFF3E8',
  },
  seasoningToggleLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
});
