export type FridgePopularChip = {
  label: string;
  iconKey: string;
};

/** Sprint 55.2 — quick-pick staples only; full catalog via search / custom input. */
export const FRIDGE_POPULAR_CHIPS: FridgePopularChip[] = [
  { label: '양파', iconKey: 'onion' },
  { label: '계란', iconKey: 'egg' },
  { label: '대파', iconKey: 'green_onion' },
  { label: '감자', iconKey: 'potato' },
  { label: '당근', iconKey: 'carrot' },
  { label: '두부', iconKey: 'tofu' },
  { label: '김', iconKey: 'seaweed' },
  { label: '버섯', iconKey: 'mushroom' },
  { label: '무', iconKey: 'radish' },
  { label: '양배추', iconKey: 'cabbage' },
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
  resultsGuide: '선택한 재료로 지금 만들 수 있는 메뉴를 추천했어요.',
  primaryShortage: '조건에 맞는 메뉴가 아직 많지 않아요.',
  anotherMenuRecommendation: '다른 메뉴 추천',
  reselect: '재료 다시 선택',
  emptyTitle: '선택한 재료로 찾은 메뉴가 아직 없어요',
  emptyHint: '다른 재료를 골라보거나, 재료를 더 추가해 보세요.',
  groupReady: '바로 만들 수 있어요',
  groupOneMissing: '하나만 더 있으면 돼요',
  groupNeedTwo: '두 가지만 더 있으면 돼요',
  groupExtended: '더 많은 메뉴',
  showMoreMenus: '더 많은 메뉴 보기',
  groupSimilar: '비슷한 메뉴도 추천해요',
  groupSideDishes: '함께 만들기 좋은 반찬',
  matchRate: (percent: number) => `일치 ${percent}%`,
  starLabel: (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating),
  ownedPrefix: '✔ 보유',
  missingPrefix: '❌ 부족',
  matchedSelectedPrefix: '✔ 활용',
  unusedSelectedPrefix: '○ 미활용 선택',
  ownedLabel: '보유',
  missingLabel: '부족',
  matchedSelectedLabel: '활용',
  unusedSelectedLabel: '미활용 선택',
  utilizationAll: (count: number) => `선택한 재료 ${count}개 모두 활용해요`,
  utilizationPartial: (selected: number, matched: number) =>
    `선택한 재료 ${selected}개 중 ${matched}개를 활용해요`,
  utilizationSingle: (selected: number) => `선택한 재료 1개 활용`,
  utilizationShortage: '해당 재료를 함께 활용하는 레시피가 부족해요',
  detailCta: '상세보기',
  cookTime: (minutes: number) => `${minutes}분`,
} as const;
