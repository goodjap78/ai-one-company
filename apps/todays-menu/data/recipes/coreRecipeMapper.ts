import type { CoreRecipe, CoreRecipeCategory, CoreCuisine } from '../../types/coreRecipe';
import type { GoldMealRecord } from '../../types/goldMeal';
import type { MealDNA, MealDnaCategory, MealDnaCookingTime, MealDnaHealth } from '../../types/mealDna';
import type { MealStyle } from '../../types/mealStyle';
import { mealTypesToSlots } from './constants';

function cuisineFromRecipe(recipe: CoreRecipe): GoldMealRecord['cuisine'] {
  return recipe.cuisine;
}

function inferMealStyle(recipe: CoreRecipe): MealStyle {
  if (recipe.name.includes('삼겹살')) return 'grill';
  if (recipe.cookTimeMinutes <= 12 && recipe.tags.includes('quick')) return 'instant';
  return 'recipe';
}

function inferMealPurpose(recipe: CoreRecipe): GoldMealRecord['mealPurpose'] {
  const purposes: GoldMealRecord['mealPurpose'] = [];
  if (recipe.tags.includes('quick') || recipe.category === 'quick') purposes.push('quick');
  if (recipe.tags.includes('comfort')) purposes.push('comfort');
  if (recipe.tags.includes('family')) purposes.push('family');
  if (recipe.tags.includes('healthy') || recipe.category === 'healthy') purposes.push('diet');
  if (recipe.tags.includes('late_night')) purposes.push('comfort');
  if (purposes.length === 0) purposes.push('comfort');
  return purposes;
}

function inferSituationTags(recipe: CoreRecipe): GoldMealRecord['situationTags'] {
  const tags: GoldMealRecord['situationTags'] = ['home'];
  if (recipe.tags.includes('family')) tags.push('family');
  if (recipe.tags.includes('solo')) tags.push('alone');
  if (recipe.mealTypes.includes('snack')) tags.push('alone');
  return tags;
}

function cookTimeTier(minutes: number): MealDnaCookingTime {
  if (minutes <= 20) return 'quick';
  if (minutes <= 35) return 'moderate';
  return 'slow';
}

function inferHealth(recipe: CoreRecipe): MealDnaHealth {
  if (recipe.category === 'healthy' || recipe.tags.includes('healthy')) return 'light';
  if (recipe.calories <= 380) return 'light';
  if (recipe.calories >= 650) return 'hearty';
  if (recipe.category === 'quick' && recipe.cookTimeMinutes <= 12) return 'indulgent';
  return 'balanced';
}

function categoryToDna(category: CoreRecipeCategory, cuisine: CoreCuisine, name: string): MealDnaCategory {
  if (/찌개|탕|국/.test(name) && !/만두국|우동/.test(name)) {
    return /찌개|탕/.test(name) ? 'stew' : 'soup';
  }
  if (/파스타|우동|라면|짜장|짬뽕|면/.test(name)) return 'noodle';
  if (/샐러드/.test(name)) return 'salad';
  if (/삼겹살/.test(name)) return 'grill';
  if (/밥|덮밥|볶음밥|비빔|김밥|규동|오므라이스|카레/.test(name)) return 'rice';
  if (category === 'japanese' || cuisine === 'Japanese') return 'japanese';
  if (category === 'chinese' || cuisine === 'Chinese') return 'chinese';
  if (category === 'western' || cuisine === 'Western') return 'western';
  if (category === 'healthy') return 'salad';
  return 'korean';
}

function buildMealDna(recipe: CoreRecipe): MealDNA {
  return {
    weather: recipe.weatherTags,
    season: recipe.seasonTags,
    time: mealTypesToSlots(recipe.mealTypes),
    situation: inferSituationTags(recipe),
    cookingTime: cookTimeTier(recipe.cookTimeMinutes),
    health: inferHealth(recipe),
    category: categoryToDna(recipe.category, recipe.cuisine, recipe.name),
    canonicalIngredients: [
      ...recipe.ingredients.map((item) => item.canonicalName ?? item.name),
      ...recipe.seasonings.map((item) => item.canonicalName ?? item.name),
    ],
  };
}

function buildExperienceLabel(recipe: CoreRecipe): string {
  if (recipe.category === 'quick' || recipe.tags.includes('quick')) return '금방 만드는 한 끼';
  if (recipe.category === 'healthy' || recipe.tags.includes('healthy')) return '가볍게 즐기는 한 끼';
  if (recipe.category === 'korean') return '든든한 한식 한 끼';
  if (recipe.category === 'japanese') return '담백한 일식 한 끼';
  if (recipe.category === 'chinese') return '푸짐한 중식 한 끼';
  if (recipe.category === 'western') return '부드러운 양식 한 끼';
  return `오늘의 ${recipe.name}`;
}

export function coreRecipeToGoldMeal(recipe: CoreRecipe): GoldMealRecord {
  const hasSteps = recipe.cookingSteps.length > 0;
  const allIngredients = [...recipe.ingredients, ...recipe.seasonings];

  return {
    id: recipe.id,
    title: recipe.name,
    subtitle: recipe.aiReasonTemplates[0] ?? `오늘은 ${recipe.name} 어때요?`,
    description: recipe.aiReasonTemplates.join(' '),
    type: 'MAIN',
    mealStyle: inferMealStyle(recipe),
    mealPurpose: inferMealPurpose(recipe),
    mealTime: mealTypesToSlots(recipe.mealTypes),
    weatherTags: recipe.weatherTags,
    situationTags: inferSituationTags(recipe),
    cuisine: cuisineFromRecipe(recipe),
    mode: 'homemade',
    cookTime: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    aiReason: recipe.aiReasonTemplates[0] ?? `오늘은 ${recipe.name}이 잘 맞아요.`,
    experienceLabel: buildExperienceLabel(recipe),
    suggestedPairings: recipe.pairingFoods.map((name) => ({ name })),
    ingredients: allIngredients,
    cookingSupport: hasSteps
      ? {
          kind: 'steps',
          tip: recipe.tip,
          steps: recipe.cookingSteps,
        }
      : undefined,
    tags: recipe.tags,
    heroImage: {
      emoji: recipe.emoji,
      accessibilityLabel: recipe.name,
    },
    mealDna: buildMealDna(recipe),
  };
}
