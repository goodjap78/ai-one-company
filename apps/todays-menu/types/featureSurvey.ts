/**
 * Sprint H3-12 — Coming Soon feature survey votes.
 * Local-only now; shape is backend-ready for later sync.
 */

export type ComingSoonFeatureId =
  | 'dine_out'
  | 'kids_meal'
  | 'fridge'
  | 'receipt'
  | 'pet'
  | 'health'
  | 'reward';

export type FeatureSurveyOption = {
  id: string;
  label: string;
};

export type FeatureSurveyDefinition = {
  featureId: ComingSoonFeatureId;
  title: string;
  description: string;
  options: FeatureSurveyOption[];
};

/** Persisted vote — one current selection per feature. */
export type FeatureVoteRecord = {
  featureId: ComingSoonFeatureId;
  selectedOption: string;
  /** Option label at vote time (analytics-friendly). */
  selectedOptionLabel: string;
  votedAt: string;
};

/** Map of featureId → latest vote. */
export type FeatureVotesStore = Partial<Record<ComingSoonFeatureId, FeatureVoteRecord>>;

/** Payload ready to POST to a future backend. */
export type FeatureVoteAnalyticsEvent = {
  event: 'coming_soon_feature_vote';
  featureId: ComingSoonFeatureId;
  selectedOptionId: string;
  selectedOptionLabel: string;
  votedAt: string;
  source: 'home_coming_soon_survey';
};
