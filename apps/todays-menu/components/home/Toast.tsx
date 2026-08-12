import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

type Props = {
  message: string;
  visible: boolean;
  onHide: () => void;
  /** Show Seed on save / favorite / success toasts. */
  showSaveMascot?: boolean;
};

export function Toast({ message, visible, onHide, showSaveMascot = false }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onHide();
    });

    return () => animation.stop();
  }, [visible, message, onHide, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, showSaveMascot && styles.containerCream, { opacity }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.row}>
        {showSaveMascot ? <SeedMascot variant="happy" size={36} /> : null}
        <Text
          style={[
            styles.message,
            showSaveMascot && styles.messageCream,
            showSaveMascot && styles.messageWithMascot,
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    width: '100%',
    maxWidth: theme.sizes.maxContentWidth - theme.spacing.screen * 2,
    marginHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radius.tip,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md + 2,
    ...theme.shadows.card,
  },
  containerCream: {
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  message: {
    ...theme.typography.tipBody,
    color: theme.colors.background,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageCream: {
    color: '#3A2417',
    fontWeight: '600',
  },
  messageWithMascot: {
    flexShrink: 1,
    textAlign: 'left',
  },
});
