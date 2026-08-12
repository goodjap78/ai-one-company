import { useLocalSearchParams } from 'expo-router';
import { CookingScreen } from '../../components/cooking/CookingScreen';
import { parseRouteParam } from '../../utils/routeParams';

export default function CookingRoute() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const id = parseRouteParam(recipeId);

  return <CookingScreen recipeId={id} />;
}
