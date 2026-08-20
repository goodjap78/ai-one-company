import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenLoading } from '../ui/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getHankkiFavoriteRemovedToast,
  getHankkiFavoriteSavedToast,
  getHankkiFavoritesMessages,
} from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import { NAV_BACK } from '../../constants/navigationCopy';
import { mobileShell } from '../../constants/mobileShell';
import { useTabScreenPadding } from '../../hooks/useTabScreenPadding';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { resolveFavoriteCards } from '../../services/favorite';
import { getFavoriteRecipeIds, getFavorites, toggleFavorite } from '../../services/FavoriteService';
import { setRecipeOpenSource } from '../../services/analytics';
import { getCurrentMealType } from '../../utils/mealType';
import { Toast } from '../home/Toast';
import { FavoritesEmptyState } from './FavoritesEmptyState';
import { RecipeCard } from './RecipeCard';
import type { FavoriteCardData } from '../../services/favorite';

const labels = getHankkiFavoritesMessages();

type Props = {
  variant?: 'stack' | 'tab';
};

export function FavoritesScreen({ variant = 'stack' }: Props) {
  const router = useRouter();
  const { scrollPaddingBottom } = useTabScreenPadding();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FavoriteCardData[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const isTab = variant === 'tab';
  const contentBottomPadding = isTab ? scrollPaddingBottom : ds.spacing.xl;

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const preferences = await getFavorites();
    const cards = await resolveFavoriteCards(preferences);
    const ids = await getFavoriteRecipeIds();
    setItems(cards);
    setFavoriteIds(new Set(ids));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
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
    await loadFavorites();
  };

  const handleOpenRecipe = (item: FavoriteCardData) => {
    setRecipeOpenSource('favorite');
    router.push(`/ingredients/${item.recipeId}`);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, appChrome.canvas]}
      edges={isTab ? ['top'] : ['top', 'bottom']}
    >
      <View style={mobileShell.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            mobileShell.scrollContent,
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.frame}>
            <ScreenBackButton
              label={isTab ? NAV_BACK.home : NAV_BACK.myPage}
              fallbackHref={isTab ? '/(tabs)' : '/(tabs)/my'}
            />

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
              <FavoritesEmptyState onGoHome={handleGoHome} />
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
