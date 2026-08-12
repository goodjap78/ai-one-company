import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '../../constants/designSystem';
import { MEAL_HISTORY_COPY, formatMealHistoryDate } from '../../constants/mealHistoryCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { getHistory } from '../../services/MealHistoryService';
import type { MealHistoryEntry } from '../../types/mealHistory';
import { getMealTypeLabel } from '../../utils/mealType';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { SectionEmptyState } from '../ui/SectionEmptyState';
import { appChrome } from '../ui/appChrome';
import { screenLayout } from '../ui/screenLayout';
type DateGroup = {
  cookedDate: string;
  dateLabel: string;
  items: MealHistoryEntry[];
};

function groupMealHistoryByDate(entries: MealHistoryEntry[]): DateGroup[] {
  const groups: DateGroup[] = [];

  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last?.cookedDate === entry.cookedDate) {
      last.items.push(entry);
      continue;
    }

    groups.push({
      cookedDate: entry.cookedDate,
      dateLabel: formatMealHistoryDate(entry.cookedDate),
      items: [entry],
    });
  }

  return groups;
}

export function MealHistoryScreen() {
  const [items, setItems] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const history = await getHistory();
    setItems(history);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const groups = useMemo(() => groupMealHistoryByDate(items), [items]);

  return (
    <SafeAreaView style={[screenLayout.safeArea, appChrome.canvas]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={screenLayout.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenLayout.frame}>
          <ScreenBackButton label={NAV_BACK.myPage} fallbackHref="/(tabs)/my" />

          <View style={styles.headerBlock}>
            <Text style={screenLayout.title}>{MEAL_HISTORY_COPY.sectionTitle}</Text>
            <Text style={screenLayout.subtitle}>{MEAL_HISTORY_COPY.screenSubtitle}</Text>
          </View>

          {loading ? (
            <ScreenLoading compact />
          ) : items.length === 0 ? (
            <SectionEmptyState
              emoji="🍚"
              title={MEAL_HISTORY_COPY.emptyMessage}
              message={MEAL_HISTORY_COPY.emptyHint}
            />
          ) : (
            <View style={styles.list}>
              {groups.map((group) => (
                <View key={group.cookedDate} style={styles.dateGroup}>
                  <Text style={styles.dateLabel}>{group.dateLabel}</Text>
                  {group.items.map((entry) => (
                    <Text key={entry.id} style={styles.mealLine} numberOfLines={1} ellipsizeMode="tail">
                      {getMealTypeLabel(entry.mealType)} · {entry.recipeName ?? entry.recipeId}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: ds.spacing.md,
  },
  list: {
    gap: ds.spacing.md,
  },
  dateGroup: {
    gap: ds.spacing.md,
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    padding: ds.spacing.cardInner,
    ...ds.shadow.card,
  },
  dateLabel: {
    ...ds.typography.caption,
    color: ds.colors.textPrimary,
    fontWeight: '700',
  },
  mealLine: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    fontWeight: '500',
  },
});