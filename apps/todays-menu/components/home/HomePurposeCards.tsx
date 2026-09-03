import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { HOME_PURPOSES, type HomePurposeId } from '../../constants/homeIaCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';

type Props = {
  activePurpose: HomePurposeId;
  onSelect: (purpose: HomePurposeId) => void;
  disabled?: boolean;
};

/**
 * HANKKI v1.1 — top-level meal intent cards (today / kids / weekly).
 */
export const HomePurposeCards = memo(function HomePurposeCards({
  activePurpose,
  onSelect,
  disabled,
}: Props) {
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {HOME_PURPOSES.map((purpose) => {
        const active = purpose.id === activePurpose;
        return (
          <Pressable
            key={purpose.id}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && !disabled && styles.cardPressed,
              disabled && styles.cardDisabled,
            ]}
            onPress={() => {
              if (disabled) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(purpose.id);
            }}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
            accessibilityLabel={`${purpose.title}. ${purpose.description}`}
          >
            <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
              {purpose.emoji}
            </Text>
            <Text
              style={[styles.title, narrow && styles.titleNarrow, active && styles.titleActive]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {purpose.title}
            </Text>
            {active && !narrow ? (
              <Text style={styles.description} numberOfLines={2}>
                {purpose.description}
              </Text>
            ) : null}
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
    gap: 6,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFCF7',
    borderRadius: ds.radius.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
    minHeight: 64,
    ...ds.shadow.card,
    shadowOpacity: 0.06,
  },
  cardActive: {
    backgroundColor: '#FFF3E8',
    borderColor: 'rgba(232, 140, 90, 0.45)',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#3A2417',
    letterSpacing: -0.25,
  },
  titleNarrow: {
    fontSize: 11,
    lineHeight: 14,
  },
  titleActive: {
    color: '#E85A28',
  },
  description: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: '#8A7464',
    letterSpacing: -0.1,
  },
});
