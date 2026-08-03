import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  findSimilarConvenienceCombos,
  formatComboKindLabel,
  formatEstimatedPriceRange,
  formatStoreScopeLabel,
  getConvenienceComboById,
  getPrimarySituationTag,
  resolveAvailabilityDisclaimer,
  situationTagToLabel,
} from '../../services/convenience/convenienceComboCatalog';
import {
  getConvenienceFavoriteIds,
  toggleConvenienceFavorite,
} from '../../services/convenience/convenienceFavoritesStorage';
import { FavoriteHeartButton } from '../favorites/FavoriteHeartButton';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { screenLayout } from '../ui/screenLayout';
import { ConvenienceComboCard } from './ConvenienceComboCard';

export function ConvenienceComboDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const comboId = typeof params.id === 'string' ? params.id : '';
  const combo = getConvenienceComboById(comboId);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const loadFavoriteState = useCallback(async () => {
    if (!combo) return;
    const ids = await getConvenienceFavoriteIds();
    setFavoriteIds(new Set(ids));
    setIsFavorite(ids.includes(combo.id));
  }, [combo]);

  useEffect(() => {
    void loadFavoriteState();
  }, [loadFavoriteState]);

  const similar = useMemo(
    () => (combo ? findSimilarConvenienceCombos(combo, 3) : []),
    [combo],
  );

  const handleToggleFavorite = async () => {
    if (!combo) return;
    const ok = await toggleConvenienceFavorite(combo.id);
    if (!ok) {
      Alert.alert(convenienceCombosCopy.favoriteSaveFailed);
      return;
    }
    await loadFavoriteState();
  };

  const handleToggleSimilarFavorite = async (comboId: string) => {
    const ok = await toggleConvenienceFavorite(comboId);
    if (!ok) {
      Alert.alert(convenienceCombosCopy.favoriteSaveFailed);
      return;
    }
    await loadFavoriteState();
  };

  if (!combo) {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <View style={screenLayout.page}>
          <View style={screenLayout.frame}>
            <ScreenBackButton
              label={convenienceCombosCopy.title}
              fallbackHref="/convenience-combos"
            />
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{convenienceCombosCopy.notFound}</Text>
              <Text style={styles.emptyHint}>{convenienceCombosCopy.notFoundHint}</Text>
              <Pressable
                style={styles.backListButton}
                onPress={() => router.replace('/convenience-combos')}
              >
                <Text style={styles.backListButtonText}>{convenienceCombosCopy.title}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ComboDetailContent
      combo={combo}
      isFavorite={isFavorite}
      favoriteIds={favoriteIds}
      similar={similar}
      onToggleFavorite={handleToggleFavorite}
      onToggleSimilarFavorite={handleToggleSimilarFavorite}
      onOpenCombo={(id) =>
        router.push({ pathname: '/convenience-combos/[id]', params: { id } })
      }
    />
  );
}

