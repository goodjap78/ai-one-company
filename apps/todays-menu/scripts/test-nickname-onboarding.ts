/**
 * HANKKI — nickname onboarding fix QA.
 * Run: npx tsx scripts/test-nickname-onboarding.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  nicknameValidationMessage,
  validateNicknameInput,
} from '../services/nicknameValidation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI nickname onboarding QA — start\n');

run('validation — Korean nickname', () => {
  const ok = validateNicknameInput('순석');
  assert(ok.ok === true, '순석 ok');
  if (ok.ok) assert(ok.value === '순석', '순석 value');
});

run('validation — trim trailing space (test B)', () => {
  const ok = validateNicknameInput('순석 ');
  assert(ok.ok === true, 'trimmed ok');
  if (ok.ok) assert(ok.value === '순석', 'trimmed value');
});

run('validation — empty', () => {
  const empty = validateNicknameInput('   ');
  assert(empty.ok === false && empty.error === 'empty', 'empty rejected');
  assert(nicknameValidationMessage('empty').length > 0, 'empty message');
});

run('validation — max length 12', () => {
  const tooLong = validateNicknameInput('가'.repeat(13));
  assert(tooLong.ok === false && tooLong.error === 'too_long', '13 chars rejected');
  const max = validateNicknameInput('가'.repeat(12));
  assert(max.ok === true, '12 chars ok');
});

run('validation — english and digits', () => {
  assert(validateNicknameInput('Min3').ok === true, 'alphanumeric ok');
  assert(validateNicknameInput('123').ok === true, 'digits ok');
});

run('storage keys documented in source', () => {
  const nickname = read('services/nicknameStorage.ts');
  const onboarding = read('services/onboardingStorage.ts');
  const profile = read('services/memory/userProfileService.ts');
  assert(nickname.includes("@todays_menu/nickname"), 'nickname key');
  assert(onboarding.includes('@hankki/onboarding_complete'), 'onboarding flag key');
  assert(profile.includes('@hankki/user_profile'), 'profile key');
  assert(nickname.includes('trim()'), 'saveNickname trims');
});

run('bootstrap reads nickname not onboarding flag', () => {
  const index = read('app/index.tsx');
  assert(index.includes('getNickname'), 'index uses getNickname');
  assert(!index.includes('isOnboardingComplete'), 'index does not gate on onboarding flag');
});

run('home + my page read same nickname storage', () => {
  const home = read('app/(tabs)/index.tsx');
  const my = read('components/my/MyProfileHeader.tsx');
  assert(home.includes('getNickname'), 'home reads nickname');
  assert(my.includes('getNickname'), 'my reads nickname');
});

run('save order — nickname before onboarding flag', () => {
  const screen = read('components/onboarding/OnboardingScreen.tsx');
  const saveNick = screen.indexOf('await saveNickname');
  const saveProfile = screen.indexOf('await saveUserProfile');
  const setComplete = screen.indexOf('await setOnboardingComplete');
  assert(saveNick > 0 && saveProfile > saveNick, 'profile after nickname');
  assert(setComplete > saveProfile, 'onboarding flag after profile');
});

run('OnboardingScreen — IME + keyboard tap fixes', () => {
  const screen = read('components/onboarding/OnboardingScreen.tsx');
  assert(screen.includes('nicknameRef'), 'ref tracks latest input');
  assert(screen.includes('onEndEditing'), 'end editing sync');
  assert(screen.includes('keyboardShouldPersistTaps="always"'), 'persist taps always');
  assert(!screen.includes('TouchableWithoutFeedback'), 'no outer touchable swallowing taps');
  assert(screen.includes('waitForImeCommit'), 'IME flush before submit');
  assert(screen.includes('finally'), 'saving reset in finally');
  assert(!screen.includes('disabled={saving || !nickname'), 'no premature disable on empty nickname');
});

run('routes', () => {
  assert(fs.existsSync(path.join(ROOT, 'app/onboarding.tsx')), 'onboarding route');
  assert(read('app/onboarding.tsx').includes('OnboardingScreen'), 'screen wired');
});

console.log(`\nHANKKI nickname onboarding QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
