import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

type Props = {
  disabled?: boolean;
};

export function HomeSearchButton({ disabled }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="레시피 검색"
    >
      <MaterialCommunityIcons
        name="magnify"
        size={24}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.bubble,
  },
  pressed: theme.interaction.pressedLight,
  disabled: {
    opacity: 0.5,
  },
});
