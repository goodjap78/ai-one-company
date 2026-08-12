import type { MockWeatherCondition } from '../types/today';

export type SpeechWeatherKind = 'rain' | 'hot' | 'cold';

export type HankkiSpeechCardCopy = {
  line1: string;
  line2: string;
};

const MAX_LINE_CHARS = 22;

/** Friendly rotating lines — never repeat the previous pick. */
const FRIENDLY_LINES: Array<(title: string) => string> = [
  (t) => `오늘은 ${t}이 딱이에요!`,
  () => '든든한 한 끼 어떠세요?',
  () => '오늘도 맛있게 드세요!',
  () => '부담 없이 즐기기 좋아요!',
  (t) => `오늘 기분엔 ${t}가 잘 어울려요!`,
  (t) => `${t}로 한 끼 해결해요!`,
  () => '마음이 편해지는 메뉴예요.',
  (t) => `${t}, 같이 해볼까요?`,
];

let lastLine = '';

function clampLine(text: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length <= MAX_LINE_CHARS) return normalized;
  return `${normalized.slice(0, MAX_LINE_CHARS - 1)}…`;
}

function shortenTitle(title: string): string {
  const trimmed = title.trim() || '이 메뉴';
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 7)}…`;
}

function pickFriendlyLine(title: string): string {
  const short = shortenTitle(title);
  const filled = FRIENDLY_LINES.map((fn) => clampLine(fn(short)));
  const alternatives = filled.filter((line) => line !== lastLine);
  const pool = alternatives.length > 0 ? alternatives : filled;
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? filled[0];
  lastLine = picked;
  return picked;
}

/** Split a long line into at most 2 display lines without clipping mid-word harshly. */
function toSpeechCopy(message: string): HankkiSpeechCardCopy {
  const text = clampLine(message);
  if (text.length <= 14) {
    return { line1: text, line2: '' };
  }

  const space = text.lastIndexOf(' ', Math.ceil(text.length * 0.55));
  if (space > 4) {
    return {
      line1: text.slice(0, space).trim(),
      line2: text.slice(space).trim(),
    };
  }

  return { line1: text, line2: '' };
}

export function resolveSpeechWeatherKind(
  condition: MockWeatherCondition | undefined | null,
): SpeechWeatherKind | null {
  if (condition === 'rainy') return 'rain';
  if (condition === 'hot') return 'hot';
  if (condition === 'cold') return 'cold';
  return null;
}

/**
 * Fresh HANKKI speech for the food hero bubble.
 * Weather is ignored for rotation freshness — friendly lines only.
 */
export function buildHankkiSpeechMessage(input: {
  recipeTitle: string;
  weatherKind?: SpeechWeatherKind | null;
  honeyTip?: string;
}): HankkiSpeechCardCopy {
  const title = input.recipeTitle.trim() || '이 메뉴';
  return toSpeechCopy(pickFriendlyLine(title));
}

/** Kept for any stale imports. */
export function pickTemplate(_pairs: unknown, title: string): HankkiSpeechCardCopy {
  return toSpeechCopy(pickFriendlyLine(title));
}

export const pickSpeechLine = pickTemplate;
