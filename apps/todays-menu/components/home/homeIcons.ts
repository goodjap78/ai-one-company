export type HomeIconKey =
  | 'homemade'
  | 'delivery'
  | 'kids'
  | 'fridge'
  | 'receipt'
  | 'pet'
  | 'health'
  | 'reward'
  | 'weather'
  | 'recentMeals'
  | 'time'
  | 'cookTime'
  | 'difficulty'
  | 'servings'
  | 'heart'
  | 'heartOutline'
  | 'pairingDefault'
  | 'chevronRight';

export const homeIcons = {
  homemade: 'homemade',
  delivery: 'delivery',
  kids: 'kids',
  fridge: 'fridge',
  receipt: 'receipt',
  pet: 'pet',
  health: 'health',
  reward: 'reward',
  weather: 'weather',
  recentMeals: 'recentMeals',
  time: 'time',
  cookTime: 'cookTime',
  difficulty: 'difficulty',
  servings: 'servings',
  heart: 'heart',
  heartOutline: 'heartOutline',
  pairingDefault: 'pairingDefault',
  chevronRight: 'chevronRight',
} as const satisfies Record<HomeIconKey, HomeIconKey>;

export function getHomeIcon(key: HomeIconKey): HomeIconKey {
  return homeIcons[key];
}
