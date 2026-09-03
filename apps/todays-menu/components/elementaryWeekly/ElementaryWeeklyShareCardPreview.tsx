import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
} from '../../constants/elementaryBreakfastShareCard';
import { SHARE_CARD_QA_PREVIEW_MAX_WIDTH } from '../../constants/elementaryWeeklyShareCardLayout';
import { ds } from '../../constants/designSystem';
import type { ElementaryWeeklyShareCardModel } from '../../services/weeklyPlan/elementaryWeeklyShareCardModel';
import {
  ElementaryWeeklyShareCard,
  type ElementaryWeeklyShareCardCopy,
} from './ElementaryWeeklyShareCard';

type Props = {
  model: ElementaryWeeklyShareCardModel;
  copy: ElementaryWeeklyShareCardCopy;
};

/**
 * Scales the share card for browser QA only — capture pipeline still uses 360×450.
 */
export function ElementaryWeeklyShareCardPreview({ model, copy }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = Math.min(windowWidth * 0.9, SHARE_CARD_QA_PREVIEW_MAX_WIDTH);
  const scale = previewWidth / WEEKLY_PLAN_SHARE_CARD_WIDTH;
  const previewHeight = WEEKLY_PLAN_SHARE_CARD_HEIGHT * scale;

  return (
    <View style={[styles.shell, { width: previewWidth, height: previewHeight }]}>
      <View
        style={[
          styles.scaledCard,
          {
            width: WEEKLY_PLAN_SHARE_CARD_WIDTH,
            height: WEEKLY_PLAN_SHARE_CARD_HEIGHT,
            transform: [{ scale }],
            ...(Platform.OS === 'web'
              ? ({ transformOrigin: 'top left' } as Record<string, string>)
              : null),
          },
        ]}
      >
        <ElementaryWeeklyShareCard model={model} copy={copy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: ds.radius.card,
    borderWidth: 1,
    borderColor: ds.colors.border,
    ...ds.shadow.card,
  },
  scaledCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
