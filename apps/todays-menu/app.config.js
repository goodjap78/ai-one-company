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

// Google Mobile Ads (AdMob) — Android banner phase 1.
// App ID from EAS/build env when set; otherwise Google official TEST App ID.
// iOS App ID is plugin-only (UI ads not enabled). AD_ID blockedPermissions stay.
const admobAndroidAppId =
  process.env.ADMOB_ANDROID_APP_ID?.trim() ||
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() ||
  'ca-app-pub-3940256099942544~3347511713';
const admobIosAppId =
  process.env.ADMOB_IOS_APP_ID?.trim() ||
  'ca-app-pub-3940256099942544~1458002511';

expo.plugins.push([
  'react-native-google-mobile-ads',
  {
    androidAppId: admobAndroidAppId,
    iosAppId: admobIosAppId,
  },
]);

module.exports = { expo };
