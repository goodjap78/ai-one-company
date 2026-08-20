import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { convenienceCombosCopy, getConvenienceSituationGuideMessage } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import { NAV_BACK } from '../../constants/navigationCopy';
import {
  formatComboKindLabel,
  formatEstimatedPriceRange,
  getConvenienceComboById,
  listAllConvenienceCombos,
} from '../../services/convenience/convenienceComboCatalog';
import {
  getConvenienceFavoriteIds,
  toggleConvenienceFavorite,
} from '../../services/convenience/convenienceFavoritesStorage';
import {
  buildRecommendationReason,
  DEFAULT_RECOMMENDATION_SITUATION,
  getConvenienceComboSessionRecentIds,
  pickAlternateRecommendations,
  pickEntryRecommendation,
  pickNextRecommendation,
  RECOMMENDATION_SITUATION_ORDER,
  recordConvenienceComboSessionRecommendation,
  type RecommendationSituationId,
} from '../../services/convenience/convenienceComboRecommendation';
import { resolveConvenienceComboImage } from '../../services/images/resolveConvenienceComboImage';
import { APP_HOME_HREF } from '../../constants/appRoutes';
import {
  navigateToConvenienceAll,
  navigateToConvenienceDetail,
} from '../../services/convenience/convenienceComboNavigation';
import { ScreenReplaceNavButton } from '../ui/ScreenReplaceNavButton';
import { screenLayout } from '../ui/screenLayout';
import { ConvenienceComboSuggestionStrip } from './ConvenienceComboSuggestionStrip';
import { ConvenienceComboFeaturedHero } from './ConvenienceComboFeaturedHero';
import { ConvenienceFilterChips } from './ConvenienceFilterChips';
import { trackConvenienceOpen } from '../../services/analytics';
import { resolveConvenienceContentMaxWidth } from './convenienceGridLayout';

const ACCENT_COLORS = [
  '#E8834A',
  '#6FA86A',
  '#6A8AB8',
  '#C47A2A',
  '#8A6AB8',
  '#E85A6A',
] as const;

function situationChipLabel(id: RecommendationSituationId): string {
  return convenienceCombosCopy.situation[id];
}

export function ConvenienceComboRecommendationScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const contentMaxWidth = resolveConvenienceContentMaxWidth(windowWidth, 1);

  const [selectedSituation, setSelectedSituation] =
    useState<RecommendationSituationId>(DEFAULT_RECOMMENDATION_SITUATION);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentRecommendationId, setCurrentRecommendationId] = useState('');
  const [recentRecommendationIds, setRecentRecommendationIds] = useState<string[]>([]);
  const skipRotationOnFocusRef = useRef(false);

  const loadFavorites = useCallback(async () => {
    const ids = await getConvenienceFavoriteIds();
    setFavoriteIds(new Set(ids));
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    trackConvenienceOpen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (skipRotationOnFocusRef.current) {
        skipRotationOnFocusRef.current = false;
        return;
      }
      const combo = pickEntryRecommendation(DEFAULT_RECOMMENDATION_SITUATION, new Set());
      setSelectedSituation(DEFAULT_RECOMMENDATION_SITUATION);
      setRecentRecommendationIds(getConvenienceComboSessionRecentIds());
      setCurrentRecommendationId(combo?.id ?? listAllConvenienceCombos()[0]?.id ?? '');
    }, []),
  );

  const situationOptions = useMemo(
    () =>
      RECOMMENDATION_SITUATION_ORDER.map((id) => ({
        id,
        label: situationChipLabel(id),
      })),
    [],
  );

  const currentCombo = getConvenienceComboById(currentRecommendationId);

  const alternates = useMemo(() => {
    if (!currentRecommendationId) return [];
    return pickAlternateRecommendations(
      selectedSituation,
      currentRecommendationId,
      favoriteIds,
      3,
      getConvenienceComboSessionRecentIds(),
    );
  }, [selectedSituation, currentRecommendationId, favoriteIds]);

  const reasonText = buildRecommendationReason(selectedSituation);
  const guideMessage = getConvenienceSituationGuideMessage(selectedSituation);

  const handleSituationChange = (id: RecommendationSituationId) => {
    setSelectedSituation(id);
    const combo = pickEntryRecommendation(id, favoriteIds);
    setRecentRecommendationIds(getConvenienceComboSessionRecentIds());
    setCurrentRecommendationId(combo?.id ?? '');
  };

  const handleAnotherRecommendation = () => {
    if (!currentRecommendationId) return;
    const next = pickNextRecommendation(
      selectedSituation,
      currentRecommendationId,
      getConvenienceComboSessionRecentIds(),
      favoriteIds,
    );
    if (!next) return;
    recordConvenienceComboSessionRecommendation(next.id);
    setRecentRecommendationIds(getConvenienceComboSessionRecentIds());
    setCurrentRecommendationId(next.id);
  };

  const handleToggleFavorite = async () => {
    if (!currentCombo) return;
    const ok = await toggleConvenienceFavorite(currentCombo.id);
    if (!ok) {
      Alert.alert(convenienceCombosCopy.favoriteSaveFailed);
      return;
    }
    await loadFavorites();
  };

  const openDetail = (id: string) => {
    skipRotationOnFocusRef.current = true;
    navigateToConvenienceDetail(router, id);
  };

  const featuredHeroImage = currentCombo ? resolveConvenienceComboImage(currentCombo) : null;
  const isHackFeatured = currentCombo?.comboKind === 'hack_combo';
  const kindLabel = currentCombo ? formatComboKindLabel(currentCombo.comboKind) : '';
  const hasDistinctTransformation =
    currentCombo &&
    isHackFeatured &&
    currentCombo.transformationName &&
    currentCombo.transformationName.trim() !== currentCombo.title.trim();
  const displayTitle = currentCombo
    ? hasDistinctTransformation
      ? currentCombo.transformationName!
      : currentCombo.title
    : '';
  const priceLabel = currentCombo
    ? formatEstimatedPriceRange(currentCombo.estimatedPriceRange)
    : '';
  const prepLabel = currentCombo
    ? convenienceCombosCopy.prepMinutes(currentCombo.prepTimeMinutes)
    : '';
  const isFavorite = currentCombo ? favoriteIds.has(currentCombo.id) : false;

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.frame, { maxWidth: contentMaxWidth }]}>
            <ScreenReplaceNavButton
              href={APP_HOME_HREF}
              label={NAV_BACK.home}
              accessibilityLabel="홈으로"
            />

            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {convenienceCombosCopy.title}
              </Text>
              <Text style={styles.description}>
                {convenienceCombosCopy.recommendationDescription}
              </Text>
            </View>

            <ConvenienceFilterChips
              options={situationOptions}
              selectedId={selectedSituation}
              onSelect={handleSituationChange}
              compact
            />

            {currentCombo ? (
              <View style={styles.featuredCard}>
                <ConvenienceComboFeaturedHero
                  heroImage={featuredHeroImage}
                  fallbackColor={ACCENT_COLORS[0]}
                  title={displayTitle}
                  guideMessage={guideMessage}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => void handleToggleFavorite()}
                />

                <View style={styles.featuredBody}>
                  <View style={styles.metaRow}>
                    {priceLabel ? (
                      <Text style={styles.metaText}>
                        {convenienceCombosCopy.estimatedPrice}: {priceLabel}
                      </Text>
                    ) : null}
                    {prepLabel ? (
                      <Text style={styles.metaText}>
                        {convenienceCombosCopy.prepTime}: {prepLabel}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.kindBadge,
                      isHackFeatured ? styles.kindBadgeHack : styles.kindBadgeEasy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.kindBadgeText,
                        isHackFeatured ? styles.kindBadgeTextHack : styles.kindBadgeTextEasy,
                      ]}
                    >
                      {kindLabel}
                    </Text>
                  </View>
                  {hasDistinctTransformation ? (
                    <Text style={styles.featuredSubtitle}>{currentCombo.title}</Text>
                  ) : null}
                  <Text style={styles.whyLine}>{currentCombo.whyItWorks}</Text>
                  <Text style={styles.reasonLine}>{reasonText}</Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => openDetail(currentCombo.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>
                      {convenienceCombosCopy.eatThisCombo}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleAnotherRecommendation}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryButtonText}>
                      {convenienceCombosCopy.anotherRecommendation}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {alternates.length > 0 ? (
              <View style={styles.alternateSection}>
                <Text style={styles.sectionLabel}>
                  {convenienceCombosCopy.alternateTitle}
                </Text>
                <ConvenienceComboSuggestionStrip
                  combos={alternates}
                  accentColors={ACCENT_COLORS}
                  onPressCombo={openDetail}
                />
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                skipRotationOnFocusRef.current = true;
                navigateToConvenienceAll(router);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllButtonText}>
                {convenienceCombosCopy.viewAllCombos}
              </Text>
            </Pressable>
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
  sectionLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    color: '#3A2417',
  },
  featuredCard: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
    paddingBottom: ds.spacing.md,
    ...ds.shadow.card,
  },
  featuredBody: {
    paddingHorizontal: ds.spacing.cardInner,
    paddingTop: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kindBadgeHack: {
    backgroundColor: '#F5E6D0',
  },
  kindBadgeEasy: {
    backgroundColor: '#E8F0E8',
  },
  kindBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kindBadgeTextHack: {
    color: '#8B4513',
  },
  kindBadgeTextEasy: {
    color: '#3D6B4F',
  },
  featuredSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  whyLine: {
    ...ds.typography.body,
    fontSize: 15,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  reasonLine: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primaryDark,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    ...ds.typography.button,
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: ds.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    backgroundColor: ds.colors.canvas,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  alternateSection: {
    gap: ds.spacing.sm,
    marginBottom: 4,
  },
  viewAllButton: {
    marginTop: 4,
    borderRadius: ds.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primarySoft,
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
});
