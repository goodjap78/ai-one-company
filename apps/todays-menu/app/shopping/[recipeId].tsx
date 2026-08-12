import { useLocalSearchParams } from 'expo-router';
import { ShoppingScreen } from '../../components/shopping/ShoppingScreen';
import { parseShoppingListMode } from '../../constants/shoppingConfig';
import { parseRouteParam } from '../../utils/routeParams';

export default function ShoppingListRoute() {
  const { recipeId: rawId, mode: rawMode, seasonings: rawSeasonings } = useLocalSearchParams<{
    recipeId: string;
    mode?: string;
    seasonings?: string;
  }>();
  const recipeId = parseRouteParam(rawId) ?? '';
  const mode = parseShoppingListMode(parseRouteParam(rawMode));
  const seasoningsParam = parseRouteParam(rawSeasonings);
  const showSeasoningsInitially = seasoningsParam === '1' || seasoningsParam === 'true';

  return (
    <ShoppingScreen
      recipeId={recipeId}
      mode={mode}
      showSeasoningsInitially={showSeasoningsInitially}
    />
  );
}
