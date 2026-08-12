import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { getHistory } from '../../services/MealHistoryService';
import { MyCompactRow } from './MyCompactRow';

export function RecentMealHistorySection() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  const loadHistory = useCallback(async () => {
    const history = await getHistory();
    setCount(history.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const { mealHistory: copy } = MY_PAGE_COPY;

  return (
    <MyCompactRow
      title={copy.title}
      subtitle={copy.summaryLabel(count)}
      trailingLabel={copy.viewLabel}
      onPress={() => router.push('/meal-history')}
      accessibilityLabel={`${copy.title}, ${copy.summaryLabel(count)}`}
    />
  );
}
