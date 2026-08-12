export const SEARCH_COPY = {
  placeholder: '레시피·재료 검색 (예: 김치, 계란)',
  emptyQueryHint: '최근 검색',
  emptyResults: '검색 결과가 없습니다.',
  resultIngredientMatch: (ingredient: string) => `재료: ${ingredient}`,
  backLabel: '← 홈으로',
  screenTitle: '레시피 검색',
} as const;
