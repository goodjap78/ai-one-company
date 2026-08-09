/**
 * Sprint 56-G — production wiring QA.
 * Run: npm run test:convenience-illustration-production
 */
import './ingredient-factory/nodePngRequireStub';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  CONVENIENCE_COMPONENT_CATALOG,
  lookupConvenienceComponentAlias,
} from '../data/content/combos/convenienceComponentCatalog';
import {
  CONVENIENCE_ILLUSTRATION_ICON_ASSETS,
  isKnownConvenienceIllustrationIconKey,
  listConvenienceIllustrationIconKeys,
} from '../services/images/convenienceIllustrationIconAssets';
import { resolveConvenienceIllustrationIcon, resolveConvenienceIllustrationIconForLabel } from '../services/images/resolveConvenienceIllustrationIcon';
import { resolveConvenienceComboItem } from '../services/convenience/resolveConvenienceComboItems';
import { CONVENIENCE_ILLUSTRATION_ICON_KEYS } from '../types/convenienceIllustrationIcon';
import { PATHS } from './convenience-illustration-icon-factory/config';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

const appRoot = path.join(__dirname, '..');
const prodDir = path.join(appRoot, 'assets/convenience-illustration-icons');
const hashSnapPath = path.join(prodDir, 'PRODUCTION_HASH_SNAPSHOT.json');
const heroRegistryPath = path.join(appRoot, 'services/images/convenienceComboImageAssets.ts');

console.log('Convenience illustration production wiring QA — start\n');

for (const key of CONVENIENCE_ILLUSTRATION_ICON_KEYS) {
  const prodPath = path.join(prodDir, `${key}.png`);
  assert(fs.existsSync(prodPath), `production asset exists: ${key}`);
  const masterPath = path.join(PATHS.mastersDir, `${key}.png`);
  assert(fs.existsSync(masterPath), `master exists: ${key}`);
  assert(sha256File(prodPath) === sha256File(masterPath), `hash MATCH master↔production: ${key}`);
}

if (fs.existsSync(hashSnapPath)) {
  const snap = JSON.parse(fs.readFileSync(hashSnapPath, 'utf8')) as Record<string, string>;
  for (const key of CONVENIENCE_ILLUSTRATION_ICON_KEYS) {
    const prodPath = path.join(prodDir, `${key}.png`);
    if (snap[key]) {
      assert(sha256File(prodPath) === snap[key], `production hash snapshot: ${key}`);
    }
  }
}

const registryKeys = listConvenienceIllustrationIconKeys();
assert(registryKeys.length === 10, 'registry 10 keys');
for (const key of CONVENIENCE_ILLUSTRATION_ICON_KEYS) {
  assert(key in CONVENIENCE_ILLUSTRATION_ICON_ASSETS, `registry entry: ${key}`);
  assert(resolveConvenienceIllustrationIcon(key) != null, `resolver returns source: ${key}`);
}

const mapped = CONVENIENCE_COMPONENT_CATALOG.filter((e) => e.illustrationIconKey);
assert(mapped.length === 10, 'catalog illustration mappings 10/10');
for (const entry of mapped) {
  assert(
    isKnownConvenienceIllustrationIconKey(entry.illustrationIconKey!),
    `catalog illustration key valid: ${entry.key}`,
  );
}

const cupRamen = resolveConvenienceComboItem({ name: '컵라면' });
assert(cupRamen.illustrationIconKey === 'cup_ramen', '컵라면 → illustration');
assert(cupRamen.iconKey == null, '컵라면 no wrong ingredient key');

const kimbap = resolveConvenienceComboItem({ name: '삼각김밥' });
assert(kimbap.illustrationIconKey === 'triangle_kimbap', '삼각김밥 → illustration');

const milk = resolveConvenienceComboItem({ name: '우유' });
assert(milk.illustrationIconKey === 'milk', '우유 → illustration (not ingredient reuse)');

const hotbar = resolveConvenienceComboItem({ name: '핫바' });
assert(hotbar.illustrationIconKey === 'hot_bar', '핫바 → illustration');

const unknown = resolveConvenienceComboItem({ name: '알수없는상품' });
assert(!unknown.illustrationIconKey && !unknown.iconKey, 'unknown → text only');

assert(resolveConvenienceIllustrationIcon('nonexistent_key') === null, 'unknown key → null');
assert(resolveConvenienceIllustrationIconForLabel('알수없는') === null, 'unknown label → null');

const itemCardsSource = fs.readFileSync(
  path.join(appRoot, 'components/convenience/ConvenienceComboItemCards.tsx'),
  'utf8',
);
assert(itemCardsSource.includes('resolveConvenienceIllustrationIcon'), 'UI uses illustration resolver');
assert(itemCardsSource.includes('resolveIngredientIcon'), 'UI keeps ingredient fallback');
assert(!itemCardsSource.includes('placeholder'), 'no placeholder in UI');

assert(fs.existsSync(path.join(appRoot, 'services/images/convenienceIllustrationIconAssets.ts')), 'registry file exists');
assert(!fs.existsSync(path.join(appRoot, 'services/images/convenienceIllustrationIconAssets.ts.bak')), 'no broken require backup');

if (fs.existsSync(PATHS.approvedMastersJson)) {
  const approved = JSON.parse(fs.readFileSync(PATHS.approvedMastersJson, 'utf8')) as {
    productionWired?: boolean;
    registryWired?: boolean;
    uiWired?: boolean;
  };
  assert(approved.productionWired === true, 'APPROVED_MASTERS productionWired true');
  assert(approved.registryWired === true, 'APPROVED_MASTERS registryWired true');
  assert(approved.uiWired === true, 'APPROVED_MASTERS uiWired true');
}

assert(fs.existsSync(heroRegistryPath), 'hero combo image registry unchanged');
const heroBefore = fs.readFileSync(heroRegistryPath, 'utf8');
assert(heroBefore.includes('CONVENIENCE_COMBO_IMAGE'), 'hero registry intact');

console.log(`\nConvenience illustration production wiring QA — done (${failed} failed)`);
if (failed > 0) process.exit(1);
