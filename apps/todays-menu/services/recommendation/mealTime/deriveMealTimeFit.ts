/**
 * Sprint 57 — Deterministic meal-time fit scoring from existing recipe metadata.
 * No AI/API calls. Same recipe → same scores.
 */
import type { Recipe } from '../../../data/recipes/types';
import type {
  MealTimeFit,
  MealTimeFitReasons,
  MealTimeFitResult,
  MealTimeSlotKey,
} from '../../../types/mealTimeRecommendation';
import { MEAL_TIME_OVERRIDES } from '../../../data/recommendation/mealTimeOverrides';
import { classifyRecipeFoodTypes } from './classifyMealFoodType';
import {
  bump,
  finalize,
  hasAny,
  primaryMealTimeFromFit,
  textBlob,
  type ScoreAccumulator,
} from './mealTimeScoringUtils';

type DeriveInput = Pick<
  Recipe,
  | 'id'
  | 'name'
  | 'category'
  | 'mealType'
  | 'time'
  | 'difficulty'
  | 'ingredients'
  | 'tags'
  | 'situation'
  | 'aiTags'
  | 'decisionTags'
  | 'standardMetadata'
>;

function authorMealSlots(mealType: string[]): Set<MealTimeSlotKey> {
  const out = new Set<MealTimeSlotKey>();
  for (const raw of mealType) {
    const t = raw.trim();
    if (t === '아침') out.add('breakfast');
    else if (t === '점심') out.add('lunch');
    else if (t === '저녁') out.add('dinner');
    else if (t === '야식' || t === '간식') out.add('lateNight');
  }
  return out;
}

function decisionMealSlots(decisionMealTime: string[]): Set<MealTimeSlotKey> {
  const out = new Set<MealTimeSlotKey>();
  for (const raw of decisionMealTime) {
    if (raw === 'breakfast') out.add('breakfast');
    else if (raw === 'lunch') out.add('lunch');
    else if (raw === 'dinner') out.add('dinner');
    else if (raw === 'late_night') out.add('lateNight');
  }
  return out;
}

function standardMealSlots(mealTypes: string[]): Set<MealTimeSlotKey> {
  const out = new Set<MealTimeSlotKey>();
  for (const raw of mealTypes) {
    if (raw === 'breakfast') out.add('breakfast');
    else if (raw === 'lunch') out.add('lunch');
    else if (raw === 'dinner') out.add('dinner');
    else if (raw === 'late_night' || raw === 'snack') out.add('lateNight');
  }
  return out;
}

function scoreBreakfast(source: DeriveInput, text: string): { score: number; reasons: string[] } {
  const acc: ScoreAccumulator = { score: 0.18, reasons: ['base:0.18'] };
  const author = authorMealSlots(source.mealType);
  const decision = decisionMealSlots(source.decisionTags.mealTime);
  const standard = standardMealSlots(source.standardMetadata.mealTypes);
  const dish = source.standardMetadata.dishType;
  const spicy = source.decisionTags.spicyLevel;
  const time = source.time;
  const diff = source.standardMetadata.difficulty;

  if (author.has('breakfast')) bump(acc, 0.42, 'author:아침:+0.42');
  if (decision.has('breakfast')) bump(acc, 0.22, 'decision:breakfast:+0.22');
  if (standard.has('breakfast')) bump(acc, 0.18, 'standard:breakfast:+0.18');

  if (time <= 10) bump(acc, 0.14, 'cookTime<=10:+0.14');
  else if (time <= 20) bump(acc, 0.08, 'cookTime<=20:+0.08');
  else if (time >= 40) bump(acc, -0.18, 'cookTime>=40:-0.18');

  if (diff === 'easy') bump(acc, 0.1, 'difficulty:easy:+0.10');
  else if (diff === 'hard') bump(acc, -0.12, 'difficulty:hard:-0.12');

  if (dish === 'sandwich') bump(acc, 0.16, 'dish:sandwich:+0.16');
  if (dish === 'salad') bump(acc, 0.1, 'dish:salad:+0.10');
  if (dish === 'soup') bump(acc, 0.12, 'dish:soup:+0.12');
  if (dish === 'rice' && time <= 25) bump(acc, 0.08, 'dish:light_rice:+0.08');

  if (hasAny(text, [/토스트/, /프렌치토스트/, /오믈렛/, /계란/, /죽/, /요거트/, /그래놀라/])) {
    bump(acc, 0.14, 'name:breakfast_food:+0.14');
  }
  if (hasAny(text, [/샌드/, /버거/, /클럽/])) bump(acc, 0.12, 'name:sandwich:+0.12');
  if (hasAny(text, [/우유/, /유제품/, /요구르트/, /치즈(?!볶)/])) bump(acc, 0.06, 'dairy:+0.06');
  if (hasAny(text, [/과일/, /바나나/, /블루베리/])) bump(acc, 0.08, 'fruit:+0.08');
  if (hasAny(text, [/가벼운/, /light/, /healthy/, /다이어트/, /담백/])) {
    bump(acc, 0.1, 'tags:light:+0.10');
  }
  if (source.ingredients.some((i) => i.iconKey === 'egg')) bump(acc, 0.1, 'ingredient:egg:+0.10');

  if (spicy >= 2) bump(acc, -0.2, 'spicy>=2:-0.20');
  if (hasAny(text, [/제육/, /갈비/, /불고기/, /찜닭/, /수육/, /보쌈/])) {
    bump(acc, -0.15, 'heavy_meat:-0.15');
  }
  if (hasAny(text, [/찌개/, /전골/]) && !author.has('breakfast')) bump(acc, -0.08, 'stew_penalty:-0.08');
  if (author.has('야식') && !author.has('아침')) bump(acc, -0.12, 'author:야식_only:-0.12');

  return finalize(acc);
}

