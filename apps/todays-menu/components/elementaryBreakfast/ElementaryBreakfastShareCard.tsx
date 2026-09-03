import { StyleSheet, Text, View } from 'react-native';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from '../../constants/elementaryBreakfastShareCard';
import { elementaryBreakfastWeeklyPlanCopy as copy } from '../../constants/elementaryBreakfastWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { fontFamily } from '../../constants/fonts';
import type { ElementaryBreakfastShareCardModel } from '../../services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  model: ElementaryBreakfastShareCardModel;
};

/**
 * Share-only layout. Must not include nav, buttons, ads, or debug text.
 */
export function ElementaryBreakfastShareCard({ model }: Props) {
  return (
    <View style={styles.card} collapsable={false}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{copy.shareCardTitle}</Text>
        <Text style={styles.title}>{copy.shareCardTitleLine2}</Text>
        <Text style={styles.subtitle}>{copy.shareCardSubtitle}</Text>
      </View>

      <View style={styles.rows}>
        {model.rows.map((row) => (
          <View key={row.day} style={styles.row}>
            <Text style={styles.day}>{row.dayLabel}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={styles.time}>{copy.cookTime(row.timeMinutes)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.brand}>
        <SeedMascot variant="happy" size={36} />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>{copy.shareCardBrandName}</Text>
          <Text style={styles.brandTagline}>{copy.shareCardBrandTagline}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WEEKLY_PLAN_SHARE_CARD_WIDTH,
    height: WEEKLY_PLAN_SHARE_CARD_HEIGHT,
    backgroundColor: ds.colors.canvas,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  header: {
    gap: 6,
  },
  kicker: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: ds.colors.primary,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: ds.colors.textSecondary,
  },
  rows: {
    gap: 8,
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
  },
  day: {
    width: 22,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: ds.colors.primary,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: ds.colors.textPrimary,
  },
  time: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.border,
  },
  brandText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  brandName: {
    fontFamily: fontFamily.titleRound,
    fontSize: 18,
    lineHeight: 22,
    color: ds.colors.primary,
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: ds.colors.textMuted,
  },
});
