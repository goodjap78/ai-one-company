import { memo } from 'react';
import { Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { homePremiumStyles } from './homePremiumStyles';

type Props = {
  label?: string;
};

const labels = getHankkiHomeDecisionMessages();

export const HomeRecommendationBadge = memo(function HomeRecommendationBadge({ label }: Props) {
  return (
    <View style={homePremiumStyles.recommendationBadge}>
      <Text style={homePremiumStyles.recommendationBadgeText}>
        {label ?? labels.recommendationBadgeLabel}
      </Text>
    </View>
  );
});
