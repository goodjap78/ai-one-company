import { useRouter } from 'expo-router';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { MySectionCard } from './MySectionCard';

export function MyAiRecommendationSection() {
  const router = useRouter();
  const copy = MY_PAGE_COPY.aiSettings;

  return (
    <MySectionCard
      emoji={copy.emoji}
      title={copy.title}
      subtitle={copy.subtitle}
      onPress={() => router.push('/ai-recommendation-settings')}
      accessibilityLabel={copy.title}
    />
  );
}
