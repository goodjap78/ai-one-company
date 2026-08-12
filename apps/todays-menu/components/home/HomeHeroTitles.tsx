import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../../constants/fonts';
import { ds } from '../../constants/designSystem';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import type { MealTimeSlotKey } from '../../types/mealTimeRecommendation';
import { SeedMascot } from '../common/SeedMascot';

const TITLE_COLOR = '#3A2417';
const SUBTITLE_COLOR = '#8A7464';
/** Header mascot — 10% larger than 66px baseline. */
const SEED_SIZE = 73;

type Props = {
  selectedSlot: MealTimeSlotKey;
};

/**
 * Home header: title/subtitle left; Seed wave on the right.
 * Subtitle follows the active meal-time slot.
 */
export const HomeHeroTitles = memo(function HomeHeroTitles({ selectedSlot }: Props) {
  const subtitle = northStarHomeCopy.slotSubtitles[selectedSlot];

  return (
    <View style={styles.block}>
      <View style={styles.titleRow}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {northStarHomeCopy.title}
        </Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      <View style={styles.seedWrap} pointerEvents="none">
        <SeedMascot variant="wave" size={SEED_SIZE} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  block: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    gap: 4,
    overflow: 'visible',
    zIndex: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    paddingRight: 86,
  },
  title: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontFamily: fontFamily.titleRound,
    ...ds.typography.pageTitle,
    color: TITLE_COLOR,
  },
  subtitle: {
    ...ds.typography.caption,
    color: SUBTITLE_COLOR,
    paddingLeft: 2,
    paddingRight: 86,
    lineHeight: 18,
  },
  seedWrap: {
    position: 'absolute',
    right: 2,
    bottom: -7,
    width: SEED_SIZE,
    height: SEED_SIZE,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
});
