const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

const androidServices = path.join(__dirname, 'google-services.json');
const iosServices = path.join(__dirname, 'GoogleService-Info.plist');
const hasAndroidServices = fs.existsSync(androidServices);
const hasIosServices = fs.existsSync(iosServices);

/** Permissions merged in by Firebase Analytics / Play Services even when Ad ID collection is off. */
const ANDROID_AD_ID_BLOCKED_PERMISSIONS = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
  'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
];

const expo = {
  ...appJson.expo,
  android: { ...appJson.expo.android },
  ios: { ...appJson.expo.ios },
  plugins: [...(appJson.expo.plugins ?? [])],
};

if (hasAndroidServices) {
  expo.android.googleServicesFile = './google-services.json';
  // Strip unused Advertising ID / AdServices permissions from the merged production manifest.
  // Collection is already disabled via firebase.json; this removes Play Console AD_ID declaration noise.
  expo.android.blockedPermissions = [
    ...new Set([
      ...(expo.android.blockedPermissions ?? []),
      ...ANDROID_AD_ID_BLOCKED_PERMISSIONS,
    ]),
  ];
}

if (hasIosServices) {
  expo.ios.googleServicesFile = './GoogleService-Info.plist';
}

if (hasAndroidServices || hasIosServices) {
  expo.plugins.push('@react-native-firebase/app');
  expo.plugins.push([
    '@react-native-firebase/analytics',
    {
      ios: {
        withoutAdIdSupport: true,
      },
    },
  ]);
  expo.plugins.push([
    'expo-build-properties',
    {
      ios: {
        useFrameworks: 'static',
        forceStaticLinking: ['RNFBApp', 'RNFBAnalytics'],
      },
    },
  ]);
}

// Google Mobile Ads — Android banner. iOS App ID is plugin-only (UI/init off).
// Linked GMA still requires GADApplicationIdentifier; do not drop iosAppId.
const GOOGLE_TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
const admobAndroidAppIdFromEnv =
  process.env.ADMOB_ANDROID_APP_ID?.trim() ||
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() ||
  '';
const admobProductionGateOn =
  process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true';
const admobAndroidAppIdIsSample =
  !admobAndroidAppIdFromEnv || admobAndroidAppIdFromEnv.includes('3940256099942544');

if (
  process.env.EAS_BUILD_PROFILE === 'production' &&
  admobProductionGateOn &&
  admobAndroidAppIdIsSample
) {
  throw new Error(
    'ADMOB_ANDROID_APP_ID is required when EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS=true on EAS production builds',
  );
}

const admobAndroidAppId = admobAndroidAppIdFromEnv || GOOGLE_TEST_ADMOB_ANDROID_APP_ID;
const admobIosAppId =
  process.env.ADMOB_IOS_APP_ID?.trim() || GOOGLE_TEST_ADMOB_IOS_APP_ID;

expo.plugins.push([
  'react-native-google-mobile-ads',
  {
    androidAppId: admobAndroidAppId,
    iosAppId: admobIosAppId,
  },
]);

module.exports = { expo };
