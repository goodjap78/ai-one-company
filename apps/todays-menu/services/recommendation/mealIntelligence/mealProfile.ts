import type { MenuItem } from '../../../types/recommendation';
import type { MealStyle } from '../../../types/mealStyle';

/** How a meal "feels" to eat — used for situation scoring, not tag matching. */
export type MealArchetype =
  | 'cold_meal'
  | 'soup'
  | 'stew'
  | 'grill'
  | 'hotpot'
  | 'jeon'
  | 'noodle'
  | 'rice'
  | 'pasta'
  | 'salad'
  | 'breakfast'
  | 'simple'
  | 'family'
  | 'bbq'
  | 'special'
  | 'delivery';

type ArchetypeRule = {
  archetype: MealArchetype;
  keywords: string[];
};

const ARCHETYPE_RULES: ArchetypeRule[] = [
  { archetype: 'cold_meal', keywords: ['냉면', '콩국수', '막국수', '냉모밀', '비빔국수', '초계국수', '회덮밥'] },
  { archetype: 'salad', keywords: ['샐러드'] },
  { archetype: 'stew', keywords: ['찌개', '전골', '부대'] },
  { archetype: 'soup', keywords: ['탕', '국', '곰탕', '갈비탕', '수제비', '미역국', '잔치국수'] },
  { archetype: 'hotpot', keywords: ['전골', '샤브', '마라탕'] },
  { archetype: 'grill', keywords: ['삼겹살', '곱창', '구이', '고기', '갈비', '돈까스'] },
  { archetype: 'bbq', keywords: ['삼겹살', '곱창', '치킨', '족발', '보쌈'] },
  { archetype: 'jeon', keywords: ['전', '부침', '파전', '김치전'] },
  { archetype: 'noodle', keywords: ['국수', '면', '짜파', '짜장', '짬뽕', '라면', '우동', '파스타'] },
  { archetype: 'pasta', keywords: ['파스타', '스파게티', '크림'] },
  { archetype: 'rice', keywords: ['밥', '비빔밥', '덮밥', '볶음밥', '김밥', '초밥'] },
  { archetype: 'breakfast', keywords: ['죽', '토스트', '샌드위치', '시리얼'] },
  { archetype: 'simple', keywords: ['컵라면', '라면', '짜파게티', '즉석', '간편'] },
  { archetype: 'special', keywords: ['치킨', '피자', '족발', '보쌈', '마라탕'] },
];

/** Variety rotation — prefer moving through these archetypes over time. */
export const VARIETY_CYCLE: MealArchetype[] = ['rice', 'noodle', 'grill', 'stew', 'delivery'];

function titleMatches(title: string, keywords: string[]): boolean {
  return keywords.some((keyword) => title.includes(keyword));
}

export function classifyMealArchetypes(menu: MenuItem): MealArchetype[] {
  const title = menu.title;
  const found = new Set<MealArchetype>();

  for (const rule of ARCHETYPE_RULES) {
    if (titleMatches(title, rule.keywords)) {
      found.add(rule.archetype);
    }
  }

  if (menu.mealStyle === 'grill') found.add('grill');
  if (menu.mealStyle === 'grill') found.add('bbq');
  if (menu.mealStyle === 'instant') found.add('simple');
  if (menu.mealStyle === 'delivery' || menu.mode === 'delivery') found.add('delivery');
  if (menu.tags.includes('one_pot')) found.add('stew');
  if (menu.tags.includes('rice_based')) found.add('rice');
  if (menu.tags.includes('family')) found.add('family');
  if (menu.situationTags?.includes('family')) found.add('family');
  if (menu.situationTags?.includes('weekend')) found.add('special');

  if (found.size === 0) {
    if (menu.mealStyle === 'recipe') found.add('rice');
    else if (menu.mode === 'delivery') found.add('delivery');
    else found.add('rice');
  }

  return [...found];
}

export function mealHasArchetype(menu: MenuItem, archetype: MealArchetype): boolean {
  return classifyMealArchetypes(menu).includes(archetype);
}

export function getPrimaryArchetype(menu: MenuItem): MealArchetype {
  const archetypes = classifyMealArchetypes(menu);
  const priority: MealArchetype[] = [
    'delivery',
    'cold_meal',
    'stew',
    'grill',
    'noodle',
    'rice',
    'simple',
    'jeon',
    'soup',
    'pasta',
    'salad',
    'breakfast',
    'special',
    'family',
    'bbq',
    'hotpot',
  ];
  for (const archetype of priority) {
    if (archetypes.includes(archetype)) return archetype;
  }
  return archetypes[0] ?? 'rice';
}

export function menuCuisineFromId(id: string): string {
  if (id.startsWith('gold_kr_') || id.startsWith('core_kr_') || id.startsWith('core_quick_')) {
    return 'korean';
  }
  if (id.startsWith('gold_j_') || id.startsWith('core_j_')) return 'japanese';
  if (id.startsWith('gold_c_') || id.startsWith('core_c_')) return 'chinese';
  if (id.startsWith('gold_w_') || id.startsWith('core_w_') || id.startsWith('core_h_')) {
    return 'western';
  }
  return 'catalog';
}

export function nextVarietyArchetype(last: MealArchetype | null): MealArchetype {
  if (!last) return 'rice';
  const index = VARIETY_CYCLE.indexOf(last);
  if (index === -1) return VARIETY_CYCLE[0];
  return VARIETY_CYCLE[(index + 1) % VARIETY_CYCLE.length];
}
