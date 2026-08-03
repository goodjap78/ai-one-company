import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { theme } from '../../constants/theme';
import { getHomeIcon } from '../home/homeIcons';

type Props = {
  isFavorite: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
  variant?: 'default' | 'hero';
};

const HERO_BUTTON_SIZE = 42;
const HERO_ICON_SIZE = 20;

export function FavoriteHeartButton({
  isFavorite,
  onPress,
  size = 'md',
  variant = 'default',
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const buttonSize = variant === 'hero' ? HERO_BUTTON_SIZE : theme.sizes.touchTarget;
  const iconSize = size === 'sm' ? 18 : variant === 'hero' ? HERO_ICON_SIZE : 20;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        variant === 'hero' && styles.buttonHero,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        isFavorite && styles.buttonActive,
        isFavorite && variant === 'hero' && styles.buttonHeroActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite
          ? '취향에 저장됨. 탭하면 제거해요.'
          : '취향에 저장. 탭하면 추가해요.'
      }
    >
      <AppIcon
        name={isFavorite ? getHomeIcon('heart') : getHomeIcon('heartOutline')}
        size={iconSize}
        color={isFavorite ? theme.colors.heart : theme.colors.textMuted}
        filled={isFavorite}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: '#8B6B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  buttonHero: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#8B6B52',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primaryMuted,
  },
  buttonHeroActive: {
    backgroundColor: 'rgba(255, 240, 230, 0.96)',
    borderColor: theme.colors.primaryMuted,
  },
  pressed: theme.interaction.pressedLight,
});
