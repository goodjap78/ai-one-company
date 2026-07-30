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

/**
 * Home hero food layer with consistent focal positioning.
 * Detail / thumb screens keep using plain MealImageView.
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

  return (
    <View style={styles.clip}>
      <Image
        key={`focal-${recipeId}-${useRemote ? 'url' : 'local'}`}
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
