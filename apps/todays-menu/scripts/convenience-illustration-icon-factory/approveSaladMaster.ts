/**
 * Sprint 56-E.1 — approve salad_v1 as fifth master; preserve cup_ramen/cup_rice/triangle_kimbap/milk.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import {
  CUP_RAMEN_APPROVED_MASTER,
  CUP_RICE_APPROVED_MASTER,
  TRIANGLE_KIMBAP_APPROVED_MASTER,
  TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
  TRIANGLE_KIMBAP_V11_REJECTED,
  MILK_APPROVED_MASTER,
  SALAD_APPROVED_MASTER,
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import { buildRenderProfileFromMetrics } from './convenienceIconRenderProfile';
import { writeApprovedMastersReviewHtml } from './writeReviewHtml';
import { prepareLunchboxPilotPrompt } from './prepareLunchboxPilot';
import { SALAD_V1_FILE, PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function approveSaladMaster(): { ok: boolean; error?: string } {
  const v1Abs = path.join(PATHS.reviewDir, SALAD_V1_FILE);
  if (!fs.existsSync(v1Abs)) {
    return { ok: false, error: `Missing review file ${SALAD_V1_FILE}` };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return { ok: false, error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}` };
  }
  if (!fs.existsSync(PATHS.cupRiceMaster)) {
    return { ok: false, error: `Missing cup_rice master at ${PATHS.cupRiceMaster}` };
  }
  if (!fs.existsSync(PATHS.triangleKimbapMaster)) {
    return { ok: false, error: `Missing triangle_kimbap master at ${PATHS.triangleKimbapMaster}` };
  }
  if (!fs.existsSync(PATHS.milkMaster)) {
    return { ok: false, error: `Missing milk master at ${PATHS.milkMaster}` };
  }

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);
  const riceHashBefore = sha256File(PATHS.cupRiceMaster);
  const kimHashBefore = sha256File(PATHS.triangleKimbapMaster);
  const milkHashBefore = sha256File(PATHS.milkMaster);

  copyFile(v1Abs, PATHS.saladMaster);

  const ramenHashAfter = sha256File(PATHS.cupRamenMaster);
  const riceHashAfter = sha256File(PATHS.cupRiceMaster);
  const kimHashAfter = sha256File(PATHS.triangleKimbapMaster);
  const milkHashAfter = sha256File(PATHS.milkMaster);
  if (ramenHashBefore !== ramenHashAfter) {
    return { ok: false, error: 'cup_ramen master changed unexpectedly' };
  }
  if (riceHashBefore !== riceHashAfter) {
    return { ok: false, error: 'cup_rice master changed unexpectedly' };
  }
  if (kimHashBefore !== kimHashAfter) {
    return { ok: false, error: 'triangle_kimbap master changed unexpectedly' };
  }
  if (milkHashBefore !== milkHashAfter) {
    return { ok: false, error: 'milk master changed unexpectedly' };
  }

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const milkMetrics = analyzeIngredientPng(PATHS.milkMaster, 'milk_master');
  const saladMetrics = analyzeIngredientPng(PATHS.saladMaster, 'salad_master');

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
    masters: {
      cup_ramen: {
        ...CUP_RAMEN_APPROVED_MASTER,
        masterAbsolutePath: PATHS.cupRamenMaster,
        measuredMetrics: {
          bboxAreaPct: Number((ramenMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: ramenMetrics.backgroundRgb,
          backgroundPolicy: ramenMetrics.backgroundPolicy,
          paddingTopPct: Number(ramenMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(ramenMetrics.paddingBottomPct.toFixed(1)),
          fileBytes: ramenMetrics.fileBytes,
        },
      },
      cup_rice: {
        ...CUP_RICE_APPROVED_MASTER,
        masterAbsolutePath: PATHS.cupRiceMaster,
        measuredMetrics: {
          bboxAreaPct: Number((riceMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: riceMetrics.backgroundRgb,
          backgroundPolicy: riceMetrics.backgroundPolicy,
          paddingTopPct: Number(riceMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(riceMetrics.paddingBottomPct.toFixed(1)),
          paddingLeftPct: Number(riceMetrics.paddingLeftPct.toFixed(1)),
          paddingRightPct: Number(riceMetrics.paddingRightPct.toFixed(1)),
          foregroundPixelRatio: Number((riceMetrics.foregroundPixelRatio * 100).toFixed(1)),
          fileBytes: riceMetrics.fileBytes,
          bodyHex: CUP_RICE_APPROVED_MASTER.referenceMetrics.bodyHex,
          accentBandHex: CUP_RICE_APPROVED_MASTER.referenceMetrics.accentBandHex,
          silhouette: CUP_RICE_APPROVED_MASTER.referenceMetrics.silhouette,
          legibilityPx: CUP_RICE_APPROVED_MASTER.referenceMetrics.legibilityPx,
        },
      },
      triangle_kimbap: {
        ...TRIANGLE_KIMBAP_APPROVED_MASTER,
        masterAbsolutePath: PATHS.triangleKimbapMaster,
        measuredMetrics: {
          bboxAreaPct: Number((kimMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: kimMetrics.backgroundRgb,
          backgroundPolicy: kimMetrics.backgroundPolicy,
          paddingTopPct: Number(kimMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(kimMetrics.paddingBottomPct.toFixed(1)),
          paddingLeftPct: Number(kimMetrics.paddingLeftPct.toFixed(1)),
          paddingRightPct: Number(kimMetrics.paddingRightPct.toFixed(1)),
          foregroundPixelRatio: Number((kimMetrics.foregroundPixelRatio * 100).toFixed(1)),
          fileBytes: kimMetrics.fileBytes,
          riceHex: TRIANGLE_KIMBAP_APPROVED_MASTER.referenceMetrics.riceHex,
          seaweedHex: TRIANGLE_KIMBAP_APPROVED_MASTER.referenceMetrics.seaweedHex,
          silhouette: TRIANGLE_KIMBAP_APPROVED_MASTER.referenceMetrics.silhouette,
          legibilityPx: TRIANGLE_KIMBAP_APPROVED_MASTER.referenceMetrics.legibilityPx,
          face: false,
          fillingDotsMax: TRIANGLE_KIMBAP_APPROVED_MASTER.referenceMetrics.fillingDotsMax,
        },
      },
      milk: {
        ...MILK_APPROVED_MASTER,
        masterAbsolutePath: PATHS.milkMaster,
        measuredMetrics: {
          bboxAreaPct: Number((milkMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: milkMetrics.backgroundRgb,
          backgroundPolicy: milkMetrics.backgroundPolicy,
          paddingTopPct: Number(milkMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(milkMetrics.paddingBottomPct.toFixed(1)),
          paddingLeftPct: Number(milkMetrics.paddingLeftPct.toFixed(1)),
          paddingRightPct: Number(milkMetrics.paddingRightPct.toFixed(1)),
          foregroundPixelRatio: Number((milkMetrics.foregroundPixelRatio * 100).toFixed(1)),
          fileBytes: milkMetrics.fileBytes,
          cartonHex: MILK_APPROVED_MASTER.referenceMetrics.cartonHex,
          accentHex: MILK_APPROVED_MASTER.referenceMetrics.accentHex,
          silhouette: MILK_APPROVED_MASTER.referenceMetrics.silhouette,
          legibilityPx: MILK_APPROVED_MASTER.referenceMetrics.legibilityPx,
          face: false,
          straw: false,
        },
      },
      salad: {
        ...SALAD_APPROVED_MASTER,
        masterAbsolutePath: PATHS.saladMaster,
        measuredMetrics: {
          bboxAreaPct: Number((saladMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: saladMetrics.backgroundRgb,
          backgroundPolicy: saladMetrics.backgroundPolicy,
          paddingTopPct: Number(saladMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(saladMetrics.paddingBottomPct.toFixed(1)),
          paddingLeftPct: Number(saladMetrics.paddingLeftPct.toFixed(1)),
          paddingRightPct: Number(saladMetrics.paddingRightPct.toFixed(1)),
          foregroundPixelRatio: Number((saladMetrics.foregroundPixelRatio * 100).toFixed(1)),
          fileBytes: saladMetrics.fileBytes,
          containerHex: SALAD_APPROVED_MASTER.referenceMetrics.containerHex,
          rimHex: SALAD_APPROVED_MASTER.referenceMetrics.rimHex,
          leafHex: SALAD_APPROVED_MASTER.referenceMetrics.leafHex,
          accentHex: SALAD_APPROVED_MASTER.referenceMetrics.accentHex,
          silhouette: SALAD_APPROVED_MASTER.referenceMetrics.silhouette,
          legibilityPx: SALAD_APPROVED_MASTER.referenceMetrics.legibilityPx,
          face: false,
        },
      },
    },
    rejectedMasters: {
      triangle_kimbap_v1: TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
      triangle_kimbap_v11: TRIANGLE_KIMBAP_V11_REJECTED,
    },
    nextPilot: {
      iconKey: 'lunchbox',
      promptOnly: true,
      generationApproved: false,
    },
    lunchboxPilot: {
      iconKey: 'lunchbox',
      promptOnly: true,
      generationApproved: false,
    },
    productionWired: false,
    registryWired: false,
    uiWired: false,
    previousApprovedAt: existing.approvedAt ?? null,
  };

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.approvedMastersJson, JSON.stringify(approved, null, 2), 'utf8');

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  writeApprovedMastersReviewHtml({ profile });

  const lunchboxPrep = prepareLunchboxPilotPrompt();
  if (!lunchboxPrep.ok) {
    return { ok: false, error: lunchboxPrep.error ?? 'lunchbox pilot prompt preparation failed' };
  }

  console.log(`Approved master: ${PATHS.saladMaster}`);
  console.log(
    `salad bbox ${(saladMetrics.bboxAreaRatio * 100).toFixed(1)}% · bg rgb(${saladMetrics.backgroundRgb.r},${saladMetrics.backgroundRgb.g},${saladMetrics.backgroundRgb.b})`,
  );
  console.log(
    `cup_ramen master unchanged · bbox ${(ramenMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(
    `cup_rice master unchanged · bbox ${(riceMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(
    `triangle_kimbap master unchanged · bbox ${(kimMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(
    `milk master unchanged · bbox ${(milkMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review source retained: ${v1Abs}`);
  console.log(`Registry: ${PATHS.approvedMastersJson}`);
  console.log('nextPilot: lunchbox (prompt only · generation NOT approved)');

  return { ok: true };
}
