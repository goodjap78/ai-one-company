import { FRIDGE_NOODLE_MATCH_KEY } from '../services/fridge/fridgeIngredientMatch';

export type FridgePopularChip = {
  label: string;
  iconKey: string;
};

/** Popular chips — only entries with a resolvable iconKey (or virtual noodle key). */
export const FRIDGE_POPULAR_CHIPS: FridgePopularChip[] = [
  { label: '양파', iconKey: 'onion' },
  { label: '계란', iconKey: 'egg' },
  { label: '대파', iconKey: 'green_onion' },
  { label: '돼지고기', iconKey: 'pork' },
  { label: '밥', iconKey: 'rice' },
  { label: '감자', iconKey: 'potato' },
  { label: '당근', iconKey: 'carrot' },
  { label: '양배추', iconKey: 'cabbage' },
  { label: '두부', iconKey: 'tofu' },
  { label: '소고기', iconKey: 'beef' },
  { label: '닭고기', iconKey: 'chicken' },
  { label: '김치', iconKey: 'kimchi' },
  { label: '햄', iconKey: 'ham' },
  { label: '시금치', iconKey: 'spinach' },
  { label: '애호박', iconKey: 'zucchini' },
  { label: '버섯', iconKey: 'mushroom' },
  { label: '콩나물', iconKey: 'bean_sprout' },
  { label: '치즈', iconKey: 'cheese' },
  { label: '토마토', iconKey: 'tomato' },
  { label: '김', iconKey: 'seaweed' },
  { label: '무', iconKey: 'radish' },
  { label: '청양고추', iconKey: 'green_chili' },
  { label: '참치', iconKey: 'tuna' },
  { label: '오징어', iconKey: 'squid' },
  { label: '어묵', iconKey: 'fish_cake' },
  { label: '면류', iconKey: FRIDGE_NOODLE_MATCH_KEY },
  { label: '식빵', iconKey: 'bread_crumbs' },
  { label: '우유', iconKey: 'milk' },
  { label: '버터', iconKey: 'butter' },
  { label: '깻잎', iconKey: 'perilla' },
  { label: '소시지', iconKey: 'sausage' },
  { label: '고구마', iconKey: 'sweet_potato' },
  { label: '브로콜리', iconKey: 'broccoli' },
  { label: '아보카도', iconKey: 'avocado' },
];

/** Chips from the brief that could not be connected to a known iconKey. */
export const FRIDGE_UNMAPPED_CHIP_LABELS = ['만두'] as const;

export const FRIDGE_RAID_COPY = {
  screenTitle: '냉장고 털기',
  screenDescription: '집에 있는 재료를 골라주세요.\n지금 만들 수 있는 메뉴를 찾아드릴게요.',
  popularTitle: '인기 재료',
  selectedTitle: '선택한 재료',
  selectedCount: (count: number) => `${count}개 선택`,
  clearAll: '전체 초기화',
  customPlaceholder: '재료 직접 입력 (예: 양파)',
  customAdd: '추가',
  customFail: '아직 지원하지 않는 재료예요',
  maxReached: '재료는 최대 40개까지 선택할 수 있어요.',
  recommendCta: '이 재료로 추천받기',
  resultsTitle: '추천 결과',
  reselect: '재료 다시 선택',
  emptyTitle: '선택한 재료로 찾은 메뉴가 아직 없어요',
  emptyHint: '다른 재료를 골라보거나, 재료를 더 추가해 보세요.',
  groupReady: '바로 만들 수 있어요',
  groupOneMissing: '하나만 더 있으면 돼요',
  groupSimilar: '비슷한 메뉴도 추천해요',
  groupSideDishes: '함께 만들기 좋은 반찬',
  matchRate: (percent: number) => `일치 ${percent}%`,
  ownedLabel: '보유한 핵심 재료',
  missingLabel: '부족한 재료',
  detailCta: '상세보기',
  cookTime: (minutes: number) => `${minutes}분`,
} as const;
