import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  RecommendationFeedbackEntry,
  RecommendationFeedbackRating,
} from '../../types/recommendationFeedback';

const FEEDBACK_STORAGE_KEY = '@hankki/recommendation_feedback';

export type SaveRecommendationFeedbackResult = {
  saved: boolean;
  entry: RecommendationFeedbackEntry;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildFeedbackId(recipeId: string, feedbackDate: string): string {
  return `feedback_${recipeId}_${feedbackDate}`;
}

function isFeedbackEntry(value: unknown): value is RecommendationFeedbackEntry {
  if (!value || typeof value !== 'object') return false;

  const entry = value as RecommendationFeedbackEntry;
  return (
    typeof entry.id === 'string' &&
    typeof entry.recipeId === 'string' &&
    typeof entry.feedbackDate === 'string' &&
    (entry.rating === 'good' || entry.rating === 'neutral' || entry.rating === 'bad') &&
    typeof entry.createdAt === 'string'
  );
}

async function readFeedbackEntries(): Promise<RecommendationFeedbackEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isFeedbackEntry);
  } catch {
    return [];
  }
}

async function writeFeedbackEntries(entries: RecommendationFeedbackEntry[]): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
}

export async function getTodayFeedback(
  recipeId: string,
  date = todayDateString(),
): Promise<RecommendationFeedbackEntry | null> {
  const entries = await readFeedbackEntries();
  return entries.find((entry) => entry.recipeId === recipeId && entry.feedbackDate === date) ?? null;
}

/** One feedback per recipe per day. */
export async function saveRecommendationFeedback(
  recipeId: string,
  rating: RecommendationFeedbackRating,
  date = todayDateString(),
): Promise<SaveRecommendationFeedbackResult> {
  const entries = await readFeedbackEntries();
  const existing = entries.find(
    (entry) => entry.recipeId === recipeId && entry.feedbackDate === date,
  );

  const entry: RecommendationFeedbackEntry = existing ?? {
    id: buildFeedbackId(recipeId, date),
    recipeId,
    feedbackDate: date,
    rating,
    createdAt: new Date().toISOString(),
  };

  if (existing) {
    return { saved: false, entry: existing };
  }

  const next = [entry, ...entries.filter((item) => item.id !== entry.id)];
  await writeFeedbackEntries(next);
  return { saved: true, entry };
}

export async function getRecommendationFeedback(): Promise<RecommendationFeedbackEntry[]> {
  return readFeedbackEntries();
}

export async function clearRecommendationFeedback(): Promise<void> {
  await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
}
