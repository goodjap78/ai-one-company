import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import type { MealExperiencePairing } from '../../types/mealExperience';
import { getPairingEmoji } from '../../utils/pairingEmoji';

type Props = {
  pairings: MealExperiencePairing[];
  label?: string;
};

const defaultLabel = getHankkiHomeDecisionMessages().pairingsSectionLabel;

export const SuggestedPairingsRow = memo(function SuggestedPairingsRow({
  pairings,
  label = defaultLabel,
}: Props) {
  if (pairings.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🍽 {label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {pairings.map((pairing, index) => (
          <View
            key={pairing.menuId ?? pairing.name}
            style={[
              styles.chip,
              { backgroundColor: ds.colors.chipPastel[index % ds.colors.chipPastel.length] },
            ]}
          >
            <Text style={styles.chipEmoji}>{getPairingEmoji(pairing.name)}</Text>
            <Text style={styles.chipText}>{pairing.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: ds.spacing.md,
  },
  label: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: ds.spacing.md,
    paddingRight: ds.spacing.screen,
  },
  chip: {
    height: ds.sizes.chipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: ds.radius.chip,
    paddingHorizontal: ds.spacing.md,
  },
  chipEmoji: {
    fontSize: 15,
    lineHeight: 20,
  },
  chipText: {
    ...ds.typography.caption,
    color: ds.colors.textPrimary,
    fontWeight: '600',
  },
});
