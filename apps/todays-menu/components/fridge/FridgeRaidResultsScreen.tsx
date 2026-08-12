import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
import { FRIDGE_COMPACT_WINDOW_SIZE } from '../../constants/fridgeCompactLayout';
import { APP_HOME_HREF } from '../../constants/appRoutes';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import { buildFridgeRaidResultsBundle } from '../../services/fridge/buildFridgeRaidCandidates';
import {
  canRotateFridgeRecommendationWindow,
  pickNextFridgeRecommendationWindow,
  sliceFridgeRecommendationWindow,
} from '../../services/fridge/fridgeCompactRecommendation';
import { loadRecommendationContext } from '../../services/recommendation/recommendationContext';
import { getPantry } from '../../services/pantry/pantryService';
import type { PantrySnapshot } from '../../types/pantry';
import { buildMissingShoppingListFromNames } from '../../services/shopping';
import { traceFridgePantrySelection } from '../../services/fridge/traceFridgePantrySelection';
import { FridgeRaidCompactFeed } from './FridgeRaidCompactFeed';
import { FridgeRecommendationBannerSlot } from './FridgeRecommendationBannerSlot';
import { FridgeSelectedIngredientChips } from './FridgeSelectedIngredientChips';
import { FridgeShoppingBridge } from './FridgeShoppingBridge';
import { ScreenReplaceNavButton } from '../ui/ScreenReplaceNavButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { screenLayout } from '../ui/screenLayout';

function buildPantrySelectionSignature(pantry: PantrySnapshot): string {
  return pantry.items
    .map((item) => `${item.id}:${item.iconKey ?? item.normalizedName}`)
    .sort()
    .join('|');
}

