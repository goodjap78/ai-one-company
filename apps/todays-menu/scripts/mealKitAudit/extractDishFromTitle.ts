/** Extract plausible Korean dish names from live Coupang meal-kit titles. */

const SUFFIXES = [
  '부대찌개',
  '된장찌개',
  '김치찌개',
  '순두부찌개',
  '청국장찌개',
  '닭볶음탕',
  '곱도리탕',
  '칼국수',
  '수제비',
  '볶음밥',
  '덮밥',
  '비빔밥',
  '떡볶이',
  '순대볶음',
  '찌개',
  '전골',
  '나베',
  '샤브',
  '탕',
  '국',
  '볶음',
  '조림',
  '찜',
  '구이',
  '냉면',
  '라면',
  '우동',
  '파스타',
] as const;

const NOISE = [
  /\[.*?\]/g,
  /\(.*?\)/g,
  /\d+인분/g,
  /\d+개/g,
  /\d+팩/g,
  /\d+(?:g|kg|ml)/gi,
  /로켓프레시|당일배송|무료배송|캠핑|요리|세트|모음|대용량|업소용/g,
];

export function extractDishNameFromTitle(title: string): string | null {
  let cleaned = title;
  for (const pattern of NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  const kitSplit = cleaned.split(/밀키트|mealkit|간편식/i)[0] ?? cleaned;
  const compact = kitSplit.replace(/\s+/g, '');
  if (compact.length < 2) return null;

  let best: string | null = null;
  for (const suffix of SUFFIXES) {
    const index = compact.lastIndexOf(suffix);
    if (index < 0) continue;
    const start = Math.max(0, index - 6);
    const dish = compact.slice(start, index + suffix.length);
    if (dish.length < 2 || dish.length > 14) continue;
    best = dish;
    break;
  }

  if (!best) return null;
  return best.replace(/^(소온|프레시지|마이셰프|비비고|오뚜기|곰곰|더미식|오늘차림|하이포크)/, '');
}

export function countDistinctBrands(titles: string[]): number {
  const brands = new Set<string>();
  for (const title of titles) {
    const token = title
      .replace(/\[.*?\]/g, ' ')
      .trim()
      .split(/\s+/)[0];
    if (token && token.length >= 2) brands.add(token);
  }
  return brands.size;
}
