import type { MenuItem } from '../../../../types/recommendation';
import type { MealSituationSnapshot } from '../../../../types/mealIntelligenceEngine';
import type { MealDNA, SituationDNA } from '../../../../types/mealDna';
import { MEAL_DNA_DIMENSION_WEIGHTS } from '../../../../types/mealDna';
import { buildSituationDna } from './buildSituationDna';
import { resolveMealDna } from './resolveMealDna';

export type MealDnaScoreResult = {
  points: number;
  notes: string[];
};

function overlapScore<T extends string>(
  mealValues: T[],
  situationValues: T[],
  weight: number,
  noteKey: string,
): { points: number; notes: string[] } {
  const overlap = mealValues.filter((value) => situationValues.includes(value));
  if (overlap.length === 0) return { points: 0, notes: [] };
  return {
    points: Math.min(weight, overlap.length * Math.round(weight / 2)),
    notes: [`dna_${noteKey}_${overlap[0]}`],
  };
}

function timeScore(mealDna: MealDNA, situationDna: SituationDNA): { points: number; notes: string[] } {
  const weight = MEAL_DNA_DIMENSION_WEIGHTS.time;
  const slot = situationDna.time[0];
  if (mealDna.time.includes(slot)) {
    return { points: weight, notes: [`dna_time_${slot.toLowerCase()}`] };
  }
  return { points: -Math.round(weight * 0.5), notes: ['dna_time_mismatch'] };
}

function cookingTimeScore(
  mealDna: MealDNA,
  situationDna: SituationDNA,
): { points: number; notes: string[] } {
  const weight = MEAL_DNA_DIMENSION_WEIGHTS.cookingTime;
  if (situationDna.preferredCookingTime.includes(mealDna.cookingTime)) {
    return { points: weight, notes: [`dna_cook_${mealDna.cookingTime}`] };
  }
  const isTooSlow =
    mealDna.cookingTime === 'slow' && situationDna.preferredCookingTime.includes('quick');
  if (isTooSlow) {
    return { points: -Math.round(weight * 0.6), notes: ['dna_cook_too_slow'] };
  }
  return { points: 0, notes: [] };
}

function healthScore(mealDna: MealDNA, situationDna: SituationDNA): { points: number; notes: string[] } {
  const weight = MEAL_DNA_DIMENSION_WEIGHTS.health;
  if (situationDna.preferredHealth.includes(mealDna.health)) {
    return { points: weight, notes: [`dna_health_${mealDna.health}`] };
  }
  return { points: 0, notes: [] };
}

/** Score how well a meal's DNA matches today's situation DNA. */
export function scoreMealDnaMatch(
  mealDna: MealDNA,
  situationDna: SituationDNA,
): MealDnaScoreResult {
  let points = 0;
  const notes: string[] = [];

  const dimensions = [
    overlapScore(mealDna.weather, situationDna.weather, MEAL_DNA_DIMENSION_WEIGHTS.weather, 'weather'),
    overlapScore(mealDna.season, situationDna.season, MEAL_DNA_DIMENSION_WEIGHTS.season, 'season'),
    timeScore(mealDna, situationDna),
    overlapScore(
      mealDna.situation,
      situationDna.situation,
      MEAL_DNA_DIMENSION_WEIGHTS.situation,
      'situation',
    ),
    cookingTimeScore(mealDna, situationDna),
    healthScore(mealDna, situationDna),
  ];

  for (const partial of dimensions) {
    points += partial.points;
    notes.push(...partial.notes);
  }

  return { points, notes };
}

/** HMIE — attribute-based meal scoring from Meal DNA. */
export function scoreMealDna(
  menu: MenuItem,
  situation: MealSituationSnapshot,
): MealDnaScoreResult {
  const mealDna = resolveMealDna(menu);
  const situationDna = buildSituationDna(situation);
  return scoreMealDnaMatch(mealDna, situationDna);
}

export { buildSituationDna, resolveMealDna };
