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
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { MealMode } from '../../types/home';
import { getHomeIcon } from './homeIcons';

type Props = {
  value: MealMode;
  onChange: (mode: MealMode) => void;
  disabled?: boolean;
};

const PRESS_SCALE = 0.98;
const CARD_HEIGHT = 92;
const CARD_RADIUS = 24;
const CARD_GAP = 12;
const CARD_PADDING = 14;

/** Short copy — never use longer phrases like "집에서 만들어 먹기". */
const COPY = {
  homemade: {
    title: '집에서 만들기',
    subtitle: 'AI 추천 레시피',
  },
  delivery: {
    title: '외식·포장',
    subtitle: '준비 중',
  },
} as const;

/** Selected homemade — warm orange, dark brown title, cream icon */
const HOMEMADE_ACTIVE = ['#FFD4A8', '#FFB06A', '#FF8F45'] as const;
const HOMEMADE_IDLE = ['#FFE8D0', '#FFD2A8', '#FFC08A'] as const;

/** Inactive dine-out — soft green / cream */
const DINEOUT_IDLE = ['#F7FBF1', '#EAF5D8', '#DCEFBE'] as const;
const DINEOUT_ACTIVE = ['#E8F4D0', '#D4E8B0', '#C2DC96'] as const;

type CardDef = {
  mode: MealMode;
  iconKey: 'homemade' | 'delivery';
  title: string;
  subtitle: string;
  idleGradient: readonly [string, string, string];
  activeGradient: readonly [string, string, string];
  titleColor: string;
  titleActiveColor: string;
  subtitleColor: string;
  iconColor: string;
  iconActiveColor: string;
  iconBg: string;
  iconActiveBg: string;
  borderIdle: string;
  borderActive: string;
  badgeStyle?: boolean;
};

const CARDS: CardDef[] = [
  {
    mode: 'homemade',
    iconKey: 'homemade',
    title: COPY.homemade.title,
    subtitle: COPY.homemade.subtitle,
    idleGradient: HOMEMADE_IDLE,
    activeGradient: HOMEMADE_ACTIVE,
    titleColor: '#3A2417',
    titleActiveColor: '#3A2417',
    subtitleColor: '#8A5A3E',
    iconColor: '#E85A28',
    iconActiveColor: '#E85A28',
    iconBg: 'rgba(255,255,255,0.85)',
    iconActiveBg: '#FFF8F0',
    borderIdle: 'rgba(255, 150, 90, 0.22)',
    borderActive: 'rgba(232, 90, 40, 0.35)',
  },
  {
    mode: 'delivery',
    iconKey: 'delivery',
    title: COPY.delivery.title,
    subtitle: COPY.delivery.subtitle,
    idleGradient: DINEOUT_IDLE,
    activeGradient: DINEOUT_ACTIVE,
    titleColor: '#5A6A4A',
    titleActiveColor: '#3A4A2E',
    subtitleColor: '#7A8A68',
    iconColor: '#6A8A4A',
    iconActiveColor: '#5A8A3A',
    iconBg: 'rgba(255,255,255,0.8)',
    iconActiveBg: 'rgba(255,255,255,0.9)',
    borderIdle: 'rgba(140, 180, 90, 0.22)',
    borderActive: 'rgba(100, 150, 60, 0.35)',
    badgeStyle: true,
  },
];

function ServiceCard({
  card,
  active,
  disabled,
  onPress,
  narrow,
}: {
  card: CardDef;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  narrow: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconBox = narrow ? 36 : 40;
  const iconSize = narrow ? 20 : 22;
  const titleColor = active ? card.titleActiveColor : card.titleColor;
  const iconColor = active ? card.iconActiveColor : card.iconColor;
  const iconBg = active ? card.iconActiveBg : card.iconBg;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  };

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
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${card.title}. ${card.subtitle}`}
        style={disabled ? styles.cardDisabled : undefined}
      >
        <LinearGradient
          colors={[...(active ? card.activeGradient : card.idleGradient)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderColor: active ? card.borderActive : card.borderIdle,
            },
          ]}
        >
          <View style={styles.contentCol}>
            <View
              style={[
                styles.iconWrap,
                {
                  width: iconBox,
                  height: iconBox,
                  borderRadius: iconBox / 2,
                  backgroundColor: iconBg,
                },
              ]}
            >
              <AppIcon name={getHomeIcon(card.iconKey)} size={iconSize} color={iconColor} />
            </View>

            <View style={styles.textBlock}>
              <Text
                style={[styles.label, narrow && styles.labelNarrow, { color: titleColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {card.title}
              </Text>

              {card.badgeStyle ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {card.subtitle}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.subtitle, { color: card.subtitleColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {card.subtitle}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export const HomeServiceModeCards = memo(function HomeServiceModeCards({
  value,
  onChange,
  disabled,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;

  const handleSelect = (mode: MealMode) => {
    if (disabled) return;
    if (mode === 'delivery') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(mode);
      return;
    }
    if (mode === value) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(mode);
  };

  return (
    <View style={styles.row}>
      {CARDS.map((card) => (
        <ServiceCard
          key={card.mode}
          card={card}
          active={value === card.mode}
          disabled={disabled}
          narrow={narrow}
          onPress={() => handleSelect(card.mode)}
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
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    padding: CARD_PADDING,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    width: '100%',
    minWidth: 0,
    flexShrink: 1,
    gap: Platform.OS === 'ios' ? 4 : 3,
    paddingVertical: Platform.OS === 'ios' ? 1 : 0,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: -0.25,
    flexShrink: 1,
  },
  labelNarrow: {
    fontSize: 13,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: '#6A7A58',
    letterSpacing: -0.1,
  },
});