function scoreLunch(source: DeriveInput, text: string): { score: number; reasons: string[] } {
  const acc: ScoreAccumulator = { score: 0.28, reasons: ['base:0.28'] };
  const author = authorMealSlots(source.mealType);
  const decision = decisionMealSlots(source.decisionTags.mealTime);
  const standard = standardMealSlots(source.standardMetadata.mealTypes);
  const dish = source.standardMetadata.dishType;
  const time = source.time;

  if (author.has('lunch')) bump(acc, 0.35, 'author:점심:+0.35');
  if (decision.has('lunch')) bump(acc, 0.2, 'decision:lunch:+0.20');
  if (standard.has('lunch')) bump(acc, 0.16, 'standard:lunch:+0.16');

  if (dish === 'rice_bowl') bump(acc, 0.14, 'dish:rice_bowl:+0.14');
  if (dish === 'rice') bump(acc, 0.1, 'dish:rice:+0.10');
  if (dish === 'noodle') bump(acc, 0.12, 'dish:noodle:+0.12');
  if (dish === 'stir_fry') bump(acc, 0.1, 'dish:stir_fry:+0.10');
  if (dish === 'soup') bump(acc, 0.06, 'dish:soup:+0.06');

  if (hasAny(text, [/덮밥/, /볶음밥/, /비빔밥/, /김밥/, /도시락/, /한그릇/])) {
    bump(acc, 0.12, 'name:lunch_bowl:+0.12');
  }
  if (hasAny(text, [/든든/, /comfort/, /rice_based/, /한식/])) bump(acc, 0.08, 'tags:hearty_korean:+0.08');
  if (time <= 30) bump(acc, 0.06, 'cookTime<=30:+0.06');
  if (time >= 50) bump(acc, -0.1, 'cookTime>=50:-0.10');

  if (author.has('breakfast') && !author.has('점심') && !author.has('lunch')) {
    bump(acc, -0.08, 'breakfast_only:-0.08');
  }
  if (hasAny(text, [/아이스크림/, /케이크/, /호떡/, /디저트/]) && !author.has('lunch')) {
    bump(acc, -0.12, 'dessert_only:-0.12');
  }

  return finalize(acc);
}

function scoreDinner(source: DeriveInput, text: string): { score: number; reasons: string[] } {
  const acc: ScoreAccumulator = { score: 0.32, reasons: ['base:0.32'] };
  const author = authorMealSlots(source.mealType);
  const decision = decisionMealSlots(source.decisionTags.mealTime);
  const standard = standardMealSlots(source.standardMetadata.mealTypes);
  const dish = source.standardMetadata.dishType;
  const serving = source.standardMetadata.servings;

  if (author.has('dinner')) bump(acc, 0.3, 'author:저녁:+0.30');
  if (decision.has('dinner')) bump(acc, 0.18, 'decision:dinner:+0.18');
  if (standard.has('dinner')) bump(acc, 0.14, 'standard:dinner:+0.14');

  if (dish === 'stew') bump(acc, 0.12, 'dish:stew:+0.12');
  if (dish === 'soup') bump(acc, 0.1, 'dish:soup:+0.10');
  if (dish === 'stir_fry') bump(acc, 0.1, 'dish:stir_fry:+0.10');
  if (dish === 'grilled') bump(acc, 0.1, 'dish:grilled:+0.10');
  if (dish === 'fried') bump(acc, 0.06, 'dish:fried:+0.06');
  if (dish === 'noodle' && !hasAny(text, [/라면/, /컵누들/])) bump(acc, 0.05, 'dish:noodle:+0.05');

  if (hasAny(text, [/가족/, /family/, /집밥/, /반찬/, /밥반찬/])) bump(acc, 0.1, 'tags:family:+0.10');
  if (serving >= 3) bump(acc, 0.06, 'servings>=3:+0.06');
  if (hasAny(text, [/고기/, /돼지/, /소고기/, /닭/, /생선/, /구이/, /찌개/, /국/])) {
    bump(acc, 0.08, 'protein_main:+0.08');
  }
  if (hasAny(text, [/파스타/, /양식/])) bump(acc, 0.06, 'western_dinner:+0.06');

  if (author.has('breakfast') && !author.has('dinner') && !author.has('저녁')) {
    bump(acc, -0.06, 'breakfast_only:-0.06');
  }
  if (hasAny(text, [/요거트/, /그래놀라/, /토스트/]) && !author.has('dinner')) {
    bump(acc, -0.1, 'breakfast_food:-0.10');
  }

  return finalize(acc);
}

