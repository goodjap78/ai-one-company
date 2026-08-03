import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { navigateBack } from '../../utils/navigateBack';
import { screenLayout } from './screenLayout';

type Props = {
  label: string;
  fallbackHref?: Href;
  accessibilityLabel?: string;
};

function normalizeLabel(label: string): string {
  return label.replace(/^←\s*/, '').trim();
}

export function ScreenBackButton({ label, fallbackHref = '/', accessibilityLabel }: Props) {
  const router = useRouter();
  const displayLabel = normalizeLabel(label);

  return (
    <Pressable
      style={({ pressed }) => [screenLayout.backLink, styles.row, pressed && screenLayout.pressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigateBack(router, fallbackHref);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `뒤로, ${displayLabel}`}
    >
      <MaterialCommunityIcons
        name="chevron-left"
        size={22}
        color={theme.colors.textSecondary}
        style={styles.icon}
      />
      <Text style={screenLayout.backLinkText}>{displayLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    marginLeft: -4,
  },
});
