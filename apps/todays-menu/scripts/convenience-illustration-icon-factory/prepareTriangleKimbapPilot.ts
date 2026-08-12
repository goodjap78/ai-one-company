/**
 * Sprint 56-B.2 — write triangle_kimbap pilot prompt only (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildTriangleKimbapPilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { TRIANGLE_KIMBAP_NEXT_PILOT } from './convenienceIconStyleLock';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

export function prepareTriangleKimbapPilotPrompt(): {
  ok: boolean;
  promptPath?: string;
  error?: string;
} {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildTriangleKimbapPilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });

  const md = [
    '# triangle_kimbap pilot prompt (PREPARED — DO NOT GENERATE)',
    '',
    `> Status: **prompt only** · generation **NOT approved** (Sprint 56-B.2)`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| iconKey | \`triangle_kimbap\` |`,
    `| Korean name | 삼각김밥 |`,
    `| generationApproved | false |`,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(PATHS.triangleKimbapPilotPrompt, md, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`triangle_kimbap pilot prompt written: ${PATHS.triangleKimbapPilotPrompt}`);
  console.log('Image generation: BLOCKED until explicit approval');

  return { ok: true, promptPath: PATHS.triangleKimbapPilotPrompt };
}
