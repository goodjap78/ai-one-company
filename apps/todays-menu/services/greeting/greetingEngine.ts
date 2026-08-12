import {
  getHankkiGreetingBrainMessages,
  getHankkiGreetingSubtitle,
  getHankkiPersonalGreeting,
} from '../../constants/HankkiMessages';
import type { MealType } from '../../types/home';
import type { MealHistoryEntry } from '../../types/mealHistory';
import type { ConversationMemory } from '../../types/conversation';
import {
  getConversationMemory,
  getRecentMeals,
  getYesterdayMeal,
  incrementConversationCount,
  recordGreeting,
  resolveRecipeTitle,
} from '../memory';

export type HankkiGreeting = {
  greeting: string;
  subtitle: string;
};

type BuildGreetingInput = {
  nickname: string;
  mealType: MealType;
  recentMeals?: MealHistoryEntry[];
  conversationMemory?: ConversationMemory;
};

function buildSubtitle(
  mealType: MealType,
  yesterdayMeal: MealHistoryEntry | null,
  hasRecentMeals: boolean,
): string {
  const labels = getHankkiGreetingBrainMessages();
  const parts: string[] = [];

  if (yesterdayMeal) {
    const title = resolveRecipeTitle(yesterdayMeal.recipeId);
    parts.push(labels.yesterdayMeal(title));
  }

  if (hasRecentMeals) {
    parts.push(labels.varietyHint);
  }

  if (parts.length > 0) {
    return parts.join('\n');
  }

  return getHankkiGreetingSubtitle(mealType);
}

function buildGreetingLine(
  nickname: string,
  mealType: MealType,
  conversationMemory: ConversationMemory,
): string {
  const labels = getHankkiGreetingBrainMessages();

  if (conversationMemory.conversationCount > 0) {
    return labels.returningUser;
  }

  return getHankkiPersonalGreeting(nickname, mealType);
}

export async function buildHankkiGreeting(input: BuildGreetingInput): Promise<HankkiGreeting> {
  const [recentMeals, conversationMemory, yesterdayMeal] = await Promise.all([
    input.recentMeals ? Promise.resolve(input.recentMeals) : getRecentMeals(),
    input.conversationMemory ? Promise.resolve(input.conversationMemory) : getConversationMemory(),
    getYesterdayMeal(),
  ]);

  const greeting = buildGreetingLine(input.nickname, input.mealType, conversationMemory);
  const subtitle = buildSubtitle(input.mealType, yesterdayMeal, recentMeals.length > 0);

  await incrementConversationCount();
  await recordGreeting(greeting);

  return { greeting, subtitle };
}
