/**
 * Optional key-step gallery (max 3).
 * Detail screen uses RecipeStepsList as the canonical step-image path to avoid
 * duplicate renders of the same registry assets. Keep this component for
 * non-detail surfaces that need a compact gallery without step text.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { CHILD_STEP_IMAGE_SPEC } from '../../constants/childRecipeImageSpecs';
import type { RecipeStep } from '../../types/recipe';
import { resolveStepImageSource } from '../../utils/resolveStepImageSource';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  steps: RecipeStep[];
};

/**
 * Prefer prep → core cook → finish when multiple images exist.
 * Only steps with a resolvable imageKey are shown (max 3).
 */
export function ChildStepImageSlots({ steps }: Props) {
  const withImages = steps
    .map((step) => ({
      step,
      source: resolveStepImageSource(step.imageKey),
    }))
    .filter((row) => row.source != null);

  // Prefer prep / core / finish spread when more than max slots are registered.
  const max = CHILD_STEP_IMAGE_SPEC.maxSlotsPerRecipe;
  const selected =
    withImages.length <= max
      ? withImages
      : [withImages[0]!, withImages[Math.floor((withImages.length - 1) / 2)]!, withImages[withImages.length - 1]!];

  // Dedupe identical imageKey (keep first order).
  const seen = new Set<string>();
  const unique = selected.filter((row) => {
    const key = row.step.imageKey ?? '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={recipePremiumStyles.sectionTitle}>핵심 조리 장면</Text>
      <View style={styles.row}>
        {unique.map(({ step, source }) => (
          <View key={step.order} style={styles.slot}>
            <Image
              source={source!}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel={`${step.order}단계 사진`}
            />
            <Text style={styles.caption} numberOfLines={2}>
              {step.guide?.trim() || `${step.order}단계`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    flex: 1,
    gap: 6,
  },
  image: {
    width: '100%',
    aspectRatio: CHILD_STEP_IMAGE_SPEC.aspectRatio,
    borderRadius: 12,
    backgroundColor: recipeRef.colors.pastelCard,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textWarm,
  },
});
