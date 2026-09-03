import {
  BABY_FOOD_HREF,
  ELEMENTARY_BROWSE_HREF,
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
  TODDLER_MEALS_HREF,
  TODDLER_BREAKFAST_WEEK_HREF,
  TODDLER_DINNER_WEEK_HREF,
} from './appRoutes';

/**
 * HANKKI v1.1 — Home IA purpose-first copy and entry definitions.
 */
export const homeIaCopy = {
  heroTitle: '한끼',
} as const;

export type HomePurposeId = 'today' | 'kids' | 'weekly';

export type HomePurposeEntry = {
  id: string;
  title: string;
  href: string;
};

export type HomePurposeDef = {
  id: HomePurposeId;
  emoji: string;
  title: string;
  description: string;
  entries?: readonly HomePurposeEntry[];
};

export type HomeWeeklyAudienceId = 'toddler' | 'elementary';

/** Sprint 12 — 2-step weekly IA: audience then meal. */
export const HOME_WEEKLY_AUDIENCES = [
  { id: 'toddler' as const, title: '유아' },
  { id: 'elementary' as const, title: '초등학생' },
] as const;

export const HOME_WEEKLY_MEAL_LABELS = {
  breakfast: '아침 7일',
  dinner: '저녁 7일',
} as const;

export const HOME_PURPOSES: readonly HomePurposeDef[] = [
  {
    id: 'today',
    emoji: '🍚',
    title: '오늘 뭐 먹지?',
    description: '나와 가족의 오늘 한 끼를 골라보세요.',
  },
  {
    id: 'kids',
    emoji: '👨‍👩‍👧',
    title: '아이 뭐 먹이지?',
    description: '아이에게 맞는 한 끼를 찾아보세요.',
    entries: [
      {
        id: 'babyFood',
        title: '이유식',
        href: BABY_FOOD_HREF,
      },
      {
        id: 'toddlerMeals',
        title: '유아식',
        href: TODDLER_MEALS_HREF,
      },
      {
        id: 'elementary',
        title: '초등학생',
        href: ELEMENTARY_BROWSE_HREF,
      },
    ],
  },
  {
    id: 'weekly',
    emoji: '📅',
    title: '일주일 식단',
    description: '이번 주 메뉴 고민을 한 번에 해결해보세요.',
    entries: [
      {
        id: 'toddlerBreakfast',
        title: '유아 아침 7일',
        href: TODDLER_BREAKFAST_WEEK_HREF,
      },
      {
        id: 'toddlerDinner',
        title: '유아 저녁 7일',
        href: TODDLER_DINNER_WEEK_HREF,
      },
      {
        id: 'elemBreakfast',
        title: '초등 아침 7일',
        href: ELEMENTARY_BREAKFAST_WEEK_HREF,
      },
      {
        id: 'elemDinner',
        title: '초등 저녁 7일',
        href: ELEMENTARY_DINNER_WEEK_HREF,
      },
    ],
  },
] as const;

export function getHomePurposeById(id: HomePurposeId): HomePurposeDef {
  const purpose = HOME_PURPOSES.find((item) => item.id === id);
  if (!purpose) {
    throw new Error(`Unknown home purpose: ${id}`);
  }
  return purpose;
}
