/**
 * Sprint 56-A.3 — write cup_rice pilot prompt only (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildCupRicePilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { CUP_RICE_NEXT_PILOT } from './convenienceIconStyleLock';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

export function prepareCupRicePilotPrompt(): { ok: boolean; promptPath?: string; error?: string } {
  if (!CUP_RICE_NEXT_PILOT.generationApproved) {
    // Expected — generation remains blocked until explicit approval sprint.
  }

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildCupRicePilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });

  const md = [
    '# cup_rice pilot prompt (PREPARED — DO NOT GENERATE)',
    '',
    `> Status: **prompt only** · generation **NOT approved** (Sprint 56-A.3)`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| iconKey | \`cup_rice\` |`,
    `| Korean name | 컵밥 |`,
    `| generationApproved | false |`,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(PATHS.cupRicePilotPrompt, md, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`cup_rice pilot prompt written: ${PATHS.cupRicePilotPrompt}`);
  console.log('Image generation: BLOCKED until explicit approval');

  return { ok: true, promptPath: PATHS.cupRicePilotPrompt };
}
