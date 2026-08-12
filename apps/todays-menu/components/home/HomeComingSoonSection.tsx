import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { ComingSoonFeatureId } from '../../types/featureSurvey';
import type { HomeIconKey } from './homeIcons';
import { getHomeIcon } from './homeIcons';

const CARD_GAP = 8;
/** Full cards visible + intentional peek of next card (~14–20px). */
const FULL_VISIBLE_CARDS = 3;
const PEEK_PX = 18;

const SURVEY_ID_BY_CARD: Record<string, ComingSoonFeatureId> = {
  dineOut: 'dine_out',
  kids: 'kids_meal',
  receipt: 'receipt',
  health: 'health',
  reward: 'reward',
};

const ICON_BY_ID: Record<string, HomeIconKey> = {
  dineOut: 'delivery',
  kids: 'kids',
  receipt: 'receipt',
  health: 'health',
  reward: 'reward',
};

const PASTELS = [
  { bg: '#FFF3E8', icon: '#E85A28', badge: '#8A5A3E' },
  { bg: '#F3F8F1', icon: '#5A8A3A', badge: '#5A6A4A' },
  { bg: '#F0F6FF', icon: '#4A6AAA', badge: '#3A4A6A' },
  { bg: '#FFF8EE', icon: '#C47A2A', badge: '#8A5A3E' },
  { bg: '#FFF8EF', icon: '#E85A28', badge: '#8A6A52' },
] as const;

type SecondaryCard = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
};

type Props = {
  onComingSoonPress: (featureId: ComingSoonFeatureId) => void;
};

function useSecondaryCardWidth(screenWidth: number): number {
  const contentWidth = Math.min(screenWidth, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const gapTotal = CARD_GAP * FULL_VISIBLE_CARDS;
  const usable = Math.max(0, contentWidth - gapTotal - PEEK_PX);
  return Math.max(96, Math.floor(usable / FULL_VISIBLE_CARDS));
}

/**
 * Sprint 61-D — readable horizontal shortcuts (below primary feature visual weight).
 */
export const HomeComingSoonSection = memo(function HomeComingSoonSection({
  onComingSoonPress,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;
  const baseCardWidth = useSecondaryCardWidth(width);

  const rewardCard: SecondaryCard = {
    id: 'reward',
    title: northStarHomeCopy.reward.title,
    subtitle: northStarHomeCopy.reward.subtitle,
    badge: northStarHomeCopy.reward.badge,
  };

  const cards: SecondaryCard[] = [...northStarHomeCopy.comingSoon.cards, rewardCard];

  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, narrow && styles.sectionTitleNarrow]}
        accessibilityRole="header"
      >
        {northStarHomeCopy.comingSoon.sectionTitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        clipToPadding={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {cards.map((card, index) => {
          const pastel = PASTELS[index % PASTELS.length];
          const iconKey = ICON_BY_ID[card.id] ?? 'pairingDefault';
          const surveyId = SURVEY_ID_BY_CARD[card.id];

          return (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.btn,
                { width: baseCardWidth, backgroundColor: pastel.bg },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                if (surveyId) onComingSoonPress(surveyId);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${card.badge ?? ''}. ${card.subtitle}`}
            >
              <AppIcon
                name={getHomeIcon(iconKey)}
                size={narrow ? 14 : 15}
                color={pastel.icon}
              />
              <Text
                style={[styles.btnTitle, narrow && styles.btnTitleNarrow]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {card.title}
              </Text>
              {card.badge ? (
                <Text style={[styles.badgeText, { color: pastel.badge }]} numberOfLines={1}>
                  {card.badge}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: '100%',
    gap: 6,
    paddingBottom: 2,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    fontSize: 15,
    lineHeight: 20,
    color: '#3A2417',
  },
  sectionTitleNarrow: {
    fontSize: 14,
    lineHeight: 18,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingRight: PEEK_PX,
    paddingTop: 2,
    paddingBottom: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    minHeight: 54,
    ...ds.shadow.card,
    shadowOpacity: 0.06,
  },
  pressed: {
    opacity: 0.9,
  },
  btnTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#3A2417',
    letterSpacing: -0.2,
  },
  btnTitleNarrow: {
    fontSize: 10,
    lineHeight: 13,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
});
