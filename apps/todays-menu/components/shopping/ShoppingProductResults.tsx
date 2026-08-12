import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { ds } from '../../constants/designSystem';
import type { IngredientProductResult } from '../../types/shoppingProduct';
import { trackShoppingEvent } from '../../services/shopping/shoppingAnalytics';
import { openShoppingProduct } from '../../services/shopping/openShoppingProduct';
import { recipeRef } from '../recipe/recipePremiumStyles';
import { ShoppingProductCard } from './ShoppingProductCard';

type Props = {
  result: IngredientProductResult;
};

function statusMessage(status: IngredientProductResult['status']): string | null {
  switch (status) {
    case 'disabled':
      return SHOPPING_COPY.productsDisabled;
    case 'loading':
      return SHOPPING_COPY.productsLoading;
    case 'empty':
      return SHOPPING_COPY.productsEmpty;
    case 'error':
      return SHOPPING_COPY.productsError;
    case 'idle':
      return null;
    case 'success':
      return null;
    default:
      return null;
  }
}

export function ShoppingProductResults({ result }: Props) {
  const message = statusMessage(result.status);

  if (result.status === 'loading') {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={ds.colors.primary} />
        <Text style={styles.statusText}>{SHOPPING_COPY.productsLoading}</Text>
      </View>
    );
  }

  if (result.status === 'success' && result.products.length > 0) {
    return (
      <ProductList
        products={result.products}
        onOpen={(item) => {
          void openShoppingProduct(item);
        }}
      />
    );
  }

  if (!message) return null;

  return <Text style={styles.statusText}>{message}</Text>;
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    paddingHorizontal: 4,
  },
  products: {
    gap: 8,
    paddingTop: 4,
  },
});

function ProductList({
  products,
  onOpen,
}: {
  products: IngredientProductResult['products'];
  onOpen: (product: IngredientProductResult['products'][number]) => void;
}) {
  useEffect(() => {
    for (const product of products) {
      trackShoppingEvent('shopping_product_impression', {
        productId: product.id,
        keyword: product.keyword,
      });
    }
  }, [products]);

  return (
    <View style={styles.products}>
      {products.map((product) => (
        <ShoppingProductCard key={product.id} product={product} onPress={onOpen} />
      ))}
    </View>
  );
}
