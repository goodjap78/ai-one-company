import { useEffect, useState } from 'react';
import {
  Image,
  type ImageStyle,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../constants/theme';
import type { RecipeImage } from '../../types/recipe';

type Props = {
  image: RecipeImage;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  variant?: 'hero' | 'thumb';
  showEmojiFallback?: boolean;
  emojiFallbackLabel?: string;
  emojiSize?: number;
  /** Remount Image when meal identity changes (fixes stale local assets on refresh). */
  remountKey?: string;
};

/**
 * remote URL → this recipe's local photo → clean emoji placeholder.
 * Never falls back to another recipe's food image.
 *
 * For hero food focal positioning use FocalMealImage + recipeId instead.
 */
function resolveImageIdentity(remountKey: string | undefined, image: RecipeImage): string {
  if (remountKey) return remountKey;
  if (image.url) return `url:${image.url}`;
  if (image.source != null) return `src:${String(image.source)}`;
  return `emoji:${image.emoji}`;
}

export function MealImageView({
  image,
  style,
  containerStyle,
  accessibilityLabel,
  variant = 'hero',
  showEmojiFallback = false,
  emojiFallbackLabel,
  emojiSize,
  remountKey,
}: Props) {
  const imageIdentity = resolveImageIdentity(remountKey, image);
  const [tier, setTier] = useState(() => initialTier(image));
  const resolvedEmojiSize = emojiSize ?? (variant === 'thumb' ? 36 : 72);
  const photoStyle = [containerStyle, style] as StyleProp<ImageStyle>;

  useEffect(() => {
    setTier(initialTier(image));
  }, [imageIdentity, image.url, image.source, image.emoji]);

  const label = accessibilityLabel ?? image.accessibilityLabel ?? '메뉴 이미지';

  if (tier === 0 && image.url) {
    return (
      <Image
        key={imageIdentity}
        source={{ uri: image.url }}
        style={photoStyle}
        resizeMode="cover"
        onError={() => setTier(1)}
        accessibilityRole="image"
        accessibilityLabel={label}
      />
    );
  }

  if (tier <= 1 && image.source) {
    return (
      <Image
        key={imageIdentity}
        source={image.source}
        style={photoStyle}
        resizeMode="cover"
        onError={() => setTier(3)}
        accessibilityRole="image"
        accessibilityLabel={label}
      />
    );
  }

  if (!showEmojiFallback) {
    return <View style={[style, containerStyle, styles.emptyFallback]} />;
  }

  if (variant === 'thumb') {
    return (
      <View style={[styles.thumbFallback, containerStyle]}>
        <Text style={[styles.emoji, { fontSize: resolvedEmojiSize }]}>{image.emoji || '🍽️'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.emojiFallback, style, containerStyle]} accessibilityLabel={label}>
      <Text style={[styles.emoji, { fontSize: resolvedEmojiSize }]}>{image.emoji || '🍽️'}</Text>
      {emojiFallbackLabel ? <Text style={styles.emojiLabel}>{emojiFallbackLabel}</Text> : null}
    </View>
  );
}

function initialTier(image: RecipeImage): number {
  if (image.url) return 0;
  if (image.source) return 1;
  return 3;
}

const styles = StyleSheet.create({
  emptyFallback: {
    backgroundColor: theme.colors.primarySoft,
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E4',
  },
  emojiFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FFE8D4',
  },
  emoji: {
    fontSize: 72,
  },
  emojiLabel: {
    ...theme.typography.metaText,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
