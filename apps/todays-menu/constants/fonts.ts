/**
 * Shared font family tokens — identical on iOS and Android.
 * Loaded once via expo-font in the root layout (Sprint H4).
 */
export const fontFamily = {
  /** Rounded Korean display face for Home main title */
  titleRound: 'Jua_400Regular',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
