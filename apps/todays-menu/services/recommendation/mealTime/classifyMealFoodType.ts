/**
 * Sprint 57 — Food-type taxonomy for meal-time gap analysis.
 */
import type { Recipe } from '../../../data/recipes/types';
import { hasAny } from './mealTimeScoringUtils';

export const BREAKFAST_FOOD_TYPES = [
  'toast',
  'porridge',
  'egg',
  'sandwich',
  'soup',
  'light_soup',
  'light_rice',
  'yogurt_fruit',
  'salad_light',
] as const;

export const LUNCH_FOOD_TYPES = [
  'rice_bowl',
  'fried_rice',
  'noodle',
  'quick_korean',
  'gimbap',
  'sandwich_lunch',
] as const;

export const DINNER_FOOD_TYPES = [
  'soup_stew',
  'fish',
  'meat',
  'family_meal',
  'side_dish_combo',
  'pasta_western',
  'grilled',
] as const;

export const LATE_NIGHT_FOOD_TYPES = [
  'ramen',
  'snack',
  'spicy_quick',
  'noodle',
  'convenience_style',
  'light_late',
] as const;

export type BreakfastFoodType = (typeof BREAKFAST_FOOD_TYPES)[number];
export type LunchFoodType = (typeof LUNCH_FOOD_TYPES)[number];
export type DinnerFoodType = (typeof DINNER_FOOD_TYPES)[number];
export type LateNightFoodType = (typeof LATE_NIGHT_FOOD_TYPES)[number];

export type MealFoodType =
  | BreakfastFoodType
  | LunchFoodType
  | DinnerFoodType
  | LateNightFoodType;

type ClassifySource = Pick<Recipe, 'name' | 'category' | 'mealType' | 'tags' | 'aiTags' | 'standardMetadata'>;

export function classifyRecipeFoodTypes(source: ClassifySource, text: string): MealFoodType[] {
  const out: MealFoodType[] = [];
  const dish = source.standardMetadata.dishType;

  if (hasAny(text, [/토스트/, /프렌치토스트/])) out.push('toast');
  if (hasAny(text, [/죽/, /porridge/])) out.push('porridge');
  if (hasAny(text, [/계란/, /오믈렛/, /스크램블/]) || dish === 'other' && /계란/.test(source.name)) {
    out.push('egg');
  }
  if (dish === 'sandwich' || hasAny(text, [/샌드/, /클럽/])) out.push('sandwich');
  if (dish === 'soup' && hasAny(text, [/국/, /미역/, /콩나물/])) out.push('soup');
  if (hasAny(text, [/맑은국/, /파계란/, /양파계란/, /두부맑/, /감자맑/])) out.push('light_soup');
  if (dish === 'rice' && hasAny(text, [/가벼운/, /light/, /밥/])) out.push('light_rice');
  if (hasAny(text, [/요거트/, /그래놀라/, /파르페/])) out.push('yogurt_fruit');
  if (dish === 'salad' || hasAny(text, [/샐러드/])) out.push('salad_light');

  if (dish === 'rice_bowl' || hasAny(text, [/덮밥/, /규동/])) out.push('rice_bowl');
  if (hasAny(text, [/볶음밥/])) out.push('fried_rice');
  if (dish === 'noodle' || hasAny(text, [/면/, /국수/, /우동/, /라면/])) out.push('noodle');
  if (
    hasAny(text, [/한식/, /집밥/, /볶음/, /찌개/]) &&
    source.standardMetadata.cookingTime <= 35
  ) {
    out.push('quick_korean');
  }
  if (hasAny(text, [/김밥/])) out.push('gimbap');
  if (dish === 'sandwich' && source.mealType.includes('점심')) out.push('sandwich_lunch');

  if (dish === 'stew' || dish === 'soup' || hasAny(text, [/찌개/, /탕/, /국/])) out.push('soup_stew');
  if (hasAny(text, [/생선/, /고등어/, /갈치/, /연어/, /참치/, /fish/, /salmon/, /mackerel/])) {
    out.push('fish');
  }
  if (hasAny(text, [/돼지/, /소고기/, /닭/, /제육/, /불고기/, /갈비/, /pork/, /beef/, /chicken/])) {
    out.push('meat');
  }
  if (hasAny(text, [/가족/, /family/]) || source.standardMetadata.servings >= 3) out.push('family_meal');
  if (hasAny(text, [/반찬/, /밥반찬/, /나물/])) out.push('side_dish_combo');
  if (hasAny(text, [/파스타/, /양식/, /그라탕/])) out.push('pasta_western');
  if (dish === 'grilled' || hasAny(text, [/구이/, /스테이크/])) out.push('grilled');

  if (hasAny(text, [/라면/, /라멘/, /컵누들/])) out.push('ramen');
  if (dish === 'snack' || hasAny(text, [/떡볶이/, /핫도그/, /순대/, /어묵/, /분식/])) out.push('snack');
  if (source.standardMetadata.spiceLevel !== 'mild' && source.standardMetadata.cookingTime <= 30) {
    out.push('spicy_quick');
  }
  if (dish === 'noodle') out.push('noodle');
  if (hasAny(text, [/간편/, /quick/, /편의/, /도시락/, /즉석/])) out.push('convenience_style');
  if (hasAny(text, [/가벼운/, /light/, /요거트/, /샐러드/]) && source.mealType.includes('야식')) {
    out.push('light_late');
  }

  return [...new Set(out)];
}

export function foodTypeSlotAffinity(type: MealFoodType): Array<'breakfast' | 'lunch' | 'dinner' | 'lateNight'> {
  if ((BREAKFAST_FOOD_TYPES as readonly string[]).includes(type)) {
    return ['breakfast'];
  }
  if ((LUNCH_FOOD_TYPES as readonly string[]).includes(type)) {
    return ['lunch'];
  }
  if ((DINNER_FOOD_TYPES as readonly string[]).includes(type)) {
    return ['dinner'];
  }
  if ((LATE_NIGHT_FOOD_TYPES as readonly string[]).includes(type)) {
    return ['lateNight'];
  }
  return ['dinner'];
}
