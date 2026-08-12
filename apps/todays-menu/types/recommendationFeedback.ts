export type RecommendationFeedbackRating = 'good' | 'neutral' | 'bad';

export type RecommendationFeedbackEntry = {
  id: string;
  recipeId: string;
  feedbackDate: string;
  rating: RecommendationFeedbackRating;
  createdAt: string;
};
