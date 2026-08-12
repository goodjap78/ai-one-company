import { memo } from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { homePremiumStyles, homeRef } from './homePremiumStyles';

type Props = {
  tip: string;
};

const labels = getHankkiHomeDecisionMessages();
const BULB_SIZE = 20;

export const HomeHoneyTipCard = memo(function HomeHoneyTipCard({ tip }: Props) {
  if (!tip.trim()) return null;

  return (
    <View style={homePremiumStyles.honeyTipCard} accessibilityRole="text">
      <View style={homePremiumStyles.honeyTipHeader}>
        <View style={homePremiumStyles.honeyTipBulbWrap}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={BULB_SIZE}
            color={homeRef.colors.honeyBulb}
          />
        </View>
        <Text style={homePremiumStyles.honeyTipTitle}>{labels.honeyTipSectionLabel}</Text>
      </View>
      <Text style={homePremiumStyles.honeyTipBody}>{tip}</Text>
    </View>
  );
});
