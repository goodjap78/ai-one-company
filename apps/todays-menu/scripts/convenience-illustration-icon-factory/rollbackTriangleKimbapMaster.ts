/**
 * Sprint 56-C.2 — rollback wrong triangle_kimbap v1 master approval.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng } from './analyzeIngredientPng';
import {
  CUP_RAMEN_APPROVED_MASTER,
  CUP_RICE_APPROVED_MASTER,
  TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import {
  TRIANGLE_KIMBAP_V1_FILE,
  PATHS,
} from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function rollbackTriangleKimbapMaster(): { ok: boolean; error?: string } {
  const v1ReviewAbs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V1_FILE);
  const v1HistoryAbs = path.join(PATHS.triangleKimbapHistoryDir, TRIANGLE_KIMBAP_V1_FILE);

  if (!fs.existsSync(PATHS.cupRamenMaster) || !fs.existsSync(PATHS.cupRiceMaster)) {
    return { ok: false, error: 'Missing cup_ramen or cup_rice master' };
  }

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);
  const riceHashBefore = sha256File(PATHS.cupRiceMaster);

  if (fs.existsSync(v1ReviewAbs)) {
    copyFile(v1ReviewAbs, v1HistoryAbs);
    fs.unlinkSync(v1ReviewAbs);
  } else if (!fs.existsSync(v1HistoryAbs)) {
    return {
      ok: false,
      error: `Missing ${TRIANGLE_KIMBAP_V1_FILE} in review and history`,
    };
  }

  if (fs.existsSync(PATHS.triangleKimbapMaster)) {
    fs.unlinkSync(PATHS.triangleKimbapMaster);
  }

  const ramenHashAfter = sha256File(PATHS.cupRamenMaster);
  const riceHashAfter = sha256File(PATHS.cupRiceMaster);
  if (ramenHashBefore !== ramenHashAfter || riceHashBefore !== riceHashAfter) {
    return { ok: false, error: 'cup_ramen or cup_rice master changed unexpectedly' };
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
    rejectedMasters: {
      triangle_kimbap_v1: TRIANGLE_KIMBAP_V1_REJECTED_MASTER,
    },
    nextPilot: {
      iconKey: 'triangle_kimbap',
      reviewFile: 'triangle_kimbap_v11.png',
      generationApproved: true,
      note: 'v1.1 bottom/side seaweed wrap — v1 master approval reverted',
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
    rollbackFrom: '56-C.1 triangle_kimbap v1 master',
  };

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.approvedMastersJson, JSON.stringify(approved, null, 2), 'utf8');

  console.log(`Archived v1: ${v1HistoryAbs}`);
  console.log('Removed masters/triangle_kimbap.png (if existed)');
  console.log(`Approved masters restored to 2 · Registry: ${PATHS.approvedMastersJson}`);
  console.log('nextPilot: triangle_kimbap_v11 · milk generation still blocked');

  return { ok: true };
}
