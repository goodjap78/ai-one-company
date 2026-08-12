/**
 * Sprint 56-B.2 — approve cup_rice_v11 as second master; archive v1 to history.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng } from './analyzeIngredientPng';
import {
  CUP_RAMEN_APPROVED_MASTER,
  CUP_RICE_APPROVED_MASTER,
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import {
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  PATHS,
} from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function approveCupRiceMaster(): { ok: boolean; error?: string } {
  const v11Abs = path.join(PATHS.reviewDir, CUP_RICE_V11_FILE);
  if (!fs.existsSync(v11Abs)) {
    return { ok: false, error: `Missing review file ${CUP_RICE_V11_FILE}` };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return { ok: false, error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}` };
  }

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);

  const v1Abs = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);
  copyFile(v11Abs, PATHS.cupRiceMaster);

  if (fs.existsSync(v1Abs)) {
    copyFile(v1Abs, path.join(PATHS.cupRiceHistoryDir, CUP_RICE_V1_FILE));
  }

  const ramenHashAfter = sha256File(PATHS.cupRamenMaster);
  if (ramenHashBefore !== ramenHashAfter) {
    return { ok: false, error: 'cup_ramen master changed unexpectedly' };
  }

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');

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
    },
    nextPilot: {
      iconKey: 'triangle_kimbap',
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

  console.log(`Approved master: ${PATHS.cupRiceMaster}`);
  console.log(
    `cup_rice bbox ${(riceMetrics.bboxAreaRatio * 100).toFixed(1)}% · bg rgb(${riceMetrics.backgroundRgb.r},${riceMetrics.backgroundRgb.g},${riceMetrics.backgroundRgb.b})`,
  );
  console.log(
    `cup_ramen master unchanged · bbox ${(ramenMetrics.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  if (fs.existsSync(path.join(PATHS.cupRiceHistoryDir, CUP_RICE_V1_FILE))) {
    console.log(`History v1: ${path.join(PATHS.cupRiceHistoryDir, CUP_RICE_V1_FILE)}`);
  }
  console.log(`Registry: ${PATHS.approvedMastersJson}`);

  return { ok: true };
}
