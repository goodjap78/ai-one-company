import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { MealMode } from '../../types/home';
import { SeedMascot } from '../common/SeedMascot';
import { HomeServiceModeCards } from './HomeServiceModeCards';

type Props = {
  mealMode: MealMode;
  onMealModeChange: (mode: MealMode) => void;
  disabled?: boolean;
};

const labels = getHankkiHomeDecisionMessages();
const TITLE_COLOR = '#3A2417';

export function HomePageHeader({ mealMode, onMealModeChange, disabled }: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;

  return (
    <View style={styles.container}>
      <View style={styles.headlineRow}>
        <SeedMascot variant="wave" size={narrow ? 48 : 56} />
        <View style={styles.headlineBlock}>
          <Text
            style={[styles.title, narrow && styles.titleNarrow]}
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {labels.appHeadline}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
            {labels.appSubtitle}
          </Text>
        </View>
      </View>

      <HomeServiceModeCards
        value={mealMode}
        onChange={onMealModeChange}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    gap: 8,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: '100%',
  },
  headlineBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: TITLE_COLOR,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: undefined,
    }),
  },
  titleNarrow: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#8A7464',
  },
});
