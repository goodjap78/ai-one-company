import { StyleSheet } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';

/** Canonical chrome — HANKKI Design System. */
export const APP_BUTTON_HEIGHT = ds.sizes.buttonHeight;
export const APP_BUTTON_RADIUS = ds.radius.button;

export const appChrome = StyleSheet.create({
  canvas: {
    backgroundColor: ds.colors.canvas,
  },
  card: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
    gap: ds.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.border,
    ...ds.shadow.card,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  sectionHint: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
  },
  primaryButton: {
    height: APP_BUTTON_HEIGHT,
    borderRadius: APP_BUTTON_RADIUS,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.lg,
    ...ds.shadow.button,
  },
  primaryButtonPressed: {
    ...theme.interaction.pressed,
    backgroundColor: ds.colors.primaryDark,
  },
  primaryButtonText: {
    ...ds.typography.button,
    color: ds.colors.card,
  },
  secondaryButton: {
    height: APP_BUTTON_HEIGHT,
    borderRadius: APP_BUTTON_RADIUS,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.lg,
  },
  secondaryButtonText: {
    ...ds.typography.button,
    fontWeight: '600',
    color: ds.colors.textPrimary,
  },
  pressed: theme.interaction.pressedLight,
});
