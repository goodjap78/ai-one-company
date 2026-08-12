/**
 * Sprint 56-A.3 — approve cup_ramen_v15 as locked master; archive v1/v2 to history.
 */
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng } from './analyzeIngredientPng';
import {
  CUP_RAMEN_APPROVED_MASTER,
  HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
} from './convenienceIconStyleLock';
import {
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V15_FILE,
  CUP_RAMEN_V2_FILE,
  PATHS,
} from './config';

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

export function approveCupRamenMaster(): { ok: boolean; error?: string } {
  const v15Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE);
  if (!fs.existsSync(v15Abs)) {
    return { ok: false, error: `Missing review file ${CUP_RAMEN_V15_FILE}` };
  }

  const v1Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);
  const v2Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE);

  copyFile(v15Abs, PATHS.cupRamenMaster);

  if (fs.existsSync(v1Abs)) {
    copyFile(v1Abs, path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V1_FILE));
  }
  if (fs.existsSync(v2Abs)) {
    copyFile(v2Abs, path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V2_FILE));
  }

  const masterMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');

  const approved = {
    styleVersion: HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION,
    approvedAt: new Date().toISOString(),
    masters: {
      cup_ramen: {
        ...CUP_RAMEN_APPROVED_MASTER,
        masterAbsolutePath: PATHS.cupRamenMaster,
        measuredMetrics: {
          bboxAreaPct: Number((masterMetrics.bboxAreaRatio * 100).toFixed(1)),
          backgroundRgb: masterMetrics.backgroundRgb,
          backgroundPolicy: masterMetrics.backgroundPolicy,
          paddingTopPct: Number(masterMetrics.paddingTopPct.toFixed(1)),
          paddingBottomPct: Number(masterMetrics.paddingBottomPct.toFixed(1)),
          fileBytes: masterMetrics.fileBytes,
        },
      },
    },
    nextPilot: {
      iconKey: 'cup_rice',
      promptOnly: true,
      generationApproved: false,
    },
    productionWired: false,
    registryWired: false,
    uiWired: false,
  };

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.approvedMastersJson, JSON.stringify(approved, null, 2), 'utf8');

  console.log(`Approved master: ${PATHS.cupRamenMaster}`);
  console.log(
    `bbox ${(masterMetrics.bboxAreaRatio * 100).toFixed(1)}% · bg rgb(${masterMetrics.backgroundRgb.r},${masterMetrics.backgroundRgb.g},${masterMetrics.backgroundRgb.b})`,
  );
  if (fs.existsSync(path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V1_FILE))) {
    console.log(`History v1: ${path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V1_FILE)}`);
  }
  if (fs.existsSync(path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V2_FILE))) {
    console.log(`History v2: ${path.join(PATHS.cupRamenHistoryDir, CUP_RAMEN_V2_FILE)}`);
  }
  console.log(`Registry: ${PATHS.approvedMastersJson}`);

  return { ok: true };
}
