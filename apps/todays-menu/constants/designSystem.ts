import { fontFamily } from './fonts';

/**
 * HANKKI Design System — single source of truth for premium UI.
 * Spacing scale: 16 / 24 / 32 / 48 only.
 */
export const ds = {
  /** Shared font families — identical on iOS and Android (Sprint H4). */
  fontFamily,
  colors: {
    canvas: '#FFF8EF',
    card: '#FFFCF7',
    primary: '#FF6B35',
    primaryDark: '#E85A28',
    primarySoft: '#FFF0E6',
    secondaryButton: '#F3EEE8',
    secondaryBorder: '#E8E0D8',
    textPrimary: '#1E1E1E',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    warmText: '#7A7268',
    border: '#EFE8E2',
    borderLight: '#F5EDE6',
    badgeBg: '#FFE8D2',
    badgeText: '#FF6A00',
    honeyTipBg: '#FFF8E8',
    reasonBg: '#FFF7EE',
    chipPastel: ['#FFF3E8', '#FFF8EE', '#F3F8F1', '#FFF5F0', '#F7F3FF', '#FFF9E8'] as const,
    shadow: '#A67C5B',
    glow: '#FF6B35',
    /** Convenience combo item icons — matches sectionCard interior (not canvas). */
    convenienceComponentIconBg: '#FFFCF7',
  },
  typography: {
    pageTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.4 },
    sectionTitle: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
    foodName: { fontSize: 24, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.4 },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    caption: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    button: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
  },
  spacing: {
    xs: 16,
    sm: 16,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    screen: 16,
    section: 24,
    card: 24,
    cardInner: 16,
  },
  radius: {
    card: 24,
    button: 24,
    chip: 999,
    image: 24,
    badge: 999,
  },
  sizes: {
    buttonHeight: 52,
    chipHeight: 44,
    heroHeight: 300,
    characterSize: 18,
    maxContentWidth: 430,
    touchTarget: 48,
  },
  shadow: {
    card: {
      shadowColor: '#A67C5B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    button: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 3,
    },
  },
  character: {
    /** Consistent bottom-right anchor inside reason / tip cards */
    position: {
      position: 'absolute' as const,
      right: 16,
      bottom: 12,
    },
    fontSize: 18,
    lineHeight: 22,
  },
} as const;

export type DesignSystem = typeof ds;
