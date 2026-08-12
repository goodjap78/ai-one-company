/**
 * Sprint 56-B — cup_rice pilot review PNG (one shot, Style Lock v1.0).
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
  buildCupRicePilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import {
  CUP_RICE_PILOT_GENERATION,
  CUP_RICE_NEXT_PILOT,
} from './convenienceIconStyleLock';
import {
  CUP_RICE_PILOT_ICON_KEY,
  CUP_RICE_V1_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writeConveniencePilotReviewHtml } from './writeReviewHtml';

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export async function generateCupRicePilot(): Promise<{
  ok: boolean;
  cupRicePath?: string;
  error?: string;
}> {
  if (CUP_RICE_PILOT_GENERATION.approvedSprint !== '56-B') {
    return { ok: false, error: 'cup_rice generation not approved for this sprint' };
  }

  if (!fs.existsSync(PATHS.cupRamenMaster)) {
    return {
      ok: false,
      error: `Missing cup_ramen master at ${PATHS.cupRamenMaster}`,
    };
  }

  const masterHashBefore = sha256File(PATHS.cupRamenMaster);

  const cupRiceAbs = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);
  if (fs.existsSync(cupRiceAbs)) {
    return {
      ok: false,
      error: `${CUP_RICE_V1_FILE} already exists — delete manually to regenerate`,
    };
  }

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildCupRicePilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(
    PATHS.cupRiceV1Prompt,
    `# cup_rice v1 pilot prompt (Sprint 56-B)\n\n${prompt}\n`,
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

  const provider = createImageProvider(env);
  const assetKey = CUP_RICE_PILOT_GENERATION.allowedAssetKey;

  if (assetKey !== `${CUP_RICE_PILOT_ICON_KEY}_v1`) {
    return { ok: false, error: `asset key gate failed: ${assetKey}` };
  }

  console.log(`Generating ${CUP_RICE_V1_FILE} via ${provider.name} (Sprint 56-B only)…`);

  const result = await provider.generateImage({
    assetKey,
    subject: CUP_RICE_NEXT_PILOT.koreanName,
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
    absolutePath: cupRiceAbs,
    force: true,
  });
  if (saved.status === 'error') {
    return { ok: false, error: saved.error };
  }

  const masterHashAfter = sha256File(PATHS.cupRamenMaster);
  if (masterHashBefore !== masterHashAfter) {
    return { ok: false, error: 'cup_ramen master file changed during generation' };
  }

  writeConveniencePilotReviewHtml({
    profile,
    cupRiceV1Abs: cupRiceAbs,
  });

  const ramenM = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const riceM = analyzeIngredientPng(cupRiceAbs, 'cup_rice_v1');
  console.log(
    `master bbox ${(ramenM.bboxAreaRatio * 100).toFixed(1)}% · cup_rice bbox ${(riceM.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review PNG: ${cupRiceAbs}`);
  console.log(`Master unchanged: ${PATHS.cupRamenMaster}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return { ok: true, cupRicePath: cupRiceAbs };
}
