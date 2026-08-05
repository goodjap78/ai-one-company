/** 한끼 앱 조리용 컵 기준 (ml). 레시피 원문은 컵 단위를 유지하고 표시 시 변환. */
export const COOKING_CUP_ML = 200;

/** 한국식 큰술 1스푼 ≈ 15ml */
export const COOKING_TABLESPOON_ML = 15;

/** 한국식 작은술 1스푼 ≈ 5ml */
export const COOKING_TEASPOON_ML = 5;

export function cupsToMilliliters(cups: number): number {
  return cups * COOKING_CUP_ML;
}

export function tablespoonsToMilliliters(tablespoons: number): number {
  return tablespoons * COOKING_TABLESPOON_ML;
}

export function teaspoonsToMilliliters(teaspoons: number): number {
  return teaspoons * COOKING_TEASPOON_ML;
}
