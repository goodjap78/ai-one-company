import type { Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import {
  COMBO_KIND_FILTER_ORDER,
  countCombosByStoreScope,
  filterConvenienceCombos,
  listAllConvenienceCombos,
  sortConvenienceCombos,
  SITUATION_FILTER_ORDER,
  STORE_FILTER_ORDER,
  type ComboKindFilterId,
  type ComboSituationFilterId,
  type ComboSortId,
  type ComboStoreFilterId,
} from '../../services/convenience/convenienceComboCatalog';
import {
  getConvenienceFavoriteIds,
  toggleConvenienceFavorite,
} from '../../services/convenience/convenienceFavoritesStorage';
import { CONVENIENCE_RECOMMENDATION_HREF } from '../../constants/appRoutes';
import { navigateToConvenienceDetail } from '../../services/convenience/convenienceComboNavigation';
import { ScreenReplaceNavButton } from '../ui/ScreenReplaceNavButton';
import { screenLayout } from '../ui/screenLayout';
import { ConvenienceComboCard } from './ConvenienceComboCard';
import { ConvenienceFilterChips } from './ConvenienceFilterChips';
import {
  resolveConvenienceCardWidth,
  resolveConvenienceContentMaxWidth,
  resolveConvenienceGridColumns,
} from './convenienceGridLayout';
import { ConvenienceSegmentControl } from './ConvenienceSegmentControl';

const ACCENT_COLORS = [
  '#E8834A',
  '#6FA86A',
  '#6A8AB8',
  '#C47A2A',
  '#8A6AB8',
  '#E85A6A',
] as const;

const GRID_GAP = ds.spacing.cardInner;

function kindFilterLabel(id: ComboKindFilterId): string {
  switch (id) {
    case 'all':
      return convenienceCombosCopy.kindFilterAll;
    case 'hack_combo':
      return convenienceCombosCopy.kindFilterHack;
    case 'easy_set':
      return convenienceCombosCopy.kindFilterEasy;
    default:
      return id;
  }
}

function storeFilterLabel(id: ComboStoreFilterId): string {
  switch (id) {
    case 'all':
      return convenienceCombosCopy.all;
    case 'common':
      return convenienceCombosCopy.storeCommon;
    case 'cu':
      return convenienceCombosCopy.storeCu;
    case 'gs25':
      return convenienceCombosCopy.storeGs25;
    case 'seven':
      return convenienceCombosCopy.storeSeven;
    case 'emart24':
      return convenienceCombosCopy.storeEmart24;
    default:
      return id;
  }
}

function situationFilterLabel(id: ComboSituationFilterId): string {
  if (id === 'all') return convenienceCombosCopy.all;
  return convenienceCombosCopy.situation[id];
}

export function ConvenienceCombosScreen({
  backHref = CONVENIENCE_RECOMMENDATION_HREF,
  backLabel = convenienceCombosCopy.title,
  backAccessibilityLabel = '편의점 추천으로',
  backIcon = 'chevron-left',
  description = convenienceCombosCopy.description,
}: {
  backHref?: Href;
  backLabel?: string;
  backAccessibilityLabel?: string;
  backIcon?: 'home-outline' | 'chevron-left';
  description?: string;
} = {}) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const allCombos = listAllConvenienceCombos();
  const storeCounts = countCombosByStoreScope();

  const [kindFilter, setKindFilter] = useState<ComboKindFilterId>('all');
  const [situationFilter, setSituationFilter] = useState<ComboSituationFilterId>('all');
  const [storeFilter, setStoreFilter] = useState<ComboStoreFilterId>('all');
  const [sortId, setSortId] = useState<ComboSortId>('default');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const columns = resolveConvenienceGridColumns(windowWidth);
  const contentMaxWidth = resolveConvenienceContentMaxWidth(windowWidth, columns);
  const cardWidth = resolveConvenienceCardWidth(windowWidth, columns);

  const loadFavorites = useCallback(async () => {
    const ids = await getConvenienceFavoriteIds();
    setFavoriteIds(new Set(ids));
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const kindOptions = useMemo(
    () =>
      COMBO_KIND_FILTER_ORDER.map((id) => ({
        id,
        label: kindFilterLabel(id),
      })),
    [],
  );

  const situationOptions = useMemo(
    () =>
      SITUATION_FILTER_ORDER.map((id) => ({
        id,
        label: situationFilterLabel(id),
      })),
    [],
  );

  const storeSegmentOptions = useMemo(
    () =>
      STORE_FILTER_ORDER
        .filter((id) => {
          if (id === 'all' || id === 'common') return true;
          return (storeCounts[id] ?? 0) > 0;
        })
        .map((id) => ({
          id,
          label: storeFilterLabel(id),
          disabled: id !== 'all' && id !== 'common' && (storeCounts[id] ?? 0) === 0,
        })),
    [storeCounts],
  );

  const sortOptions: { id: ComboSortId; label: string }[] = [
    { id: 'default', label: convenienceCombosCopy.sortDefault },
    { id: 'price_low', label: convenienceCombosCopy.sortPriceLow },
    { id: 'prep_fast', label: convenienceCombosCopy.sortPrepFast },
  ];

  const filtered = useMemo(() => {
    const list = filterConvenienceCombos({
      combos: allCombos,
      kindFilter,
      situationFilter,
      storeFilter,
      favoriteIds,
      favoritesOnly,
    });
    return sortConvenienceCombos(list, sortId);
  }, [
    allCombos,
    kindFilter,
    situationFilter,
    storeFilter,
    favoriteIds,
    favoritesOnly,
    sortId,
  ]);

  const handleToggleFavorite = async (comboId: string) => {
    const ok = await toggleConvenienceFavorite(comboId);
    if (!ok) {
      Alert.alert(convenienceCombosCopy.favoriteSaveFailed);
      return;
    }
    await loadFavorites();
  };

  const emptyMessage = favoritesOnly
    ? convenienceCombosCopy.emptyFavorites
    : convenienceCombosCopy.emptyFilter;

  const showStoreSegment = storeSegmentOptions.length <= 3;

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.frame,
              { maxWidth: contentMaxWidth },
            ]}
          >
            <ScreenReplaceNavButton
              href={backHref}
              label={backLabel}
              accessibilityLabel={backAccessibilityLabel}
              icon={backIcon}
            />

            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {convenienceCombosCopy.title}
              </Text>
              <Text style={styles.description}>{description}</Text>
              <Text style={styles.count}>
                {convenienceCombosCopy.countLabel(allCombos.length)}
              </Text>
            </View>

            <View style={styles.filterBlock}>
              <ConvenienceFilterChips
                options={kindOptions}
                selectedId={kindFilter}
                onSelect={setKindFilter}
                compact
              />

              <ConvenienceFilterChips
                options={situationOptions}
                selectedId={situationFilter}
                onSelect={setSituationFilter}
                compact
              />

              <View style={styles.filterToolbar}>
                {showStoreSegment ? (
                  <ConvenienceSegmentControl
                    options={storeSegmentOptions}
                    selectedId={storeFilter}
                    onSelect={(id) => {
                      const option = storeSegmentOptions.find((o) => o.id === id);
                      if (option?.disabled) return;
                      setStoreFilter(id);
                    }}
                  />
                ) : (
                  <ConvenienceFilterChips
                    options={storeSegmentOptions}
                    selectedId={storeFilter}
                    onSelect={(id) => {
                      const option = storeSegmentOptions.find((o) => o.id === id);
                      if (option?.disabled) return;
                      setStoreFilter(id);
                    }}
                    compact
                  />
                )}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortScroll}
                  contentContainerStyle={styles.sortScrollContent}
                >
                  {sortOptions.map((option) => {
                    const active = sortId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={({ pressed }) => [
                          styles.sortChip,
                          active && styles.sortChipActive,
                          pressed && styles.sortChipPressed,
                        ]}
                        onPress={() => setSortId(option.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            active && styles.sortChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={({ pressed }) => [
                    styles.favToggle,
                    favoritesOnly && styles.favToggleActive,
                    pressed && styles.favTogglePressed,
                  ]}
                  onPress={() => setFavoritesOnly((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: favoritesOnly }}
                >
                  <Text
                    style={[
                      styles.favToggleText,
                      favoritesOnly && styles.favToggleTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {convenienceCombosCopy.favoritesOnly}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.resultCount}>
                {convenienceCombosCopy.resultCount(filtered.length)}
              </Text>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            ) : (
              <View style={[styles.grid, { gap: GRID_GAP }]}>
                {filtered.map((combo, index) => (
                  <View
                    key={combo.id}
                    style={[
                      styles.gridItem,
                      columns > 1 ? { width: cardWidth } : styles.gridItemFull,
                    ]}
                  >
                    <ConvenienceComboCard
                      combo={combo}
                      isFavorite={favoriteIds.has(combo.id)}
                      accentColor={ACCENT_COLORS[index % ACCENT_COLORS.length]}
                      onToggleFavorite={() => handleToggleFavorite(combo.id)}
                      onView={() => navigateToConvenienceDetail(router, combo.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: ds.spacing.xl,
  },
  frame: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: ds.spacing.screen,
    paddingTop: ds.spacing.md,
    gap: ds.spacing.md,
  },
  header: {
    gap: 6,
  },
  title: {
    ...ds.typography.sectionTitle,
    fontSize: 20,
    lineHeight: 28,
    color: '#3A2417',
  },
  description: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
    lineHeight: 20,
  },
  count: {
    ...ds.typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  filterBlock: {
    gap: 10,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortScroll: {
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: '100%',
  },
  sortScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  sortChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    minHeight: 32,
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  sortChipPressed: {
    opacity: 0.88,
  },
  sortChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  sortChipTextActive: {
    color: ds.colors.primaryDark,
    fontWeight: '800',
  },
  favToggle: {
    borderRadius: ds.radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    backgroundColor: ds.colors.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  favToggleActive: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  favTogglePressed: {
    opacity: 0.88,
  },
  favToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  favToggleTextActive: {
    color: ds.colors.primaryDark,
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
  },
  emptyText: {
    ...ds.typography.body,
    color: ds.colors.warmText,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'stretch',
  },
  gridItem: {
    minWidth: 0,
    flexDirection: 'column',
  },
  gridItemFull: {
    width: '100%',
  },
});
