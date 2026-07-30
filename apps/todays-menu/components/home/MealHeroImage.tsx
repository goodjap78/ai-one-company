import { memo, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import { MealImageView } from '../meal/MealImageView';
import type { RecipeImage } from '../../types/recipe';
import { HomeHeroFocalImage } from './HomeHeroFocalImage';

const IMAGE_FADE_MS = 180;

type Props = {
  image: RecipeImage;
  calm?: boolean;
  homeHero?: boolean;
  /** When set, only the food photo layer fades on change (home hero). */
  recipeId?: string;
};

const labels = getHankkiHomeDecisionMessages();

/**
 * Food-only hero. HANKKI mascot never appears here —
 * mascot (when official) lives left of the Home title only.
 */
export const MealHeroImage = memo(function MealHeroImage({
  image,
  calm = false,
  homeHero = false,
  recipeId,
}: Props) {
  const hasPhoto = Boolean(image.url || image.source);
  const [photoFailed, setPhotoFailed] = useState(false);
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const previousRecipeId = useRef<string | null>(null);

  useEffect(() => {
    setPhotoFailed(false);
  }, [recipeId, image.url, image.source]);

  useEffect(() => {
    if (!homeHero || !recipeId) return;

    if (previousRecipeId.current && previousRecipeId.current !== recipeId) {
      imageOpacity.setValue(0.4);
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: IMAGE_FADE_MS,
        useNativeDriver: true,
      }).start();
    }

    previousRecipeId.current = recipeId;
  }, [homeHero, recipeId, imageOpacity]);

  const photoLayer =
    homeHero && recipeId && hasPhoto && !photoFailed ? (
      <HomeHeroFocalImage
        image={image}
        recipeId={recipeId}
        style={styles.image}
        accessibilityLabel="오늘 메뉴 사진"
        useRemote={Boolean(image.url)}
        onError={() => setPhotoFailed(true)}
      />
    ) : (
      <MealImageView
        key={recipeId ? `hero-${recipeId}` : undefined}
        image={image}
        remountKey={recipeId}
        style={styles.image}
        accessibilityLabel={hasPhoto ? '오늘 메뉴 사진' : labels.imagePlaceholder}
        showEmojiFallback
        emojiFallbackLabel={hasPhoto ? undefined : labels.imagePlaceholder}
        emojiSize={homeHero ? 64 : 76}
      />
    );

  return (
    <View
      style={[
        styles.container,
        calm && styles.containerCalm,
        homeHero && styles.containerHomeHero,
      ]}
    >
      {homeHero && recipeId ? (
        <Animated.View style={[styles.imageFadeLayer, { opacity: imageOpacity }]}>
          {photoLayer}
        </Animated.View>
      ) : (
        photoLayer
      )}
      {homeHero && hasPhoto ? <View style={styles.warmWash} pointerEvents="none" /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    aspectRatio: 1.25,
    backgroundColor: '#FFE8D4',
    ...ds.shadow.card,
  },
  containerCalm: {
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  containerHomeHero: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    aspectRatio: undefined,
    borderRadius: 0,
    maxWidth: '100%',
  },
  imageFadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  warmWash: {
    ...StyleSheet.absoluteFillObject,
    /** Keep food bright — very light warm tint only */
    backgroundColor: 'rgba(255, 140, 60, 0.02)',
  },
});
