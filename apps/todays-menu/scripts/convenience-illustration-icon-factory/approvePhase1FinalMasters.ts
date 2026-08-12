/**
 * Sprint 56-F Final — approve batch 5 review icons as masters (no regeneration).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng, analyzeReferenceSet, type IngredientPngMetrics } from './analyzeIngredientPng';
import { buildRenderProfileFromMetrics } from './convenienceIconRenderProfile';
import {
  CUP_RAMEN_APPROVED_MASTER,
  CUP_RICE_APPROVED_MASTER,
  TRIANGLE_KIMBAP_APPROVED_MASTER,
  TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
  TRIANGLE_KIMBAP_V11_REJECTED,
  MILK_APPROVED_MASTER,
  SALAD_APPROVED_MASTER,
  LUNCHBOX_APPROVED_MASTER,
  SANDWICH_APPROVED_MASTER,
  HAMBURGER_APPROVED_MASTER,
  HOT_BAR_APPROVED_MASTER,
  CUP_UDON_APPROVED_MASTER,
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import { writePhase1FinalApprovedReviewHtml } from './writeReviewHtml';
import {
  LUNCHBOX_V1_FILE,
  SANDWICH_V1_FILE,
  HAMBURGER_V1_FILE,
  HOT_BAR_V1_FILE,
  CUP_UDON_V1_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';

const BATCH_APPROVALS = [
  {
    reviewFile: LUNCHBOX_V1_FILE,
    masterPath: PATHS.lunchboxMaster,
    constant: LUNCHBOX_APPROVED_MASTER,
    analyzeKey: 'lunchbox_master',
  },
  {
    reviewFile: SANDWICH_V1_FILE,
    masterPath: PATHS.sandwichMaster,
    constant: SANDWICH_APPROVED_MASTER,
    analyzeKey: 'sandwich_master',
  },
  {
    reviewFile: HAMBURGER_V1_FILE,
    masterPath: PATHS.hamburgerMaster,
    constant: HAMBURGER_APPROVED_MASTER,
    analyzeKey: 'hamburger_master',
  },
  {
    reviewFile: HOT_BAR_V1_FILE,
    masterPath: PATHS.hotBarMaster,
    constant: HOT_BAR_APPROVED_MASTER,
    analyzeKey: 'hot_bar_master',
  },
  {
    reviewFile: CUP_UDON_V1_FILE,
    masterPath: PATHS.cupUdonMaster,
    constant: CUP_UDON_APPROVED_MASTER,
    analyzeKey: 'cup_udon_master',
  },
] as const;

const PROTECTED_MASTERS = [
  { key: 'cup_ramen', path: PATHS.cupRamenMaster, constant: CUP_RAMEN_APPROVED_MASTER },
  { key: 'cup_rice', path: PATHS.cupRiceMaster, constant: CUP_RICE_APPROVED_MASTER },
  {
    key: 'triangle_kimbap',
    path: PATHS.triangleKimbapMaster,
    constant: TRIANGLE_KIMBAP_APPROVED_MASTER,
  },
  { key: 'milk', path: PATHS.milkMaster, constant: MILK_APPROVED_MASTER },
  { key: 'salad', path: PATHS.saladMaster, constant: SALAD_APPROVED_MASTER },
] as const;

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function baseMeasuredMetrics(m: IngredientPngMetrics): Record<string, unknown> {
  return {
    bboxAreaPct: Number((m.bboxAreaRatio * 100).toFixed(1)),
    backgroundRgb: m.backgroundRgb,
    backgroundPolicy: m.backgroundPolicy,
    paddingTopPct: Number(m.paddingTopPct.toFixed(1)),
    paddingBottomPct: Number(m.paddingBottomPct.toFixed(1)),
    paddingLeftPct: Number(m.paddingLeftPct.toFixed(1)),
    paddingRightPct: Number(m.paddingRightPct.toFixed(1)),
    foregroundPixelRatio: Number((m.foregroundPixelRatio * 100).toFixed(1)),
    fileBytes: m.fileBytes,
    legibilityPx: 40,
    face: false,
  };
}

function buildMasterEntry(
  constant: {
    iconKey: string;
    approvedSprint: string;
    sourceReviewFile: string;
    masterRelativePath: string;
    referenceMetrics: Record<string, unknown>;
    historyFiles: readonly string[];
  },
  masterAbs: string,
  metrics: IngredientPngMetrics,
): Record<string, unknown> {
  return {
    ...constant,
    approvalStatus: 'APPROVED_MASTER',
    masterAbsolutePath: masterAbs,
    measuredMetrics: {
      ...baseMeasuredMetrics(metrics),
      ...Object.fromEntries(
        Object.entries(constant.referenceMetrics).filter(
          ([key]) =>
            !['bboxTargetMinPct', 'bboxTargetMaxPct', 'backgroundPolicy', 'manualApprovalNote'].includes(
              key,
            ),
        ),
      ),
    },
  };
}

export function approvePhase1FinalMasters(): { ok: boolean; error?: string } {
  for (const batch of BATCH_APPROVALS) {
    const reviewAbs = path.join(PATHS.reviewDir, batch.reviewFile);
    if (!fs.existsSync(reviewAbs)) {
      return { ok: false, error: `Missing review file ${batch.reviewFile}` };
    }
  }

  for (const protectedMaster of PROTECTED_MASTERS) {
    if (!fs.existsSync(protectedMaster.path)) {
      return { ok: false, error: `Missing protected master ${protectedMaster.key}` };
    }
  }

  const protectedHashesBefore: Record<string, string> = {};
  for (const protectedMaster of PROTECTED_MASTERS) {
    protectedHashesBefore[protectedMaster.key] = sha256File(protectedMaster.path);
  }

  for (const batch of BATCH_APPROVALS) {
    const reviewAbs = path.join(PATHS.reviewDir, batch.reviewFile);
    copyFile(reviewAbs, batch.masterPath);
  }

  for (const protectedMaster of PROTECTED_MASTERS) {
    const after = sha256File(protectedMaster.path);
    if (after !== protectedHashesBefore[protectedMaster.key]) {
      return { ok: false, error: `${protectedMaster.key} master changed unexpectedly` };
    }
  }

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const milkMetrics = analyzeIngredientPng(PATHS.milkMaster, 'milk_master');
  const saladMetrics = analyzeIngredientPng(PATHS.saladMaster, 'salad_master');

  const batchMetrics = BATCH_APPROVALS.map((batch) => ({
    batch,
    metrics: analyzeIngredientPng(batch.masterPath, batch.analyzeKey),
  }));

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(PATHS.approvedMastersJson)) {
    existing = JSON.parse(fs.readFileSync(PATHS.approvedMastersJson, 'utf8')) as Record<
      string,
      unknown
    >;
  }

  const approved = {
    styleVersion: HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
    approvedAt: new Date().toISOString(),
    phase1Complete: true,
    phase1FinalApproval: '56-F Final',
    masters: {
      cup_ramen: buildMasterEntry(CUP_RAMEN_APPROVED_MASTER, PATHS.cupRamenMaster, ramenMetrics),
      cup_rice: buildMasterEntry(CUP_RICE_APPROVED_MASTER, PATHS.cupRiceMaster, riceMetrics),
      triangle_kimbap: buildMasterEntry(
        TRIANGLE_KIMBAP_APPROVED_MASTER,
        PATHS.triangleKimbapMaster,
        kimMetrics,
      ),
      milk: buildMasterEntry(MILK_APPROVED_MASTER, PATHS.milkMaster, milkMetrics),
      salad: buildMasterEntry(SALAD_APPROVED_MASTER, PATHS.saladMaster, saladMetrics),
      lunchbox: buildMasterEntry(
        LUNCHBOX_APPROVED_MASTER,
        PATHS.lunchboxMaster,
        batchMetrics[0]!.metrics,
      ),
      sandwich: buildMasterEntry(
        SANDWICH_APPROVED_MASTER,
        PATHS.sandwichMaster,
        batchMetrics[1]!.metrics,
      ),
      hamburger: buildMasterEntry(
        HAMBURGER_APPROVED_MASTER,
        PATHS.hamburgerMaster,
        batchMetrics[2]!.metrics,
      ),
      hot_bar: buildMasterEntry(
        HOT_BAR_APPROVED_MASTER,
        PATHS.hotBarMaster,
        batchMetrics[3]!.metrics,
      ),
      cup_udon: buildMasterEntry(
        CUP_UDON_APPROVED_MASTER,
        PATHS.cupUdonMaster,
        batchMetrics[4]!.metrics,
      ),
    },
    rejectedMasters: {
      triangle_kimbap_v1: TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
      triangle_kimbap_v11: TRIANGLE_KIMBAP_V11_REJECTED,
    },
    phase1BatchReview: {
      sprint: '56-F',
      reviewOnly: false,
      masterAutoApproval: true,
      finalApproval: '56-F Final',
      icons: ['lunchbox', 'sandwich', 'hamburger', 'hot_bar', 'cup_udon'],
      auditFile: 'PHASE1_BATCH_AUDIT.json',
    },
    productionWired: false,
    registryWired: false,
    uiWired: false,
    previousApprovedAt: existing.approvedAt ?? null,
  };

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.approvedMastersJson, JSON.stringify(approved, null, 2), 'utf8');

  if (fs.existsSync(PATHS.batchAuditJson)) {
    const audit = JSON.parse(fs.readFileSync(PATHS.batchAuditJson, 'utf8')) as Record<
      string,
      unknown
    >;
    audit.pendingMasterApproval = 0;
    audit.mastersCount = 10;
    audit.finalApproval = '56-F Final';
    fs.writeFileSync(PATHS.batchAuditJson, JSON.stringify(audit, null, 2), 'utf8');
  }

  const masterHashSnapshot = path.join(PATHS.generatedRoot, 'MASTER_HASH_SNAPSHOT.json');
  const snapOut = {
    cup_ramen: protectedHashesBefore.cup_ramen,
    cup_rice: protectedHashesBefore.cup_rice,
    triangle_kimbap: protectedHashesBefore.triangle_kimbap,
    milk: protectedHashesBefore.milk,
    salad: protectedHashesBefore.salad,
    lunchbox: sha256File(PATHS.lunchboxMaster),
    sandwich: sha256File(PATHS.sandwichMaster),
    hamburger: sha256File(PATHS.hamburgerMaster),
    hot_bar: sha256File(PATHS.hotBarMaster),
    cup_udon: sha256File(PATHS.cupUdonMaster),
    recordedAt: new Date().toISOString(),
    sprint: '56-F Final',
  };
  fs.writeFileSync(masterHashSnapshot, JSON.stringify(snapOut, null, 2), 'utf8');

  const refMetrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(refMetrics);
  writePhase1FinalApprovedReviewHtml({ profile });

  for (const { batch, metrics } of batchMetrics) {
    console.log(
      `Approved master: ${batch.masterPath} · bbox ${(metrics.bboxAreaRatio * 100).toFixed(1)}%`,
    );
  }
  console.log('Protected masters unchanged (5)');
  console.log(`Registry: ${PATHS.approvedMastersJson}`);
  console.log('phase1Complete: true · productionWired: false');

  return { ok: true };
}
