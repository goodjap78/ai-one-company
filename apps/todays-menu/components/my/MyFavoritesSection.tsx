import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { getFavoriteDisplayCount } from '../../services/favorite';
import { MyCompactRow } from './MyCompactRow';

export function MyFavoritesSection() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);

  const loadCount = useCallback(async () => {
    const nextCount = await getFavoriteDisplayCount();
    setCount(nextCount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCount();
    }, [loadCount]),
  );

  const { favorites: copy } = MY_PAGE_COPY;
  const resolvedCount = count ?? 0;

  return (
    <MyCompactRow
      title={copy.title}
      subtitle={copy.summaryLabel(resolvedCount)}
      trailingLabel={copy.viewLabel}
      onPress={() => router.push('/favorites')}
      accessibilityLabel={`${copy.title}, ${copy.summaryLabel(resolvedCount)}`}
    />
  );
}