function scoreLateNight(source: DeriveInput, text: string): { score: number; reasons: string[] } {
  const acc: ScoreAccumulator = { score: 0.2, reasons: ['base:0.20'] };
  const author = authorMealSlots(source.mealType);
  const decision = decisionMealSlots(source.decisionTags.mealTime);
  const standard = standardMealSlots(source.standardMetadata.mealTypes);
  const dish = source.standardMetadata.dishType;
  const spicy = source.decisionTags.spicyLevel;
  const time = source.time;

  if (author.has('lateNight')) bump(acc, 0.38, 'author:야식/간식:+0.38');
  if (decision.has('lateNight')) bump(acc, 0.22, 'decision:late_night:+0.22');
  if (standard.has('lateNight')) bump(acc, 0.18, 'standard:late_night/snack:+0.18');

  if (dish === 'snack') bump(acc, 0.16, 'dish:snack:+0.16');
  if (dish === 'noodle') bump(acc, 0.12, 'dish:noodle:+0.12');
  if (dish === 'fried') bump(acc, 0.08, 'dish:fried:+0.08');

  if (hasAny(text, [/라면/, /라멘/, /떡볶이/, /분식/, /핫도그/, /순대/, /어묵/, /야식/, /late_night/])) {
    bump(acc, 0.14, 'name:late_night_food:+0.14');
  }
  if (spicy >= 1) bump(acc, 0.08, 'spicy:+0.08');
  if (time <= 25) bump(acc, 0.1, 'cookTime<=25:+0.10');
  if (hasAny(text, [/안주/, /drinking/, /술/, /매콤/, /spicy/])) bump(acc, 0.08, 'drinking_snack:+0.08');
  if (hasAny(text, [/가벼운/, /light/, /샐러드/, /요거트/])) bump(acc, 0.06, 'light_late:+0.06');

  if (time >= 60) bump(acc, -0.15, 'cookTime>=60:-0.15');
  if (hasAny(text, [/갈비탕/, /설렁탕/, /보쌈/, /수육/]) && !author.has('lateNight')) {
    bump(acc, -0.12, 'heavy_dinner:-0.12');
  }

  return finalize(acc);
}

export function deriveMealTimeFit(recipe: DeriveInput): MealTimeFitResult {
  const text = textBlob([
    recipe.name,
    ...recipe.category,
    ...recipe.mealType,
    ...recipe.tags,
    ...recipe.situation,
    ...recipe.aiTags,
    recipe.standardMetadata.dishType,
    ...recipe.standardMetadata.tasteProfile,
    ...recipe.standardMetadata.situationTags,
    ...recipe.ingredients.map((i) => `${i.name} ${i.iconKey}`),
  ]);

  const breakfast = scoreBreakfast(recipe, text);
  const lunch = scoreLunch(recipe, text);
  const dinner = scoreDinner(recipe, text);
  const lateNight = scoreLateNight(recipe, text);

  let fit: MealTimeFit = {
    breakfast: breakfast.score,
    lunch: lunch.score,
    dinner: dinner.score,
    lateNight: lateNight.score,
  };

  const override = MEAL_TIME_OVERRIDES[recipe.id];
  if (override) {
    fit = {
      breakfast: override.breakfast ?? fit.breakfast,
      lunch: override.lunch ?? fit.lunch,
      dinner: override.dinner ?? fit.dinner,
      lateNight: override.lateNight ?? fit.lateNight,
    };
  }

  const reasons: MealTimeFitReasons = {
    breakfast: override?.reason
      ? [...breakfast.reasons, `override:${override.reason}`]
      : breakfast.reasons,
    lunch: override?.reason
      ? [...lunch.reasons, `override:${override.reason}`]
      : lunch.reasons,
    dinner: override?.reason
      ? [...dinner.reasons, `override:${override.reason}`]
      : dinner.reasons,
    lateNight: override?.reason
      ? [...lateNight.reasons, `override:${override.reason}`]
      : lateNight.reasons,
  };

  const foodTypes = classifyRecipeFoodTypes(recipe, text);
  const mainCategory = recipe.category[0] ?? recipe.standardMetadata.cuisine;

  return {
    recipeId: recipe.id,
    title: recipe.name,
    fit,
    primaryMealTime: primaryMealTimeFromFit(fit),
    reasons,
    mainCategory,
    cookTime: recipe.time,
    difficulty: recipe.difficulty,
    foodTypes,
  };
}

export function deriveMealTimeFitScoresOnly(recipe: DeriveInput): MealTimeFit {
  return deriveMealTimeFit(recipe).fit;
}
