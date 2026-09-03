import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../constants/designSystem';
import { appChrome } from '../ui/appChrome';
import { screenLayout } from '../ui/screenLayout';

type Props = {
  saveLabel: string;
  shareLabel: string;
  refreshLabel: string;
  refreshBusyLabel: string;
  sharingBusyLabel: string;
  busy: boolean;
  sharing: boolean;
  refreshing: boolean;
  onSave: () => void;
  onShare: () => void;
  onRefresh: () => void;
};

/** Sticky footer with primary save/share CTAs and secondary regenerate. */
export function ElementaryWeeklyPlanFooter({
  saveLabel,
  shareLabel,
  refreshLabel,
  refreshBusyLabel,
  sharingBusyLabel,
  busy,
  sharing,
  refreshing,
  onSave,
  onShare,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, ds.spacing.md);

  return (
    <View style={[styles.footer, { paddingBottom: bottomPad }]}>
      <View style={styles.primaryRow}>
        <Pressable
          style={({ pressed }) => [
            appChrome.secondaryButton,
            styles.primaryButton,
            pressed && !busy && appChrome.pressed,
            busy && styles.buttonDisabled,
          ]}
          onPress={onSave}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          accessibilityState={{ disabled: busy, busy: sharing }}
        >
          <Text
            style={appChrome.secondaryButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {saveLabel}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            screenLayout.primaryButton,
            styles.primaryButton,
            pressed && !busy && screenLayout.pressedPrimary,
            busy && styles.buttonDisabled,
          ]}
          onPress={onShare}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={shareLabel}
          accessibilityState={{ disabled: busy, busy: sharing }}
        >
          <Text
            style={screenLayout.primaryText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {sharing ? sharingBusyLabel : shareLabel}
          </Text>
        </Pressable>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && !busy && appChrome.pressed,
          busy && styles.buttonDisabled,
        ]}
        onPress={onRefresh}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={refreshLabel}
        accessibilityState={{ disabled: busy, busy: refreshing }}
      >
        <Text style={styles.refreshText} numberOfLines={1}>
          {refreshing ? refreshBusyLabel : refreshLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Scroll content bottom inset for the sticky footer (two button rows + safe area). */
export function elementaryWeeklyPlanFooterScrollPadding(bottomInset = 0): number {
  const rowHeight = ds.sizes.buttonHeight;
  const gap = ds.spacing.md;
  const footerTop = ds.spacing.md;
  const refreshHeight = 44;
  const safeBottom = Math.max(bottomInset, ds.spacing.md);
  return footerTop + rowHeight + gap + refreshHeight + safeBottom + ds.spacing.lg;
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: ds.spacing.screen,
    paddingTop: ds.spacing.md,
    backgroundColor: ds.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderLight,
    gap: ds.spacing.md,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  primaryButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: ds.spacing.sm,
  },
  refreshButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ds.radius.button,
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
  },
  refreshText: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