export function FridgeRaidResultsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [results, setResults] = useState<Awaited<ReturnType<typeof buildFridgeRaidResultsBundle>> | null>(
    null,
  );
  const [showExtended, setShowExtended] = useState(false);
  const [recommendationOffset, setRecommendationOffset] = useState(0);
  const [recentRecommendationIds, setRecentRecommendationIds] = useState<string[]>([]);
  const [pantryTrace, setPantryTrace] = useState<ReturnType<typeof traceFridgePantrySelection> | null>(
    null,
  );
  const pantrySignatureRef = useRef<string | null>(null);

  const loadResults = useCallback(async () => {
    const [pantry, context] = await Promise.all([getPantry(), loadRecommendationContext()]);
    const pantrySignature = buildPantrySelectionSignature(pantry);
    const preserveRecommendationWindow = pantrySignatureRef.current === pantrySignature;
    pantrySignatureRef.current = pantrySignature;

    if (!preserveRecommendationWindow) {
      setLoading(true);
    }

    setSelectedNames(pantry.items.map((item) => item.name));
    setPantryTrace(traceFridgePantrySelection(pantry));
    setResults(
      buildFridgeRaidResultsBundle({
        recipes: HANKKI_RECIPES,
        pantry,
        context,
      }),
    );
    if (!preserveRecommendationWindow) {
      setShowExtended(false);
      setRecommendationOffset(0);
      setRecentRecommendationIds([]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadResults();
    }, [loadResults]),
  );

  const primaryFeed = results?.primaryFeed ?? [];
  const extendedFeed = results?.extended ?? [];
  const sideDishFeed = results?.sideDishes ?? [];

  const visiblePrimaryCandidates = useMemo(
    () => sliceFridgeRecommendationWindow(primaryFeed, recommendationOffset, FRIDGE_COMPACT_WINDOW_SIZE),
    [primaryFeed, recommendationOffset],
  );

  const hasAnyResults = useMemo(() => {
    if (!results) return false;
    return primaryFeed.length + extendedFeed.length + sideDishFeed.length > 0;
  }, [results, primaryFeed, extendedFeed, sideDishFeed]);

  const canRotatePrimary = canRotateFridgeRecommendationWindow(primaryFeed, FRIDGE_COMPACT_WINDOW_SIZE);
  const showPrimaryShortage =
    primaryFeed.length > 0 && primaryFeed.length < FRIDGE_COMPACT_WINDOW_SIZE;

  const handleRotatePrimary = useCallback(() => {
    const next = pickNextFridgeRecommendationWindow(
      primaryFeed,
      recommendationOffset,
      recentRecommendationIds,
      FRIDGE_COMPACT_WINDOW_SIZE,
    );
    setRecommendationOffset(next.offset);
    setRecentRecommendationIds(next.recentIds);
  }, [primaryFeed, recommendationOffset, recentRecommendationIds]);

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      router.push(`/recipe/${recipeId}`);
    },
    [router],
  );

  const bridgeMissingShopping = useMemo(() => {
    const top = primaryFeed[0];
    if (!top) return { recipeId: null, items: [] };
    const list = buildMissingShoppingListFromNames(top.recipeId, top.missingIngredients);
    return { recipeId: top.recipeId, items: list.items };
  }, [primaryFeed]);

  if (loading || !results) {
    return <ScreenLoading />;
  }

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}>
        <View style={screenLayout.frame}>
          <ScreenReplaceNavButton
            href={APP_HOME_HREF}
            label={NAV_BACK.home}
            accessibilityLabel="홈으로"
          />

          <View style={styles.header}>
            <Text style={screenLayout.title} accessibilityRole="header">
              {FRIDGE_RAID_COPY.resultsTitle}
            </Text>
            <Text style={screenLayout.subtitle}>{FRIDGE_RAID_COPY.resultsGuide}</Text>
            <FridgeSelectedIngredientChips names={selectedNames} />
            {selectedNames.length > 0 ? (
              <Text style={styles.selectedCount}>
                {FRIDGE_RAID_COPY.selectedCount(selectedNames.length)}
              </Text>
            ) : (
              <Text style={screenLayout.subtitle}>선택한 재료가 없어요</Text>
            )}
            {__DEV__ && pantryTrace ? (
              <Text style={styles.devTrace} selectable>
                선택 원문: {pantryTrace.rawNames.join(', ')}
                {'\n'}
                정규화: {pantryTrace.matchKeys.join(', ')}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.reselectButton, pressed && screenLayout.pressed]}
              onPress={() => router.push('/fridge-raid')}
              accessibilityRole="button"
              accessibilityLabel={FRIDGE_RAID_COPY.reselect}
            >
              <Text style={styles.reselectLabel}>{FRIDGE_RAID_COPY.reselect}</Text>
            </Pressable>
          </View>

          {!hasAnyResults ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{FRIDGE_RAID_COPY.emptyTitle}</Text>
              <Text style={styles.emptyHint}>{FRIDGE_RAID_COPY.emptyHint}</Text>
              <Pressable
                style={({ pressed }) => [screenLayout.primaryButton, pressed && screenLayout.pressedPrimary]}
                onPress={() => router.push('/fridge-raid')}
                accessibilityRole="button"
                accessibilityLabel={FRIDGE_RAID_COPY.reselect}
              >
                <Text style={screenLayout.primaryText}>{FRIDGE_RAID_COPY.reselect}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {primaryFeed.length > 0 ? (
                <View style={styles.section}>
                  <FridgeRaidCompactFeed
                    candidates={visiblePrimaryCandidates}
                    onPressRecipe={handleOpenRecipe}
                  />
                  {showPrimaryShortage ? (
                    <Text style={styles.shortageHint}>{FRIDGE_RAID_COPY.primaryShortage}</Text>
                  ) : null}
                  {canRotatePrimary ? (
                    <Pressable
                      style={({ pressed }) => [styles.rotateButton, pressed && screenLayout.pressed]}
                      onPress={handleRotatePrimary}
                      accessibilityRole="button"
                      accessibilityLabel={FRIDGE_RAID_COPY.anotherMenuRecommendation}
                    >
                      <Text style={styles.rotateButtonLabel}>
                        {FRIDGE_RAID_COPY.anotherMenuRecommendation} →
                      </Text>
                    </Pressable>
                  ) : null}
                  <FridgeShoppingBridge
                    missingItems={bridgeMissingShopping.items}
                    recipeId={bridgeMissingShopping.recipeId}
                  />
                </View>
              ) : extendedFeed.length > 0 ? (
                <Text style={styles.shortageHint}>{FRIDGE_RAID_COPY.utilizationShortage}</Text>
              ) : null}

              <FridgeRecommendationBannerSlot previewMode={__DEV__ ? false : undefined} />

              {extendedFeed.length > 0 ? (
                <View style={styles.section}>
                  {!showExtended ? (
                    <Pressable
                      style={({ pressed }) => [styles.moreButton, pressed && screenLayout.pressed]}
                      onPress={() => setShowExtended(true)}
                      accessibilityRole="button"
                      accessibilityLabel={FRIDGE_RAID_COPY.showMoreMenus}
                    >
                      <Text style={styles.moreButtonLabel}>
                        {FRIDGE_RAID_COPY.showMoreMenus} →
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle} accessibilityRole="header">
                        {FRIDGE_RAID_COPY.groupExtended}
                      </Text>
                      <FridgeRaidCompactFeed
                        candidates={extendedFeed}
                        onPressRecipe={handleOpenRecipe}
                      />
                    </>
                  )}
                </View>
              ) : null}

              {sideDishFeed.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">
                    {FRIDGE_RAID_COPY.groupSideDishes}
                  </Text>
                  <FridgeRaidCompactFeed
                    candidates={sideDishFeed}
                    onPressRecipe={handleOpenRecipe}
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: ds.spacing.xl,
  },
  header: {
    gap: ds.spacing.sm,
  },
  selectedCount: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  reselectButton: {
    alignSelf: 'flex-start',
    paddingVertical: ds.spacing.xs,
  },
  reselectLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  section: {
    gap: ds.spacing.md,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  shortageHint: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  rotateButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  rotateButtonLabel: {
    ...ds.typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: ds.colors.primaryDark,
    fontWeight: '700',
  },
  devTrace: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    fontWeight: '600',
  },
  moreButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  moreButtonLabel: {
    ...ds.typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: ds.colors.primaryDark,
    fontWeight: '700',
  },
  emptyBox: {
    ...screenLayout.centered,
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },
  emptyTitle: {
    ...ds.typography.body,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  emptyHint: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.md,
  },
});
