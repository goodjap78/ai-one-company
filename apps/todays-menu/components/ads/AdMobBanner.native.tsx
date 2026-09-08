import { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdMobBannerUnitId, isAdMobBannerEnabled } from '../../constants/admobConfig';
import { MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';
import { isInternalQaEnabled } from '../../utils/isInternalQaEnabled';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Android-only AdMob banner. Hidden when the gate has no unit, on iOS,
 * and after load failure — no empty reserved space.
 */
export function AdMobBanner({ style }: Props) {
  const [failed, setFailed] = useState(false);
  const [qaFailDetail, setQaFailDetail] = useState<string | null>(null);
  const unitId = getAdMobBannerUnitId();
  const qa = isInternalQaEnabled();

  const handleFailed = useCallback(
    (error: { code?: string | number; message?: string } | Error) => {
      const code = 'code' in error ? String(error.code ?? '') : '';
      const message = error instanceof Error ? error.message : String(error.message ?? error);
      if (qa) {
        console.warn('[AdMob QA] onAdFailedToLoad', { code, message });
        setQaFailDetail([code, message].filter(Boolean).join(' · ') || 'load failed');
      }
      setFailed(true);
    },
    [qa],
  );

  if (Platform.OS !== 'android') {
    return null;
  }

  if (!isAdMobBannerEnabled() || !unitId) {
    if (qa) {
      return (
        <Text style={styles.qaDebug} accessibilityLabel="AdMob QA gated off">
          AdMob QA: gated off
        </Text>
      );
    }
    return null;
  }

  if (failed) {
    if (qa) {
      return (
        <Text style={styles.qaDebug} accessibilityLabel="AdMob QA load failed">
          AdMob QA: {qaFailDetail ?? 'load failed'}
        </Text>
      );
    }
    return null;
  }

  return (
    <View style={[styles.wrap, style]} accessibilityLabel="광고">
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          // Align with AD_ID blockedPermissions + Firebase adid collection off.
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={handleFailed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: MOBILE_SCREEN_PADDING,
    overflow: 'hidden',
  },
  qaDebug: {
    width: '100%',
    marginTop: 8,
    paddingHorizontal: MOBILE_SCREEN_PADDING,
    fontSize: 11,
    lineHeight: 14,
    color: '#8A7464',
  },
});
