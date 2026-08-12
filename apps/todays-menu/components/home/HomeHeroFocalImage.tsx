import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import type { RecipeImage } from '../../types/recipe';
import { computeHomeHeroImageLayout } from '../../utils/computeHomeHeroImageLayout';
import { resolveHomeHeroFocalPoint } from '../../utils/resolveHomeHeroFocalPoint';

type Props = {
  image: RecipeImage;
  recipeId: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel: string;
  onError?: () => void;
  useRemote?: boolean;
};

/** Align with MealImageView — remount when meal image identity changes on web. */
function resolveHomeHeroImageKey(
  recipeId: string,
  image: RecipeImage,
  useRemote: boolean,
): string {
  if (useRemote && image.url) return `${recipeId}:url:${image.url}`;
  if (image.source != null) return `${recipeId}:src:${String(image.source)}`;
  return `${recipeId}:emoji:${image.emoji ?? ''}`;
}

/**
 * Home + recipe detail hero food layer with consistent focal positioning.
 * Small cards use FocalMealImage with a lower focalScale.
 */
export function HomeHeroFocalImage({
  image,
  recipeId,
  style,
  accessibilityLabel,
  onError,
  useRemote = false,
}: Props) {
  const focal = resolveHomeHeroFocalPoint(recipeId);
  const layout = computeHomeHeroImageLayout(focal);

  const source = useRemote && image.url ? { uri: image.url } : image.source;
  if (!source) return null;

  const imageKey = resolveHomeHeroImageKey(recipeId, image, useRemote);

  return (
    <View style={styles.clip}>
      <Image
        key={`focal-${imageKey}`}
        source={source}
        style={[styles.image, layout, style]}
        resizeMode="cover"
        onError={onError}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});
