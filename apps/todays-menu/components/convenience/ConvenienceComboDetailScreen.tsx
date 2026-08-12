import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import { NAV_BACK } from '../../constants/navigationCopy';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  findSimilarConvenienceCombos,
  formatComboKindLabel,
  formatEstimatedPriceRange,
  getConvenienceComboById,
  resolveAvailabilityDisclaimer,
} from '../../services/convenience/convenienceComboCatalog';
import {
  getConvenienceFavoriteIds,
  toggleConvenienceFavorite,
} from '../../services/convenience/convenienceFavoritesStorage';
import { resolveConvenienceComboImage } from '../../services/images/resolveConvenienceComboImage';
import { APP_HOME_HREF } from '../../constants/appRoutes';
import {
  navigateToConvenienceAll,
  navigateToConvenienceDetailFromDetail,
  navigateToConvenienceRecommendation,
} from '../../services/convenience/convenienceComboNavigation';
import { SeedMascot } from '../common/SeedMascot';
import { FavoriteHeartButton } from '../favorites/FavoriteHeartButton';
import { ScreenReplaceNavButton } from '../ui/ScreenReplaceNavButton';
import { screenLayout } from '../ui/screenLayout';
import { ConvenienceComboSuggestionStrip } from './ConvenienceComboSuggestionStrip';
import { ConvenienceComboItemCards } from './ConvenienceComboItemCards';

const SUMMARY_THUMB_SIZE = 96;
const FALLBACK_ACCENT = '#E8834A';

function splitComboPoints(text: string, max = 3): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const bySentence = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (bySentence.length >= 2) return bySentence.slice(0, max);
  return [trimmed];
}

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

  if (!combo) {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <View style={screenLayout.page}>
          <View style={screenLayout.frame}>
            <ScreenReplaceNavButton
              href={APP_HOME_HREF}
              label={NAV_BACK.home}
              accessibilityLabel="홈으로"
            />
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{convenienceCombosCopy.notFound}</Text>
              <Text style={styles.emptyHint}>{convenienceCombosCopy.notFoundHint}</Text>
              <Pressable
                style={styles.backListButton}
                onPress={() => navigateToConvenienceRecommendation(router)}
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
      similar={similar}
      onToggleFavorite={handleToggleFavorite}
      onOpenCombo={(id) => navigateToConvenienceDetailFromDetail(router, id)}
      onViewAll={() => navigateToConvenienceAll(router)}
      onAnotherRecommendation={() => navigateToConvenienceRecommendation(router)}
    />
  );
}

