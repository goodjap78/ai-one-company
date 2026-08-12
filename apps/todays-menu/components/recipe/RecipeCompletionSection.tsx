import { StyleSheet, Text, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { SeedMascot } from '../common/SeedMascot';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  tip?: string | null;
  mealTitle: string;
};

const labels = getHankkiRecipeMessages();

/**
 * Sprint R2 — 완성 section before bottom actions.
 */
export function RecipeCompletionSection({ tip, mealTitle }: Props) {
  const body = tip?.trim() || labels.completionDefaultBody(mealTitle);

  return (
    <View style={styles.section}>
      <Text style={recipePremiumStyles.sectionTitle}>{labels.completionSectionTitle}</Text>
      <View style={styles.card}>
        <SeedMascot variant="happy" size={44} style={styles.seed} />
        <View style={styles.copy}>
          <Text style={styles.title}>{labels.completionCardTitle}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: recipeRef.colors.creamTip,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: recipeRef.colors.tipBorder,
  },
  seed: {
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: recipeRef.colors.textWarm,
  },
});
