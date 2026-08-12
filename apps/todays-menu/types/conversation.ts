export type ConversationMood = 'happy' | 'tired' | 'hungry' | 'neutral';
export type ConversationWeather = 'sunny' | 'rainy' | 'cold' | 'hot';

/**
 * Session-level conversational context for HANKKI Brain.
 * Tracks what Hankki last said and how often the user has visited.
 */
export type ConversationMemory = {
  mood: ConversationMood | null;
  weather: ConversationWeather | null;
  lastGreeting: string | null;
  lastRecommendation: string | null;
  conversationCount: number;
  updatedAt: string;
};
