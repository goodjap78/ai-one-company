import { useCallback, useState } from 'react';
import {
  COMING_SOON_SURVEY_COPY,
  getComingSoonSurvey,
} from '../../constants/comingSoonSurveyCopy';
import {
  getFeatureVote,
  saveFeatureVote,
  toFeatureVoteAnalyticsEvent,
} from '../../services/surveys/featureVoteStorage';
import type { ComingSoonFeatureId, FeatureSurveyDefinition } from '../../types/featureSurvey';

type SurveyPhase = 'choose' | 'done';

export type ComingSoonSurveyState = {
  featureId: ComingSoonFeatureId;
  survey: FeatureSurveyDefinition;
  selectedOptionId: string | null;
  phase: SurveyPhase;
};

/**
 * Sprint H3-12 — Home Coming Soon survey controller.
 */
export function useComingSoonSurvey() {
  const [active, setActive] = useState<ComingSoonSurveyState | null>(null);

  const openSurvey = useCallback(async (featureId: ComingSoonFeatureId) => {
    const survey = getComingSoonSurvey(featureId);
    const existing = await getFeatureVote(featureId);
    setActive({
      featureId,
      survey,
      selectedOptionId: existing?.selectedOption ?? null,
      phase: 'choose',
    });
  }, []);

  const closeSurvey = useCallback(() => {
    setActive(null);
  }, []);

  const selectOption = useCallback((optionId: string) => {
    setActive((prev) => (prev ? { ...prev, selectedOptionId: optionId } : prev));
  }, []);

  const submitVote = useCallback(async () => {
    if (!active?.selectedOptionId) return;

    const option = active.survey.options.find((item) => item.id === active.selectedOptionId);
    if (!option) return;

    const vote = await saveFeatureVote({
      featureId: active.featureId,
      selectedOption: option.id,
      selectedOptionLabel: option.label,
    });

    // Prepare analytics payload for a future backend (no network yet).
    if (__DEV__) {
      console.log('[feature_vote]', toFeatureVoteAnalyticsEvent(vote));
    }

    setActive((prev) => (prev ? { ...prev, phase: 'done' } : prev));
  }, [active]);

  return {
    activeSurvey: active,
    surveyVisible: active !== null,
    surveyCopy: COMING_SOON_SURVEY_COPY,
    openSurvey,
    closeSurvey,
    selectOption,
    submitVote,
  };
}
