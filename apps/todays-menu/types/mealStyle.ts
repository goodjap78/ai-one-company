/** How the user executes a complete meal after accepting (PD-011). */
export const MEAL_STYLES = ['recipe', 'grill', 'delivery', 'assembly', 'instant'] as const;

export type MealStyle = (typeof MEAL_STYLES)[number];
