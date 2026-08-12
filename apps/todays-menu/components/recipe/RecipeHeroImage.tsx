import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import type { RecipeImage } from '../../types/recipe';
import { SeedMascot } from '../common/SeedMascot';
import { HomeHeroFocalImage } from '../home/HomeHeroFocalImage';
import { MealImageView } from '../meal/MealImageView';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  image: RecipeImage;
  recipeId: string;
  /** Dynamic Seed tip from recipe.recommendationMessages. */
  seedMessage?: string | null;
};

const labels = getHankkiRecipeMessages();

function useRecipeHeroHeight(): number {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const fromRatio = contentWidth / recipeRef.hero.aspectRatio;
  return Math.round(
    Math.min(recipeRef.hero.maxHeight, Math.max(recipeRef.hero.minHeight, fromRatio)),
  );
}

/**
 * Sprint R3-1 — master hero: meal photo + seed_recommend (~64) + cream tip.
 * Title stays above hero; no heart overlay; no dark fill; height unchanged.
 */
export function RecipeHeroImage({ image, recipeId, seedMessage }: Props) {
  const height = useRecipeHeroHeight();
  const hasPhoto = Boolean(image.url || image.source);
  const tip = seedMessage?.trim() ?? '';

  return (
    <View style={[styles.container, { height }]}>
      {hasPhoto ? (
        <HomeHeroFocalImage
          image={image}
          recipeId={recipeId}
          style={styles.imageFill}
          accessibilityLabel="메뉴 사진"
          useRemote={Boolean(image.url)}
        />
      ) : (
        <MealImageView
          image={image}
          style={[styles.image, { height }]}
          accessibilityLabel={labels.imagePlaceholder}
          showEmojiFallback
          emojiFallbackLabel={labels.imagePlaceholder}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(255, 248, 239, 0.1)', 'rgba(255, 248, 239, 0.26)']}
        locations={[0.62, 0.86, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {tip ? (
        <View
          style={styles.seedRow}
          accessibilityRole="text"
          accessibilityLabel={`한끼: ${tip}`}
          pointerEvents="none"
        >
          <SeedMascot variant="recommend" size={64} style={styles.seed} />
          <View style={styles.tipCard}>
            <Text style={styles.tipText} numberOfLines={2}>
              {tip}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...recipePremiumStyles.heroImage,
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  /** Same fill override as Home hero — keeps focal offset without 128% zoom crop. */
  imageFill: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  seedRow: {
    position: 'absolute',
    left: 6,
    right: 10,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    zIndex: 4,
  },
  seed: {
    marginBottom: -2,
    backgroundColor: 'transparent',
  },
  tipCard: {
    flex: 1,
    minWidth: 0,
    marginBottom: 6,
    backgroundColor: '#FFF8EF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 170, 120, 0.28)',
    shadowColor: '#A67C5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#3A2417',
  },
});
