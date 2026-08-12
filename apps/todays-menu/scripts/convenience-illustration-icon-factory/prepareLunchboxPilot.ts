/**
 * Sprint 56-E.1 — write lunchbox pilot prompt only (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildLunchboxPilotPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { LUNCHBOX_NEXT_PILOT } from './convenienceIconStyleLock';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

export function prepareLunchboxPilotPrompt(): {
  ok: boolean;
  promptPath?: string;
  error?: string;
} {
  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  const prompt = buildLunchboxPilotPrompt(profile);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });

  const md = [
    '# lunchbox pilot prompt (PREPARED — DO NOT GENERATE)',
    '',
    `> Status: **prompt only** · generation **NOT approved** (Sprint 56-E.1)`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| iconKey | \`lunchbox\` |`,
    `| Korean name | 도시락 |`,
    `| generationApproved | false |`,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(PATHS.lunchboxPilotPrompt, md, 'utf8');
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`lunchbox pilot prompt written: ${PATHS.lunchboxPilotPrompt}`);
  console.log(`iconKey: ${LUNCHBOX_NEXT_PILOT.iconKey} · generationApproved: false`);
  console.log('Image generation: BLOCKED until explicit approval');

  return { ok: true, promptPath: PATHS.lunchboxPilotPrompt };
}
