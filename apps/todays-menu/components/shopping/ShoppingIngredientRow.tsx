import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { resolveIngredientIcon } from '../../services/images/resolveIngredientIcon';
import type { ShoppingIngredientItem } from '../../types/shopping';
import { recipeRef } from '../recipe/recipePremiumStyles';

type Props = {
  item: ShoppingIngredientItem;
  selected: boolean;
  onToggle: () => void;
};

export function ShoppingIngredientRow({ item, selected, onToggle }: Props) {
  const iconSource = resolveIngredientIcon({
    name: item.ingredientName,
    iconKey: item.iconKey,
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${item.ingredientName} ${item.amountText}`}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>

      <View style={styles.iconWrap}>
        {iconSource ? (
          <Image source={iconSource} style={styles.icon} resizeMode="contain" />
        ) : (
          <View style={styles.iconFallback} />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={2}>
          {item.ingredientName}
        </Text>
        <Text style={styles.amount} numberOfLines={1}>
          {item.amountText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  rowPressed: {
    opacity: 0.92,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D8C4B0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFCF7',
  },
  checkboxSelected: {
    backgroundColor: ds.colors.primary,
    borderColor: ds.colors.primary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: recipeRef.colors.pastelCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 32,
    height: 32,
  },
  iconFallback: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: recipeRef.colors.divider,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
  amount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
  },
});
