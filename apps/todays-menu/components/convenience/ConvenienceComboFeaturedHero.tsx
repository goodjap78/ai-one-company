import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import { FavoriteHeartButton } from '../favorites/FavoriteHeartButton';
import { HomeRecommendTip } from '../home/HomeRecommendTip';

export const CONVENIENCE_FEATURED_HERO_MIN_MOBILE = 220;
export const CONVENIENCE_FEATURED_HERO_MAX_MOBILE = 250;
export const CONVENIENCE_FEATURED_HERO_MAX_WEB = 280;

function resolveFeaturedHeroHeight(windowWidth: number): number {
  const maxHeight =
    Platform.OS === 'web' ? CONVENIENCE_FEATURED_HERO_MAX_WEB : CONVENIENCE_FEATURED_HERO_MAX_MOBILE;
  const minHeight =
    Platform.OS === 'web' ? CONVENIENCE_FEATURED_HERO_MIN_MOBILE : CONVENIENCE_FEATURED_HERO_MIN_MOBILE;
  const fromRatio = windowWidth * (9 / 16);
  return Math.round(Math.min(maxHeight, Math.max(minHeight, fromRatio)));
}

type Props = {
  heroImage: ImageSourcePropType | null;
  fallbackColor: string;
  title: string;
  guideMessage: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

/**
 * Home TodayMealCard hero pattern — badge, title, heart, Seed tip overlaid on food image.
 */
export function ConvenienceComboFeaturedHero({
  heroImage,
  fallbackColor,
  title,
  guideMessage,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const heroHeight = resolveFeaturedHeroHeight(windowWidth);
  const hasPhoto = Boolean(heroImage);
  const tip = guideMessage.trim();

  return (
    <View style={styles.heroShell}>
      <View style={[styles.heroFrame, { height: heroHeight }]}>
        {hasPhoto ? (
          <Image
            source={heroImage!}
            style={[styles.heroImage, { height: heroHeight }]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={title}
          />
        ) : (
          <View
            style={[
              styles.heroImage,
              styles.heroFallback,
              { height: heroHeight, backgroundColor: fallbackColor },
            ]}
          />
        )}

        <LinearGradient
          colors={
            hasPhoto
              ? [
                  'transparent',
                  'transparent',
                  'rgba(35, 20, 12, 0.22)',
                  'rgba(35, 20, 12, 0.34)',
                ]
              : [
                  'rgba(255, 248, 239, 0.08)',
                  'rgba(255, 248, 239, 0.2)',
                  'rgba(35, 20, 12, 0.18)',
                  'rgba(35, 20, 12, 0.32)',
                ]
          }
          locations={[0, 0.45, 0.78, 1]}
          style={styles.heroGradient}
          pointerEvents="none"
        />

        <View style={styles.heroTopOverlay} pointerEvents="none">
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {convenienceCombosCopy.todayRecommendationBadge}
            </Text>
          </View>
          <Text
            style={hasPhoto ? styles.heroTitleOnPhoto : styles.heroTitleOnFallback}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>

        {tip ? <HomeRecommendTip message={tip} maxLines={2} /> : null}
      </View>

      <View style={styles.heartOverlay} pointerEvents="box-none">
        <FavoriteHeartButton
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          variant="hero"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    width: '100%',
    position: 'relative',
  },
  heroFrame: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#F3E7DB',
  },
  heroImage: {
    width: '100%',
  },
  heroFallback: {
    opacity: 0.92,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  heroTopOverlay: {
    position: 'absolute',
    top: ds.spacing.cardInner,
    left: ds.spacing.cardInner,
    right: 56,
    gap: 8,
    zIndex: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 232, 210, 0.96)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#FF6A00',
    letterSpacing: -0.2,
  },
  heroTitleOnPhoto: {
    ...ds.typography.foodName,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroTitleOnFallback: {
    ...ds.typography.foodName,
    color: '#3A2417',
  },
  heartOverlay: {
    position: 'absolute',
    top: ds.spacing.cardInner,
    right: ds.spacing.cardInner,
    zIndex: 5,
  },
});
