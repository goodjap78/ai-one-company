import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import { recipeRef } from './recipePremiumStyles';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 8;

type Props = {
  baseServings: number;
  targetServings: number;
  onChange: (servings: number) => void;
  onReset: () => void;
};

const labels = getHankkiRecipeMessages();

export function RecipeServingAdjuster({
  baseServings,
  targetServings,
  onChange,
  onReset,
}: Props) {
  const canDecrease = targetServings > MIN_SERVINGS;
  const canIncrease = targetServings < MAX_SERVINGS;
  const showReset = targetServings !== baseServings;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{labels.servingAdjustTitle}</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.stepButton, !canDecrease && styles.stepButtonDisabled]}
          onPress={() => {
            if (!canDecrease) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(targetServings - 1);
          }}
          disabled={!canDecrease}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={labels.servingAdjustDecreaseA11y}
          accessibilityState={{ disabled: !canDecrease }}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <Text style={styles.servingValue} accessibilityRole="text">
          {targetServings}인분
        </Text>

        <Pressable
          style={[styles.stepButton, !canIncrease && styles.stepButtonDisabled]}
          onPress={() => {
            if (!canIncrease) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(targetServings + 1);
          }}
          disabled={!canIncrease}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={labels.servingAdjustIncreaseA11y}
          accessibilityState={{ disabled: !canIncrease }}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>

      {showReset ? (
        <Pressable
          style={styles.resetButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReset();
          }}
          accessibilityRole="button"
          accessibilityLabel={labels.servingAdjustReset}
        >
          <Text style={styles.resetButtonText}>{labels.servingAdjustReset}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.45,
  },
  stepButtonText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
  servingValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
    minWidth: 64,
    textAlign: 'center',
  },
  resetButton: {
    alignSelf: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ds.colors.primary,
  },
});
