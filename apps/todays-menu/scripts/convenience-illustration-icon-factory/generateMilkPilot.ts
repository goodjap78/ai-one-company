/**
 * Sprint 56-D — milk v1 pilot review PNG (Style Lock v1.0).
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
  buildMilkPilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import { MILK_NEXT_PILOT, MILK_PILOT_GENERATION } from './convenienceIconStyleLock';
import {
  MILK_PILOT_ICON_KEY,
  MILK_V1_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writeMilkPilotReviewHtml } from './writeReviewHtml';
import { scaleReviewPngToBbox } from './scaleReviewPngCenter';

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export async function generateMilkPilot(): Promise<{
  ok: boolean;
  milkPath?: string;
  error?: string;
}> {
  if (MILK_PILOT_GENERATION.approvedSprint !== '56-D') {
    return { ok: false, error: 'milk generation not approved for this sprint' };
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

  const outAbs = path.join(PATHS.reviewDir, MILK_V1_FILE);
  if (fs.existsSync(outAbs)) {
    return {
      ok: false,
      error: `${MILK_V1_FILE} already exists — delete manually to regenerate`,
    };
  }

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildMilkPilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(
    PATHS.milkV1Prompt,
    `# milk v1 pilot prompt (Sprint 56-D)\n\n${prompt}\n`,
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

  const assetKey = MILK_PILOT_GENERATION.allowedAssetKey;
  if (assetKey !== `${MILK_PILOT_ICON_KEY}_v1`) {
    return { ok: false, error: `asset key gate failed: ${assetKey}` };
  }

  const provider = createImageProvider(env);
  console.log(`Generating ${MILK_V1_FILE} via ${provider.name} (Sprint 56-D only)…`);

  const result = await provider.generateImage({
    assetKey,
    subject: MILK_NEXT_PILOT.koreanName,
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
  if (sha256File(PATHS.triangleKimbapMaster) !== kimHashBefore) {
    return { ok: false, error: 'triangle_kimbap master changed during generation' };
  }

  const scaled = scaleReviewPngToBbox(
    outAbs,
    'milk_v1',
    MILK_PILOT_GENERATION.targetBboxMinPct,
    MILK_PILOT_GENERATION.targetBboxMaxPct,
  );
  console.log(`Scaled milk ${scaled.linearScale}x → bbox ${scaled.bboxPct}%`);

  writeMilkPilotReviewHtml({ profile });

  const ramenM = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceM = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const kimM = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const milkM = analyzeIngredientPng(outAbs, 'milk_v1');
  console.log(
    `ramen bbox ${(ramenM.bboxAreaRatio * 100).toFixed(1)}% · rice bbox ${(riceM.bboxAreaRatio * 100).toFixed(1)}% · triangle bbox ${(kimM.bboxAreaRatio * 100).toFixed(1)}% · milk bbox ${(milkM.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review PNG: ${outAbs}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return { ok: true, milkPath: outAbs };
}
