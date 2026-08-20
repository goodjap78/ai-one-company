import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listMealKitQaRecipes,
  MEAL_KIT_QA_MENU_COUNT,
  type MealKitQaListItem,
} from '../../constants/mealKitQaFixtures';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import { isMealKitFeatureEnabled } from '../../constants/featureFlags';
import { isInternalQaEnabled } from '../../utils/isInternalQaEnabled';
import { setRecipeOpenSource } from '../../services/analytics';
import { recipePremiumStyles, recipeRef } from '../recipe/recipePremiumStyles';
import { ScreenBackButton } from '../ui/ScreenBackButton';

/**
 * Preview/dev-only jump list from production meal-kit eligibility.
 */
export function MealKitQaScreen() {
  const router = useRouter();
  const items = useMemo(() => listMealKitQaRecipes(), []);
  const existing = items.filter((item) => item.section === 'existing');
  const expansion = items.filter((item) => item.section === 'expansion');

  useEffect(() => {
    if (!isMealKitFeatureEnabled() || !isInternalQaEnabled()) {
      router.replace('/(tabs)');
    }
  }, [router]);

  if (!isMealKitFeatureEnabled() || !isInternalQaEnabled()) {
    return null;
  }

  const openRecipe = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecipeOpenSource('qa');
    router.push(`/ingredients/${recipeId}`);
  };

  const openMealKit = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/shopping/${recipeId}?mode=meal-kit`);
  };

  return (
    <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <ScreenBackButton label={NAV_BACK.myPage} fallbackHref="/(tabs)/my" />
        <Text style={styles.title} accessibilityRole="header">
          Meal Kit QA
        </Text>
        <Text style={styles.count}>총 {MEAL_KIT_QA_MENU_COUNT}개</Text>
        <Text style={styles.hint}>
          production eligibility 목록입니다. 레시피 상세 또는 밀키트 쇼핑으로 바로 이동합니다.
        </Text>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Section title={`기존 validated (${existing.length})`} items={existing} onRecipe={openRecipe} onMealKit={openMealKit} />
          <Section title={`신규 catalog expansion (${expansion.length})`} items={expansion} onRecipe={openRecipe} onMealKit={openMealKit} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  items,
  onRecipe,
  onMealKit,
}: {
  title: string;
  items: MealKitQaListItem[];
  onRecipe: (recipeId: string) => void;
  onMealKit: (recipeId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.recipeId} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.buttonText}>
              <Text style={styles.buttonLabel}>
                [{item.displayId}] {item.recipeName}
              </Text>
              <Text style={styles.keyword}>{item.searchKeyword}</Text>
            </View>
            <View style={[styles.badge, item.section === 'expansion' ? styles.badgeNew : styles.badgeExisting]}>
              <Text style={styles.badgeText}>{item.section === 'expansion' ? '신규' : '기존'}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              onPress={() => onRecipe(item.recipeId)}
              accessibilityRole="button"
              accessibilityLabel={`${item.recipeName} 레시피 열기`}
            >
              <Text style={styles.actionLabel}>레시피</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}
              onPress={() => onMealKit(item.recipeId)}
              accessibilityRole="button"
              accessibilityLabel={`${item.recipeName} 밀키트 열기`}
            >
              <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>밀키트</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  count: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
  },
  list: {
    gap: 14,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: recipeRef.colors.textMuted,
    marginTop: 6,
  },
  card: {
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  buttonText: {
    flex: 1,
    gap: 2,
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
  keyword: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeExisting: {
    backgroundColor: '#EEE8E1',
  },
  badgeNew: {
    backgroundColor: '#FFE8D6',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.secondaryBorder,
  },
  actionPrimary: {
    backgroundColor: ds.colors.primaryDark,
    borderColor: ds.colors.primaryDark,
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
  actionLabelPrimary: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
  },
});
