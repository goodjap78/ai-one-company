/**
 * Sprint 56-C.1 — write milk pilot prompt only (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildMilkPilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { MILK_NEXT_PILOT } from './convenienceIconStyleLock';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

export function prepareMilkPilotPrompt(): {
  ok: boolean;
  promptPath?: string;
  error?: string;
} {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildMilkPilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });

  const md = [
    '# milk pilot prompt (PREPARED — DO NOT GENERATE)',
    '',
    `> Status: **prompt only** · generation **NOT approved** (Sprint 56-C.1)`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| iconKey | \`milk\` |`,
    `| Korean name | 우유 |`,
    `| generationApproved | false |`,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(PATHS.milkPilotPrompt, md, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`milk pilot prompt written: ${PATHS.milkPilotPrompt}`);
  console.log(`iconKey: ${MILK_NEXT_PILOT.iconKey} · generationApproved: false`);
  console.log('Image generation: BLOCKED until explicit approval');

  return { ok: true, promptPath: PATHS.milkPilotPrompt };
}
