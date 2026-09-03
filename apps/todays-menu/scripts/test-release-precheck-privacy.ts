/**
 * HANKKI v1.1 — Release precheck privacy + native config static QA.
 * Run: npx tsx scripts/test-release-precheck-privacy.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}\n`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI release precheck privacy + config QA — start\n');

run('privacy.html — photo save wording, no stale absolutes', () => {
  const src = read('legal/privacy.html');
  assert(src.includes('2026-08-29'), 'updated date');
  assert(src.includes('쓰기(추가)'), 'photo write/add described');
  assert(src.includes('기존 사진을 읽거나 스캔하지 않으며'), 'no read/scan claim');
  assert(
    !src.includes('사진 라이브러리 접근을 현재 수행하지 않습니다'),
    'removed absolute no-photo-library claim',
  );
  assert(src.includes('이름, 나이, 월령'), 'child PII not collected');
  assert(src.includes('Google AdMob'), 'AdMob disclosed');
  assert(src.includes('Google Mobile Ads SDK'), 'Mobile Ads SDK named');
  assert(
    !src.includes('별도의 배너·전면 광고 SDK는 현재 앱에 포함되어 있지 않습니다'),
    'no stale no-AdMob claim',
  );
  assert(
    !src.includes('AdMob 미설치'),
    'no AdMob not-installed claim',
  );
  assert(src.includes('이유식 레시피 상세'), 'baby detail coupang scope');
  assert(src.includes('query_length'), 'child analytics params');
});

run('Play Data Safety draft — aligned with code', () => {
  const src = read('docs/HANKKI_PLAY_DATA_SAFETY_DRAFT.md');
  assert(!src.includes('AdMob 미설치'), 'no stale AdMob line');
  assert(!src.includes('No photo library access'), 'no stale photos NO absolute');
  assert(src.includes('save-only') || src.includes('Save-to-album'), 'photo save distinguished');
  assert(src.includes('query_length'), 'analytics params documented');
  assert(src.includes('CHECK_REQUIRED'), 'manifest check flagged');
});

run('App Store privacy draft exists', () => {
  const src = read('docs/HANKKI_APP_STORE_PRIVACY_DRAFT.md');
  assert(src.includes('Add Photos Only') || src.includes('savePhotosPermission'), 'photo add-only');
  assert(src.includes('ATT'), 'tracking section');
  assert(src.includes('query_length'), 'analytics payload');
});

run('app.json — save-only media + no read permission', () => {
  const appJson = JSON.parse(read('app.json')) as {
    expo: { plugins: unknown[] };
  };
  const mediaPlugin = appJson.expo.plugins.find(
    (p) => Array.isArray(p) && p[0] === 'expo-media-library',
  ) as [string, Record<string, unknown>] | undefined;
  assert(Boolean(mediaPlugin), 'expo-media-library plugin');
  const cfg = mediaPlugin![1];
  assert(cfg.photosPermission === false, 'photos read disabled');
  assert(typeof cfg.savePhotosPermission === 'string', 'save permission string set');
  assert(
    String(cfg.savePhotosPermission).includes('식단'),
    'save permission mentions meal plan',
  );
});

run('app.config.js — AD_ID blocked', () => {
  const src = read('app.config.js');
  assert(src.includes('blockedPermissions'), 'blockedPermissions configured');
  assert(src.includes('com.google.android.gms.permission.AD_ID'), 'AD_ID blocked');
  assert(src.includes('react-native-google-mobile-ads'), 'AdMob plugin registered');
});

run('ChildRecipeBrowseList — FlatList virtualization', () => {
  const src = read('components/child/ChildRecipeBrowseList.tsx');
  assert(src.includes('FlatList'), 'uses FlatList');
  assert(src.includes('keyExtractor'), 'stable keyExtractor');
  assert(src.includes('scrollEnabled={false}'), 'nested in parent ScrollView');
  assert(!src.includes('recipes.map'), 'no full map render');
});

run('hankkiRecipes — indexed lookup map', () => {
  const src = read('data/recipes/hankkiRecipes.ts');
  assert(src.includes('hankkiRecipeByIdMap'), 'lazy map cache');
  assert(src.includes('.get(id)'), 'O(1) lookup');
});

if (failed > 0) {
  console.error(`FAIL — ${failed}`);
  process.exit(1);
}
console.log('PASS — release precheck privacy + config');
