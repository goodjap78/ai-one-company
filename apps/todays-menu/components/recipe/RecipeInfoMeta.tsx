import { StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages, getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import type { Difficulty } from '../../types/home';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  cookingTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  calories?: number | null;
  isDelivery?: boolean;
};

const labels = getHankkiRecipeMessages();
const difficultyLabels = getHankkiHomeDecisionMessages().difficultyLabels;

/**
 * Sprint R1 — horizontal quick-info card: 조리시간 / 난이도 / 인분 / 칼로리.
 */
export function RecipeInfoMeta({
  cookingTimeMinutes,
  difficulty,
  servings,
  calories,
  isDelivery = false,
}: Props) {
  const calorieLabel =
    typeof calories === 'number' && calories > 0 ? `${calories}` : '—';

  const items = [
    {
      key: 'time',
      label: isDelivery ? labels.metaDeliveryTime : labels.metaTime,
      value: `${cookingTimeMinutes}분`,
    },
    {
      key: 'difficulty',
      label: labels.metaDifficulty,
      value: difficultyLabels[difficulty],
    },
    {
      key: 'servings',
      label: labels.metaServings,
      value: `${servings}인분`,
    },
    {
      key: 'calories',
      label: labels.metaCalories,
      value: calorieLabel === '—' ? '—' : `${calorieLabel}kcal`,
    },
  ];

  return (
    <View style={styles.container} accessibilityRole="summary">
      {items.map((item, index) => (
        <View key={item.key} style={styles.itemWrap}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View
            style={styles.item}
            accessibilityLabel={`${item.label} ${item.value}`}
          >
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.value} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...recipePremiumStyles.panel,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  itemWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 4,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    textAlign: 'center',
  },
  value: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
    textAlign: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: recipeRef.colors.divider,
    marginVertical: 6,
  },
});
