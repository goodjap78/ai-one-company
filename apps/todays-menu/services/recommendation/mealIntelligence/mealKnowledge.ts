/**
 * Weather / temperature thresholds for meal intelligence.
 */

export function isVeryHot(weather: { condition: string; temperatureC: number }): boolean {
  return weather.condition === 'hot' || weather.temperatureC >= 30;
}

export function isTemperatureFatigue(weather: { temperatureC: number }): boolean {
  return weather.temperatureC > 32;
}

export function isCold(weather: { condition: string; temperatureC: number }): boolean {
  return weather.condition === 'cold' || weather.temperatureC < 10;
}

export function isRainy(weather: { condition: string }): boolean {
  return weather.condition === 'rainy';
}

/** @deprecated Use isVeryHot */
export const isHot = isVeryHot;
export const isExtremeHeat = isTemperatureFatigue;
