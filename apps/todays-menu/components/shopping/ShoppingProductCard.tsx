import * as Haptics from 'expo-haptics';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import type { ShoppingProduct } from '../../types/shoppingProduct';
import { canOpenShoppingProduct } from '../../services/shopping/resolveOutboundProductUrl';
import { recipeRef } from '../recipe/recipePremiumStyles';

type Props = {
  product: ShoppingProduct;
  onPress: (product: ShoppingProduct) => void;
};

function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

/**
 * Sprint 63-D — real product row only (no synthetic catalog cards).
 */
export function ShoppingProductCard({ product, onPress }: Props) {
  const priceLabel = formatPrice(product.price);
  const originalLabel = formatPrice(product.originalPrice);
  const canOpen = canOpenShoppingProduct(product);

  const handlePress = () => {
    if (!canOpen) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(product);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !canOpen && styles.cardDisabled,
        pressed && canOpen && styles.cardPressed,
      ]}
      onPress={handlePress}
      disabled={!canOpen}
      accessibilityRole="button"
      accessibilityLabel={product.title}
      accessibilityState={{ disabled: !canOpen }}
    >
      <View style={styles.thumbWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbFallback} />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {priceLabel ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{priceLabel}</Text>
            {originalLabel && originalLabel !== priceLabel ? (
              <Text style={styles.originalPrice}>{originalLabel}</Text>
            ) : null}
          </View>
        ) : null}
        {canOpen ? (
          <Text style={styles.hint}>{SHOPPING_COPY.productExternalHint}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  cardDisabled: {
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.92,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: recipeRef.colors.pastelCard,
  },
  thumb: {
    width: 52,
    height: 52,
  },
  thumbFallback: {
    flex: 1,
    backgroundColor: recipeRef.colors.divider,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  originalPrice: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
  },
});
