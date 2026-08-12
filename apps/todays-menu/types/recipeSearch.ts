export type RecipeSearchEntry = {
  recipeId: string;
  title: string;
  subtitle: string;
  mode: 'homemade' | 'delivery';
  ingredientNames: string[];
};

export type RecipeSearchResult = {
  recipeId: string;
  title: string;
  subtitle: string;
  mode: 'homemade' | 'delivery';
  matchType: 'title' | 'ingredient';
  matchedIngredient?: string;
};
