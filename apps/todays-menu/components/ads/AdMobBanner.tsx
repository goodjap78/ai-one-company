import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdMobBannerUnitId, isAdMobBannerEnabled } from '../../constants/admobConfig';
import { MOBILE_SCREEN_PADDING } from '../../constants/mobileShell';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Android-only AdMob banner (phase 1: Google TEST adaptive unit).
 * Hides completely on load failure — no empty reserved space.
 */
export function AdMobBanner({ style }: Props) {
  const [failed, setFailed] = useState(false);

  const handleFailed = useCallback(() => {
    setFailed(true);
  }, []);

  if (!isAdMobBannerEnabled() || Platform.OS !== 'android' || failed) {
    return null;
  }

  return (
    <View style={[styles.wrap, style]} accessibilityLabel="광고">
      <BannerAd
        unitId={getAdMobBannerUnitId()}
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
});
