import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NAV_BACK } from '../../constants/navigationCopy';
import { SHOPPING_CONFIG } from '../../constants/shoppingConfig';
import { SHOPPING_COPY } from '../../constants/shoppingCopy';
import { ds } from '../../constants/designSystem';
import { isMealKitFeatureEnabled } from '../../constants/featureFlags';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { useMealKitProductSearch } from '../../hooks/useMealKitProductSearch';
import { getMealKitEligibility } from '../../services/shopping/mealKit/mealKitEligibility';
import { openShoppingProduct } from '../../services/shopping/openShoppingProduct';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { MealImageView } from '../meal/MealImageView';
import { recipePremiumStyles, recipeRef } from '../recipe/recipePremiumStyles';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ShoppingProductCard } from './ShoppingProductCard';

type Props = {
  recipeId: string;
};

/**
 * Sprint 66-A — meal-kit shopping mode UI (embedded in ShoppingScreen route).
 * Single keyword search; max 3 products; reuses product cards + affiliate outbound.
 */
export function MealKitShoppingPanel({ recipeId }: Props) {
  const recipe = getHankkiRecipeById(recipeId);
  const featureEnabled = isMealKitFeatureEnabled();
  const eligibility = featureEnabled ? getMealKitEligibility(recipeId) : null;
  const heroImage = recipe ? resolveMealHeroImage(recipeId, 'homemade') : null;
  const recipeName = eligibility?.recipeName ?? recipe?.name ?? null;
  const searchKeyword = eligibility?.searchKeyword ?? null;

  const search = useMealKitProductSearch(
    recipeName,
    searchKeyword,
    Boolean(featureEnabled && eligibility),
  );

  const disclosureText = SHOPPING_CONFIG.affiliateDisclosureText?.trim() ?? '';

  if (!featureEnabled) {
    return (
      <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.empty}>{SHOPPING_COPY.mealKitFeatureUnavailable}</Text>
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />
        </View>
      </SafeAreaView>
    );
  }

  if (!eligibility) {
    return (
      <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.empty}>{SHOPPING_COPY.invalidRecipe}</Text>
          <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={recipePremiumStyles.canvas} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            {heroImage ? (
              <MealImageView
                image={heroImage}
                containerStyle={styles.heroThumb}
                style={styles.heroThumbInner}
                variant="thumb"
              />
            ) : null}
            <View style={styles.headerCopy}>
              <Text style={styles.screenTitle} accessibilityRole="header">
                {SHOPPING_COPY.mealKitScreenTitle}
              </Text>
              <Text style={styles.recipeName} numberOfLines={2}>
                {eligibility.recipeName}
              </Text>
              <Text style={styles.hint}>{SHOPPING_COPY.mealKitScreenHint}</Text>
            </View>
          </View>
        </View>

        {disclosureText.length > 0 ? (
          <Text style={styles.disclosure}>{disclosureText}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>{SHOPPING_COPY.mealKitProductsTitle}</Text>

        {search.status === 'loading' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={ds.colors.primary} />
            <Text style={styles.statusText}>{SHOPPING_COPY.productsLoading}</Text>
          </View>
        ) : null}

        {search.status === 'disabled' ? (
          <Text style={styles.statusText}>{SHOPPING_COPY.productsDisabled}</Text>
        ) : null}

        {search.status === 'error' ? (
          <Text style={styles.statusText}>{SHOPPING_COPY.productsError}</Text>
        ) : null}

        {search.status === 'empty' ? (
          <Text style={styles.emptyCard}>{SHOPPING_COPY.mealKitEmpty}</Text>
        ) : null}

        {search.status === 'success' && search.products.length > 0 ? (
          <View style={styles.products}>
            {search.products.map((product) => (
              <ShoppingProductCard
                key={product.id}
                product={product}
                onPress={() => {
                  void openShoppingProduct(product);
                }}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.sm,
    paddingBottom: ds.spacing.xl,
    gap: ds.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  headerCard: {
    backgroundColor: recipeRef.colors.card,
    borderRadius: 16,
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroThumbInner: {
    borderRadius: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  screenTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  recipeName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textWarm,
  },
  hint: {
    ...ds.typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: recipeRef.colors.textMuted,
    fontWeight: '600',
  },
  disclosure: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    textAlign: 'left',
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
  },
  empty: {
    ...ds.typography.body,
    color: recipeRef.colors.textMuted,
    textAlign: 'center',
  },
  emptyCard: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textWarm,
    textAlign: 'center',
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: recipeRef.colors.divider,
  },
  products: {
    gap: 8,
  },
});
