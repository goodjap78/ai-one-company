import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';
import type { FavoriteCardData } from '../../services/favorite';
import { MealImageView } from '../meal/MealImageView';
import { FavoriteHeartButton } from './FavoriteHeartButton';

type Props = {
  item: FavoriteCardData;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function RecipeCard({ item, isFavorite, onPress, onToggleFavorite }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.cardBody, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} 레시피 보기`}
      >
        <View style={styles.imageWrap}>
          <MealImageView
            image={item.image}
            variant="thumb"
            style={styles.image}
            containerStyle={styles.imageContainer}
            showEmojiFallback
            emojiFallbackLabel={item.title}
            emojiSize={28}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </Pressable>

      <View style={styles.heartWrap}>
        <FavoriteHeartButton isFavorite={isFavorite} onPress={onToggleFavorite} size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    ...ds.shadow.card,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing.md,
    gap: ds.spacing.md,
    paddingRight: ds.spacing.xl + ds.spacing.md,
  },
  pressed: theme.interaction.pressed,
  heartWrap: {
    position: 'absolute',
    top: ds.spacing.md,
    right: ds.spacing.md,
  },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.image,
    overflow: 'hidden',
    backgroundColor: ds.colors.primarySoft,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    ...ds.typography.foodName,
    color: ds.colors.textPrimary,
  },
});
