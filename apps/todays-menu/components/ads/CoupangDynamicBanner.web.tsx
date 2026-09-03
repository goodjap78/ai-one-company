import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COUPANG_DYNAMIC_BANNER } from '../../constants/coupangDynamicBanner';
import { MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';

type Props = {
  style?: StyleProp<ViewStyle>;
};

const WEB_QA_PLACEHOLDER_LABEL = '쿠팡 광고 영역 · 실기기에서 표시';

/**
 * Web preview: Coupang widget WebView is unreliable in browser QA.
 * Reserve the same slot height/spacing as native without loading partner ads.
 */
export function CoupangDynamicBanner({ style }: Props) {
  const { width: windowWidth } = useWindowDimensions();

  const { bannerWidth, bannerHeight } = useMemo(() => {
    const maxContent = Math.max(0, Math.floor(windowWidth - MOBILE_SCREEN_PADDING * 2));
    const width = Math.min(COUPANG_DYNAMIC_BANNER.width, maxContent);
    const height =
      width >= COUPANG_DYNAMIC_BANNER.width
        ? COUPANG_DYNAMIC_BANNER.height
        : Math.max(
            40,
            Math.round((COUPANG_DYNAMIC_BANNER.height * width) / COUPANG_DYNAMIC_BANNER.width),
          );
    return { bannerWidth: width, bannerHeight: height };
  }, [windowWidth]);

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <View
        style={[styles.frame, { width: bannerWidth, height: bannerHeight }]}
        accessibilityLabel={WEB_QA_PLACEHOLDER_LABEL}
      >
        <Text style={styles.label} numberOfLines={1}>
          {WEB_QA_PLACEHOLDER_LABEL}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
