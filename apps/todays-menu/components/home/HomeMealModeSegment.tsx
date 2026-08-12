import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import type { MealMode } from '../../types/home';
import { homeRef } from './homePremiumStyles';

type Props = {
  value: MealMode;
  onChange: (mode: MealMode) => void;
  disabled?: boolean;
  showLabel?: boolean;
  showSubtitle?: boolean;
};

const labels = getHankkiHomeDecisionMessages();

const SEGMENTS: {
  mode: MealMode;
  emoji: string;
  labelKey: 'modeHomemadeOption' | 'modeDeliveryOption';
  subtitleKey: 'modeHomemadeSubtitle' | 'modeDeliverySubtitle';
}[] = [
  {
    mode: 'homemade',
    emoji: '🏠',
    labelKey: 'modeHomemadeOption',
    subtitleKey: 'modeHomemadeSubtitle',
  },
  {
    mode: 'delivery',
    emoji: '🍽',
    labelKey: 'modeDeliveryOption',
    subtitleKey: 'modeDeliverySubtitle',
  },
];

export const HomeMealModeSegment = memo(function HomeMealModeSegment({
  value,
  onChange,
  disabled,
  showLabel = true,
  showSubtitle = true,
}: Props) {
  const handleSelect = (mode: MealMode) => {
    if (mode === value || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(mode);
  };

  return (
    <View style={styles.section}>
      {showLabel ? <Text style={styles.title}>{labels.modeSectionLabel}</Text> : null}
      <View style={styles.track}>
        {SEGMENTS.map((segment) => {
          const active = value === segment.mode;
          const title = labels[segment.labelKey];
          const subtitle = labels[segment.subtitleKey];
          return (
            <Pressable
              key={segment.mode}
              style={({ pressed }) => [
                styles.segment,
                active && styles.segmentActive,
                pressed && !disabled && styles.segmentPressed,
                disabled && styles.segmentDisabled,
              ]}
              onPress={() => handleSelect(segment.mode)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={showSubtitle ? `${title}. ${subtitle}` : title}
            >
              <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>
                {segment.emoji} {title}
              </Text>
              {showSubtitle ? (
                <Text style={[styles.segmentSubtitle, active && styles.segmentSubtitleActive]}>
                  {subtitle}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  track: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: homeRef.colors.track,
    borderRadius: homeRef.card.radius,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: homeRef.button.radius - 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  segmentActive: {
    backgroundColor: homeRef.colors.surface,
    shadowColor: '#C45A2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  segmentPressed: {
    opacity: 0.88,
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentTitle: {
    ...theme.typography.metaText,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  segmentTitleActive: {
    color: theme.colors.textPrimary,
  },
  segmentSubtitle: {
    ...theme.typography.metaText,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 15,
  },
  segmentSubtitleActive: {
    color: theme.colors.textSecondary,
  },
});
