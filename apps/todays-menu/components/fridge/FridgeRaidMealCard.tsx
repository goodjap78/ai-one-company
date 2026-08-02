import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ds } from '../../constants/designSystem';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
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
          <Text style={styles.title} numberOfLines={2}>
            {candidate.title}
          </Text>
          <Text style={styles.meta}>
            {FRIDGE_RAID_COPY.cookTime(candidate.cookTime)} ·{' '}
            {FRIDGE_RAID_COPY.matchRate(candidate.matchPercent)}
          </Text>
          <Text style={styles.reason} numberOfLines={2}>
            {candidate.reason}
          </Text>
          {candidate.ownedMainNames.length > 0 ? (
            <Text style={styles.owned} numberOfLines={2}>
              {FRIDGE_RAID_COPY.ownedLabel}: {candidate.ownedMainNames.join(', ')}
            </Text>
          ) : null}
          {candidate.missingMainNames.length > 0 ? (
            <Text style={styles.missing} numberOfLines={2}>
              {FRIDGE_RAID_COPY.missingLabel}: {candidate.missingMainNames.join(', ')}
            </Text>
          ) : null}
        </View>
      </View>

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
  title: {
    ...ds.typography.body,
    fontWeight: '800',
    color: ds.colors.textPrimary,
  },
  meta: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  reason: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '600',
  },
  owned: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  missing: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
  },
});
