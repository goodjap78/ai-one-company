import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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

const PRESS_SCALE = 0.98;
/** Sprint H6 — slightly shorter cards so CTA fits on first screen */
const CARD_MIN_HEIGHT = 98;
const CARD_MIN_HEIGHT_NARROW = 100;
const CARD_RADIUS = ds.radius.card;
const CARD_GAP = 8;

/**
 * Shared vertical rhythm — identical on all 3 cards (H5 / Sprint 48-A).
 */
const ICON_ROW_HEIGHT = 34;
const TITLE_AREA_HEIGHT = 36;
const SUBTITLE_AREA_HEIGHT = 26;

type FeatureId = 'recommendation' | 'convenience' | 'fridge';

type FeatureDef = {
  id: FeatureId;
  iconKey: HomeIconKey;
  title: string;
  subtitle: string;
  badge?: string;
  gradient: readonly [string, string, string];
  activeGradient?: readonly [string, string, string];
  titleColor: string;
  subtitleColor: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  activeBorderColor?: string;
  badgeTextColor: string;
};

/** Soft pastel cards — Sprint 48-A top row: 추천 · 편의점 · 냉장고 */
const FEATURES: FeatureDef[] = [
  {
    id: 'recommendation',
    iconKey: 'homemade',
    title: northStarHomeCopy.features.recommendation.title,
    subtitle: northStarHomeCopy.features.recommendation.subtitle,
    gradient: ['#FFF6EE', '#FFEEDD', '#FFE4CC'],
    activeGradient: ['#FFF0E0', '#FFE2C4', '#FFD4A8'],
    titleColor: '#4A3224',
    subtitleColor: '#A06A48',
    iconColor: '#E8834A',
    iconBg: 'rgba(255,252,247,0.95)',
    borderColor: 'rgba(232, 170, 120, 0.28)',
    activeBorderColor: 'rgba(232, 140, 90, 0.36)',
    badgeTextColor: '#8A6A52',
  },
  {
    id: 'convenience',
    iconKey: 'delivery',
    title: northStarHomeCopy.features.convenience.title,
    subtitle: northStarHomeCopy.features.convenience.subtitle,
    badge: northStarHomeCopy.features.convenience.badge,
    gradient: ['#F6FBF4', '#EEF7E8', '#E4F0DC'],
    titleColor: '#3E5240',
    subtitleColor: '#6A8A68',
    iconColor: '#6FA86A',
    iconBg: 'rgba(255,252,247,0.95)',
    borderColor: 'rgba(140, 180, 130, 0.26)',
    badgeTextColor: '#5A7A58',
  },
  {
    id: 'fridge',
    iconKey: 'fridge',
    title: northStarHomeCopy.features.fridge.title,
    subtitle: northStarHomeCopy.features.fridge.subtitle,
    gradient: ['#F5F8FC', '#EAF1F9', '#DEE9F5'],
    titleColor: '#3A4A62',
    subtitleColor: '#6A7A9A',
    iconColor: '#6A8AB8',
    iconBg: 'rgba(255,252,247,0.95)',
    borderColor: 'rgba(130, 160, 200, 0.26)',
    badgeTextColor: '#5A6A88',
  },
];

function FeatureCard({
  feature,
  active,
  disabled,
  narrow,
  onPress,
}: {
  feature: FeatureDef;
  active: boolean;
  disabled?: boolean;
  narrow: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconBox = narrow ? 30 : 32;
  const iconSize = narrow ? 16 : 18;
  const colors = active && feature.activeGradient ? feature.activeGradient : feature.gradient;
  const borderColor =
    active && feature.activeBorderColor ? feature.activeBorderColor : feature.borderColor;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  };

  const a11y = `${feature.title}. ${feature.subtitle}${feature.badge ? `. ${feature.badge}` : ''}`;

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!disabled) animateTo(PRESS_SCALE);
        }}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
        accessibilityLabel={a11y}
        style={disabled ? styles.cardDisabled : undefined}
      >
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              minHeight: narrow ? CARD_MIN_HEIGHT_NARROW : CARD_MIN_HEIGHT,
              borderColor,
            },
          ]}
        >
          {feature.badge ? (
            <View style={styles.badge} pointerEvents="none">
              <Text style={[styles.badgeText, { color: feature.badgeTextColor }]} numberOfLines={1}>
                {feature.badge}
              </Text>
            </View>
          ) : null}

          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconWrap,
                {
                  width: iconBox,
                  height: iconBox,
                  borderRadius: iconBox / 2,
                  backgroundColor: feature.iconBg,
                },
              ]}
            >
              <AppIcon
                name={getHomeIcon(feature.iconKey)}
                size={iconSize}
                color={feature.iconColor}
              />
            </View>
          </View>

          <View style={styles.titleArea}>
            <Text
              style={[styles.title, narrow && styles.titleNarrow, { color: feature.titleColor }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {feature.title}
            </Text>
          </View>

          <View style={styles.subtitleArea}>
            <Text
              style={[
                styles.subtitle,
                narrow && styles.subtitleNarrow,
                { color: feature.subtitleColor },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {feature.subtitle}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Top 3 core features — recommendation (homemade), convenience combos, fridge raid.
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
      {FEATURES.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          active={feature.id === 'recommendation' && mealMode === 'homemade'}
          disabled={disabled}
          narrow={narrow}
          onPress={() => handlePress(feature.id)}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: '100%',
    gap: CARD_GAP,
  },
  cardOuter: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    borderRadius: CARD_RADIUS,
    ...ds.shadow.card,
  },
  card: {
    position: 'relative',
    width: '100%',
    borderRadius: CARD_RADIUS,
    paddingTop: ds.spacing.cardInner,
    paddingBottom: ds.spacing.cardInner,
    paddingLeft: ds.spacing.cardInner,
    paddingRight: ds.spacing.cardInner,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 4,
    justifyContent: 'flex-start',
  },
  cardDisabled: {
    opacity: 0.55,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: 'rgba(255,252,247,0.95)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 3 : 2,
    maxWidth: '70%',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  iconRow: {
    height: ICON_ROW_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleArea: {
    width: '100%',
    minWidth: 0,
    minHeight: TITLE_AREA_HEIGHT,
    justifyContent: 'center',
    paddingRight: 4,
  },
  title: {
    width: '100%',
    minWidth: 0,
    ...ds.typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  titleNarrow: {
    fontSize: 11,
    lineHeight: 15,
  },
  subtitleArea: {
    width: '100%',
    minWidth: 0,
    height: SUBTITLE_AREA_HEIGHT,
    justifyContent: 'center',
  },
  subtitle: {
    width: '100%',
    minWidth: 0,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  subtitleNarrow: {
    fontSize: 10,
    lineHeight: 13,
  },
});