function ComboDetailContent({
  combo,
  isFavorite,
  favoriteIds,
  similar,
  onToggleFavorite,
  onToggleSimilarFavorite,
  onOpenCombo,
}: {
  combo: ConvenienceCombo;
  isFavorite: boolean;
  favoriteIds: Set<string>;
  similar: ConvenienceCombo[];
  onToggleFavorite: () => void;
  onToggleSimilarFavorite: (comboId: string) => void;
  onOpenCombo: (id: string) => void;
}) {
  const situationTag = getPrimarySituationTag(combo);
  const situationLabel = situationTag ? situationTagToLabel(situationTag) : null;
  const priceLabel = formatEstimatedPriceRange(combo.estimatedPriceRange);
  const guideSteps = combo.assemblyGuide.slice(0, 3);
  const isHack = combo.comboKind === 'hack_combo';
  const kindLabel = formatComboKindLabel(combo.comboKind);
  const disclaimer = resolveAvailabilityDisclaimer(combo);
  const hasDistinctTransformation =
    isHack &&
    combo.transformationName &&
    combo.transformationName.trim() !== combo.title.trim();

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={screenLayout.frame}>
            <View style={styles.navRow}>
              <ScreenBackButton
                label={convenienceCombosCopy.title}
                fallbackHref="/convenience-combos"
              />
              <FavoriteHeartButton isFavorite={isFavorite} onPress={onToggleFavorite} />
            </View>

            <View style={styles.hero}>
              <View style={styles.tagRow}>
                <View
                  style={[
                    styles.kindBadge,
                    isHack ? styles.kindBadgeHack : styles.kindBadgeEasy,
                  ]}
                >
                  <Text
                    style={[
                      styles.kindBadgeText,
                      isHack ? styles.kindBadgeTextHack : styles.kindBadgeTextEasy,
                    ]}
                  >
                    {kindLabel}
                  </Text>
                </View>
                {situationLabel ? (
                  <View style={styles.situationTag}>
                    <Text style={styles.situationTagText}>{situationLabel}</Text>
                  </View>
                ) : null}
                <Text style={styles.storeLabel}>
                  {formatStoreScopeLabel(combo.storeScope)}
                </Text>
              </View>
              <Text style={styles.title} accessibilityRole="header">
                {combo.title}
              </Text>
              {hasDistinctTransformation ? (
                <View style={styles.transformationBox}>
                  <Text style={styles.transformationLabel}>
                    {convenienceCombosCopy.transformationTitle}
                  </Text>
                  <Text style={styles.transformationName}>{combo.transformationName}</Text>
                </View>
              ) : null}
              <Text style={styles.description}>{combo.description}</Text>
              <Text style={styles.favoriteHint}>
                {isFavorite ? convenienceCombosCopy.saved : convenienceCombosCopy.favorites}
              </Text>
            </View>

            <View style={styles.metaCard}>
              {priceLabel ? (
                <Text style={styles.metaLine}>
                  {convenienceCombosCopy.estimatedPrice}: {priceLabel}
                </Text>
              ) : null}
              <Text style={styles.metaLine}>
                {convenienceCombosCopy.prepTime}:{' '}
                {convenienceCombosCopy.prepMinutes(combo.prepTimeMinutes)}
              </Text>
              <Text style={styles.metaLine}>
                {convenienceCombosCopy.difficulty}: {combo.difficulty}
              </Text>
              {combo.calories != null ? (
                <Text style={styles.metaLine}>
                  {convenienceCombosCopy.calories}: {combo.calories}{' '}
                  {convenienceCombosCopy.caloriesUnit}
                </Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isHack
                  ? convenienceCombosCopy.whyItWorksTitle
                  : convenienceCombosCopy.whyPairingTitle}
              </Text>
              <Text style={styles.bodyText}>{combo.whyItWorks}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isHack
                  ? convenienceCombosCopy.assemblyHackHint
                  : convenienceCombosCopy.assemblyEasyHint}
              </Text>
              {combo.items.map((item) => (
                <Text key={item.name} style={styles.itemLine}>· {item.name}</Text>
              ))}
            </View>

            {!isHack && situationLabel ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {convenienceCombosCopy.recommendedSituationTitle}
                </Text>
                <Text style={styles.bodyText}>{situationLabel}</Text>
              </View>
            ) : null}

            {isHack && guideSteps.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{convenienceCombosCopy.assemblyTitle}</Text>
                {guideSteps.map((step, index) => (
                  <Text key={`${index}-${step}`} style={styles.guideStep}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{disclaimer}</Text>
            </View>

            {similar.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{convenienceCombosCopy.similarTitle}</Text>
                <View style={styles.similarList}>
                  {similar.map((item) => (
                    <ConvenienceComboCard
                      key={item.id}
                      combo={item}
                      isFavorite={favoriteIds.has(item.id)}
                      onToggleFavorite={() => onToggleSimilarFavorite(item.id)}
                      onView={() => onOpenCombo(item.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ds.spacing.sm,
  },
  hero: {
    gap: ds.spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kindBadge: {
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
  situationTag: {
    backgroundColor: ds.colors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  situationTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ds.colors.badgeText,
  },
  storeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ds.colors.textMuted,
  },
  title: {
    ...ds.typography.foodName,
    color: '#3A2417',
  },
  transformationBox: {
    backgroundColor: ds.colors.honeyTipBg,
    borderRadius: ds.radius.card,
    padding: ds.spacing.sm,
    gap: 4,
  },
  transformationLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  transformationName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#3A2417',
  },
  description: {
    ...ds.typography.body,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  favoriteHint: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  metaCard: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    ...ds.shadow.card,
  },
  metaLine: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  section: {
    gap: ds.spacing.sm,
  },
  sectionTitle: {
    ...ds.typography.body,
    fontSize: 17,
    fontWeight: '800',
    color: '#3A2417',
  },
  bodyText: {
    ...ds.typography.body,
    fontSize: 15,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  itemLine: {
    ...ds.typography.body,
    fontSize: 15,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  guideStep: {
    ...ds.typography.body,
    fontSize: 15,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  noteBox: {
    backgroundColor: ds.colors.honeyTipBg,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
  },
  noteText: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
    lineHeight: 18,
  },
  similarList: {
    gap: ds.spacing.cardInner,
  },
  emptyBox: {
    gap: ds.spacing.md,
    paddingVertical: ds.spacing.lg,
  },
  emptyTitle: {
    ...ds.typography.sectionTitle,
    color: '#3A2417',
  },
  emptyHint: {
    ...ds.typography.body,
    color: ds.colors.warmText,
  },
  backListButton: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.button,
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: 12,
  },
  backListButtonText: {
    ...ds.typography.button,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
