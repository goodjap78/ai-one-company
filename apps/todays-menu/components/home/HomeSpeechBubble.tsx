import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { HankkiSpeechCardCopy } from '../../constants/hankkiSpeechTemplates';
import { ds } from '../../constants/designSystem';

type Props = {
  copy: HankkiSpeechCardCopy;
};

const SEED_WAVE = require('../../assets/seed/seed_wave.png');
const SEED_SIZE = 36;

/**
 * Compact Seed recommendation card below the food hero (H2-5).
 * Only place Seed appears on Home.
 */
export const HomeSpeechBubble = memo(function HomeSpeechBubble({ copy }: Props) {
  const line1 = copy.line1.trim();
  const line2 = copy.line2.trim();
  if (!line1 && !line2) return null;

  const a11y = [line1, line2].filter(Boolean).join(' ');

  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`한끼: ${a11y}`}>
      <Image
        source={SEED_WAVE}
        style={styles.seed}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityRole="image"
        accessibilityLabel="Seed"
      />
      <View style={styles.textCol}>
        {line1 ? (
          <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
            {line1}
          </Text>
        ) : null}
        {line2 ? (
          <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
            {line2}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: '100%',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFF6EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
  },
  seed: {
    width: SEED_SIZE,
    height: SEED_SIZE,
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  text: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#3A2417',
  },
});
