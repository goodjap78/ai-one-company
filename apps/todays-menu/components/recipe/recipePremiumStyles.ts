import { StyleSheet } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';

/**
 * Sprint R1 — Recipe Detail tokens aligned with Home (homePremiumStyles / homeRef).
 */
export const recipeRef = {
  colors: {
    canvas: ds.colors.canvas,
    card: '#FFFCF7',
    pastelCard: '#FFF8EF',
    creamTip: '#FFF9E8',
    tipBorder: '#F2E6C4',
    textDeep: '#3A2417',
    textWarm: '#5C4030',
    textMuted: '#8A7264',
    divider: '#EDE6DF',
    badgeBg: ds.colors.badgeBg,
    badgeText: ds.colors.badgeText,
    primary: ds.colors.primary,
    primarySoft: ds.colors.primarySoft,
    metaBg: '#FFFCF7',
  },
  hero: {
    aspectRatio: 1.6,
    minHeight: 188,
    maxHeight: 220,
    imageRadius: 24,
  },
  footerHeight: ds.sizes.buttonHeight + ds.spacing.lg + ds.spacing.md,
  chipPastel: ds.colors.chipPastel,
  button: {
    height: 52,
    radius: 18,
  },
} as const;

const softShadow = {
  shadowColor: '#A67C5B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 2,
} as const;

export const recipePremiumStyles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: recipeRef.colors.canvas,
  },
  sectionStack: {
    gap: ds.spacing.section,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: ds.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.md,
    marginLeft: -ds.spacing.md,
  },
  backButtonText: {
    ...ds.typography.button,
    fontWeight: '600',
    color: recipeRef.colors.textWarm,
  },
  headerBlock: {
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: recipeRef.colors.badgeBg,
    borderRadius: ds.radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: recipeRef.colors.badgeText,
  },
  mealTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: recipeRef.colors.textDeep,
  },
  heroImage: {
    width: '100%',
    borderRadius: recipeRef.hero.imageRadius,
    overflow: 'hidden',
    backgroundColor: recipeRef.colors.primarySoft,
    ...softShadow,
  },
  titleBlock: {
    gap: ds.spacing.md,
    paddingTop: 0,
  },
  reasonCard: {
    backgroundColor: ds.colors.reasonBg,
    borderRadius: ds.radius.card,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.cardInner,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    ...ds.shadow.card,
  },
  reasonText: {
    ...ds.typography.body,
    color: ds.colors.warmText,
    paddingRight: 32,
  },
  reasonEmoji: {
    ...ds.character.position,
    fontSize: ds.character.fontSize,
    lineHeight: ds.character.lineHeight,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: recipeRef.colors.textDeep,
  },
  sectionIntro: {
    ...ds.typography.caption,
    color: recipeRef.colors.textMuted,
    marginTop: -4,
  },
  panel: {
    backgroundColor: recipeRef.colors.metaBg,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    ...softShadow,
  },
  chipGroupLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: recipeRef.colors.textMuted,
    fontWeight: '700',
  },
  stepCard: {
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    ...softShadow,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: recipeRef.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepText: {
    ...ds.typography.body,
    color: recipeRef.colors.textDeep,
    flex: 1,
  },
  honeyTipCard: {
    backgroundColor: recipeRef.colors.creamTip,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: recipeRef.colors.tipBorder,
    gap: 10,
    ...softShadow,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: ds.spacing.screen,
    paddingTop: ds.spacing.md,
    paddingBottom: ds.spacing.md,
    backgroundColor: recipeRef.colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.border,
    gap: ds.spacing.md,
  },
  mealCompletedButton: {
    flex: 1,
    height: recipeRef.button.height,
    borderRadius: recipeRef.button.radius,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  mealCompletedButtonLabel: {
    ...ds.typography.button,
    color: recipeRef.colors.textDeep,
  },
  primaryButton: {
    flex: 1.35,
    height: recipeRef.button.height,
    borderRadius: recipeRef.button.radius,
    backgroundColor: recipeRef.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    ...ds.shadow.button,
  },
  primaryButtonLabel: {
    ...ds.typography.button,
    color: '#FFFFFF',
  },
  pressed: theme.interaction.pressedLight,
  pressedPrimary: {
    ...theme.interaction.pressed,
    backgroundColor: ds.colors.primaryDark,
  },
});
