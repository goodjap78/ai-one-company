import type { MealSituationSnapshot } from '../../../../types/mealIntelligenceEngine';
import type { SituationDNA, MealDnaCookingTime, MealDnaHealth } from '../../../../types/mealDna';
import type { SituationTag, WeatherTag } from '../../../../types/mealIntelligence';
import { mealTypeToSlot } from '../../../../types/mealTime';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from '../mealKnowledge';

function resolveWeatherTags(situation: MealSituationSnapshot): WeatherTag[] {
  const tags: WeatherTag[] = [];
  const { weather } = situation;

  if (isRainy(weather)) tags.push('rain');
  if (isCold(weather)) tags.push('cold');
  if (isVeryHot(weather) || isTemperatureFatigue(weather)) tags.push('hot');
  if (weather.condition === 'cloudy') tags.push('humid');

  return tags;
}

function resolveSituationTags(situation: MealSituationSnapshot): SituationTag[] {
  const tags: SituationTag[] = ['home'];

  if (situation.mealMode === 'delivery') tags.push('delivery');
  if (situation.isWeekend) tags.push('weekend');
  if (situation.mealType === 'late_night' || situation.hourOfDay >= 22) {
    tags.push('alone');
  }
  if (situation.isWeekend && situation.mealType === 'dinner') {
    tags.push('family', 'friends');
  }
  if (situation.mealType === 'lunch' && !situation.isWeekend) {
    tags.push('office', 'alone');
  }

  return [...new Set(tags)];
}

function resolvePreferredCookingTime(situation: MealSituationSnapshot): MealDnaCookingTime[] {
  if (situation.mealType === 'lunch' && !situation.isWeekend) {
    return ['quick', 'moderate'];
  }
  if (situation.mealType === 'late_night') {
    return ['quick'];
  }
  if (situation.isWeekend) {
    return ['moderate', 'slow'];
  }
  return ['quick', 'moderate', 'slow'];
}

function resolvePreferredHealth(situation: MealSituationSnapshot): MealDnaHealth[] {
  const { weather } = situation;

  if (isVeryHot(weather) || isTemperatureFatigue(weather)) {
    return ['light', 'balanced'];
  }
  if (isCold(weather) || isRainy(weather)) {
    return ['hearty', 'balanced'];
  }
  if (situation.mealType === 'late_night') {
    return ['balanced', 'indulgent'];
  }
  return ['balanced', 'light', 'hearty'];
}

/** Build today's desired DNA profile before scoring meals. */
export function buildSituationDna(situation: MealSituationSnapshot): SituationDNA {
  return {
    weather: resolveWeatherTags(situation),
    season: [situation.season],
    time: [mealTypeToSlot(situation.mealType)],
    situation: resolveSituationTags(situation),
    preferredCookingTime: resolvePreferredCookingTime(situation),
    preferredHealth: resolvePreferredHealth(situation),
  };
}
