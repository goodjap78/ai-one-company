/**
 * Baby batch cooking UI copy — not medical or storage advice.
 */

export const babyBatchCookingCopy = {
  weeklyEntryButton: '재료 한 번에 준비하기',
  selectTitle: '재료 한 번에 준비하기',
  selectSubtitle: '만들 메뉴를 골라 회분을 정해 주세요.',
  selectedCount: (count: number) => `${count}개 메뉴 선택`,
  viewIngredientsButton: '선택한 메뉴 재료 보기',
  noSelectionHint: '메뉴를 하나 이상 선택해 주세요.',
  batchFriendlyBadge: '한 번에 만들기 좋은 메뉴',
  portionFixed: '1회분',
  portionPreset: (n: number) => `${n}회분`,
  resultTitle: '준비할 재료',
  resultSubtitle: '선택한 메뉴에 필요한 재료를 모았어요.',
  selectedMenusTitle: (count: number) => `선택한 메뉴 ${count}개`,
  selectedMenuLine: (name: string, portion: number) => `${name} · ${portion}회분`,
  separateUnitNote: '단위가 달라 따로 표시해요.',
  guidanceLines: [
    '새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.',
    '이미 먹어본 재료를 중심으로 활용해보세요.',
  ] as const,
  checklistProgress: (checked: number, total: number) => `준비한 재료 ${checked} / ${total}`,
  checklistComplete: '모든 재료를 확인했어요.',
  resetChecksButton: '체크 초기화',
  shareIngredientsButton: '재료 목록 공유',
  shareDialogTitle: '재료 목록 공유',
  shareFailedTitle: '공유하지 못했어요',
  shareFailedMessage: '잠시 후 다시 시도해 주세요.',
  noIngredientsMessage: '선택한 메뉴에서 합산할 재료가 없어요.',
  loadingMessage: '이번 주 메뉴를 불러오고 있어요',
  emptyPlanTitle: '주간 메뉴가 없어요',
  emptyPlanMessage: '먼저 이번 주 메뉴를 골라 주세요.',
  backToWeekly: '이번 주 메뉴로',
} as const;
