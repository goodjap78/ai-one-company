/**
 * Sprint 56-C.4 — approve triangle_kimbap_v12 as third master; preserve cup_ramen/cup_rice.
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
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import { buildRenderProfileFromMetrics } from './convenienceIconRenderProfile';
import { writeApprovedMastersReviewHtml } from './writeReviewHtml';
import { prepareMilkPilotPrompt } from './prepareMilkPilot';
import {
  TRIANGLE_KIMBAP_V12_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function approveTriangleKimbapV12Master(): { ok: boolean; error?: string } {
  const v12Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V12_FILE);
  if (!fs.existsSync(v12Abs)) {
    return { ok: false, error: `Missing review file ${TRIANGLE_KIMBAP_V12_FILE}` };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return { ok: false, error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}` };
  }
  if (!fs.existsSync(PATHS.cupRiceMaster)) {
    return { ok: false, error: `Missing cup_rice master at ${PATHS.cupRiceMaster}` };
  }

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);
  const riceHashBefore = sha256File(PATHS.cupRiceMaster);

  copyFile(v12Abs, PATHS.triangleKimbapMaster);

  const ramenHashAfter = sha256File(PATHS.cupRamenMaster);
  const riceHashAfter = sha256File(PATHS.cupRiceMaster);
  if (ramenHashBefore !== ramenHashAfter) {
    return { ok: false, error: 'cup_ramen master changed unexpectedly' };
  }
  if (riceHashBefore !== riceHashAfter) {
    return { ok: false, error: 'cup_rice master changed unexpectedly' };
  }

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');

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
    },
    rejectedMasters: {
      triangle_kimbap_v1: TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
      triangle_kimbap_v11: TRIANGLE_KIMBAP_V11_REJECTED,
    },
    nextPilot: {
      iconKey: 'milk',
      promptOnly: true,
      generationApproved: false,
    },
    milkPilot: {
      iconKey: 'milk',
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

  const milkPrep = prepareMilkPilotPrompt();
  if (!milkPrep.ok) {
    return { ok: false, error: milkPrep.error ?? 'milk pilot prompt preparation failed' };
  }

  console.log(`Approved master: ${PATHS.triangleKimbapMaster}`);
  console.log(
    `triangle_kimbap bbox ${(kimMetrics.bboxAreaRatio * 100).toFixed(1)}% · bg rgb(${kimMetrics.backgroundRgb.r},${kimMetrics.backgroundRgb.g},${kimMetrics.backgroundRgb.b})`,
  );
  console.log(
    `cup_ramen master unchanged · bbox ${(ramenMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(
    `cup_rice master unchanged · bbox ${(riceMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review source retained: ${v12Abs}`);
  console.log(`Registry: ${PATHS.approvedMastersJson}`);

  return { ok: true };
}
