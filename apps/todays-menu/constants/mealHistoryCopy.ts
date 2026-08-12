export const MEAL_HISTORY_COPY = {
  sectionTitle: '최근 먹은 메뉴',
  screenSubtitle: '날짜별로 최근 식사를 모아봤어요.',
  emptyMessage: '아직 기록된 식사가 없습니다.',
  emptyHint: '레시피에서 "오늘 이 메뉴로 먹었어요"를 누르면 여기에 쌓여요.',
} as const;

export function formatMealHistoryDate(cookedDate: string): string {
  const parts = cookedDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return cookedDate;
  }

  const [, month, day] = parts;
  return `${month}월 ${day}일`;
}
