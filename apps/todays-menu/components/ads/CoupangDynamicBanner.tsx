import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView, type ShouldStartLoadRequest } from 'react-native-webview';
import {
  COUPANG_DYNAMIC_BANNER,
  COUPANG_DYNAMIC_BANNER_URL,
  COUPANG_DYNAMIC_BANNER_WIDGET_HOST,
} from '../../constants/coupangDynamicBanner';
import { MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import { openOutboundUrl } from '../../services/shopping/openShoppingProduct';

type Props = {
  style?: StyleProp<ViewStyle>;
};

function parseHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isWidgetFrameUrl(url: string): boolean {
  if (!url || url === 'about:blank') return true;
  const host = parseHostname(url);
  if (!host) return false;
  return (
    host === COUPANG_DYNAMIC_BANNER_WIDGET_HOST ||
    host.endsWith(`.${COUPANG_DYNAMIC_BANNER_WIDGET_HOST}`)
  );
}

function isCoupangProductOutbound(url: string): boolean {
  const host = parseHostname(url);
  if (!host) return false;
  return (
    host === 'coupang.com' ||
    host.endsWith('.coupang.com') ||
    host === 'link.coupang.com' ||
    host.includes('coupang')
  );
}

/**
 * Coupang Partners carousel widget (328×50) via WebView.
 * Widget frame stays in-WebView; product clicks open externally.
 */
export function CoupangDynamicBanner({ style }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [failed, setFailed] = useState(false);

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

  const handleShouldStart = useCallback((request: ShouldStartLoadRequest): boolean => {
    const url = request.url ?? '';
    if (isWidgetFrameUrl(url)) {
      return true;
    }
    if (isCoupangProductOutbound(url)) {
      void openOutboundUrl(url);
      return false;
    }
    // Block unknown navigations inside the tiny WebView.
    return false;
  }, []);

  if (failed) {
    return null;
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <View style={[styles.frame, { width: bannerWidth, height: bannerHeight }]}>
        <WebView
          source={{ uri: COUPANG_DYNAMIC_BANNER_URL }}
          style={styles.webview}
          originWhitelist={['https://*', 'http://*']}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={handleShouldStart}
          onOpenWindow={(event) => {
            const targetUrl = event.nativeEvent?.targetUrl;
            if (typeof targetUrl === 'string' && targetUrl.length > 0) {
              void openOutboundUrl(targetUrl);
            }
          }}
          onError={() => setFailed(true)}
          onHttpError={() => setFailed(true)}
          accessibilityLabel="쿠팡 파트너스 추천"
        />
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
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
