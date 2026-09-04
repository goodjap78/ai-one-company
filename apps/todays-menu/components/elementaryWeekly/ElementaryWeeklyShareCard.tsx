import { StyleSheet, Text, View } from 'react-native';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from '../../constants/elementaryBreakfastShareCard';
import {
  SHARE_CARD_PADDING_BOTTOM,
  SHARE_CARD_PADDING_H,
  SHARE_CARD_PADDING_TOP,
  SHARE_GRID_GAP,
} from '../../constants/elementaryWeeklyShareCardLayout';
import { ds } from '../../constants/designSystem';
import { fontFamily } from '../../constants/fonts';
import type { ElementaryWeeklyShareCardModel } from '../../services/weeklyPlan/elementaryWeeklyShareCardModel';
import { ElementaryWeeklyShareMealCell } from './ElementaryWeeklyShareMealCell';

export type ElementaryWeeklyShareCardCopy = {
  shareCardTitle: string;
  shareCardTitleLine2: string;
  shareCardSubtitle: string;
  shareCardShoppingHintLabel: string;
  shareCardBrandName: string;
  shareCardBrandTagline: string;
  cookTime: (minutes: number) => string;
};

type Props = {
  model: ElementaryWeeklyShareCardModel;
  copy: ElementaryWeeklyShareCardCopy;
};

/**
 * Share-only card-news layout for elementary / toddler weekly plans.
 * Sprint 14.1 — photo-dominant (no shopping hint). 4:5 capture 360×450 → 1080×1350.
 */
export function ElementaryWeeklyShareCard({ model, copy }: Props) {
  const [mon, tue, wed, thu, fri, sat, sun] = model.items;
  const titleLine2 = copy.shareCardTitleLine2.trim();

  return (
    <View style={styles.card} collapsable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy.shareCardTitle}</Text>
        {titleLine2 ? <Text style={styles.titleSecondary}>{titleLine2}</Text> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.gridRow}>
          {mon ? <ElementaryWeeklyShareMealCell item={mon} cookTime={copy.cookTime} /> : null}
          {tue ? <ElementaryWeeklyShareMealCell item={tue} cookTime={copy.cookTime} /> : null}
        </View>
        <View style={styles.gridRow}>
          {wed ? <ElementaryWeeklyShareMealCell item={wed} cookTime={copy.cookTime} /> : null}
          {thu ? <ElementaryWeeklyShareMealCell item={thu} cookTime={copy.cookTime} /> : null}
        </View>
        <View style={styles.gridRow}>
          {fri ? <ElementaryWeeklyShareMealCell item={fri} cookTime={copy.cookTime} /> : null}
          {sat ? <ElementaryWeeklyShareMealCell item={sat} cookTime={copy.cookTime} /> : null}
        </View>

        {sun ? (
          <ElementaryWeeklyShareMealCell
            item={sun}
            cookTime={copy.cookTime}
            variant="sunday"
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.brand}>
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
    paddingHorizontal: SHARE_CARD_PADDING_H,
    paddingTop: SHARE_CARD_PADDING_TOP,
    paddingBottom: SHARE_CARD_PADDING_BOTTOM,
  },
  header: {
    flexShrink: 0,
    gap: 0,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.35,
  },
  titleSecondary: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: ds.colors.primary,
    letterSpacing: -0.2,
  },
  body: {
    flex: 1,
    minHeight: 0,
    gap: SHARE_GRID_GAP,
  },
  gridRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: SHARE_GRID_GAP,
  },
  footer: {
    flexShrink: 0,
    marginTop: 2,
    paddingTop: 2,
  },
  brand: {
    gap: 0,
    alignItems: 'center',
  },
  brandName: {
    fontFamily: fontFamily.titleRound,
    fontSize: 8,
    lineHeight: 10,
    color: ds.colors.primary,
  },
  brandTagline: {
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '500',
    color: ds.colors.textMuted,
  },
});
