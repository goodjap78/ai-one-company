import { useLocalSearchParams } from 'expo-router';
import { IngredientsScreen } from '../../components/ingredients/IngredientsScreen';
import { parseRouteParam } from '../../utils/routeParams';

export default function IngredientsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseRouteParam(id);

  return <IngredientsScreen recipeId={recipeId} />;
}
