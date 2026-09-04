import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_HOME_HREF } from '../../constants/appRoutes';
import { ds } from '../../constants/designSystem';
import { fontFamily } from '../../constants/fonts';
import { SeedMascot } from '../common/SeedMascot';

const A11Y_HOME = '한끼 홈으로 이동';

type Props = {
  /** Optional override; defaults to tab home. */
  href?: typeof APP_HOME_HREF;
};

/**
 * Soft brand home control for child / weekly screens.
 * Replaces small text breadcrumbs; system back stays unchanged.
 */
export function HankkiHomeBrandLink({ href = APP_HOME_HREF }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace(href);
      }}
      accessibilityRole="link"
      accessibilityLabel={A11Y_HOME}
      hitSlop={8}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <SeedMascot variant="wave" size={32} />
      <View style={styles.textCol}>
        <Text style={styles.brand}>한끼</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingRight: 4,
  },
  pressed: {
    opacity: 0.82,
  },
  textCol: {
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fontFamily.titleRound,
    fontSize: 18,
    lineHeight: 22,
    color: ds.colors.primary,
    letterSpacing: -0.4,
  },
});
