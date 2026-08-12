import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { MealMode } from '../../types/home';
import type { HomeIconKey } from './homeIcons';
import { getHomeIcon } from './homeIcons';

type Props = {
  mealMode: MealMode;
  onRecommendationPress: () => void;
  onConveniencePress: () => void;
  onFridgePress: () => void;
  disabled?: boolean;
};

const BTN_GAP = 5;

type FeatureId = 'recommendation' | 'convenience' | 'fridge';

type FeatureDef = {
  id: FeatureId;
  iconKey: HomeIconKey;
  title: string;
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
  activeBg: string;
  activeBorder: string;
};

const FEATURES: FeatureDef[] = [
  {
    id: 'recommendation',
    iconKey: 'homemade',
    title: northStarHomeCopy.features.recommendation.title,
    bg: '#FFF6EE',
    border: 'rgba(232, 170, 120, 0.28)',
    iconColor: '#E8834A',
    titleColor: '#4A3224',
    activeBg: '#FFF0E0',
    activeBorder: 'rgba(232, 140, 90, 0.45)',
  },
  {
    id: 'convenience',
    iconKey: 'delivery',
    title: northStarHomeCopy.features.convenience.title,
    bg: '#F6FBF4',
    border: 'rgba(140, 180, 130, 0.26)',
    iconColor: '#6FA86A',
    titleColor: '#3E5240',
    activeBg: '#EEF7E8',
    activeBorder: 'rgba(100, 160, 100, 0.4)',
  },
  {
    id: 'fridge',
    iconKey: 'fridge',
    title: northStarHomeCopy.features.fridge.title,
    bg: '#F5F8FC',
    border: 'rgba(130, 160, 200, 0.26)',
    iconColor: '#6A8AB8',
    titleColor: '#3A4A62',
    activeBg: '#EAF1F9',
    activeBorder: 'rgba(100, 140, 190, 0.4)',
  },
];

/**
 * Sprint 61-D — horizontal feature shortcuts (icon + title, mid-weight height).
 */
export const HomeFeatureCards = memo(function HomeFeatureCards({
  mealMode,
  onRecommendationPress,
  onConveniencePress,
  onFridgePress,
  disabled,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;

  const handlePress = (id: FeatureId) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'recommendation') {
      onRecommendationPress();
      return;
    }
    if (id === 'convenience') {
      onConveniencePress();
      return;
    }
    onFridgePress();
  };

  return (
    <View style={styles.row}>
      {FEATURES.map((feature) => {
        const active = feature.id === 'recommendation' && mealMode === 'homemade';
        return (
          <Pressable
            key={feature.id}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: active ? feature.activeBg : feature.bg,
                borderColor: active ? feature.activeBorder : feature.border,
              },
              pressed && !disabled && styles.btnPressed,
              disabled && styles.btnDisabled,
            ]}
            onPress={() => handlePress(feature.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
            accessibilityLabel={feature.title}
          >
            <AppIcon
              name={getHomeIcon(feature.iconKey)}
              size={narrow ? 15 : 16}
              color={feature.iconColor}
            />
            <Text
              style={[
                styles.title,
                narrow && styles.titleNarrow,
                { color: feature.titleColor },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {feature.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: BTN_GAP,
  },
  btn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    minHeight: 54,
    ...ds.shadow.card,
    shadowOpacity: 0.07,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleNarrow: {
    fontSize: 11,
    lineHeight: 14,
  },
});
