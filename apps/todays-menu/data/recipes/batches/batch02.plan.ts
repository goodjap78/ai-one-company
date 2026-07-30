/**
 * Sprint RF-1 — Batch 02 production plan (NOT inserted into HANKKI_RECIPES).
 */
export type Batch02PlanEntry = {
  id: string;
  name: string;
  heroImageKey: string;
  category: string[];
  mealType: string[];
  timeTarget: number;
  difficulty: '쉬움' | '보통' | '어려움';
  notes: string;
  priority: 1 | 2 | 3;
};

export const BATCH_02_PLAN: readonly Batch02PlanEntry[] = [
  {
    id: '011',
    name: '순두부찌개',
    heroImageKey: 'sundubu_jjigae',
    category: ['한식', '국물요리'],
    mealType: ['저녁'],
    timeTarget: 30,
    difficulty: '쉬움',
    notes: '국물 라인 확장',
    priority: 1,
  },
  {
    id: '012',
    name: '닭볶음탕',
    heroImageKey: 'dakbokkeumtang',
    category: ['한식', '조림'],
    mealType: ['저녁'],
    timeTarget: 45,
    difficulty: '보통',
    notes: '감자·당근 조림 스텝',
    priority: 1,
  },
  {
    id: '013',
    name: '오징어볶음',
    heroImageKey: 'ojingeo_bokkeum',
    category: ['한식', '볶음'],
    mealType: ['저녁'],
    timeTarget: 25,
    difficulty: '보통',
    notes: '해산물 라인',
    priority: 1,
  },
  {
    id: '014',
    name: '갈비탕',
    heroImageKey: 'galbitang',
    category: ['한식', '국물요리'],
    mealType: ['점심', '저녁'],
    timeTarget: 90,
    difficulty: '어려움',
    notes: '장시간 육수 — tip 중요',
    priority: 2,
  },
  {
    id: '015',
    name: '육개장',
    heroImageKey: 'yukgaejang',
    category: ['한식', '국물요리'],
    mealType: ['점심', '저녁'],
    timeTarget: 50,
    difficulty: '보통',
    notes: '매콤 국물',
    priority: 2,
  },
  {
    id: '016',
    name: '미역국',
    heroImageKey: 'miyeok_guk',
    category: ['한식', '국물요리'],
    mealType: ['아침', '저녁'],
    timeTarget: 30,
    difficulty: '쉬움',
    notes: '담백/건강',
    priority: 1,
  },
  {
    id: '017',
    name: '떡국',
    heroImageKey: 'tteokguk',
    category: ['한식', '국물요리'],
    mealType: ['아침', '점심'],
    timeTarget: 35,
    difficulty: '쉬움',
    notes: '명절/아침 슬롯',
    priority: 2,
  },
  {
    id: '018',
    name: '감자조림',
    heroImageKey: 'gamja_jorim',
    category: ['한식', '반찬'],
    mealType: ['점심', '저녁'],
    timeTarget: 25,
    difficulty: '쉬움',
    notes: '반찬형',
    priority: 2,
  },
  {
    id: '019',
    name: '계란말이',
    heroImageKey: 'egg_roll',
    category: ['한식', '반찬', '간편식'],
    mealType: ['아침', '점심'],
    timeTarget: 15,
    difficulty: '쉬움',
    notes: '빠른 아침',
    priority: 1,
  },
  {
    id: '020',
    name: '소불고기덮밥',
    heroImageKey: 'beef_bulgogi_don',
    category: ['한식', '덮밥'],
    mealType: ['점심', '저녁'],
    timeTarget: 25,
    difficulty: '쉬움',
    notes: 'Batch 01 불고기와 차별화된 덮밥 형태',
    priority: 1,
  },
] as const;

export const BATCH_02_STATUS = {
  insertedIntoProduction: true,
  insertedAt: 'RF-2',
  nextActions: [
    'Add hero JPGs under assets/meals/ for 011–020',
    'Register local requires when files exist',
    'npm run recipes:validate -- --batch=02',
    'npm run recipe-assets:dry',
  ],
} as const;
