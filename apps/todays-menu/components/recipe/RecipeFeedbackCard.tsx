import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import {
  getTodayFeedback,
  saveRecommendationFeedback,
} from '../../services/feedback';
import type { RecommendationFeedbackRating } from '../../types/recommendationFeedback';
import { recipePremiumStyles } from './recipePremiumStyles';

type Props = {
  recipeId: string;
  onSubmitted: () => void;
};

const labels = getHankkiRecipeMessages();

const OPTIONS: { rating: RecommendationFeedbackRating; label: string }[] = [
  { rating: 'good', label: labels.feedbackGood },
  { rating: 'neutral', label: labels.feedbackNeutral },
  { rating: 'bad', label: labels.feedbackBad },
];

export function RecipeFeedbackCard({ recipeId, onSubmitted }: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getTodayFeedback(recipeId).then((entry) => {
      if (!cancelled) {
        setVisible(!entry);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const handlePress = useCallback(
    async (rating: RecommendationFeedbackRating) => {
      if (submitting) return;

      setSubmitting(true);
      try {
        const result = await saveRecommendationFeedback(recipeId, rating);
        if (result.saved) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setVisible(false);
          onSubmitted();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitted, recipeId, submitting],
  );

  if (!visible) return null;

  return (
    <View style={[recipePremiumStyles.panel, styles.card]}>
      <Text style={styles.title}>{labels.feedbackTitle}</Text>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.rating}
            style={({ pressed }) => [styles.optionButton, pressed && recipePremiumStyles.pressed]}
            onPress={() => handlePress(option.rating)}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    ...theme.typography.reasonText,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  options: {
    gap: 8,
  },
  optionButton: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionLabel: {
    ...theme.typography.metaText,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
