import { ElementaryWeeklyShareQaScreen } from '../../components/qa/ElementaryWeeklyShareQaScreen';
import { isInternalQaEnabled } from '../../utils/isInternalQaEnabled';
import { Redirect } from 'expo-router';

export default function ElementaryWeeklyShareQaRoute() {
  if (!isInternalQaEnabled()) {
    return <Redirect href="/" />;
  }
  return <ElementaryWeeklyShareQaScreen />;
}
