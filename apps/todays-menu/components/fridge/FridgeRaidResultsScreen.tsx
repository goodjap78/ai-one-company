import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import { buildFridgeRaidDisplayResults } from '../../services/fridge/buildFridgeRaidCandidates';
import {
  buildFridgeUtilizationSections,
  hasMultiIngredientUtilizationGap,
} from '../../services/fridge/fridgeUtilizationDisplay';
import { loadRecommendationContext } from '../../services/recommendation/recommendationContext';
import { getPantry } from '../../services/pantry/pantryService';
import type { FridgeRaidCandidate } from '../../services/fridge/fridgeRaidTypes';
import { FridgeRaidMealCard } from './FridgeRaidMealCard';
import { FridgeShoppingBridge } from './FridgeShoppingBridge';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { screenLayout } from '../ui/screenLayout';

function ResultSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: FridgeRaidCandidate[];
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {items.map((candidate) => (
        <FridgeRaidMealCard key={candidate.recipeId} candidate={candidate} />
      ))}
    </View>
  );
}

export function FridgeRaidResultsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [results, setResults] = useState<Awaited<ReturnType<typeof buildFridgeRaidDisplayResults>> | null>(null);
  const [showExtended, setShowExtended] = useState(false);

  const loadResults = useCallback(async () => {
    setLoading(true);
    const [pantry, context] = await Promise.all([getPantry(), loadRecommendationContext()]);
    setSelectedNames(pantry.items.map((item) => item.name));
    setResults(
      buildFridgeRaidDisplayResults({
        recipes: HANKKI_RECIPES,
        pantry,
        context,
      }),
    );
    setShowExtended(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const hasAnyResults = useMemo(() => {
    if (!results) return false;
    return (
      results.tier5.length +
        results.tier4.length +
        results.tier3.length +
        results.extended.length +
        results.sideDishes.length >
      0
    );
  }, [results]);

  if (loading || !results) {
    return <ScreenLoading />;
  }

  const extendedVisible = showExtended ? results.extended : [];
  const selectedCount = selectedNames.length;
  const primaryCandidates = [...results.tier5, ...results.tier4, ...results.tier3];
  const utilizationSections =
    selectedCount >= 3
      ? buildFridgeUtilizationSections(primaryCandidates, selectedCount)
      : [];
  const extendedUtilizationSections =
    selectedCount >= 3 && showExtended
      ? buildFridgeUtilizationSections(extendedVisible, selectedCount)
      : [];
  const showUtilizationLayout = utilizationSections.length > 0;
  const utilizationGap = hasMultiIngredientUtilizationGap(
    primaryCandidates.length > 0 ? primaryCandidates : results.extended,
    selectedCount,
  );

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}>
        <View style={screenLayout.frame}>
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/fridge-raid" />

          <View style={styles.header}>
            <Text style={screenLayout.title} accessibilityRole="header">
              {FRIDGE_RAID_COPY.resultsTitle}
            </Text>
            {selectedNames.length > 0 ? (
              <>
                <Text style={screenLayout.subtitle} numberOfLines={3}>
                  {selectedNames.join(' · ')}
                </Text>
                <Text style={styles.selectedCount}>
                  {FRIDGE_RAID_COPY.selectedCount(selectedNames.length)}
                </Text>
              </>
            ) : (
              <Text style={screenLayout.subtitle}>선택한 재료가 없어요</Text>
            )}
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
              {showUtilizationLayout ? (
                <>
                  {utilizationSections.map((section) => (
                    <ResultSection key={section.title} title={section.title} items={section.items} />
                  ))}
                  {utilizationGap ? (
                    <Text style={styles.utilizationGap}>{FRIDGE_RAID_COPY.utilizationShortage}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  {primaryCandidates.length === 0 && results.extended.length > 0 && utilizationGap ? (
                    <Text style={styles.utilizationGap}>{FRIDGE_RAID_COPY.utilizationShortage}</Text>
                  ) : null}
                  <ResultSection title={FRIDGE_RAID_COPY.groupReady} items={results.tier5} />
                  <ResultSection title={FRIDGE_RAID_COPY.groupOneMissing} items={results.tier4} />
                  <ResultSection title={FRIDGE_RAID_COPY.groupNeedTwo} items={results.tier3} />
                </>
              )}

              {results.extended.length > 0 ? (
                <View style={styles.section}>
                  {!showExtended ? (
                    <Pressable
                      style={({ pressed }) => [styles.moreButton, pressed && screenLayout.pressed]}
                      onPress={() => setShowExtended(true)}
                      accessibilityRole="button"
                      accessibilityLabel={FRIDGE_RAID_COPY.showMoreMenus}
                    >
                      <Text style={styles.moreButtonLabel}>{FRIDGE_RAID_COPY.showMoreMenus}</Text>
                    </Pressable>
                  ) : extendedUtilizationSections.length > 0 ? (
                    <>
                      {extendedUtilizationSections.map((section) => (
                        <ResultSection key={`ext-${section.title}`} title={section.title} items={section.items} />
                      ))}
                    </>
                  ) : (
                    <ResultSection title={FRIDGE_RAID_COPY.groupExtended} items={extendedVisible} />
                  )}
                </View>
              ) : null}

              <ResultSection title={FRIDGE_RAID_COPY.groupSideDishes} items={results.sideDishes} />
            </>
          )}

          <FridgeShoppingBridge />
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
  sectionSubtitle: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  utilizationGap: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  moreButton: {
    alignSelf: 'flex-start',
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.pill,
    backgroundColor: ds.colors.borderLight,
  },
  moreButtonLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
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
