import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getHankkiFavoriteRemovedToast,
  getHankkiFavoriteSavedToast,
  getHankkiViewedRecipesMessages,
} from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import { NAV_BACK } from '../../constants/navigationCopy';
import { mobileShell } from '../../constants/mobileShell';
import { getFavoriteRecipeIds, toggleFavorite } from '../../services/FavoriteService';
import type { FavoriteCardData } from '../../services/favorite';
import {
  getViewedRecipeHistory,
  resolveViewedCards,
} from '../../services/viewedRecipe';
import { getCurrentMealType } from '../../utils/mealType';
import { RecipeCard } from '../favorites/RecipeCard';
import { Toast } from '../home/Toast';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { ViewedRecipesEmptyState } from './ViewedRecipesEmptyState';

const labels = getHankkiViewedRecipesMessages();

export function ViewedRecipesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FavoriteCardData[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const loadViewedRecipes = useCallback(async () => {
    setLoading(true);
    const entries = await getViewedRecipeHistory();
    const cards = await resolveViewedCards(entries);
    const ids = await getFavoriteRecipeIds();
    setItems(cards);
    setFavoriteIds(new Set(ids));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadViewedRecipes();
    }, [loadViewedRecipes]),
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleToggleFavorite = async (recipeId: string) => {
    const result = await toggleFavorite(recipeId, getCurrentMealType());
    if (result.added) {
      showToast(getHankkiFavoriteSavedToast());
    } else if (!result.isFavorite) {
      showToast(getHankkiFavoriteRemovedToast());
    }
    await loadViewedRecipes();
  };

  const handleOpenRecipe = (item: FavoriteCardData) => {
    if (item.mode === 'delivery') {
      router.push(`/delivery/${item.recipeId}`);
      return;
    }
    router.push(`/ingredients/${item.recipeId}`);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, appChrome.canvas]}
      edges={['top', 'bottom']}
    >
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            mobileShell.scrollContent,
            styles.scrollContent,
            { paddingBottom: ds.spacing.xl },
          ]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  {labels.screenTitle}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
                  {labels.screenSubtitle}
                </Text>
              </View>
              <Text style={styles.character} accessibilityLabel="한끼">
                😊
              </Text>
            </View>

            {loading ? (
              <ScreenLoading message={labels.loadingMessage} compact />
            ) : items.length === 0 ? (
              <ViewedRecipesEmptyState onGoHome={handleGoHome} />
            ) : (
              <View style={styles.list}>
                {items.map((item) => (
                  <RecipeCard
                    key={item.recipeId}
                    item={item}
                    isFavorite={favoriteIds.has(item.recipeId)}
                    onPress={() => handleOpenRecipe(item)}
                    onToggleFavorite={() => handleToggleFavorite(item.recipeId)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.toastHost}>
          <Toast
            message={toastMessage}
            visible={toastVisible}
            onHide={() => setToastVisible(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: ds.spacing.md,
  },
  frame: {
    width: '100%',
    gap: ds.spacing.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: ds.spacing.md,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  character: {
    fontSize: ds.character.fontSize,
    lineHeight: ds.character.lineHeight,
    marginTop: 4,
  },
  list: {
    gap: ds.spacing.md,
  },
  toastHost: {
    position: 'absolute',
    bottom: ds.spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
