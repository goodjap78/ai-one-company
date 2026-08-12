import type { ParsedIngredientAmount } from '../../types/grocery';

const FRACTION_PATTERN = /^(\d+)\s*\/\s*(\d+)\s*(.*)$/;
const NUMBER_UNIT_PATTERN = /^(\d+(?:\.\d+)?)\s*([^\d\s].*)?$/;

function parseFraction(value: string): number | null {
  const match = value.trim().match(FRACTION_PATTERN);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!denominator) return null;
  return numerator / denominator;
}

/** Parse Korean recipe amounts into quantity + unit for merging. */
export function parseIngredientAmount(amount: string): ParsedIngredientAmount {
  const raw = amount.trim();
  if (!raw) {
    return { quantity: 1, unit: '개', raw };
  }

  const fraction = parseFraction(raw);
  if (fraction !== null) {
    const unit = raw.replace(FRACTION_PATTERN, '$3').trim() || '개';
    return { quantity: fraction, unit, raw };
  }

  const compact = raw.replace(/\s+/g, '');
  const compactMatch = compact.match(/^(\d+(?:\.\d+)?)([가-힣a-zA-Z%]+)?$/);
  if (compactMatch) {
    return {
      quantity: Number(compactMatch[1]),
      unit: compactMatch[2]?.trim() || '개',
      raw,
    };
  }

  const spacedMatch = raw.match(NUMBER_UNIT_PATTERN);
  if (spacedMatch) {
    return {
      quantity: Number(spacedMatch[1]),
      unit: spacedMatch[2]?.trim() || '개',
      raw,
    };
  }

  if (raw.includes('적당')) {
    return { quantity: 1, unit: '적당량', raw };
  }

  return { quantity: 1, unit: raw, raw };
}

export function normalizeIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function formatGroceryDisplayLine(
  name: string,
  quantity: number,
  unit: string,
): string {
  const rounded = Number.isInteger(quantity) ? quantity : Math.round(quantity * 10) / 10;

  if (unit === '개' || unit === '적당량') {
    return `${name} ×${rounded}`;
  }

  if (unit === 'g' || unit === 'ml') {
    return `${name} ${rounded}${unit}`;
  }

  return `${name} ${rounded}${unit}`;
}
