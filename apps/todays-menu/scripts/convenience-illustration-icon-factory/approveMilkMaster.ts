/**
 * Sprint 56-D.1 — approve milk_v1 as fourth master; preserve cup_ramen/cup_rice/triangle_kimbap.
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
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import { buildRenderProfileFromMetrics } from './convenienceIconRenderProfile';
import { writeApprovedMastersReviewHtml } from './writeReviewHtml';
import { prepareSaladPilotPrompt } from './prepareSaladPilot';
import { MILK_V1_FILE, PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function approveMilkMaster(): { ok: boolean; error?: string } {
  const v1Abs = path.join(PATHS.reviewDir, MILK_V1_FILE);
  if (!fs.existsSync(v1Abs)) {
    return { ok: false, error: `Missing review file ${MILK_V1_FILE}` };
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

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);
  const riceHashBefore = sha256File(PATHS.cupRiceMaster);
  const kimHashBefore = sha256File(PATHS.triangleKimbapMaster);

  copyFile(v1Abs, PATHS.milkMaster);

  const ramenHashAfter = sha256File(PATHS.cupRamenMaster);
  const riceHashAfter = sha256File(PATHS.cupRiceMaster);
  const kimHashAfter = sha256File(PATHS.triangleKimbapMaster);
  if (ramenHashBefore !== ramenHashAfter) {
    return { ok: false, error: 'cup_ramen master changed unexpectedly' };
  }
  if (riceHashBefore !== riceHashAfter) {
    return { ok: false, error: 'cup_rice master changed unexpectedly' };
  }
  if (kimHashBefore !== kimHashAfter) {
    return { ok: false, error: 'triangle_kimbap master changed unexpectedly' };
  }

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const milkMetrics = analyzeIngredientPng(PATHS.milkMaster, 'milk_master');

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
    },
    rejectedMasters: {
      triangle_kimbap_v1: TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
      triangle_kimbap_v11: TRIANGLE_KIMBAP_V11_REJECTED,
    },
    nextPilot: {
      iconKey: 'salad',
      promptOnly: true,
      generationApproved: false,
    },
    saladPilot: {
      iconKey: 'salad',
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

  const saladPrep = prepareSaladPilotPrompt();
  if (!saladPrep.ok) {
    return { ok: false, error: saladPrep.error ?? 'salad pilot prompt preparation failed' };
  }

  console.log(`Approved master: ${PATHS.milkMaster}`);
  console.log(
    `milk bbox ${(milkMetrics.bboxAreaRatio * 100).toFixed(1)}% · bg rgb(${milkMetrics.backgroundRgb.r},${milkMetrics.backgroundRgb.g},${milkMetrics.backgroundRgb.b})`,
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
  console.log(`Review source retained: ${v1Abs}`);
  console.log(`Registry: ${PATHS.approvedMastersJson}`);
  console.log('nextPilot: salad (prompt only · generation NOT approved)');

  return { ok: true };
}
