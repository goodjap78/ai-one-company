/**
 * Sprint 56-A / 56-B / 56-C.2 pilot QA — review-only, no production.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sizeOf from 'image-size';
import {
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V15_FILE,
  CUP_RAMEN_V2_FILE,
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  TRIANGLE_KIMBAP_V1_FILE,
  TRIANGLE_KIMBAP_V11_FILE,
  TRIANGLE_KIMBAP_V12_FILE,
  MILK_V1_FILE,
  SALAD_V1_FILE,
  PATHS,
  PHASE1_BATCH_REVIEW_FILES,
} from './convenience-illustration-icon-factory/config';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Sprint convenience illustration pilot QA — start\n');

const v1Png = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);
const v15Png = path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE);
const v2Png = path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE);
const cupRicePng = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);

assert(fs.existsSync(v1Png), 'cup_ramen_v1 review PNG exists');

if (fs.existsSync(v1Png)) {
  const dims = sizeOf(fs.readFileSync(v1Png));
  assert(dims.width === 1024 && dims.height === 1024, 'v1 is 1024×1024');
}

if (fs.existsSync(v15Png)) {
  const dims = sizeOf(fs.readFileSync(v15Png));
  assert(dims.width === 1024 && dims.height === 1024, 'v1.5 is 1024×1024');
}

if (fs.existsSync(v2Png)) {
  const dims = sizeOf(fs.readFileSync(v2Png));
  assert(dims.width === 1024 && dims.height === 1024, 'v2 is 1024×1024');
}

if (fs.existsSync(cupRicePng)) {
  const dims = sizeOf(fs.readFileSync(cupRicePng));
  assert(dims.width === 1024 && dims.height === 1024, 'cup_rice_v1 is 1024×1024');
}

const cupRiceV11Png = path.join(PATHS.reviewDir, CUP_RICE_V11_FILE);
if (fs.existsSync(cupRiceV11Png)) {
  const dims = sizeOf(fs.readFileSync(cupRiceV11Png));
  assert(dims.width === 1024 && dims.height === 1024, 'cup_rice_v11 is 1024×1024');
}

const triangleKimbapV11Png = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V11_FILE);
assert(fs.existsSync(triangleKimbapV11Png), 'triangle_kimbap_v11 review PNG exists');
if (fs.existsSync(triangleKimbapV11Png)) {
  const dims = sizeOf(fs.readFileSync(triangleKimbapV11Png));
  assert(dims.width === 1024 && dims.height === 1024, 'triangle_kimbap_v11 is 1024×1024');
}

const triangleKimbapV12Png = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V12_FILE);
assert(fs.existsSync(triangleKimbapV12Png), 'triangle_kimbap_v12 review PNG exists');
if (fs.existsSync(triangleKimbapV12Png)) {
  const dims = sizeOf(fs.readFileSync(triangleKimbapV12Png));
  assert(dims.width === 1024 && dims.height === 1024, 'triangle_kimbap_v12 is 1024×1024');
}

const triangleKimbapV1Review = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V1_FILE);
assert(!fs.existsSync(triangleKimbapV1Review), 'triangle_kimbap_v1 not in review (archived)');

const triangleKimbapV1History = path.join(
  PATHS.triangleKimbapHistoryDir,
  TRIANGLE_KIMBAP_V1_FILE,
);
assert(fs.existsSync(triangleKimbapV1History), 'triangle_kimbap_v1 archived in history');

const reviewFiles = fs.existsSync(PATHS.reviewDir)
  ? fs.readdirSync(PATHS.reviewDir).filter((f) => f.endsWith('.png'))
  : [];

const allowed = new Set([
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V15_FILE,
  CUP_RAMEN_V2_FILE,
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  TRIANGLE_KIMBAP_V11_FILE,
  TRIANGLE_KIMBAP_V12_FILE,
  MILK_V1_FILE,
  SALAD_V1_FILE,
  ...PHASE1_BATCH_REVIEW_FILES,
]);
const extra = reviewFiles.filter((f) => !allowed.has(f as typeof CUP_RAMEN_V1_FILE));
assert(extra.length === 0, `no extra review PNGs (found: ${extra.join(', ')})`);
assert(
  reviewFiles.length >= 9 && reviewFiles.length <= 14,
  `review PNG count 9-14 (got ${reviewFiles.length})`,
);

for (const batchFile of PHASE1_BATCH_REVIEW_FILES) {
  const batchPng = path.join(PATHS.reviewDir, batchFile);
  if (fs.existsSync(batchPng)) {
    const dims = sizeOf(fs.readFileSync(batchPng));
    assert(dims.width === 1024 && dims.height === 1024, `${batchFile} is 1024×1024`);
  }
}

assert(fs.existsSync(PATHS.batchAuditJson), 'PHASE1_BATCH_AUDIT.json exists');

assert(fs.existsSync(PATHS.cupRamenMaster), 'cup_ramen approved master exists');

const cupRiceMaster = PATHS.cupRiceMaster;
if (fs.existsSync(cupRiceMaster)) {
  const dims = sizeOf(fs.readFileSync(cupRiceMaster));
  assert(dims.width === 1024 && dims.height === 1024, 'cup_rice master is 1024×1024');
}

assert(fs.existsSync(PATHS.triangleKimbapMaster), 'triangle_kimbap approved master exists');
if (fs.existsSync(PATHS.triangleKimbapMaster)) {
  const dims = sizeOf(fs.readFileSync(PATHS.triangleKimbapMaster));
  assert(dims.width === 1024 && dims.height === 1024, 'triangle_kimbap master is 1024×1024');
}

assert(fs.existsSync(PATHS.milkMaster), 'milk approved master exists');
if (fs.existsSync(PATHS.milkMaster)) {
  const dims = sizeOf(fs.readFileSync(PATHS.milkMaster));
  assert(dims.width === 1024 && dims.height === 1024, 'milk master is 1024×1024');
}

assert(fs.existsSync(PATHS.saladMaster), 'salad approved master exists');
if (fs.existsSync(PATHS.saladMaster)) {
  const dims = sizeOf(fs.readFileSync(PATHS.saladMaster));
  assert(dims.width === 1024 && dims.height === 1024, 'salad master is 1024×1024');
}

for (const [label, masterPath] of [
  ['lunchbox', PATHS.lunchboxMaster],
  ['sandwich', PATHS.sandwichMaster],
  ['hamburger', PATHS.hamburgerMaster],
  ['hot_bar', PATHS.hotBarMaster],
  ['cup_udon', PATHS.cupUdonMaster],
] as const) {
  assert(fs.existsSync(masterPath), `${label} approved master exists`);
  const dims = sizeOf(fs.readFileSync(masterPath));
  assert(dims.width === 1024 && dims.height === 1024, `${label} master is 1024×1024`);
}

const reviewIndex = fs.readFileSync(PATHS.reviewIndex, 'utf8');
assert(reviewIndex.includes('APPROVED MASTER'), 'review index shows APPROVED MASTER badges');
assert(reviewIndex.includes('10/10'), 'review index shows 10/10 complete');

if (fs.existsSync(PATHS.approvedMastersJson)) {
  const approved = JSON.parse(fs.readFileSync(PATHS.approvedMastersJson, 'utf8')) as {
    masters?: Record<string, unknown>;
    phase1Complete?: boolean;
    phase1BatchReview?: { masterAutoApproval?: boolean; finalApproval?: string };
    productionWired?: boolean;
    registryWired?: boolean;
    uiWired?: boolean;
  };
  const masterKeys = Object.keys(approved.masters ?? {});
  assert(masterKeys.length === 10, `approved masters exactly 10 (got ${masterKeys.length})`);
  assert(
    masterKeys.includes('cup_ramen') &&
      masterKeys.includes('cup_rice') &&
      masterKeys.includes('triangle_kimbap') &&
      masterKeys.includes('milk') &&
      masterKeys.includes('salad') &&
      masterKeys.includes('lunchbox') &&
      masterKeys.includes('sandwich') &&
      masterKeys.includes('hamburger') &&
      masterKeys.includes('hot_bar') &&
      masterKeys.includes('cup_udon'),
    'masters are Phase 1 ten icons',
  );
  assert(approved.phase1Complete === true, 'phase1Complete true');
  assert(approved.productionWired === true, 'productionWired true');
  assert(approved.registryWired === true, 'registryWired true');
  assert(approved.uiWired === true, 'uiWired true');
  if (approved.phase1BatchReview) {
    assert(approved.phase1BatchReview.masterAutoApproval === true, 'batch masters approved');
    assert(
      approved.phase1BatchReview.finalApproval === '56-F Final',
      'batch final approval recorded',
    );
  }
}

assert(fs.existsSync(PATHS.saladPilotPrompt), 'salad pilot prompt prepared');
assert(fs.existsSync(PATHS.lunchboxPilotPrompt), 'lunchbox pilot prompt prepared');

assert(
  fs.existsSync(PATHS.renderProfileJson),
  'CONVENIENCE_ICON_RENDER_PROFILE.json exists',
);

const prodDir = path.join(PATHS.appRoot, 'assets/convenience-illustration-icons');
assert(fs.existsSync(prodDir), 'production convenience illustration dir exists');
const prodPngs = fs.readdirSync(prodDir).filter((f) => f.endsWith('.png'));
assert(prodPngs.length === 10, `production PNG count 10 (got ${prodPngs.length})`);

const registryPath = path.join(
  PATHS.appRoot,
  'services/images/convenienceIllustrationIconAssets.ts',
);
assert(fs.existsSync(registryPath), 'convenience illustration registry file exists');

const milkReviewPng = path.join(PATHS.reviewDir, MILK_V1_FILE);
assert(fs.existsSync(milkReviewPng), 'milk_v1 review PNG exists');
if (fs.existsSync(milkReviewPng)) {
  const dims = sizeOf(fs.readFileSync(milkReviewPng));
  assert(dims.width === 1024 && dims.height === 1024, 'milk_v1 is 1024×1024');
}

const saladReviewPng = path.join(PATHS.reviewDir, SALAD_V1_FILE);
assert(fs.existsSync(saladReviewPng), 'salad_v1 review PNG exists');
if (fs.existsSync(saladReviewPng)) {
  const dims = sizeOf(fs.readFileSync(saladReviewPng));
  assert(dims.width === 1024 && dims.height === 1024, 'salad_v1 is 1024×1024');
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

const masterHashSnapshot = path.join(PATHS.generatedRoot, 'MASTER_HASH_SNAPSHOT.json');
if (fs.existsSync(masterHashSnapshot)) {
  const snap = JSON.parse(fs.readFileSync(masterHashSnapshot, 'utf8')) as Record<string, string>;
  if (snap.cup_ramen) {
    assert(sha256File(PATHS.cupRamenMaster) === snap.cup_ramen, 'cup_ramen master hash unchanged');
  }
  if (snap.cup_rice) {
    assert(sha256File(PATHS.cupRiceMaster) === snap.cup_rice, 'cup_rice master hash unchanged');
  }
  if (snap.triangle_kimbap) {
    assert(
      sha256File(PATHS.triangleKimbapMaster) === snap.triangle_kimbap,
      'triangle_kimbap master hash unchanged',
    );
  }
  if (snap.milk) {
    assert(sha256File(PATHS.milkMaster) === snap.milk, 'milk master hash unchanged');
  }
  if (snap.salad) {
    assert(sha256File(PATHS.saladMaster) === snap.salad, 'salad master hash unchanged');
  }
  if (snap.lunchbox) {
    assert(sha256File(PATHS.lunchboxMaster) === snap.lunchbox, 'lunchbox master hash matches snapshot');
  }
  if (snap.sandwich) {
    assert(sha256File(PATHS.sandwichMaster) === snap.sandwich, 'sandwich master hash matches snapshot');
  }
  if (snap.hamburger) {
    assert(sha256File(PATHS.hamburgerMaster) === snap.hamburger, 'hamburger master hash matches snapshot');
  }
  if (snap.hot_bar) {
    assert(sha256File(PATHS.hotBarMaster) === snap.hot_bar, 'hot_bar master hash matches snapshot');
  }
  if (snap.cup_udon) {
    assert(sha256File(PATHS.cupUdonMaster) === snap.cup_udon, 'cup_udon master hash matches snapshot');
  }
} else {
  const snapOut = {
    cup_ramen: sha256File(PATHS.cupRamenMaster),
    cup_rice: sha256File(PATHS.cupRiceMaster),
    triangle_kimbap: sha256File(PATHS.triangleKimbapMaster),
    milk: sha256File(PATHS.milkMaster),
    salad: sha256File(PATHS.saladMaster),
    recordedAt: new Date().toISOString(),
    sprint: '56-E',
  };
  fs.writeFileSync(masterHashSnapshot, JSON.stringify(snapOut, null, 2), 'utf8');
  console.log(`✅ master hash snapshot written (${masterHashSnapshot})`);
}

console.log(`\nSprint convenience illustration pilot QA — done (${failed} failed)`);
if (failed > 0) process.exit(1);
