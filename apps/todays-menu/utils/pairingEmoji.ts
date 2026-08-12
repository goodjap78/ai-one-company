const PAIRING_EMOJI_RULES: [string, string][] = [
  ['상추', '🥬'],
  ['샐러드', '🥗'],
  ['마늘빵', '🥖'],
  ['마늘', '🧄'],
  ['쌈장', '🫙'],
  ['된장', '🥣'],
  ['볶음김치', '🥬'],
  ['파김치', '🥬'],
  ['깍두기', '🥬'],
  ['김치', '🥬'],
  ['장아찌', '🥒'],
  ['오이', '🥒'],
  ['단무지', '🥒'],
  ['피클', '🥒'],
  ['계란말이', '🍳'],
  ['계란후라이', '🍳'],
  ['계란', '🥚'],
  ['공기밥', '🍚'],
  ['볶음밥', '🍚'],
  ['밥', '🍚'],
  ['김', '🍙'],
  ['미역국', '🥣'],
  ['수프', '🍲'],
  ['탕수육', '🍖'],
  ['꿔바로우', '🍖'],
  ['군만두', '🥟'],
  ['감자튀김', '🍟'],
  ['양파', '🧅'],
  ['콜라', '🥤'],
  ['치즈볼', '🧀'],
  ['우유', '🥛'],
];

/** Emoji for a pairing chip — falls back to a neutral plate icon. */
export function getPairingEmoji(name: string): string {
  return getHomePairingEmoji(name) ?? '🍽️';
}

/** Home pairing chips: emoji only when a food match exists. */
export function getHomePairingEmoji(name: string): string | null {
  for (const [keyword, emoji] of PAIRING_EMOJI_RULES) {
    if (name.includes(keyword)) return emoji;
  }
  return null;
}
