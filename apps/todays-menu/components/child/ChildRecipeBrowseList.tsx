import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { childSearchCopy } from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';
import type { Recipe } from '../../data/recipes/types';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';

type Props = {
  recipes: Recipe[];
  cookTimeLabel: (minutes: number) => string;
  onPressRecipe: (recipeId: string) => void;
  allergyLine?: (labels: readonly string[]) => string;
  allergyLabels?: (tags: Recipe['standardMetadata']['allergyTags']) => string[];
};

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export function ChildRecipeBrowseList({
  recipes,
  cookTimeLabel,
  onPressRecipe,
  allergyLine,
  allergyLabels,
}: Props) {
  const keyExtractor = useCallback((recipe: Recipe) => recipe.id, []);

  const renderItem = useCallback(
    ({ item: recipe }: { item: Recipe }) => {
      const labels = allergyLabels?.(recipe.standardMetadata.allergyTags) ?? [];
      const allergyText = allergyLine?.(labels) ?? '';
      return (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => onPressRecipe(recipe.id)}
          accessibilityRole="button"
          accessibilityLabel={`${recipe.name}, ${recipe.time}분. 레시피 보기`}
        >
          <View style={styles.imageWrap}>
            <MealImageView
              image={resolveMealHeroImage(recipe.id, 'homemade')}
              variant="thumb"
              style={styles.image}
              containerStyle={styles.imageContainer}
              showEmojiFallback
              emojiSize={28}
              remountKey={recipe.id}
              accessibilityLabel={recipe.name}
            />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.menuName} numberOfLines={2}>
              {recipe.name}
            </Text>
            <Text style={styles.cookTime}>{cookTimeLabel(recipe.time)}</Text>
            {allergyText ? <Text style={styles.allergy}>{allergyText}</Text> : null}
          </View>
        </Pressable>
      );
    },
    [allergyLabels, allergyLine, cookTimeLabel, onPressRecipe],
  );

  if (recipes.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>{childSearchCopy.emptyTitle}</Text>
        <Text style={styles.emptyHint}>{childSearchCopy.emptyHint}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
      scrollEnabled={false}
      nestedScrollEnabled
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: ds.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    gap: ds.spacing.md,
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    padding: ds.spacing.md,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: 80,
    height: 80,
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
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  menuName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: ds.colors.textPrimary,
  },
  cookTime: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  allergy: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    gap: ds.spacing.sm,
    paddingVertical: ds.spacing.lg,
  },
  emptyTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  emptyHint: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
});
