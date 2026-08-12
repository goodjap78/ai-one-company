import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { RecommendationAlternative } from '../../types/mealIntelligenceEngine';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { FocalMealImage } from '../meal/FocalMealImage';
import { MealImageView } from '../meal/MealImageView';

type Props = {
  alternatives: RecommendationAlternative[];
  selectedId: string;
  disabled?: boolean;
  onSelect: (recipeId: string) => void;
};

const labels = getHankkiHomeDecisionMessages();
/** Equal gap between 3 columns — keep modest so 360dp fits titles. */
const COL_GAP = 8;
/** Wide food photo — card width × aspect (not circular thumb). */
const ALT_IMAGE_ASPECT = 1.05;

/** Sprint 61-D / Android polish — 3 equal columns, no edge clipping. */
export const AlternativeMealsRow = memo(function AlternativeMealsRow({
  alternatives,
  selectedId,
  disabled = false,
  onSelect,
}: Props) {
  const visible = alternatives.filter((alt) => alt.recipe.id !== selectedId).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{labels.alternativesSectionLabel}</Text>
      <View style={styles.row}>
        {visible.map((alt) => (
          <AlternativeColumn
            key={alt.recipe.id}
            alt={alt}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
});

type ItemProps = {
  alt: RecommendationAlternative;
  disabled: boolean;
  onSelect: (recipeId: string) => void;
};

function AlternativeColumn({ alt, disabled, onSelect }: ItemProps) {
  const heroImage = useMemo(
    () => resolveMealHeroImage(alt.recipe.id, 'homemade', null),
    [alt.recipe.id],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.col,
        pressed && !disabled && styles.colPressed,
        disabled && styles.colDisabled,
      ]}
      onPress={() => onSelect(alt.recipe.id)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${alt.recipe.title}, ${alt.recipe.cookingTimeMinutes}분`}
    >
      <View style={styles.imageWrap}>
        {heroImage.url || heroImage.source ? (
          <FocalMealImage
            image={heroImage}
            recipeId={alt.recipe.id}
            containerStyle={styles.imageFill}
            accessibilityLabel={alt.recipe.title}
            useRemote={Boolean(heroImage.url)}
            focalScale={1.22}
          />
        ) : (
          <MealImageView
            image={heroImage}
            variant="thumb"
            showEmojiFallback
            remountKey={alt.recipe.id}
            containerStyle={styles.imageFill}
            style={styles.imageFill}
          />
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {alt.recipe.title}
        </Text>
        <Text style={styles.meta}>{alt.recipe.cookingTimeMinutes}분</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  label: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    gap: COL_GAP,
    // Do not clip the third column on Android (maxWidth% + gap overflow).
  },
  col: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  colPressed: {
    backgroundColor: theme.colors.backgroundCream,
    borderColor: theme.colors.primary,
  },
  colDisabled: {
    opacity: 0.55,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: ALT_IMAGE_ASPECT,
    backgroundColor: theme.colors.primarySoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  textBlock: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 2,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.metaText,
    color: theme.colors.textPrimary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  meta: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
