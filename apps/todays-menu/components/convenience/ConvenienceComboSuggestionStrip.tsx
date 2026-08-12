import { ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { ds } from '../../constants/designSystem';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  CONVENIENCE_STRIP_CARD_GAP,
  resolveStripCardMetrics,
  resolveStripCardWidth,
  resolveStripLayoutMode,
} from './convenienceStripLayout';
import { ConvenienceComboStripCard } from './ConvenienceComboStripCard';

const DEFAULT_ACCENTS = ['#E8834A', '#6FA86A', '#6A8AB8', '#C47A2A', '#8A6AB8', '#E85A6A'] as const;

type Props = {
  combos: ConvenienceCombo[];
  onPressCombo: (comboId: string) => void;
  accentColors?: readonly string[];
};

/**
 * Up to 3 combo cards — fit 3 on mobile (>=360px), scroll on very narrow, grid on web.
 */
export function ConvenienceComboSuggestionStrip({
  combos,
  onPressCombo,
  accentColors = DEFAULT_ACCENTS,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const items = combos.slice(0, 3);
  if (items.length === 0) return null;

  const layoutMode = resolveStripLayoutMode(windowWidth);
  const cardWidth = resolveStripCardWidth(windowWidth, layoutMode);
  const metrics = resolveStripCardMetrics(layoutMode);

  const renderCard = (
    combo: ConvenienceCombo,
    index: number,
    cardStyle?: StyleProp<ViewStyle>,
  ) => (
    <ConvenienceComboStripCard
      combo={combo}
      accentColor={accentColors[index % accentColors.length] ?? DEFAULT_ACCENTS[0]}
      metrics={metrics}
      onPress={() => onPressCombo(combo.id)}
      style={cardStyle}
    />
  );

  if (layoutMode === 'web-grid') {
    return (
      <View style={styles.gridRow}>
        {items.map((combo, index) => (
          <View key={combo.id} style={styles.gridItem}>
            {renderCard(combo, index, styles.gridCard)}
          </View>
        ))}
      </View>
    );
  }

  if (layoutMode === 'mobile-fit-three') {
    return (
      <View style={styles.fitRow}>
        {items.map((combo, index) => (
          <View key={combo.id}>
            {renderCard(combo, index, { width: cardWidth, flexShrink: 0 })}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((combo, index) => (
        <View key={combo.id}>
          {renderCard(combo, index, { width: cardWidth, flexShrink: 0 })}
        </View>
      ))}
    </ScrollView>
  );
}

export { CONVENIENCE_STRIP_CARD_GAP } from './convenienceStripLayout';

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: CONVENIENCE_STRIP_CARD_GAP,
    paddingRight: ds.spacing.screen,
  },
  fitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: CONVENIENCE_STRIP_CARD_GAP,
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: CONVENIENCE_STRIP_CARD_GAP,
    width: '100%',
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  gridCard: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
