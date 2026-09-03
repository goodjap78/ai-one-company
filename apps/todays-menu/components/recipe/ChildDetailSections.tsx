/**
 * Child recipe detail extension sections (baby / toddler / elementary).
 * Reuses /ingredients/[id] — no separate full-screen route.
 */
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ds } from '../../constants/designSystem';
import {
  allergyUserLabels,
  babyStageUserLabel,
  babyTextureUserLabel,
  childDetailCopy,
  type ChildDetailContext,
} from '../../constants/childDetailCopy';
import type { BabyPortionPreset } from '../../data/recipes/babyPortionScaling';
import { BABY_PORTION_UI_PRESETS } from '../../data/recipes/babyPortionScaling';
import type { BabyPortionScaling } from '../../data/recipes/babyPortionScaling';
import type { Recipe } from '../../data/recipes/types';
import { recipeRef } from './recipePremiumStyles';

type BadgeProps = {
  context: ChildDetailContext;
  hankki: Recipe;
};

export function ChildDetailAudienceBadge({ context, hankki }: BadgeProps) {
  if (context === 'general') return null;

  let label = childDetailCopy.elementaryBadge;
  if (context === 'baby') {
    const stage = hankki.familyAudience.babyFood?.stage;
    label = stage
      ? `${childDetailCopy.babyBadgePrefix} · ${babyStageUserLabel(stage)}`
      : childDetailCopy.babyBadgePrefix;
  } else if (context === 'toddler') {
    label = childDetailCopy.toddlerBadge;
  }

  return (
    <View style={styles.badge} accessibilityRole="text">
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

type PortionProps = {
  scaling: BabyPortionScaling;
  portion: BabyPortionPreset;
  onChange: (portion: BabyPortionPreset) => void;
};

export function BabyPortionPresetSelector({ scaling, portion, onChange }: PortionProps) {
  if (scaling !== 'scalable') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{childDetailCopy.portionTitle}</Text>
        <Text style={styles.hint}>{childDetailCopy.portionReviewOnly}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{childDetailCopy.portionTitle}</Text>
      <Text style={styles.hint}>{childDetailCopy.portionBaseHint}</Text>
      <View style={styles.presetRow}>
        {BABY_PORTION_UI_PRESETS.map((preset) => {
          const selected = portion === preset;
          return (
            <Pressable
              key={preset}
              style={[styles.presetButton, selected && styles.presetButtonSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(preset);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={childDetailCopy.portionPresetLabel(preset)}
            >
              <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                {childDetailCopy.portionPresetLabel(preset)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type SafetyProps = {
  hankki: Recipe;
};

export function BabyDetailSafetySections({ hankki }: SafetyProps) {
  const texture = hankki.familyAudience.babyFood?.texture;
  const allergyTags =
    hankki.standardMetadata.allergyTags.length > 0
      ? hankki.standardMetadata.allergyTags
      : hankki.familyAudience.safetySignals.allergyTags;
  const allergyLabels = allergyUserLabels(allergyTags);

  const fishBoneHint =
    /흰살생선|생선/.test(hankki.name) &&
    hankki.recipe.steps.some((step) => /가시/.test(`${step.title} ${step.instruction}`))
      ? '가시를 꼼꼼히 제거한 뒤 주세요.'
      : null;

  return (
    <View style={styles.stack}>
      {texture ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.textureTitle}</Text>
          <Text style={styles.body}>{babyTextureUserLabel(texture)}</Text>
        </View>
      ) : null}

      {allergyLabels.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.allergyTitle}</Text>
          <Text style={styles.body}>{allergyLabels.join(', ')}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{childDetailCopy.safetyTitle}</Text>
        {childDetailCopy.safetyCommon.map((line) => (
          <Text key={line} style={styles.body}>
            · {line}
          </Text>
        ))}
        {fishBoneHint ? <Text style={styles.body}>· {fishBoneHint}</Text> : null}
        <Text style={styles.source}>{childDetailCopy.safetySource}</Text>
      </View>
    </View>
  );
}

export function ToddlerDetailExtraSections({ hankki }: SafetyProps) {
  const allergyTags =
    hankki.standardMetadata.allergyTags.length > 0
      ? hankki.standardMetadata.allergyTags
      : hankki.familyAudience.safetySignals.allergyTags;
  const allergyLabels = allergyUserLabels(allergyTags);

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{childDetailCopy.toddlerBiteTitle}</Text>
        {childDetailCopy.toddlerBiteLines.map((line) => (
          <Text key={line} style={styles.body}>
            · {line}
          </Text>
        ))}
      </View>
      {allergyLabels.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.allergyTitle}</Text>
          <Text style={styles.body}>{allergyLabels.join(', ')}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ElementaryDetailExtraSections({ hankki }: SafetyProps) {
  const allergyTags = hankki.standardMetadata.allergyTags;
  const allergyLabels = allergyUserLabels(allergyTags);
  const quality = hankki.elementaryQuality;
  const tags: string[] = [];
  const mealTypes = hankki.standardMetadata.mealTypes;
  if (hankki.familyAudience.childMeal?.schoolMorningFriendly === true) {
    tags.push(childDetailCopy.schoolMorningLabel);
  }
  if (mealTypes.includes('breakfast')) tags.push(childDetailCopy.breakfastLabel);
  if (mealTypes.includes('lunch')) tags.push(childDetailCopy.lunchLabel);
  if (mealTypes.includes('dinner')) tags.push(childDetailCopy.dinnerLabel);
  if (mealTypes.includes('snack')) tags.push(childDetailCopy.snackLabel);
  if (/도시락|김밥|주먹밥|샌드|토스트/.test(hankki.name)) {
    tags.push(childDetailCopy.lunchboxLabel);
  }
  const uniqueTags = [...new Set(tags)];
  const showQuality =
    quality &&
    (quality.contentVerificationStatus === 'reviewed' ||
      quality.contentVerificationStatus === 'verified');

  return (
    <View style={styles.stack}>
      {showQuality && hankki.prepTimeMinutes != null ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryPrepTitle}</Text>
          <Text style={styles.body}>
            {childDetailCopy.elementaryTimeTotal(hankki.prepTimeMinutes, hankki.time)}
          </Text>
        </View>
      ) : null}
      {showQuality && quality.prerequisites ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryPrereqTitle}</Text>
          <Text style={styles.body}>{quality.prerequisites}</Text>
        </View>
      ) : null}
      {uniqueTags.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryUseTitle}</Text>
          <Text style={styles.body}>{uniqueTags.join(' · ')}</Text>
        </View>
      ) : null}
      {showQuality && quality.kidAdjustmentTip ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryKidTipTitle}</Text>
          <Text style={styles.body}>{quality.kidAdjustmentTip}</Text>
        </View>
      ) : null}
      {showQuality && quality.substituteIngredients ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementarySubstituteTitle}</Text>
          <Text style={styles.body}>{quality.substituteIngredients}</Text>
        </View>
      ) : null}
      {allergyLabels.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.allergyTitle}</Text>
          <Text style={styles.body}>{allergyLabels.join(', ')}</Text>
        </View>
      ) : null}
      {showQuality && quality.storageInfo ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryStorageTitle}</Text>
          <Text style={styles.body}>{quality.storageInfo}</Text>
        </View>
      ) : null}
      {showQuality && quality.reheatingMethod ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{childDetailCopy.elementaryReheatTitle}</Text>
          <Text style={styles.body}>{quality.reheatingMethod}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: recipeRef.colors.badgeBg,
    borderRadius: ds.radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: recipeRef.colors.badgeText,
  },
  stack: {
    gap: 12,
  },
  card: {
    gap: 6,
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: recipeRef.colors.textWarm,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: recipeRef.colors.textMuted,
  },
  source: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: recipeRef.colors.textMuted,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  presetButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonSelected: {
    backgroundColor: ds.colors.primarySoft,
    borderColor: ds.colors.primary,
  },
  presetText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
  },
  presetTextSelected: {
    color: ds.colors.primary,
  },
});
