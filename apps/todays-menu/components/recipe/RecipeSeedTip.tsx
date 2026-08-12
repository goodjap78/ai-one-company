import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SeedMascot } from '../common/SeedMascot';
import { recipeRef } from './recipePremiumStyles';

type Props = {
  message: string;
};

/**
 * Sprint R1 — Seed recommendation cream card (mascot left, text right, no bubble tail).
 */
export const RecipeSeedTip = memo(function RecipeSeedTip({ message }: Props) {
  const text = message.trim();
  if (!text) return null;

  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`한끼: ${text}`}>
      <SeedMascot variant="recommend" size={40} style={styles.seed} />
      <Text style={styles.text} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: recipeRef.colors.creamTip,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: recipeRef.colors.tipBorder,
    shadowColor: '#A67C5B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  seed: {
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
});
