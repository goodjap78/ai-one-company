import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  formatComboItemsPreview,
  formatComboKindLabel,
  formatEstimatedPriceRange,
  formatStoreScopeLabel,
  getPrimarySituationTag,
  situationTagToLabel,
  summarizeAssemblyGuide,
} from '../../services/convenience/convenienceComboCatalog';
import { FavoriteHeartButton } from '../favorites/FavoriteHeartButton';

const CARD_MIN_HEIGHT = 148;
const TITLE_LINES = 2;
const DESC_LINES = 2;
const ITEMS_LINES = 2;

type Props = {
  combo: ConvenienceCombo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onView: () => void;
  accentColor?: string;
};

export function ConvenienceComboCard({
  combo,
  isFavorite,
  onToggleFavorite,
  onView,
  accentColor = '#E8834A',
}: Props) {
  const situationTag = getPrimarySituationTag(combo);
  const situationLabel = situationTag ? situationTagToLabel(situationTag) : null;
  const { visible, extraCount } = formatComboItemsPreview(combo.items);
  const priceLabel = formatEstimatedPriceRange(combo.estimatedPriceRange);
  const prepLabel = convenienceCombosCopy.prepMinutes(combo.prepTimeMinutes);
  const metaLine = [priceLabel, prepLabel].filter(Boolean).join(' · ');
  const isHack = combo.comboKind === 'hack_combo';
  const kindLabel = formatComboKindLabel(combo.comboKind);
  const hasDistinctTransformation =
    isHack &&
    combo.transformationName &&
    combo.transformationName.trim() !== combo.title.trim();
  const displayTitle = hasDistinctTransformation
    ? combo.transformationName!
    : combo.title;
  const subtitle = hasDistinctTransformation ? combo.title : null;
  const highlightLine = isHack
    ? summarizeAssemblyGuide(combo.assemblyGuide, 2)
    : visible.join(' · ') + (extraCount > 0 ? ` ${convenienceCombosCopy.extraItems(extraCount)}` : '');
  const descriptionLine = isHack
    ? combo.whyItWorks
    : combo.whyItWorks;

  return (
    <View style={[styles.card, { minHeight: CARD_MIN_HEIGHT }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
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
                numberOfLines={1}
              >
                {kindLabel}
              </Text>
            </View>
            {situationLabel ? (
              <View style={styles.situationTag}>
                <Text style={styles.situationTagText} numberOfLines={1}>
                  {situationLabel}
                </Text>
              </View>
            ) : null}
            <Text style={styles.storeLabel} numberOfLines={1}>
              {formatStoreScopeLabel(combo.storeScope)}
            </Text>
          </View>
          <FavoriteHeartButton
            isFavorite={isFavorite}
            onPress={onToggleFavorite}
            size="sm"
          />
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={TITLE_LINES} ellipsizeMode="tail">
            {displayTitle}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.itemsArea}>
          <Text style={styles.itemsLabel} numberOfLines={1}>
            {isHack ? convenienceCombosCopy.assemblyHackHint : convenienceCombosCopy.assemblyEasyHint}
          </Text>
          <Text style={styles.itemsText} numberOfLines={ITEMS_LINES} ellipsizeMode="tail">
            {highlightLine}
          </Text>
        </View>

        {metaLine ? (
          <Text style={styles.metaLine} numberOfLines={1} ellipsizeMode="tail">
            {metaLine}
          </Text>
        ) : null}

        <View style={styles.descArea}>
          <Text style={styles.description} numberOfLines={DESC_LINES} ellipsizeMode="tail">
            {descriptionLine}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onView();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${combo.title}. ${convenienceCombosCopy.viewCombo}`}
        >
          <Text style={styles.viewButtonText}>{convenienceCombosCopy.viewCombo}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    overflow: 'hidden',
    width: '100%',
    ...ds.shadow.card,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 32,
  },
  tagRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  kindBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: '40%',
  },
  kindBadgeHack: {
    backgroundColor: '#F5E6D0',
  },
  kindBadgeEasy: {
    backgroundColor: '#E8F0E8',
  },
  kindBadgeText: {
    fontSize: 10,
    lineHeight: 13,
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: '36%',
  },
  situationTagText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: ds.colors.badgeText,
  },
  storeLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: ds.colors.textMuted,
    flexShrink: 1,
  },
  titleArea: {
    minHeight: 36,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#3A2417',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  itemsArea: {
    minHeight: 32,
    justifyContent: 'center',
    gap: 2,
  },
  itemsLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  itemsText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: ds.colors.warmText,
  },
  metaLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  descArea: {
    minHeight: 30,
    justifyContent: 'center',
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: ds.colors.warmText,
  },
  viewButton: {
    marginTop: 2,
    alignSelf: 'stretch',
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.button,
    minHeight: ds.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.md,
  },
  viewButtonPressed: {
    opacity: 0.9,
  },
  viewButtonText: {
    ...ds.typography.button,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
});
