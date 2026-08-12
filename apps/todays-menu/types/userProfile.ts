import type { PreferenceCategory } from './preference';

export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type SpicyLevel = 'none' | 'mild' | 'medium' | 'hot';

/**
 * Long-term user identity and taste constraints for HANKKI Brain.
 * Persisted locally — no AI model attached yet.
 */
export type UserProfile = {
  nickname: string;
  familySize: number;
  hasKids: boolean;
  cookingSkill: CookingSkill;
  preferredBudget: BudgetLevel;
  spicyLevel: SpicyLevel;
  allergies: string[];
  favoriteCategories: PreferenceCategory[];
  dislikedIngredients: string[];
  updatedAt: string;
};

export type SaveUserProfileInput = Partial<Omit<UserProfile, 'updatedAt'>> & {
  nickname: string;
};
