import { useLocalSearchParams } from 'expo-router';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { parseRouteParam } from '../../utils/routeParams';

export default function DeliveryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseRouteParam(id);

  return <DeliveryScreen recipeId={recipeId} />;
}
