/**
 * Generate cup_ramen pilot review PNG only (Sprint 56-A).
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
  buildCupRamenPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { PATHS, PILOT_ICON_KEY, REFERENCE_INGREDIENT_KEYS, CUP_RAMEN_V1_FILE } from './config';
import { writePilotReviewHtml } from './writeReviewHtml';

export async function generateCupRamenPilot(): Promise<{
  ok: boolean;
  reviewPath?: string;
  error?: string;
}> {
  const metrics = analyzeReferenceSet(
    PATHS.ingredientsDir,
    [...REFERENCE_INGREDIENT_KEYS],
  );
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildCupRamenPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(
    PATHS.cupRamenPrompt,
    `# cup_ramen pilot prompt\n\n${prompt}\n`,
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
  const reviewAbs = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);

  console.log(`Generating ${PILOT_ICON_KEY} review via ${provider.name}…`);
  const result = await provider.generateImage({
    assetKey: PILOT_ICON_KEY,
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
    absolutePath: reviewAbs,
    force: true,
  });
  if (saved.status === 'error') {
    return { ok: false, error: saved.error };
  }
  writePilotReviewHtml({ profile, v1Abs: reviewAbs });

  console.log(`Review PNG: ${reviewAbs}`);
  console.log(`Review HTML: ${PATHS.reviewIndex}`);
  return { ok: true, reviewPath: reviewAbs };
}
