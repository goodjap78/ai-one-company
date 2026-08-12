import type { MenuItem } from '../../../../types/recommendation';
import type { UserFeeling } from '../../../../types/hankkiPersonality';
import type { MealSituationSnapshot } from '../../../../types/mealIntelligenceEngine';
import { classifyMealArchetypes, type MealArchetype } from '../mealProfile';

const FEELING_ARCHETYPE: Record<UserFeeling, Partial<Record<MealArchetype, number>>> = {
  busy: { simple: 14, rice: 10, noodle: 10, breakfast: 8 },
  tired: { simple: 12, soup: 12, rice: 8, stew: 8 },
  happy: { special: 12, grill: 10, bbq: 10, rice: 6 },
  lazy: { delivery: 16, simple: 14, noodle: 8 },
  comfort: { stew: 16, soup: 14, hotpot: 12, jeon: 8 },
  family: { family: 18, grill: 14, bbq: 12, stew: 10, hotpot: 8 },
  alone: { simple: 10, rice: 10, noodle: 8, delivery: 8 },
};

const BUSY_MAX_COOK_MIN = 25;
const LAZY_MAX_COOK_MIN = 20;

export type PersonalityFitResult = {
  points: number;
  notes: string[];
};

/** Step 3: does this meal naturally fit how the user might feel? */
export function scorePersonalityFit(
  menu: MenuItem,
  feelings: UserFeeling[],
  situation: MealSituationSnapshot,
): PersonalityFitResult {
  const archetypes = classifyMealArchetypes(menu);
  let points = 0;
  const notes: string[] = [];

  for (const feeling of feelings) {
    const table = FEELING_ARCHETYPE[feeling];
    for (const archetype of archetypes) {
      const bonus = table[archetype];
      if (bonus !== undefined) {
        points += bonus;
        notes.push(`feel_${feeling}_${archetype}`);
      }
    }
  }

  if (feelings.includes('busy') && menu.cookTime <= BUSY_MAX_COOK_MIN) {
    points += 10;
    notes.push('feel_busy_quick');
  }
  if (feelings.includes('busy') && menu.cookTime > 40) {
    points -= 12;
    notes.push('feel_busy_heavy');
  }

  if (feelings.includes('lazy') && menu.cookTime <= LAZY_MAX_COOK_MIN) {
    points += 10;
    notes.push('feel_lazy_easy');
  }
  if (feelings.includes('lazy') && situation.mealMode === 'delivery') {
    points += 8;
    notes.push('feel_lazy_delivery');
  }

  if (feelings.includes('family') && menu.situationTags?.includes('family')) {
    points += 10;
    notes.push('feel_family_tag');
  }

  if (feelings.includes('alone') && menu.cookTime <= 30 && menu.difficulty === 'easy') {
    points += 6;
    notes.push('feel_alone_easy');
  }

  return { points: Math.round(points / Math.max(1, feelings.length)), notes };
}
