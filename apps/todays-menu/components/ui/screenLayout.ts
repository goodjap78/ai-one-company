import { StyleSheet } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';

/** Shared screen layout tokens — HANKKI Design System. */
export const FOOTER_SCROLL_PADDING =
  ds.sizes.buttonHeight + ds.spacing.lg * 2 + ds.spacing.md;

export const screenLayout = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.colors.canvas,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ds.spacing.xl,
  },
  frame: {
    width: '100%',
    maxWidth: ds.sizes.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: ds.spacing.screen,
    paddingTop: ds.spacing.md,
    gap: ds.spacing.section,
  },
  backLink: {
    alignSelf: 'flex-start',
    minHeight: ds.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.md,
    marginLeft: -ds.spacing.md,
  },
  backLinkText: {
    ...ds.typography.button,
    fontWeight: '600',
    color: ds.colors.textSecondary,
  },
  pressed: theme.interaction.pressedLight,
  eyebrow: {
    ...theme.typography.sectionEyebrow,
    color: ds.colors.primary,
  },
  title: {
    ...ds.typography.pageTitle,
    color: ds.colors.textPrimary,
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: ds.spacing.screen,
    paddingTop: ds.spacing.md,
    paddingBottom: ds.spacing.lg,
    backgroundColor: ds.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderLight,
  },
  primaryButton: {
    height: ds.sizes.buttonHeight,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.primary,
    ...ds.shadow.button,
  },
  pressedPrimary: {
    ...theme.interaction.pressed,
    backgroundColor: ds.colors.primaryDark,
  },
  primaryText: {
    ...ds.typography.button,
    color: ds.colors.card,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.md,
    padding: ds.spacing.screen,
  },
  errorText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
});
