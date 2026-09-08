import { StyleSheet, Text, View } from 'react-native';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from '../../constants/elementaryBreakfastShareCard';
import {
  SHARE_BODY_GRID_FLEX,
  SHARE_BODY_HERO_FLEX,
  SHARE_CARD_CANVAS,
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
  shareCardRecipeHint?: string;
  cookTime: (minutes: number) => string;
};

type Props = {
  model: ElementaryWeeklyShareCardModel;
  copy: ElementaryWeeklyShareCardCopy;
};

/**
 * Sprint 16 card-news: header → Mon hero → Tue–Sun 2×3 grid → brand footer.
 * Capture 360×450 @3x → 1080×1350. Preview uses the same component.
 */
export function ElementaryWeeklyShareCard({ model, copy }: Props) {
  const [mon, tue, wed, thu, fri, sat, sun] = model.items;
  const titleLine2 = copy.shareCardTitleLine2.trim();
  const subtitle = copy.shareCardSubtitle.trim();

  return (
    <View style={styles.card} collapsable={false}>
      <View style={styles.header}>
        <Text style={styles.label}>{copy.shareCardTitle}</Text>
        {titleLine2 ? <Text style={styles.headline}>{titleLine2}</Text> : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        {mon ? (
          <View style={styles.heroSlot}>
            <ElementaryWeeklyShareMealCell item={mon} cookTime={copy.cookTime} variant="hero" />
          </View>
        ) : null}

        <View style={styles.gridBlock}>
          <View style={styles.gridRow}>
            {tue ? <ElementaryWeeklyShareMealCell item={tue} cookTime={copy.cookTime} /> : null}
            {wed ? <ElementaryWeeklyShareMealCell item={wed} cookTime={copy.cookTime} /> : null}
          </View>
          <View style={styles.gridRow}>
            {thu ? <ElementaryWeeklyShareMealCell item={thu} cookTime={copy.cookTime} /> : null}
            {fri ? <ElementaryWeeklyShareMealCell item={fri} cookTime={copy.cookTime} /> : null}
          </View>
          <View style={styles.gridRow}>
            {sat ? <ElementaryWeeklyShareMealCell item={sat} cookTime={copy.cookTime} /> : null}
            {sun ? (
              <ElementaryWeeklyShareMealCell
                item={sun}
                cookTime={copy.cookTime}
                variant="featured"
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.brandName}>{copy.shareCardBrandName}</Text>
        <Text style={styles.brandTagline}>{copy.shareCardBrandTagline}</Text>
        {copy.shareCardRecipeHint?.trim() ? (
          <Text style={styles.recipeHint}>{copy.shareCardRecipeHint}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WEEKLY_PLAN_SHARE_CARD_WIDTH,
    height: WEEKLY_PLAN_SHARE_CARD_HEIGHT,
    backgroundColor: SHARE_CARD_CANVAS,
    paddingHorizontal: SHARE_CARD_PADDING_H,
    paddingTop: SHARE_CARD_PADDING_TOP,
    paddingBottom: SHARE_CARD_PADDING_BOTTOM,
  },
  header: {
    flexShrink: 0,
    gap: 1,
    marginBottom: 5,
  },
  /** Small audience/meal label */
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: ds.colors.primary,
    letterSpacing: -0.15,
  },
  /** Dominant title */
  headline: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: ds.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
    color: ds.colors.textSecondary,
    letterSpacing: -0.1,
  },
  body: {
    flex: 1,
    minHeight: 0,
    gap: SHARE_GRID_GAP,
  },
  heroSlot: {
    flex: SHARE_BODY_HERO_FLEX,
    minHeight: 0,
  },
  gridBlock: {
    flex: SHARE_BODY_GRID_FLEX,
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
    marginTop: 4,
    alignItems: 'center',
    gap: 0,
  },
  brandName: {
    fontFamily: fontFamily.titleRound,
    fontSize: 8,
    lineHeight: 10,
    color: ds.colors.primary,
  },
  brandTagline: {
    fontSize: 6.5,
    lineHeight: 8,
    fontWeight: '500',
    color: ds.colors.textMuted,
  },
  recipeHint: {
    marginTop: 1,
    fontSize: 5.5,
    lineHeight: 7,
    fontWeight: '500',
    color: ds.colors.textMuted,
  },
});
