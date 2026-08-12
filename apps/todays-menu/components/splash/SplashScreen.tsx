import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { SeedMascot } from '../common/SeedMascot';

const MIN_DISPLAY_MS = 1200;
const LOGO_FADE_MS = 400;
const TITLE_FADE_MS = 350;
const TAGLINE_FADE_MS = 350;
const FADE_OUT_MS = 400;

type Props = {
  ready: boolean;
  onFinish: () => void;
};

export function SplashScreen({ ready, onFinish }: Props) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const chefOpacity = useRef(new Animated.Value(0)).current;

  const finishedRef = useRef(false);
  const readyRef = useRef(ready);
  const mountTimeRef = useRef(Date.now());

  readyRef.current = ready;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: LOGO_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(120, [
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: TITLE_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chefOpacity, {
          toValue: 1,
          duration: TITLE_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: TAGLINE_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [chefOpacity, logoOpacity, logoScale, taglineOpacity, titleOpacity]);

  useEffect(() => {
    if (!ready || finishedRef.current) return;

    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, remaining);

    return () => clearTimeout(timer);
  }, [ready, containerOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <SeedMascot variant="happy" size={56} />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          오늘 뭐먹지?
        </Animated.Text>

        <Animated.View style={[styles.chefRow, { opacity: chefOpacity }]}>
          <Text style={styles.chefLabel}>오늘의 식사</Text>
          <Text style={styles.chefName}>한끼</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          오늘 뭐 먹을지, 같이 정해봐요
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.splash,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    gap: theme.spacing.md,
  },
  logoWrap: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  chefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chefLabel: {
    ...theme.typography.metaText,
    color: theme.colors.textMuted,
  },
  chefName: {
    ...theme.typography.aiLabel,
    color: theme.colors.primary,
  },
  tagline: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
