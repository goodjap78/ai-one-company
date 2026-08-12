import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { HOME_HERO_DISPLAY } from '../../constants/homeHeroDisplay';
import type { RecipeImage } from '../../types/recipe';
import { computeHomeHeroImageLayout } from '../../utils/computeHomeHeroImageLayout';
import { resolveHomeHeroFocalPoint } from '../../utils/resolveHomeHeroFocalPoint';

type Props = {
  image: RecipeImage;
  recipeId: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  onError?: () => void;
  useRemote?: boolean;
  /** Lower scale for small cards — less crop zoom. */
  focalScale?: number;
};

function resolveImageKey(
  recipeId: string,
  image: RecipeImage,
  useRemote: boolean,
): string {
  if (useRemote && image.url) return `${recipeId}:url:${image.url}`;
  if (image.source != null) return `${recipeId}:src:${String(image.source)}`;
  return `${recipeId}:emoji:${image.emoji ?? ''}`;
}

/**
 * Hero / card food photo with focal-point cover (same system as Home hero).
 * Prevents blur-only center crop on wide hero assets.
 */
export function FocalMealImage({
  image,
  recipeId,
  style,
  containerStyle,
  accessibilityLabel,
  onError,
  useRemote = false,
  focalScale = HOME_HERO_DISPLAY.focalScale,
}: Props) {
  const focal = resolveHomeHeroFocalPoint(recipeId);
  const layout = computeHomeHeroImageLayout(focal, focalScale);

  const source = useRemote && image.url ? { uri: image.url } : image.source;
  if (!source) return null;

  const imageKey = resolveImageKey(recipeId, image, useRemote);

  return (
    <View style={[styles.clip, containerStyle, style as StyleProp<ViewStyle>]}>
      <Image
        key={`focal-${imageKey}`}
        source={source}
        style={[styles.image, layout]}
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
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});
