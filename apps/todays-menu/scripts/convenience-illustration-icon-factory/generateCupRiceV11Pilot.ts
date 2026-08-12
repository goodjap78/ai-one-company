/**
 * Sprint 56-B.1 — cup_rice v1.1 via programmatic scale from v1 (design preserved).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeIngredientPng } from './analyzeIngredientPng';
import { CUP_RICE_V11_GENERATION } from './convenienceIconStyleLock';
import {
  CUP_RICE_PILOT_ICON_KEY,
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  PATHS,
} from './config';
import { scaleCupRiceV11Auto } from './scaleCupRiceV11FromV1';

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export async function generateCupRiceV11Pilot(): Promise<{
  ok: boolean;
  cupRiceV11Path?: string;
  linearScale?: number;
  bboxPct?: number;
  error?: string;
}> {
  if (CUP_RICE_V11_GENERATION.approvedSprint !== '56-B.1') {
    return { ok: false, error: 'cup_rice v1.1 generation not approved for this sprint' };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return { ok: false, error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}` };
  }

  const v1Abs = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);
  if (!fs.existsSync(v1Abs)) {
    return { ok: false, error: `Missing ${CUP_RICE_V1_FILE}` };
  }

  const masterHashBefore = sha256File(PATHS.cupRamenMaster);
  const v1HashBefore = sha256File(v1Abs);

  const v11Abs = path.join(PATHS.reviewDir, CUP_RICE_V11_FILE);
  if (fs.existsSync(v11Abs)) {
    fs.unlinkSync(v11Abs);
  }

  console.log('Scaling cup_rice v1 → v1.1 (programmatic, design lock)…');

  const scaled = scaleCupRiceV11Auto();
  if (!scaled.ok) {
    return { ok: false, error: scaled.error ?? 'scale failed' };
  }

  const masterHashAfter = sha256File(PATHS.cupRamenMaster);
  const v1HashAfter = sha256File(v1Abs);
  if (masterHashBefore !== masterHashAfter) {
    return { ok: false, error: 'cup_ramen master changed' };
  }
  if (v1HashBefore !== v1HashAfter) {
    return { ok: false, error: 'cup_rice_v1 changed' };
  }

  const assetKey = CUP_RICE_V11_GENERATION.allowedAssetKey;
  if (assetKey !== `${CUP_RICE_PILOT_ICON_KEY}_v11`) {
    return { ok: false, error: `asset key gate failed: ${assetKey}` };
  }

  const ramenM = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const v1m = analyzeIngredientPng(v1Abs, 'cup_rice_v1');
  const v11m = analyzeIngredientPng(scaled.v11Path!, 'cup_rice_v11');

  console.log(
    `scale ${scaled.linearScale}x · master bbox ${(ramenM.bboxAreaRatio * 100).toFixed(1)}% · v1 ${(v1m.bboxAreaRatio * 100).toFixed(1)}% · v1.1 ${(v11m.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review PNG v1.1: ${scaled.v11Path}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return {
    ok: true,
    cupRiceV11Path: scaled.v11Path,
    linearScale: scaled.linearScale,
    bboxPct: scaled.bboxPct,
  };
}
