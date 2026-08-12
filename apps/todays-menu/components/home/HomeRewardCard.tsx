import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import { getHomeIcon } from './homeIcons';

type Props = {
  onPress?: () => void;
};

/**
 * Reward promo — still “준비 중”; tap opens Coming Soon survey (H3-12).
 */
export const HomeRewardCard = memo(function HomeRewardCard({ onPress }: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;

  return (
    <Pressable
      style={({ pressed }) => [styles.outer, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${northStarHomeCopy.reward.title}. ${northStarHomeCopy.reward.badge}. ${northStarHomeCopy.reward.body}`}
    >
      <LinearGradient
        colors={['#FFF8EF', '#FFE8D0', '#FFDCC0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.iconWrap, narrow && styles.iconWrapNarrow]}>
          <AppIcon name={getHomeIcon('reward')} size={narrow ? 22 : 24} color="#E85A28" />
        </View>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, narrow && styles.titleNarrow]} numberOfLines={1}>
              {northStarHomeCopy.reward.title}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{northStarHomeCopy.reward.badge}</Text>
            </View>
          </View>
          <Text style={[styles.body, narrow && styles.bodyNarrow]} numberOfLines={2}>
            {northStarHomeCopy.reward.body}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: ds.radius.card,
    ...ds.shadow.card,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    width: '100%',
    borderRadius: ds.radius.card,
    paddingVertical: ds.spacing.cardInner,
    paddingHorizontal: ds.spacing.cardInner,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 170, 120, 0.28)',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFCF7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapNarrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    ...ds.typography.body,
    fontWeight: '800',
    color: '#3A2417',
    letterSpacing: -0.2,
  },
  titleNarrow: {
    fontSize: 15,
    lineHeight: 20,
  },
  badge: {
    flexShrink: 0,
    backgroundColor: 'rgba(255,252,247,0.92)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#8A6A52',
  },
  body: {
    ...ds.typography.caption,
    fontWeight: '500',
    color: '#8A5A3E',
  },
  bodyNarrow: {
    fontSize: 12,
    lineHeight: 17,
  },
});
