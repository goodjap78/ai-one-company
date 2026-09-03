import * as Haptics from 'expo-haptics';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppIcon } from '../ui/AppIcon';
import { ds } from '../../constants/designSystem';
import {
  getHomePurposeById,
  HOME_WEEKLY_AUDIENCES,
  HOME_WEEKLY_MEAL_LABELS,
  type HomePurposeId,
  type HomeWeeklyAudienceId,
} from '../../constants/homeIaCopy';
import { NARROW_WIDTH_BREAKPOINT } from '../../constants/tabBarLayout';
import type { HomeIconKey } from './homeIcons';
import { getHomeIcon } from './homeIcons';

const ENTRY_GAP = 5;

const ICON_BY_ENTRY: Record<string, HomeIconKey> = {
  babyFood: 'homemade',
  toddlerMeals: 'kids',
  elementary: 'kids',
  toddlerBreakfast: 'kids',
  toddlerDinner: 'kids',
  elemBreakfast: 'homemade',
  elemDinner: 'homemade',
};

type Props = {
  activePurpose: HomePurposeId;
};

/**
 * HANKKI v1.1 Sprint 1.1 — purpose-specific secondary entries (kids / weekly only).
 * Sprint 12 — weekly uses 2-step audience → meal so chips stay uncluttered.
 */
export const HomePurposeSubPanel = memo(function HomePurposeSubPanel({ activePurpose }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const narrow = width <= NARROW_WIDTH_BREAKPOINT;
  const [weeklyAudience, setWeeklyAudience] = useState<HomeWeeklyAudienceId | null>(null);

  useEffect(() => {
    if (activePurpose !== 'weekly') {
      setWeeklyAudience(null);
    }
  }, [activePurpose]);

  const purpose = getHomePurposeById(activePurpose);
  const entries = purpose.entries ?? [];

  const weeklyMealEntries = useMemo(() => {
    if (!weeklyAudience) return [];
    const prefix = weeklyAudience === 'toddler' ? 'toddler' : 'elem';
    return entries.filter(
      (entry) =>
        entry.id === `${prefix}Breakfast` || entry.id === `${prefix}Dinner`,
    );
  }, [entries, weeklyAudience]);

  if (activePurpose === 'today') {
    return null;
  }

  if (entries.length === 0) {
    return null;
  }

  if (activePurpose === 'weekly') {
    if (!weeklyAudience) {
      return (
        <View style={styles.row}>
          {HOME_WEEKLY_AUDIENCES.map((audience) => (
            <Pressable
              key={audience.id}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWeeklyAudience(audience.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={audience.title}
            >
              <AppIcon
                name={getHomeIcon(audience.id === 'toddler' ? 'kids' : 'homemade')}
                size={narrow ? 15 : 16}
                color="#E85A28"
              />
              <Text
                style={[styles.title, narrow && styles.titleNarrow]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {audience.title}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.weeklyStack}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setWeeklyAudience(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="대상 다시 선택"
          hitSlop={8}
        >
          <Text style={styles.backAudience}>
            ← {weeklyAudience === 'toddler' ? '유아' : '초등학생'}
          </Text>
        </Pressable>
        <View style={styles.row}>
          {weeklyMealEntries.map((entry) => {
            const mealLabel = entry.id.endsWith('Breakfast')
              ? HOME_WEEKLY_MEAL_LABELS.breakfast
              : HOME_WEEKLY_MEAL_LABELS.dinner;
            const iconKey = ICON_BY_ENTRY[entry.id] ?? 'pairingDefault';
            return (
              <Pressable
                key={entry.id}
                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(entry.href as Href);
                }}
                accessibilityRole="button"
                accessibilityLabel={entry.title}
              >
                <AppIcon name={getHomeIcon(iconKey)} size={narrow ? 15 : 16} color="#E85A28" />
                <Text
                  style={[styles.title, narrow && styles.titleNarrow]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {mealLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {entries.map((entry) => {
        const iconKey = ICON_BY_ENTRY[entry.id] ?? 'pairingDefault';
        return (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(entry.href as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel={entry.title}
          >
            <AppIcon name={getHomeIcon(iconKey)} size={narrow ? 15 : 16} color="#E85A28" />
            <Text
              style={[styles.title, narrow && styles.titleNarrow]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {entry.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  weeklyStack: {
    width: '100%',
    gap: 8,
  },
  backAudience: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: ds.colors.textSecondary,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: ENTRY_GAP,
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
    borderColor: ds.colors.borderLight,
    backgroundColor: '#FFFCF7',
    minHeight: 54,
    ...ds.shadow.card,
    shadowOpacity: 0.07,
  },
  btnPressed: {
    opacity: 0.9,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: '#3A2417',
    letterSpacing: -0.3,
  },
  titleNarrow: {
    fontSize: 11,
    lineHeight: 14,
  },
});
