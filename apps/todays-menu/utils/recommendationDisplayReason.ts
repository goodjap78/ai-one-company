import { getHankkiHomeDecisionMessages } from '../constants/HankkiMessages';
import { resolveRecipeMetadata } from '../services/favorite/recipeMetadataResolver';
import { resolveRecipeTitle } from '../services/memory/recipeTitleResolver';
import type { Difficulty } from '../types/home';
import type { PreferenceSummary } from '../types/preference';
import type { TodayBrief } from '../types/today';
import type { CookingSkill } from '../types/userProfile';

const SPICY_KEYWORDS = ['제육', '김치', '매운', '불닭', '떡볶이', '고추', '마라', '짬뽕'];
const VEGETABLE_KEYWORDS = ['샐러드', '나물', '채소', '야채', '건강', '두부'];
const MEAT_KEYWORDS = ['제육', '불고기', '고기', '삼겹', '갈비', '스테이크', '돼지', '닭'];

const MAX_REASONS = 3;

export function mergeRecommendationReasons(
  contextual: AiRecommendationReason[],
  mealSignals: AiRecommendationReason[],
  max = MAX_REASONS,
): AiRecommendationReason[] {
  const merged: AiRecommendationReason[] = [];
  const seen = new Set<string>();

  for (const reason of [...contextual, ...mealSignals]) {
    if (merged.length >= max) break;
    const key = `${reason.emoji}:${reason.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(reason);
  }

  return merged;
}

export type AiRecommendationReason = {
  emoji: string;
  text: string;
};

export type ConfidenceMatchSource = 'preferenceDNA' | 'recentMeals' | 'weather';

export type ConfidenceInsight = {
  percent: number;
  matchedSources: ConfidenceMatchSource[];
};

export type ExplainableRecommendation = {
  reasons: AiRecommendationReason[];
  confidence: ConfidenceInsight;
};

export type RecommendationReasonInput = {
  todayBrief: TodayBrief | null;
  recipeId: string;
  recipeDifficulty: Difficulty;
  fallbackReason: string;
  engineConfidence: number;
};

type ReasonCandidate = {
  reason: AiRecommendationReason;
  source: ConfidenceMatchSource;
};

function getYesterdayEntry(brief: TodayBrief) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = yesterday.toISOString().slice(0, 10);
  return brief.context.recentMeals.find((meal) => meal.cookedDate === target) ?? null;
}

function titleMatches(title: string, keywords: string[]): boolean {
  return keywords.some((keyword) => title.includes(keyword));
}

function isSpicyMeal(recipeId: string, title: string): boolean {
  const { tags } = resolveRecipeMetadata(recipeId);
  if (tags.includes('spicy')) return true;
  return titleMatches(title, SPICY_KEYWORDS);
}

function isVegetableMeal(recipeId: string, title: string): boolean {
  const { tags } = resolveRecipeMetadata(recipeId);
  if (tags.includes('healthy')) return true;
  return titleMatches(title, VEGETABLE_KEYWORDS);
}

function isMeatMeal(title: string): boolean {
  return titleMatches(title, MEAT_KEYWORDS);
}

function hadRecentVegetables(brief: TodayBrief, withinDays = 3): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);

  return brief.context.recentMeals.some((meal) => {
    if (new Date(meal.cookedDate) < cutoff) return false;
    const title = resolveRecipeTitle(meal.recipeId);
    return isVegetableMeal(meal.recipeId, title);
  });
}

function matchesCookingSkill(difficulty: Difficulty, skill: CookingSkill): boolean {
  if (skill === 'beginner') return difficulty === 'easy';
  if (skill === 'intermediate') return difficulty === 'easy' || difficulty === 'normal';
  return true;
}

function matchesPreferenceDNA(
  recipeId: string,
  preferenceDNA: PreferenceSummary,
  favoriteRecipeIds: string[],
): boolean {
  if (favoriteRecipeIds.includes(recipeId)) return true;
  if (preferenceDNA.totalFavorites === 0) return false;

  const meta = resolveRecipeMetadata(recipeId);

  if (preferenceDNA.favoriteCategories.includes(meta.category)) return true;
  if (preferenceDNA.favoriteDifficulty.includes(meta.difficulty)) return true;
  if (meta.tags.some((tag) => preferenceDNA.favoriteTags.includes(tag))) return true;

  return false;
}

function clampPercent(confidence: number): number {
  return Math.min(99, Math.max(1, Math.round(confidence * 100)));
}

/** Display-only structured AI reasoning. Does not change recommendation engine output. */
export function buildExplainableRecommendation(
  input: RecommendationReasonInput,
): ExplainableRecommendation {
  const { todayBrief, recipeId, recipeDifficulty, fallbackReason, engineConfidence } = input;

  if (!todayBrief) {
    return {
      reasons: [{ emoji: '💡', text: fallbackReason }],
      confidence: {
        percent: clampPercent(engineConfidence),
        matchedSources: [],
      },
    };
  }

  const labels = getHankkiHomeDecisionMessages();
  const { weather, cookingSkill, preferenceDNA, favoriteRecipeIds, recentMeals } =
    todayBrief.context;

  const candidates: ReasonCandidate[] = [];

  if (weather.condition === 'hot') {
    candidates.push({
      reason: { emoji: '☀️', text: labels.reasonHotWeather },
      source: 'weather',
    });
  } else if (weather.condition === 'cold' || weather.condition === 'rainy') {
    candidates.push({
      reason: { emoji: weather.condition === 'rainy' ? '🌧️' : '❄️', text: labels.reasonColdWeather },
      source: 'weather',
    });
  }

  if (!hadRecentVegetables(todayBrief)) {
    candidates.push({
      reason: { emoji: '🥗', text: labels.reasonNeedVegetables },
      source: 'recentMeals',
    });
  }

  if (matchesPreferenceDNA(recipeId, preferenceDNA, favoriteRecipeIds)) {
    candidates.push({
      reason: { emoji: '❤️', text: labels.reasonMatchesPreference },
      source: 'preferenceDNA',
    });
  }

  const yesterdayEntry = getYesterdayEntry(todayBrief);
  if (yesterdayEntry) {
    const yesterdayTitle = resolveRecipeTitle(yesterdayEntry.recipeId);
    if (isSpicyMeal(yesterdayEntry.recipeId, yesterdayTitle)) {
      candidates.push({
        reason: { emoji: '🌶️', text: labels.reasonYesterdaySpicy },
        source: 'recentMeals',
      });
    } else if (isMeatMeal(yesterdayTitle)) {
      candidates.push({
        reason: { emoji: '🍖', text: labels.reasonYesterdayMeat(yesterdayTitle) },
        source: 'recentMeals',
      });
    }
  }

  if (matchesCookingSkill(recipeDifficulty, cookingSkill)) {
    candidates.push({
      reason: {
        emoji: '👨‍🍳',
        text:
          cookingSkill === 'beginner'
            ? labels.reasonMatchesSkillBeginner
            : labels.reasonMatchesSkillIntermediate,
      },
      source: 'preferenceDNA',
    });
  }

  if (recentMeals.length > 0 && candidates.every((item) => item.source !== 'recentMeals')) {
    candidates.push({
      reason: { emoji: '🍽️', text: labels.reasonLighterToday },
      source: 'recentMeals',
    });
  }

  const uniqueSources = new Set<ConfidenceMatchSource>();
  const reasons: AiRecommendationReason[] = [];

  for (const candidate of candidates) {
    if (reasons.length >= MAX_REASONS) break;
    const key = `${candidate.reason.emoji}:${candidate.reason.text}`;
    if (reasons.some((reason) => `${reason.emoji}:${reason.text}` === key)) continue;
    reasons.push(candidate.reason);
    uniqueSources.add(candidate.source);
  }

  if (reasons.length === 0) {
    reasons.push({
      emoji: '💡',
      text: fallbackReason || labels.reasonFallback,
    });
  }

  return {
    reasons,
    confidence: {
      percent: clampPercent(engineConfidence),
      matchedSources: [...uniqueSources],
    },
  };
}

/** @deprecated Use `buildExplainableRecommendation`. */
export function buildAiRecommendationReason(input: RecommendationReasonInput): string {
  return buildExplainableRecommendation(input).reasons.map((r) => `${r.emoji} ${r.text}`).join('\n');
}

/** @deprecated Use `buildExplainableRecommendation`. */
export function formatConfidenceBadge(confidence: number): string {
  return `${clampPercent(confidence)}%`;
}

/** Maps a 0–100 confidence score to a 5-star display string. */
export function formatConfidenceStars(percent: number): string {
  const filled = Math.min(5, Math.max(0, Math.round((percent / 100) * 5)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}
