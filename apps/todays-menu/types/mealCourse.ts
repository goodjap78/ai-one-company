/** Meal role in a dining context — not to be confused with breakfast/lunch/dinner `MealType`. */
export const MEAL_COURSE_TYPES = ['MAIN', 'SIDE', 'SOUP', 'DESSERT', 'DRINK'] as const;

export type MealCourseType = (typeof MEAL_COURSE_TYPES)[number];

/** Only MAIN meals are eligible for today's primary recommendation (Product Decision #002). */
export const RECOMMENDABLE_MEAL_COURSE_TYPES: MealCourseType[] = ['MAIN'];
