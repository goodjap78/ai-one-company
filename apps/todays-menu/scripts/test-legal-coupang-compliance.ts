/**
 * Sprint 65-A — Legal + Coupang affiliate compliance static checks.
 * Run: npx tsx scripts/test-legal-coupang-compliance.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { LEGAL_URLS } from '../constants/legalUrls';
import { COUPANG_PARTNERS_OFFICIAL_DISCLOSURE } from '../constants/shoppingConfig';

const APP_ROOT = path.resolve(__dirname, '..');
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
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

console.log('Sprint 65-A Legal compliance QA — start\n');

run('Official disclosure unchanged', () => {
  assert(
    COUPANG_PARTNERS_OFFICIAL_DISCLOSURE ===
      '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.',
    'exact official disclosure string',
  );
});

run('Legal URLs point at hankki-legal', () => {
  assert(LEGAL_URLS.privacy.includes('hankki-legal.vercel.app/hankki/privacy'), 'privacy URL');
  assert(LEGAL_URLS.terms.includes('hankki-legal.vercel.app/hankki/terms'), 'terms URL');
});

run('Terms cover affiliate / external trade / product info', () => {
  const src = read('legal/terms.html');
  assert(src.includes('광고 및 제휴 서비스'), 'affiliate section');
  assert(src.includes('외부 서비스 및 거래 당사자'), 'external trade section');
  assert(src.includes('직접 판매자'), 'not direct seller');
  assert(src.includes('상품 정보'), 'product info section');
  assert(src.includes('2026-08-12'), 'updated date');
  assert(src.includes('수수료'), 'commission language aligned with disclosure');
});

run('Privacy distinguishes third-party provision vs external services', () => {
  const src = read('legal/privacy.html');
  assert(src.includes('장보기 중계 서버'), 'shopping proxy mentioned');
  assert(src.includes('다이나믹 배너'), 'dynamic banner mentioned');
  assert(src.includes('제3자 제공'), 'third-party section kept');
  assert(!src.includes('쿠팡에 개인정보를 제공합니다'), 'no false PII-to-Coupang claim');
  assert(src.includes('광고 식별자'), 'ad id not in shopping request (stated)');
  assert(src.includes('장보기 요청에 포함하지'), 'shopping request exclusion stated');
  assert(src.includes('2026-08-15'), 'updated date');
  assert(src.includes('Firebase Analytics'), 'Firebase Analytics disclosed');
  assert(src.includes('Google Analytics for Firebase'), 'GA for Firebase named');
  assert(
    !src.includes('별도의 분석·광고 SDK는 현재 앱에 포함되어 있지 않습니다'),
    'removed obsolete no-analytics-SDK claim',
  );
  assert(src.includes('Google AdMob'), 'AdMob disclosed');
  assert(src.includes('Google Mobile Ads SDK'), 'Mobile Ads SDK named');
  assert(
    !src.includes('별도의 배너·전면 광고 SDK는 현재 앱에 포함되어 있지 않습니다'),
    'removed obsolete no-AdMob claim',
  );
  assert(src.includes('ads-partners.coupang.com'), 'banner host disclosed');
});

run('My Legal Section still uses LEGAL_URLS', () => {
  const src = read('components/my/MyLegalSection.tsx');
  assert(src.includes('LEGAL_URLS.privacy'), 'privacy link');
  assert(src.includes('LEGAL_URLS.terms'), 'terms link');
});

run('ShoppingScreen still shows official disclosure', () => {
  const src = read('components/shopping/ShoppingScreen.tsx');
  assert(src.includes('affiliateDisclosureText'), 'disclosure wired');
  assert(src.includes('styles.disclosure'), 'disclosure UI');
});

if (failed > 0) {
  console.error(`FAIL — ${failed}`);
  process.exit(1);
}
console.log('PASS — Sprint 65-A Legal compliance');
