import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ComingSoonFeatureId,
  FeatureVoteAnalyticsEvent,
  FeatureVoteRecord,
  FeatureVotesStore,
} from '../../types/featureSurvey';

/**
 * Sprint H3-12 — persist Coming Soon survey votes locally.
 * One current vote per feature; changing a vote overwrites.
 */
export const FEATURE_VOTES_KEY = '@todays_menu/feature_votes';

function isVoteRecord(value: unknown): value is FeatureVoteRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as FeatureVoteRecord;
  return (
    typeof row.featureId === 'string' &&
    typeof row.selectedOption === 'string' &&
    typeof row.votedAt === 'string'
  );
}

function normalizeStore(value: unknown): FeatureVotesStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const store: FeatureVotesStore = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (isVoteRecord(entry)) {
      store[key as ComingSoonFeatureId] = {
        featureId: entry.featureId,
        selectedOption: entry.selectedOption,
        selectedOptionLabel:
          typeof entry.selectedOptionLabel === 'string'
            ? entry.selectedOptionLabel
            : entry.selectedOption,
        votedAt: entry.votedAt,
      };
    }
  }
  return store;
}

export async function getFeatureVotes(): Promise<FeatureVotesStore> {
  try {
    const raw = await AsyncStorage.getItem(FEATURE_VOTES_KEY);
    if (!raw) return {};
    return normalizeStore(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function getFeatureVote(
  featureId: ComingSoonFeatureId,
): Promise<FeatureVoteRecord | null> {
  const store = await getFeatureVotes();
  return store[featureId] ?? null;
}

export async function saveFeatureVote(input: {
  featureId: ComingSoonFeatureId;
  selectedOption: string;
  selectedOptionLabel: string;
}): Promise<FeatureVoteRecord> {
  const record: FeatureVoteRecord = {
    featureId: input.featureId,
    selectedOption: input.selectedOption,
    selectedOptionLabel: input.selectedOptionLabel,
    votedAt: new Date().toISOString(),
  };

  const store = await getFeatureVotes();
  store[input.featureId] = record;

  try {
    await AsyncStorage.setItem(FEATURE_VOTES_KEY, JSON.stringify(store));
  } catch {
    // Keep returning the in-memory record even if persist fails.
  }

  return record;
}

/** Analytics-ready event — no network call yet. */
export function toFeatureVoteAnalyticsEvent(
  vote: FeatureVoteRecord,
): FeatureVoteAnalyticsEvent {
  return {
    event: 'coming_soon_feature_vote',
    featureId: vote.featureId,
    selectedOptionId: vote.selectedOption,
    selectedOptionLabel: vote.selectedOptionLabel,
    votedAt: vote.votedAt,
    source: 'home_coming_soon_survey',
  };
}
