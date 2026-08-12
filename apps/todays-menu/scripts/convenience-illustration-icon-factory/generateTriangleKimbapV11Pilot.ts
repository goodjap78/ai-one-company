/**
 * Sprint 56-C.2 — triangle_kimbap v1.1 review PNG (bottom/side seaweed wrap).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  createImageProvider,
  getProviderEnv,
  saveImageFile,
} from '../image-factory/engine';
import {
  checkProviderGate,
  printProviderNotConfigured,
} from '../image-factory/providerGate';
import { INGREDIENT_IMAGE_SPEC } from '../ingredient-factory/config';
import {
  buildTriangleKimbapV11Prompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import {
  TRIANGLE_KIMBAP_NEXT_PILOT,
  TRIANGLE_KIMBAP_V11_GENERATION,
} from './convenienceIconStyleLock';
import {
  TRIANGLE_KIMBAP_PILOT_ICON_KEY,
  TRIANGLE_KIMBAP_V11_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writeTriangleKimbapV11ReviewHtml } from './writeReviewHtml';
import { scaleReviewPngToBbox } from './scaleReviewPngCenter';

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export async function generateTriangleKimbapV11Pilot(): Promise<{
  ok: boolean;
  triangleKimbapV11Path?: string;
  error?: string;
}> {
  if (TRIANGLE_KIMBAP_V11_GENERATION.approvedSprint !== '56-C.2') {
    return { ok: false, error: 'triangle_kimbap v1.1 generation not approved for this sprint' };
  }

  if (fs.existsSync(PATHS.triangleKimbapMaster)) {
    return {
      ok: false,
      error: 'triangle_kimbap production master still exists — run rollback first',
    };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return { ok: false, error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}` };
  }
  if (!fs.existsSync(PATHS.cupRiceMaster)) {
    return { ok: false, error: `Missing cup_rice master at ${PATHS.cupRiceMaster}` };
  }

  const ramenHashBefore = sha256File(PATHS.cupRamenMaster);
  const riceHashBefore = sha256File(PATHS.cupRiceMaster);

  const outAbs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V11_FILE);
  if (fs.existsSync(outAbs)) {
    return {
      ok: false,
      error: `${TRIANGLE_KIMBAP_V11_FILE} already exists — delete manually to regenerate`,
    };
  }

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildTriangleKimbapV11Prompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(
    PATHS.triangleKimbapV11Prompt,
    `# triangle_kimbap v1.1 pilot prompt (Sprint 56-C.2)\n\n${prompt}\n`,
    'utf8',
  );
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  if (!gate.ready) {
    printProviderNotConfigured(gate);
    return { ok: false, error: gate.status };
  }

  const assetKey = TRIANGLE_KIMBAP_V11_GENERATION.allowedAssetKey;
  if (assetKey !== `${TRIANGLE_KIMBAP_PILOT_ICON_KEY}_v11`) {
    return { ok: false, error: `asset key gate failed: ${assetKey}` };
  }

  const provider = createImageProvider(env);
  console.log(`Generating ${TRIANGLE_KIMBAP_V11_FILE} via ${provider.name} (Sprint 56-C.2)…`);

  const result = await provider.generateImage({
    assetKey,
    subject: TRIANGLE_KIMBAP_NEXT_PILOT.koreanName,
    prompt,
    width: INGREDIENT_IMAGE_SPEC.width,
    height: INGREDIENT_IMAGE_SPEC.height,
    format: INGREDIENT_IMAGE_SPEC.format,
  });

  if (!result.bytes?.length) {
    return { ok: false, error: 'empty image bytes' };
  }

  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const saved = saveImageFile({
    bytes: Buffer.from(result.bytes),
    absolutePath: outAbs,
    force: true,
  });
  if (saved.status === 'error') {
    return { ok: false, error: saved.error };
  }

  if (sha256File(PATHS.cupRamenMaster) !== ramenHashBefore) {
    return { ok: false, error: 'cup_ramen master changed during generation' };
  }
  if (sha256File(PATHS.cupRiceMaster) !== riceHashBefore) {
    return { ok: false, error: 'cup_rice master changed during generation' };
  }

  const scaled = scaleReviewPngToBbox(
    outAbs,
    'triangle_kimbap_v11',
    TRIANGLE_KIMBAP_V11_GENERATION.targetBboxMinPct,
    TRIANGLE_KIMBAP_V11_GENERATION.targetBboxMaxPct,
  );
  console.log(`Scaled triangle_kimbap v1.1 ${scaled.linearScale}x → bbox ${scaled.bboxPct}%`);

  writeTriangleKimbapV11ReviewHtml({ profile });

  const ramenM = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceM = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const v11M = analyzeIngredientPng(outAbs, 'triangle_kimbap_v11');
  console.log(
    `ramen bbox ${(ramenM.bboxAreaRatio * 100).toFixed(1)}% · rice bbox ${(riceM.bboxAreaRatio * 100).toFixed(1)}% · v1.1 bbox ${(v11M.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review PNG: ${outAbs}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return { ok: true, triangleKimbapV11Path: outAbs };
}
