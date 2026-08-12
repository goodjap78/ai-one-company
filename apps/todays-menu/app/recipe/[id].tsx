import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenLoading } from '../../components/ui/ScreenLoading';
import { appChrome } from '../../components/ui/appChrome';
import { fetchRecipe, getMenuById } from '../../services/recipe';
import { parseRouteParam } from '../../utils/routeParams';

export default function RecipeDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseRouteParam(id);

  useEffect(() => {
    if (!recipeId) {
      router.replace('/');
      return;
    }

    let cancelled = false;

    const menu = getMenuById(recipeId);
    if (menu) {
      router.replace(
        menu.mode === 'delivery' ? `/delivery/${recipeId}` : `/ingredients/${recipeId}`,
      );
      return;
    }

    fetchRecipe(recipeId).then((recipe) => {
      if (cancelled) return;
      if (!recipe) {
        router.replace('/');
        return;
      }
      router.replace(
        recipe.mode === 'delivery' ? `/delivery/${recipeId}` : `/ingredients/${recipeId}`,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [recipeId, router]);

  return (
    <SafeAreaView style={[styles.safeArea, appChrome.canvas]}>
      <View style={styles.centered}>
        <ScreenLoading compact />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
