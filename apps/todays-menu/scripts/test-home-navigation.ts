/**
 * Home navigation QA — canonical route + replace (no bootstrap replay).
 * Run: npm run test:home-navigation
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP_HOME_HREF } from '../constants/appRoutes';
import { navigateToHome } from '../utils/navigateToHome';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
    process.exitCode = 1;
  }
}

const root = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('Home navigation QA — start\n');

run('APP_HOME_HREF — canonical tabs, not bootstrap index', () => {
  assert(APP_HOME_HREF === '/(tabs)', `expected /(tabs), got ${APP_HOME_HREF}`);
  assert(APP_HOME_HREF !== '/', 'must not use app/index bootstrap route');
});

run('navigateToHome — router.replace 사용', () => {
  const calls: { method: string; href: unknown }[] = [];
  const router = {
    replace: (href: unknown) => calls.push({ method: 'replace', href }),
  };
  navigateToHome(router);
  assert(calls.length === 1, 'single navigation call');
  assert(calls[0]!.method === 'replace', 'must replace');
  assert(calls[0]!.href === APP_HOME_HREF, 'must target canonical home');
});

run('navigateToHome — push 금지', () => {
  const source = read('utils/navigateToHome.ts');
  assert(source.includes('router.replace(APP_HOME_HREF)'), 'replace only');
  assert(!source.includes('router.push'), 'no push');
});

run('냉장고 선택 — ScreenReplaceNavButton + APP_HOME_HREF', () => {
  const source = read('components/fridge/FridgeRaidScreen.tsx');
  assert(source.includes('ScreenReplaceNavButton'), 'replace nav button');
  assert(source.includes('APP_HOME_HREF'), 'canonical home href');
  assert(!source.includes('fallbackHref="/"'), 'no bootstrap fallback');
  assert(!source.includes('ScreenBackButton'), 'no history back for home');
});

run('냉장고 결과 — ScreenReplaceNavButton + APP_HOME_HREF', () => {
  const source = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert(source.includes('ScreenReplaceNavButton'), 'replace nav button');
  assert(source.includes('APP_HOME_HREF'), 'canonical home href');
  assert(!source.includes('fallbackHref="/fridge-raid"'), 'no fridge back as home');
  assert(!source.includes('ScreenBackButton'), 'no history back for home');
});

run('app/index — bootstrap 전용 (splash/onboarding)', () => {
  const source = read('app/index.tsx');
  assert(source.includes('SplashScreen'), 'index runs splash bootstrap');
  assert(source.includes('Redirect href="/(tabs)"'), 'index redirects existing users to tabs');
});

run('convenience nav helper — navigateToHome 위임', () => {
  const source = read('services/convenience/convenienceComboNavigation.ts');
  assert(source.includes('navigateToHome'), 'delegates to shared helper');
});

console.log('\nHome navigation QA — done');
