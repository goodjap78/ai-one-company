/**
 * Sprint 56-D.1 — write salad pilot prompt only (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSaladPilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { SALAD_NEXT_PILOT } from './convenienceIconStyleLock';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

export function prepareSaladPilotPrompt(): {
  ok: boolean;
  promptPath?: string;
  error?: string;
} {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildSaladPilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });

  const md = [
    '# salad pilot prompt (PREPARED — DO NOT GENERATE)',
    '',
    `> Status: **prompt only** · generation **NOT approved** (Sprint 56-D.1)`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| iconKey | \`salad\` |`,
    `| Korean name | 샐러드 |`,
    `| generationApproved | false |`,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(PATHS.saladPilotPrompt, md, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`salad pilot prompt written: ${PATHS.saladPilotPrompt}`);
  console.log(`iconKey: ${SALAD_NEXT_PILOT.iconKey} · generationApproved: false`);
  console.log('Image generation: BLOCKED until explicit approval');

  return { ok: true, promptPath: PATHS.saladPilotPrompt };
}