function ComboDetailContent({
  combo,
  isFavorite,
  similar,
  onToggleFavorite,
  onOpenCombo,
  onViewAll,
  onAnotherRecommendation,
}: {
  combo: ConvenienceCombo;
  isFavorite: boolean;
  similar: ConvenienceCombo[];
  onToggleFavorite: () => void;
  onOpenCombo: (id: string) => void;
  onViewAll: () => void;
  onAnotherRecommendation: () => void;
}) {
  const isHack = combo.comboKind === 'hack_combo';
  const kindLabel = formatComboKindLabel(combo.comboKind);
  const priceLabel = formatEstimatedPriceRange(combo.estimatedPriceRange);
  const prepLabel = convenienceCombosCopy.prepMinutes(combo.prepTimeMinutes);
  const disclaimer = resolveAvailabilityDisclaimer(combo);
  const hasDistinctTransformation =
    isHack &&
    combo.transformationName &&
    combo.transformationName.trim() !== combo.title.trim();
  const displayTitle = hasDistinctTransformation ? combo.transformationName! : combo.title;
  const heroImage = resolveConvenienceComboImage(combo);
  const comboPoints = splitComboPoints(combo.whyItWorks, 3);
  const guideSteps = combo.assemblyGuide.slice(0, 3);
  const guideMessage = convenienceCombosCopy.detailGuideMessage;

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={screenLayout.frame}>
            <ScreenReplaceNavButton
              href={APP_HOME_HREF}
              label={NAV_BACK.home}
              accessibilityLabel="홈으로"
            />

            <View style={styles.summaryCard}>
              {heroImage ? (
                <Image
                  source={heroImage}
                  style={styles.summaryThumb}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  style={[
                    styles.summaryThumb,
                    styles.summaryThumbFallback,
                    { backgroundColor: FALLBACK_ACCENT },
                  ]}
                />
              )}

              <View style={styles.summaryBody}>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {displayTitle}
                </Text>
                {hasDistinctTransformation ? (
                  <Text style={styles.summarySubtitle} numberOfLines={1}>
                    {combo.title}
                  </Text>
                ) : null}
                <View style={styles.summaryMeta}>
                  {priceLabel ? (
                    <Text style={styles.summaryMetaText} numberOfLines={1}>
                      {priceLabel}
                    </Text>
                  ) : null}
                  <Text style={styles.summaryMetaText} numberOfLines={1}>
                    {convenienceCombosCopy.prepTime}: {prepLabel}
                  </Text>
                </View>
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
              </View>

              <FavoriteHeartButton isFavorite={isFavorite} onPress={onToggleFavorite} />
            </View>

            <View
              style={styles.guideRow}
              accessibilityRole="text"
              accessibilityLabel={`한끼: ${guideMessage}`}
            >
              <SeedMascot variant="recommend" size={48} style={styles.guideSeed} />
              <View style={styles.guideBubble}>
                <Text style={styles.guideBubbleText} numberOfLines={2}>
                  {guideMessage}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {convenienceCombosCopy.componentsTitle}
              </Text>
              <ConvenienceComboItemCards items={combo.items} />
            </View>

            {comboPoints.length > 0 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {convenienceCombosCopy.comboPointsTitle}
                </Text>
                {comboPoints.map((point) => (
                  <View key={point} style={styles.checkRow}>
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkIconText}>✓</Text>
                    </View>
                    <Text style={styles.checkText}>{point}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {guideSteps.length > 0 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {convenienceCombosCopy.howToMakeTitle}
                </Text>
                {guideSteps.map((step, index) => (
                  <View key={`${index}-${step}`} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText} numberOfLines={2}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{disclaimer}</Text>
            </View>

            <View style={styles.actionBlock}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={onViewAll}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  {convenienceCombosCopy.viewAllCombos}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onAnotherRecommendation}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  {convenienceCombosCopy.anotherRecommendationDetail}
                </Text>
              </Pressable>
            </View>

            {similar.length > 0 ? (
              <View style={styles.similarSection}>
                <Text style={styles.sectionTitle}>{convenienceCombosCopy.similarTitle}</Text>
                <ConvenienceComboSuggestionStrip
                  combos={similar}
                  onPressCombo={onOpenCombo}
                />
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    ...ds.shadow.card,
  },
  summaryThumb: {
    width: SUMMARY_THUMB_SIZE,
    height: SUMMARY_THUMB_SIZE,
    borderRadius: ds.radius.chip,
    backgroundColor: '#F3E7DB',
  },
  summaryThumbFallback: {
    opacity: 0.9,
  },
  summaryBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#3A2417',
  },
  summarySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  summaryMeta: {
    gap: 2,
  },
  summaryMetaText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: ds.colors.textSecondary,
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
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideSeed: {
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  guideBubble: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFF6EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: ds.spacing.cardInner,
  },
  guideBubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3A2417',
  },
  sectionCard: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
    gap: ds.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    ...ds.shadow.card,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: '#3A2417',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ds.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: ds.colors.warmText,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: ds.colors.warmText,
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
  actionBlock: {
    gap: ds.spacing.sm,
    marginTop: ds.spacing.xs,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
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
    backgroundColor: ds.colors.card,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  similarSection: {
    gap: ds.spacing.sm,
    marginTop: ds.spacing.md,
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
