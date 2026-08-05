/** Cup amounts for these names stay as 컵 — never convert to ml. */
const NON_LIQUID_CUP_NAME_MARKERS = [
  '밀가루',
  '쌀',
  '설탕',
  '빵가루',
  '부침가루',
  '전분',
  '김치',
  '잔멸치',
  '토마토소스',
  '스파게티',
  '면',
  '떡',
  '콩나물',
] as const;

const BULK_LIQUID_ICON_KEYS = new Set(['water', 'milk']);

const BULK_LIQUID_NAME_MARKERS = [
  '다시마물',
  '멸치육수',
  '사골육수',
  '육수',
  '우유',
  '두유',
  '주스',
  '생크림',
  '물',
] as const;

/** 양념 액체 — 큰술·작은술 표시 유지 (ml 변환 제외). */
const SEASONING_LIQUID_NAME_MARKERS = [
  '간장',
  '식초',
  '맛술',
  '청주',
  '참기름',
  '식용유',
  '올리브오일',
  '굴소스',
  '케첩',
  '마요',
  '된장',
  '고추장',
] as const;

function isNonLiquidCupSolid(name: string): boolean {
  return NON_LIQUID_CUP_NAME_MARKERS.some((marker) => name.includes(marker));
}

function isSeasoningLiquidName(name: string): boolean {
  return SEASONING_LIQUID_NAME_MARKERS.some((marker) => name.includes(marker));
}

/**
 * 부피가 중요한 액체(물·육수·우유) — 컵·큰술·작은술을 ml로 표시.
 * 간장·식초 등 양념 액체는 큰술 유지.
 */
export function isBulkLiquidForMlDisplay(name: string, iconKey?: string | null): boolean {
  const normalizedName = name.trim();
  if (!normalizedName) return false;

  if (isNonLiquidCupSolid(normalizedName)) return false;
  if (isSeasoningLiquidName(normalizedName)) return false;

  if (iconKey && BULK_LIQUID_ICON_KEYS.has(iconKey)) return true;

  return BULK_LIQUID_NAME_MARKERS.some((marker) => normalizedName.includes(marker));
}

/**
 * Whether a 컵 amount should be shown as ml (bulk liquids only).
 */
export function isLiquidCupIngredient(name: string, iconKey?: string | null): boolean {
  return isBulkLiquidForMlDisplay(name, iconKey);
}
