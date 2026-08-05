import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ds } from '../../constants/designSystem';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
import {
  buildMatchedSelectedSummary,
  buildUnusedSelectedHint,
} from '../../services/fridge/fridgeRecommendationIntelligence';
import type { FridgeRaidCandidate } from '../../services/fridge/fridgeRaidTypes';
import { appChrome } from '../ui/appChrome';

type Props = {
  candidate: FridgeRaidCandidate;
};

export function FridgeRaidMealCard({ candidate }: Props) {
  const router = useRouter();
  const hero = candidate.heroImage;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {hero.url ? (
          <Image
            source={{ uri: hero.url }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={hero.accessibilityLabel}
          />
        ) : hero.source ? (
          <Image
            source={hero.source}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={hero.accessibilityLabel}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.emoji}>{hero.emoji ?? '🍽️'}</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.stars}>{FRIDGE_RAID_COPY.starLabel(candidate.starRating)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {candidate.title}
          </Text>
          <Text style={styles.tierHint} numberOfLines={2}>
            {candidate.tierHint}
          </Text>
          <Text style={styles.meta}>
            {FRIDGE_RAID_COPY.cookTime(candidate.cookTime)} ·{' '}
            {FRIDGE_RAID_COPY.matchRate(candidate.matchPercent)}
          </Text>
          <Text style={styles.reason} numberOfLines={2}>
            {candidate.reason}
          </Text>
        </View>
      </View>

      {candidate.matchedSelectedIngredients.length > 0 ? (
        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientHeading}>{FRIDGE_RAID_COPY.matchedSelectedPrefix}</Text>
          <Text style={styles.ingredientList}>
            {buildMatchedSelectedSummary(candidate.matchedSelectedIngredients)} 활용
          </Text>
        </View>
      ) : null}

      {candidate.unusedSelectedIngredients.length > 0 ? (
        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientHeading}>{FRIDGE_RAID_COPY.unusedSelectedPrefix}</Text>
          <Text style={styles.unusedList}>
            {buildUnusedSelectedHint(candidate.unusedSelectedIngredients)}
          </Text>
        </View>
      ) : null}

      {candidate.matchedIngredients.length > 0 ? (
        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientHeading}>{FRIDGE_RAID_COPY.ownedPrefix}</Text>
          <Text style={styles.ingredientList}>{candidate.matchedIngredients.join(', ')}</Text>
        </View>
      ) : null}

      {candidate.missingIngredients.length > 0 ? (
        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientHeading}>{FRIDGE_RAID_COPY.missingPrefix}</Text>
          <Text style={styles.missingList}>{candidate.missingIngredients.join(', ')}</Text>
        </View>
      ) : (
        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientHeading}>{FRIDGE_RAID_COPY.missingPrefix}</Text>
          <Text style={styles.missingList}>없음</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [appChrome.secondaryButton, pressed && appChrome.pressed]}
        onPress={() => router.push(`/recipe/${candidate.recipeId}`)}
        accessibilityRole="button"
        accessibilityLabel={`${candidate.title} ${FRIDGE_RAID_COPY.detailCta}`}
      >
        <Text style={appChrome.secondaryButtonText}>{FRIDGE_RAID_COPY.detailCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...appChrome.card,
    gap: ds.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: ds.radius.card,
    backgroundColor: ds.colors.borderLight,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  stars: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
    fontWeight: '800',
  },
  title: {
    ...ds.typography.body,
    fontWeight: '800',
    color: ds.colors.textPrimary,
  },
  tierHint: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  meta: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  reason: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  ingredientBlock: {
    gap: 2,
  },
  ingredientHeading: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textPrimary,
  },
  ingredientList: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  missingList: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
    fontWeight: '600',
  },
  unusedList: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
});
