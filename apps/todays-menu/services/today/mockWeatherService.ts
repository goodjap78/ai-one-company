import type { MockWeather } from '../../types/today';

const MOCK_WEATHER_POOL: MockWeather[] = [
  { condition: 'sunny', temperatureC: 22, emoji: '☀️' },
  { condition: 'cloudy', temperatureC: 18, emoji: '⛅' },
  { condition: 'rainy', temperatureC: 15, emoji: '🌧️' },
  { condition: 'cold', temperatureC: 4, emoji: '🥶' },
  { condition: 'hot', temperatureC: 31, emoji: '🔥' },
];

/** Deterministic mock weather — no external API. */
export function getMockWeather(date: string): MockWeather {
  const seed = date.split('-').reduce((sum, part) => sum + Number(part), 0);
  return MOCK_WEATHER_POOL[seed % MOCK_WEATHER_POOL.length];
}
