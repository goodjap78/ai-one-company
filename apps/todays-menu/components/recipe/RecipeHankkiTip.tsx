import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { recipePremiumStyles } from './recipePremiumStyles';

type Props = {
  tip: string;
};

const labels = getHankkiRecipeMessages();

export function RecipeHankkiTip({ tip }: Props) {
  return (
    <View style={recipePremiumStyles.honeyTipCard}>
      <Text style={styles.title}>{labels.tipTitle}</Text>
      <Text style={styles.body}>{tip}</Text>
      <Text style={styles.character} accessibilityLabel="한끼">
        😊
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...ds.typography.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  body: {
    ...ds.typography.body,
    color: '#5C5348',
    paddingRight: 32,
  },
  character: {
    ...ds.character.position,
    fontSize: ds.character.fontSize,
    lineHeight: ds.character.lineHeight,
  },
});
