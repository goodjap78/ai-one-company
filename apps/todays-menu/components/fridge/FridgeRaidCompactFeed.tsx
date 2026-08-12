import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ds } from '../../constants/designSystem';
import {
  FRIDGE_COMPACT_CARD_GAP,
  fridgeCompactSnapInterval,
  resolveFridgeCompactCardMetrics,
  resolveFridgeCompactCardWidth,
  resolveFridgeCompactLayoutMode,
} from '../../constants/fridgeCompactLayout';
import type { FridgeRaidCandidate } from '../../services/fridge/fridgeRaidTypes';
import { FridgeRaidCompactCard } from './FridgeRaidCompactCard';

type Props = {
  candidates: FridgeRaidCandidate[];
  onPressRecipe: (recipeId: string) => void;
};

export function FridgeRaidCompactFeed({ candidates, onPressRecipe }: Props) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  if (candidates.length === 0) return null;

  const layoutMode = resolveFridgeCompactLayoutMode(windowWidth);
  const cardWidth = resolveFridgeCompactCardWidth(windowWidth);
  const metrics = resolveFridgeCompactCardMetrics(layoutMode);
  const snapInterval = fridgeCompactSnapInterval(cardWidth);

  const handlePressShopping = (recipeId: string) => {
    router.push(`/shopping/${recipeId}?mode=missing`);
  };

  const renderCard = (
    candidate: FridgeRaidCandidate,
    cardStyle?: StyleProp<ViewStyle>,
  ) => (
    <FridgeRaidCompactCard
      candidate={candidate}
      metrics={metrics}
      onPress={() => onPressRecipe(candidate.recipeId)}
      onPressShopping={handlePressShopping}
      style={cardStyle}
    />
  );

  if (layoutMode === 'web-grid') {
    return (
      <View style={styles.gridRow}>
        {candidates.map((candidate) => (
          <View key={candidate.recipeId} style={styles.gridItem}>
            {renderCard(candidate, styles.gridCard)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snapInterval}
      snapToAlignment="start"
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {candidates.map((candidate) => (
        <View key={candidate.recipeId}>
          {renderCard(candidate, { width: cardWidth, flexShrink: 0 })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: FRIDGE_COMPACT_CARD_GAP,
    paddingRight: ds.spacing.screen,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: FRIDGE_COMPACT_CARD_GAP,
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
