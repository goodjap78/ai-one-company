/**
 * Verifies Expo prebuild would inject tools:node=remove for AD_ID permissions.
 * Does not write an android/ project. Run: npx tsx scripts/verify-android-ad-id-block.ts
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { addBlockedPermissions } = require('@expo/config-plugins/build/android/Permissions.js') as {
  addBlockedPermissions: (
    manifest: { manifest: Record<string, unknown> },
    permissions: string[],
  ) => { manifest: { 'uses-permission'?: Array<{ $: Record<string, string> }> } };
};
const { ensureToolsAvailable } = require('@expo/config-plugins/build/android/Manifest.js') as {
  ensureToolsAvailable: (manifest: { manifest: Record<string, unknown> }) => {
    manifest: Record<string, unknown>;
  };
};

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { expo } = require(path.join(ROOT, 'app.config.js')) as {
  expo: { android?: { blockedPermissions?: string[] } };
};

const expected = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
  'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
];

const blocked = expo.android?.blockedPermissions ?? [];
for (const permission of expected) {
  if (!blocked.includes(permission)) {
    console.error(`FAIL missing blockedPermission: ${permission}`);
    process.exit(1);
  }
}

let androidManifest = {
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    'uses-permission': [
      { $: { 'android:name': 'android.permission.INTERNET' } },
      // Simulate library-merged AD_ID before block.
      { $: { 'android:name': 'com.google.android.gms.permission.AD_ID' } },
      { $: { 'android:name': 'android.permission.ACCESS_ADSERVICES_AD_ID' } },
      { $: { 'android:name': 'android.permission.ACCESS_ADSERVICES_ATTRIBUTION' } },
    ],
  },
};

androidManifest = ensureToolsAvailable(androidManifest) as typeof androidManifest;
androidManifest = addBlockedPermissions(androidManifest, blocked) as typeof androidManifest;

const uses = androidManifest.manifest['uses-permission'] ?? [];
for (const permission of expected) {
  const entry = uses.find((item) => item.$['android:name'] === permission);
  if (!entry || entry.$['tools:node'] !== 'remove') {
    console.error(`FAIL expected tools:node=remove for ${permission}`, entry);
    process.exit(1);
  }
}

console.log('PASS — prebuild-equivalent AD_ID block markers:');
for (const permission of expected) {
  console.log(`  <uses-permission android:name="${permission}" tools:node="remove" />`);
}
console.log('EXPECTED_MERGED_PRODUCTION: AD_ID ABSENT; ACCESS_ADSERVICES_* ABSENT');
