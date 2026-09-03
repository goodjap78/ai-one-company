/**
 * User-facing amount formatting for baby batch grocery aggregation.
 * Prefers exact fractions for spoon units; avoids floating-point artifacts.
 */

const SPOON_UNITS = new Set(['큰술', '작은술', '꼬집']);

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Exact friendly fraction when representable with small denominators. */
export function formatExactFraction(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  const tolerance = 1e-6;
  for (const den of [2, 3, 4, 6, 8]) {
    const num = Math.round(value * den);
    if (Math.abs(value - num / den) > tolerance) continue;
    if (num === 0) return '0';
    const g = gcd(num, den);
    const n = num / g;
    const d = den / g;
    if (n > d) {
      const whole = Math.floor(n / d);
      const rem = n % d;
      if (rem === 0) return String(whole);
      return `${whole} ${rem}/${d}`;
    }
    return `${n}/${d}`;
  }
  return null;
}

export function formatBabyBatchQuantity(quantity: number, unit: string): string {
  if (unit === 'g' || unit === 'ml') {
    if (Number.isInteger(quantity)) return `${quantity}${unit}`;
    const rounded = Math.round(quantity * 10) / 10;
    return `${rounded}${unit}`;
  }

  if (SPOON_UNITS.has(unit)) {
    const fraction = formatExactFraction(quantity);
    if (fraction) return `${fraction}${unit}`;
    if (Number.isInteger(quantity)) return `${quantity}${unit}`;
    const rounded = Math.round(quantity * 100) / 100;
    return `${rounded}${unit}`;
  }

  if (unit === '개' || unit === '적당량') {
    const rounded = Number.isInteger(quantity) ? quantity : Math.round(quantity * 10) / 10;
    return `×${rounded}`;
  }

  if (Number.isInteger(quantity)) return `${quantity}${unit}`;
  const rounded = Math.round(quantity * 10) / 10;
  return `${rounded}${unit}`;
}

export function formatBabyBatchDisplayLine(name: string, quantity: number, unit: string): string {
  const amount = formatBabyBatchQuantity(quantity, unit);
  if (amount.startsWith('×')) {
    return `${name} ${amount}`;
  }
  return `${name} ${amount}`;
}
