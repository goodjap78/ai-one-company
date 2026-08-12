import { Fragment, memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import type { Difficulty } from '../../types/home';
import type { TrustReasonChip } from '../../utils/buildTrustReasonChips';
import { getHomeIcon } from './homeIcons';
import { homePremiumStyles, homeRef } from './homePremiumStyles';

type Props = {
  cookingTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  weatherChip?: TrustReasonChip | null;
};

const labels = getHankkiHomeDecisionMessages();
const META_DIVIDER_HEIGHT = 20;

export const MealQuickInfoChips = memo(function MealQuickInfoChips({
  cookingTimeMinutes,
  difficulty,
  servings,
  weatherChip,
}: Props) {
  const metaItems = [
    { key: 'time', icon: getHomeIcon('cookTime'), value: `${cookingTimeMinutes}분` },
    { key: 'difficulty', icon: getHomeIcon('difficulty'), value: labels.difficultyLabels[difficulty] },
    { key: 'servings', icon: getHomeIcon('servings'), value: `${servings}인분` },
  ];

  return (
    <View style={[homePremiumStyles.panel, styles.row]} accessibilityRole="text">
      {weatherChip ? (
        <>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherEmoji}>{weatherChip.emoji}</Text>
            <Text style={styles.weatherText} numberOfLines={1}>
              {weatherChip.displayTitle}
            </Text>
          </View>
          <View style={styles.separator} />
        </>
      ) : null}

      {metaItems.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <View style={styles.item}>
            <View style={homePremiumStyles.metaIconRow}>
              <AppIcon name={item.icon} size={18} color={ds.colors.textSecondary} />
              <Text style={homePremiumStyles.metaText} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherItem: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  weatherEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  weatherText: {
    ...ds.typography.caption,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    flexShrink: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  separator: {
    width: 1,
    height: META_DIVIDER_HEIGHT,
    backgroundColor: homeRef.colors.metaDivider,
    borderRadius: 1,
  },
});
