import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  message: string;
  /** Home uses 1 line; convenience hero overlay may use 2 on narrow screens. */
  maxLines?: number;
  /** When true, flows in document layout (below hero title) instead of overlay. */
  inline?: boolean;
  /** Small mascot inside hero image overlay. */
  compact?: boolean;
  /** Embedded in hero bottom panel — flex row, smaller mascot. */
  embed?: boolean;
};

/**
 * Recommend Seed + one-line cream tip card (H2-8).
 * Mascot sits slightly outside the card; no speech-bubble tail.
 */
export const HomeRecommendTip = memo(function HomeRecommendTip({
  message,
  maxLines = 1,
  inline = false,
  embed = false,
  compact = false,
}: Props) {
  const text = message.trim();
  if (!text) return null;

  const mascotSize = compact ? 42 : embed ? 32 : 40;

  return (
    <View
      style={[
        styles.wrap,
        inline && styles.wrapInline,
        embed && styles.wrapEmbed,
        compact && styles.wrapCompact,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`한끼: ${text}`}
    >
      <SeedMascot variant="recommend" size={mascotSize} style={styles.seed} />
      <View style={[styles.card, embed && styles.cardEmbed, compact && styles.cardCompact]}>
        <Text
          style={[styles.text, embed && styles.textEmbed, compact && styles.textCompact]}
          numberOfLines={maxLines}
        >
          {text}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: ds.spacing.cardInner,
    bottom: ds.spacing.cardInner,
    // Allow horizontal expansion; keep clear of heart.
    right: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 4,
  },
  wrapInline: {
    position: 'relative',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100%',
  },
  wrapEmbed: {
    position: 'relative',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100%',
    marginTop: 4,
  },
  wrapCompact: {
    right: 12,
    left: 10,
    bottom: 10,
  },
  seed: {
    marginLeft: -2,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  card: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    backgroundColor: '#FFF8EF',
    borderRadius: ds.radius.card,
    paddingVertical: 10,
    paddingHorizontal: ds.spacing.cardInner,
    borderWidth: 1,
    borderColor: 'rgba(232, 170, 120, 0.28)',
    ...ds.shadow.card,
  },
  cardEmbed: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: ds.radius.badge,
  },
  cardCompact: {
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: ds.radius.badge,
    ...ds.shadow.card,
    shadowOpacity: 0.06,
  },
  text: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: '#3A2417',
  },
  textEmbed: {
    fontSize: 11,
    lineHeight: 15,
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
