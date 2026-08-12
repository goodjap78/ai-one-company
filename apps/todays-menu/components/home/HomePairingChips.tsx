import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import type { MealExperiencePairing } from '../../types/mealExperience';
import { getLocalMealImageSource } from '../../services/images/mealImageAssets';
import { GOLD_MEAL_IMAGE_REGISTRY } from '../../services/images/mealImageRegistry';
import type { MealLocalAssetKey } from '../../services/images/mealImageTypes';
import { getHomePairingEmoji } from '../../utils/pairingEmoji';
import { homePremiumStyles } from './homePremiumStyles';

const MAX_PAIRINGS = 3;
const labels = getHankkiHomeDecisionMessages();
const PASTELS = ds.colors.chipPastel;

const PAIRING_THUMB_BY_NAME: { match: RegExp; key: MealLocalAssetKey }[] = [
  { match: /비빔/, key: 'gold_kr_bibimbap' },
  { match: /김치찌개/, key: 'gold_kr_kimchi_jjigae' },
  { match: /제육/, key: 'gold_kr_jeyuk_bokkeum' },
  { match: /삼겹/, key: 'gold_kr_samgyeopsal' },
  { match: /짜파게티|짜파/, key: 'gold_kr_jjapaghetti' },
];

type Props = {
  pairings: MealExperiencePairing[];
};

function resolvePairingThumb(pairing: MealExperiencePairing) {
  if (pairing.menuId) {
    const entry = GOLD_MEAL_IMAGE_REGISTRY[pairing.menuId];
    if (entry?.localAssetKey && entry.localAssetKey !== 'hankki-default') {
      return getLocalMealImageSource(entry.localAssetKey);
    }
  }

  for (const rule of PAIRING_THUMB_BY_NAME) {
    if (rule.match.test(pairing.name)) {
      return getLocalMealImageSource(rule.key);
    }
  }

  return null;
}

export const HomePairingChips = memo(function HomePairingChips({ pairings }: Props) {
  const visible = pairings.slice(0, MAX_PAIRINGS);
  if (visible.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={homePremiumStyles.pairingHeader}>
        <Text style={homePremiumStyles.pairingTitle}>{labels.pairingsSectionLabel}</Text>
        <Text style={homePremiumStyles.pairingMore}>{labels.pairingsMoreLabel}</Text>
      </View>
      <View style={homePremiumStyles.pairingChipRow} accessibilityRole="text">
        {visible.map((pairing, index) => {
          const emoji = getHomePairingEmoji(pairing.name);
          const pastel = PASTELS[index % PASTELS.length];
          const thumb = resolvePairingThumb(pairing);

          return (
            <View
              key={pairing.menuId ?? pairing.name}
              style={[homePremiumStyles.pairingChip, { backgroundColor: pastel }]}
            >
              <View style={homePremiumStyles.pairingChipContent}>
                <View style={homePremiumStyles.pairingThumb}>
                  {thumb ? (
                    <Image
                      source={thumb}
                      style={homePremiumStyles.pairingThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={homePremiumStyles.pairingChipEmoji}>{emoji ?? '🍽️'}</Text>
                  )}
                </View>
                <Text style={homePremiumStyles.pairingChipText} numberOfLines={1}>
                  {pairing.name}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    gap: ds.spacing.cardInner,
    width: '100%',
  },
});
