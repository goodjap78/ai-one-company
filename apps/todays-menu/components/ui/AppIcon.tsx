import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ReactNode } from 'react';
import { theme } from '../../constants/theme';
import type { HomeIconKey } from '../home/homeIcons';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Material icon names keyed by semantic HANKKI icon ids.
 * Swap this map (or branch in renderHomeIcon) when custom SVG assets land.
 */
const MATERIAL_ICON_MAP: Record<HomeIconKey, MaterialIconName> = {
  homemade: 'pot-steam',
  delivery: 'storefront-outline',
  kids: 'baby-face-outline',
  fridge: 'fridge-outline',
  receipt: 'receipt-text-outline',
  pet: 'paw',
  health: 'heart-pulse',
  reward: 'gift-outline',
  weather: 'weather-sunny',
  recentMeals: 'silverware-fork-knife',
  time: 'clock-outline',
  cookTime: 'clock-outline',
  difficulty: 'chef-hat',
  servings: 'silverware-variant',
  heart: 'heart',
  heartOutline: 'heart-outline',
  pairingDefault: 'leaf',
  chevronRight: 'chevron-right',
};

type IconRenderProps = {
  name: HomeIconKey;
  size: number;
  color: string;
  filled?: boolean;
};

function renderMaterialIcon({ name, size, color, filled }: IconRenderProps): ReactNode {
  const isHeart = name === 'heart' || name === 'heartOutline';
  const shouldFill = filled ?? name === 'heart';
  const iconName = isHeart && shouldFill ? MATERIAL_ICON_MAP.heart : MATERIAL_ICON_MAP[name];

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}

/** Replace with SVG renderer when the HANKKI icon set is ready. */
function renderHomeIcon(props: IconRenderProps): ReactNode {
  return renderMaterialIcon(props);
}

type Props = {
  name: HomeIconKey;
  size?: number;
  color?: string;
  filled?: boolean;
};

/** Semantic icon wrapper — layouts depend on HomeIconKey, not Material names. */
export function AppIcon({
  name,
  size = 22,
  color = theme.colors.textSecondary,
  filled,
}: Props) {
  return <>{renderHomeIcon({ name, size, color, filled })}</>;
}

export type { HomeIconKey as AppIconName };
