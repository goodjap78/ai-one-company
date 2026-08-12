/**
 * Sprint 56-A.1 — regenerate simplified cup_ramen v2 (one shot); preserve v1.
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
  buildCupRamenSimplifiedPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import {
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V2_FILE,
  PATHS,
  PILOT_ICON_KEY,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writePilotReviewHtml } from './writeReviewHtml';

function archiveV1IfNeeded(): string {
  const v1Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);
  const legacyAbs = path.join(PATHS.reviewDir, `${PILOT_ICON_KEY}.png`);

  if (fs.existsSync(v1Abs)) {
    return v1Abs;
  }
  if (fs.existsSync(legacyAbs)) {
    fs.mkdirSync(PATHS.reviewDir, { recursive: true });
    fs.copyFileSync(legacyAbs, v1Abs);
    console.log(`Archived legacy review → ${CUP_RAMEN_V1_FILE}`);
    return v1Abs;
  }
  throw new Error(
    `Missing ${CUP_RAMEN_V1_FILE} and ${PILOT_ICON_KEY}.png — run convenience-icon:generate-pilot first`,
  );
}

export async function generateCupRamenSimplifiedPilot(): Promise<{
  ok: boolean;
  v1Path?: string;
  v2Path?: string;
  error?: string;
}> {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildCupRamenSimplifiedPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(PATHS.cupRamenV2Prompt, `# cup_ramen v2 simplified prompt\n\n${prompt}\n`, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  const v1Abs = archiveV1IfNeeded();
  const v2Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE);

  if (fs.existsSync(v2Abs)) {
    return { ok: false, error: 'cup_ramen_v2.png already exists — delete manually to regenerate' };
  }

  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  if (!gate.ready) {
    printProviderNotConfigured(gate);
    return { ok: false, error: gate.status };
  }

  const provider = createImageProvider(env);
  console.log(`Generating ${CUP_RAMEN_V2_FILE} (simplified) via ${provider.name}…`);

  const result = await provider.generateImage({
    assetKey: `${PILOT_ICON_KEY}_v2`,
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
    absolutePath: v2Abs,
    force: true,
  });
  if (saved.status === 'error') {
    return { ok: false, error: saved.error };
  }

  // Remove legacy single filename so review dir stays v1+v2 only
  const legacyAbs = path.join(PATHS.reviewDir, `${PILOT_ICON_KEY}.png`);
  if (fs.existsSync(legacyAbs)) {
    fs.unlinkSync(legacyAbs);
  }

  writePilotReviewHtml({
    profile,
    v1Abs,
    v2Abs,
  });

  const v1m = analyzeIngredientPng(v1Abs, 'cup_ramen_v1');
  const v2m = analyzeIngredientPng(v2Abs, 'cup_ramen_v2');
  console.log(
    `v1 bbox ${(v1m.bboxAreaRatio * 100).toFixed(1)}% · v2 bbox ${(v2m.bboxAreaRatio * 100).toFixed(1)}%`,
  );
  console.log(`Review PNG v1: ${v1Abs}`);
  console.log(`Review PNG v2: ${v2Abs}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);

  return { ok: true, v1Path: v1Abs, v2Path: v2Abs };
}
