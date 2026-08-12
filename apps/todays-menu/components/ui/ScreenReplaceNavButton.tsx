import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { screenLayout } from './screenLayout';

type IconName = 'home-outline' | 'chevron-left';

type Props = {
  href: Href;
  label: string;
  accessibilityLabel: string;
  icon?: IconName;
};

/**
 * Explicit replace navigation — never uses history back stack.
 */
export function ScreenReplaceNavButton({
  href,
  label,
  accessibilityLabel,
  icon = 'home-outline',
}: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [screenLayout.backLink, styles.row, pressed && screenLayout.pressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace(href);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialCommunityIcons
        name={icon}
        size={icon === 'home-outline' ? 20 : 22}
        color={theme.colors.textSecondary}
        style={icon === 'chevron-left' ? styles.chevronIcon : undefined}
      />
      <Text style={screenLayout.backLinkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronIcon: {
    marginLeft: -4,
  },
});
