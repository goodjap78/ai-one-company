import { Image, StyleSheet, Text, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import type { RecipeStep } from '../../types/recipe';
import { resolveStepImageSource } from '../../utils/resolveStepImageSource';
import { recipePremiumStyles, recipeRef } from './recipePremiumStyles';

type Props = {
  steps: RecipeStep[];
};

const labels = getHankkiRecipeMessages();

function StepTip({ tip }: { tip: string }) {
  return (
    <View style={styles.tipInline}>
      <Text style={styles.tipBulb}>💡</Text>
      <Text style={styles.tipBody} numberOfLines={2}>
        <Text style={styles.tipLabel}>Tip </Text>
        {tip}
      </Text>
    </View>
  );
}

/**
 * Sprint R3-2 — tip sits inline under instruction inside the same card (no empty gap).
 */
export function RecipeStepsList({ steps }: Props) {
  if (steps.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={recipePremiumStyles.sectionTitle}>{labels.stepsTitle}</Text>

      <View style={styles.list}>
        {steps.map((step) => {
          const imageSource = resolveStepImageSource(step.imageKey);
          const tip = step.tip?.trim();
          const title = step.guide?.trim();

          return (
            <View key={step.order} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.badge}>
                  <Text style={recipePremiumStyles.stepBadgeText}>{step.order}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {title || `${step.order}단계`}
                </Text>
              </View>

              {imageSource ? (
                <View style={styles.mediaRow}>
                  <Image
                    source={imageSource}
                    style={styles.stepImage}
                    resizeMode="cover"
                    accessibilityLabel={`${step.order}단계 사진`}
                  />
                  <View style={styles.mediaCopy}>
                    <Text style={styles.body}>{step.instruction}</Text>
                    {tip ? <StepTip tip={tip} /> : null}
                  </View>
                </View>
              ) : (
                <View style={styles.textOnly}>
                  <Text style={styles.body}>{step.instruction}</Text>
                  {tip ? <StepTip tip={tip} /> : null}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  list: {
    gap: 12,
  },
  card: {
    ...recipePremiumStyles.stepCard,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    ...recipePremiumStyles.stepBadge,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: recipeRef.colors.primarySoft,
    flexShrink: 0,
  },
  mediaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  textOnly: {
    gap: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: recipeRef.colors.textWarm,
  },
  tipInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFF8E0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0E2B8',
  },
  tipBulb: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  tipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: recipeRef.colors.badgeText,
  },
  tipBody: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textDeep,
  },
});
