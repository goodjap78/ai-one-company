/**
 * Release Candidate smoke checks (static + optional local server).
 * Run: npm run smoke:rc
 */
import fs from 'node:fs';
import path from 'node:path';
import { LEGAL_URLS } from '../../constants/legalUrls';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../../data/recipes/catalogExpansionHeroWaiver';
import { listHankkiRecipes } from '../../data/recipes/hankkiRecipes';
import { listContentRecipes } from '../content-center/readiness';
import { getProductionProgress } from '../content-center/productionProgress';

const APP_ROOT = path.resolve(__dirname, '../..');

type Check = { id: string; pass: boolean; detail: string };

const checks: Check[] = [];

function add(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail });
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(APP_ROOT, rel));
}

add('icon', fileExists('assets/icon.png'), 'assets/icon.png');
add('adaptive-icon', fileExists('assets/adaptive-icon.png'), 'assets/adaptive-icon.png');
add('eas-json', fileExists('eas.json'), 'eas.json');

const appJson = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'app.json'), 'utf8'));
add(
  'expo-icon-config',
  Boolean(appJson.expo?.icon),
  `expo.icon=${appJson.expo?.icon ?? '(missing)'}`,
);
add(
  'ios-build-number',
  Boolean(appJson.expo?.ios?.buildNumber),
  `ios.buildNumber=${appJson.expo?.ios?.buildNumber ?? '(missing)'}`,
);
add(
  'version-align',
  fs.readFileSync(path.join(APP_ROOT, 'package.json'), 'utf8').includes('"version": "1.0.0"') &&
    appJson.expo?.version === '1.0.0',
  'package.json and app.json both 1.0.0',
);

const progress = getProductionProgress();
const heroWaiverCount = listHankkiRecipes().filter((r) =>
  CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id),
).length;
add(
  'heroes',
  progress.approvedHeroImages + heroWaiverCount >= progress.heroTarget,
  `${progress.approvedHeroImages}+${heroWaiverCount}w/${progress.heroTarget}`,
);
add(
  'ingredients',
  progress.approvedIngredientIcons === progress.ingredientTarget,
  `${progress.approvedIngredientIcons}/${progress.ingredientTarget}`,
);

const readiness = listContentRecipes();
const recipeWaiverCount = readiness.recipes.filter((r) =>
  CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.recipeId),
).length;
add(
  'recipes-ready',
  readiness.summary.readyRecipes + recipeWaiverCount >= readiness.summary.totalRecipes,
  `${readiness.summary.readyRecipes}+${recipeWaiverCount}w/${readiness.summary.totalRecipes}`,
);

add(
  'legal-files',
  fileExists('legal/privacy.html') && fileExists('legal/terms.html'),
  'legal/privacy.html + legal/terms.html',
);

add(
  'meal-reminder-hidden',
  !fs.readFileSync(path.join(APP_ROOT, 'app/(tabs)/my.tsx'), 'utf8').includes(
    '<MealReminderSettings',
  ),
  'MealReminderSettings not mounted on My tab',
);

add(
  'accept-try-catch',
  fs.readFileSync(path.join(APP_ROOT, 'components/home/useHomeScreen.ts'), 'utf8').includes(
    'acceptErrorToast',
  ),
  'Home Accept error toast wired',
);

add(
  'settings-linking',
  fs.readFileSync(path.join(APP_ROOT, 'components/my/MyLegalSection.tsx'), 'utf8').includes(
    'openExternalUrl',
  ),
  'My legal rows open external URLs',
);

async function verifyLegalUrls(): Promise<void> {
  for (const [key, url] of Object.entries(LEGAL_URLS)) {
    if (url.startsWith('mailto:')) {
      add(`legal-${key}`, true, `${key} mailto configured`);
      continue;
    }
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      add(`legal-${key}`, res.ok, `${key} ${url} → HTTP ${res.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      add(`legal-${key}`, false, `${key} ${url} → ${message}`);
    }
  }
}

async function main(): Promise<void> {
  await verifyLegalUrls();

  const failed = checks.filter((c) => !c.pass);
  for (const c of checks) {
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id} — ${c.detail}`);
  }
  console.log(`\nSmoke summary: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
