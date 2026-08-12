import { memo } from 'react';
import { Text, View } from 'react-native';
import type { TrustReasonChip } from '../../utils/buildTrustReasonChips';
import { homePremiumStyles } from './homePremiumStyles';

type Props = {
  chips: TrustReasonChip[];
};

/**
 * Compact weather card — emoji left, title + subtitle right.
 * Prefers the weather chip when present; otherwise first chip.
 */
export const TrustReasonChips = memo(function TrustReasonChips({ chips }: Props) {
  if (chips.length === 0) return null;

  const weather = chips.find((chip) => chip.id === 'weather');
  const chip = weather ?? chips[0];
  const title = chip.id === 'weather' ? chip.text : chip.displayTitle;
  const subtitle = chip.displaySubtitle;

  return (
    <View
      style={homePremiumStyles.weatherCard}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={homePremiumStyles.weatherIconWrap}>
        <Text style={homePremiumStyles.weatherEmoji}>{chip.emoji}</Text>
      </View>
      <View style={homePremiumStyles.weatherTextBlock}>
        <Text style={homePremiumStyles.weatherTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={homePremiumStyles.weatherSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
});
