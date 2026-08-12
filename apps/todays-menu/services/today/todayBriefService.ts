import { getHankkiTodayBriefingMessages } from '../../constants/HankkiMessages';
import type { TodayBrief } from '../../types/today';
import { buildHankkiGreeting } from '../greeting';
import { getConversationMemory, resolveRecipeTitle } from '../memory';
import { getMealTypeLabel } from '../../utils/mealType';
import { buildTodayContext } from './todayContextBuilder';

function buildRecentMealSummary(
  context: Awaited<ReturnType<typeof buildTodayContext>>,
): string {
  const labels = getHankkiTodayBriefingMessages();

  if (context.recentMeals.length === 0) {
    return labels.recentMealEmpty;
  }

  const latest = context.recentMeals[0];
  const title = resolveRecipeTitle(latest.recipeId);
  return labels.recentMealLatest(title, getMealTypeLabel(latest.mealType));
}

function buildRecommendationHint(
  context: Awaited<ReturnType<typeof buildTodayContext>>,
): string {
  const labels = getHankkiTodayBriefingMessages();

  if (context.recentMeals.length > 0) {
    return labels.recommendationVariety;
  }

  return labels.recommendationDefault(context.nickname);
}

export async function getTodayBrief(nickname: string): Promise<TodayBrief> {
  const context = await buildTodayContext(nickname);
  const labels = getHankkiTodayBriefingMessages();
  const conversationMemory = await getConversationMemory();

  const { greeting } = await buildHankkiGreeting({
    nickname: context.nickname,
    mealType: context.mealTime,
    recentMeals: context.recentMeals,
    conversationMemory,
  });

  return {
    greeting,
    todaySummary: labels.todaySummary(
      context.weekdayLabel,
      getMealTypeLabel(context.mealTime),
    ),
    weatherSummary: labels.weatherSummary(context.weather),
    recentMealSummary: buildRecentMealSummary(context),
    recommendationHint: buildRecommendationHint(context),
    dailyChallenge: context.dailyChallenge,
    context,
  };
}
