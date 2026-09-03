import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/** Web preview: no Google Mobile Ads SDK — render nothing to avoid bundle / layout noise. */
export function AdMobBanner(_props: Props) {
  return null;
}
