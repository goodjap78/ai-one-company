/**
 * Sprint 56-A.2 — v1 master + trimmed lid/noodles → cup_ramen_v15 (one shot).
 */
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
  buildCupRamenV15Prompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import {
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V15_FILE,
  CUP_RAMEN_V2_FILE,
  PATHS,
  PILOT_ICON_KEY,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writePilotReviewHtml } from './writeReviewHtml';

export async function generateCupRamenV15Pilot(): Promise<{
  ok: boolean;
  v1Path?: string;
  v15Path?: string;
  v2Path?: string;
  error?: string;
}> {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildCupRamenV15Prompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(
    PATHS.cupRamenV15Prompt,
    `# cup_ramen v1.5 final candidate prompt\n\n${prompt}\n`,
    'utf8',
  );
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  const v1Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);
  if (!fs.existsSync(v1Abs)) {
    return {
      ok: false,
      error: `Missing ${CUP_RAMEN_V1_FILE} — run convenience-icon:generate-pilot first`,
    };
  }

  const v15Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE);
  if (fs.existsSync(v15Abs)) {
    return {
      ok: false,
      error: 'cup_ramen_v15.png already exists — delete manually to regenerate',
    };
  }

  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  if (!gate.ready) {
    printProviderNotConfigured(gate);
    return { ok: false, error: gate.status };
  }

  const provider = createImageProvider(env);
  console.log(`Generating ${CUP_RAMEN_V15_FILE} (v1 master trim) via ${provider.name}…`);

  const result = await provider.generateImage({
    assetKey: `${PILOT_ICON_KEY}_v15`,
    subject: '컵라면',
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
    absolutePath: v15Abs,
    force: true,
  });
  if (saved.status === 'error') {
    return { ok: false, error: saved.error };
  }

  const v2Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE);
  writePilotReviewHtml({
    profile,
    v1Abs,
    v15Abs,
    v2Abs: fs.existsSync(v2Abs) ? v2Abs : undefined,
  });

  const v1m = analyzeIngredientPng(v1Abs, 'cup_ramen_v1');
  const v15m = analyzeIngredientPng(v15Abs, 'cup_ramen_v15');
  let bboxLog = `v1 bbox ${(v1m.bboxAreaRatio * 100).toFixed(1)}% · v1.5 bbox ${(v15m.bboxAreaRatio * 100).toFixed(1)}%`;
  if (fs.existsSync(v2Abs)) {
    const v2m = analyzeIngredientPng(v2Abs, 'cup_ramen_v2');
    bboxLog += ` · v2 bbox ${(v2m.bboxAreaRatio * 100).toFixed(1)}%`;
  }
  console.log(bboxLog);
  console.log(`Review PNG v1: ${v1Abs}`);
  console.log(`Review PNG v1.5: ${v15Abs}`);
  if (fs.existsSync(v2Abs)) {
    console.log(`Review PNG v2: ${v2Abs}`);
  }
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return {
    ok: true,
    v1Path: v1Abs,
    v15Path: v15Abs,
    v2Path: fs.existsSync(v2Abs) ? v2Abs : undefined,
  };
}
