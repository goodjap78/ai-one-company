import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { ComingSoonFeatureId } from '../../types/featureSurvey';
import type { HomeIconKey } from './homeIcons';
import { getHomeIcon } from './homeIcons';

const CARD_GAP = ds.spacing.cardInner;
const CARD_RADIUS = ds.radius.card;

const SURVEY_ID_BY_CARD: Record<string, ComingSoonFeatureId> = {
  dineOut: 'dine_out',
  kids: 'kids_meal',
  receipt: 'receipt',
  health: 'health',
};

const ICON_BY_ID: Record<string, HomeIconKey> = {
  dineOut: 'delivery',
  kids: 'kids',
  receipt: 'receipt',
  health: 'health',
};

const PASTELS = [
  { bg: '#FFF3E8', icon: '#E85A28', badge: '#8A5A3E' },
  { bg: '#F3F8F1', icon: '#5A8A3A', badge: '#5A6A4A' },
  { bg: '#F0F6FF', icon: '#4A6AAA', badge: '#3A4A6A' },
  { bg: '#FFF8EE', icon: '#C47A2A', badge: '#8A5A3E' },
] as const;

type Props = {
  onComingSoonPress: (featureId: ComingSoonFeatureId) => void;
};

/**
 * Coming-soon 2×2 grid — taps open priority surveys (H3-12). Layout unchanged.
 */
export const HomeComingSoonSection = memo(function HomeComingSoonSection({
  onComingSoonPress,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;
  const cards = northStarHomeCopy.comingSoon.cards;
  const contentWidth = Math.min(width, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const cardWidth = Math.floor((contentWidth - CARD_GAP) / 2);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, narrow && styles.sectionTitleNarrow]} accessibilityRole="header">
        {northStarHomeCopy.comingSoon.sectionTitle}
      </Text>

      <View style={styles.grid}>
        {cards.map((card, index) => {
          const pastel = PASTELS[index % PASTELS.length];
          const iconKey = ICON_BY_ID[card.id] ?? 'pairingDefault';
          const surveyId = SURVEY_ID_BY_CARD[card.id];

          return (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth, backgroundColor: pastel.bg },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                if (surveyId) onComingSoonPress(surveyId);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${card.badge}. ${card.subtitle}`}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.75)' }]}>
                  <AppIcon name={getHomeIcon(iconKey)} size={narrow ? 18 : 20} color={pastel.icon} />
                </View>
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { color: pastel.badge }]} numberOfLines={1}>
                    {card.badge}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardTitle, narrow && styles.cardTitleNarrow]} numberOfLines={1}>
                {card.title}
              </Text>
              <Text style={[styles.cardSubtitle, narrow && styles.cardSubtitleNarrow]} numberOfLines={2}>
                {card.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: '100%',
    gap: ds.spacing.cardInner,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    color: '#3A2417',
  },
  sectionTitleNarrow: {
    fontSize: 20,
    lineHeight: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: CARD_GAP,
  },
  card: {
    maxWidth: '100%',
    minWidth: 0,
    borderRadius: CARD_RADIUS,
    padding: ds.spacing.cardInner,
    gap: ds.spacing.cardInner,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    ...ds.shadow.card,
  },
  pressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '55%',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  cardTitle: {
    ...ds.typography.body,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#3A2417',
    letterSpacing: -0.2,
  },
  cardTitleNarrow: {
    fontSize: 14,
    lineHeight: 18,
  },
  cardSubtitle: {
    ...ds.typography.caption,
    fontWeight: '500',
    color: ds.colors.warmText,
  },
  cardSubtitleNarrow: {
    fontSize: 11,
    lineHeight: 15,
  },
});
