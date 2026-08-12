import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getScreenHorizontalPadding,
  getTabScrollPaddingBottom,
} from '../constants/tabBarLayout';

/** Padding helpers for screens rendered inside the bottom tab navigator. */
export function useTabScreenPadding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return {
    insets,
    topInset: insets.top,
    bottomInset: insets.bottom,
    horizontalPadding: getScreenHorizontalPadding(width),
    /** Use on ScrollView contentContainerStyle.paddingBottom */
    scrollPaddingBottom: getTabScrollPaddingBottom(insets.bottom),
    windowWidth: width,
  };
}
