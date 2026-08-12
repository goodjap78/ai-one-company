/**
 * Cooking-step photography prompts (16:9).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, STEP_IMAGE_SPEC } from './config';
import type { StepManifestEntry } from './types';

const STYLE = [
  'realistic Korean home cooking photography',
  'landscape 16:9',
  'warm natural kitchen lighting',
  'cookware and ingredients as the focus',
  'no text',
  'no labels',
  'no watermark',
  'no people',
  'avoid visible hands when possible',
  'realistic food texture',
  'avoid glossy AI-rendered appearance',
].join('; ');

function inferTool(instruction: string, title: string): string {
  const text = `${title} ${instruction}`.toLowerCase();
  if (/팬|볶|부|지짐|프라이/.test(text)) return 'frying pan / skillet';
  if (/냄비|끓|국|찌개|조림|삶/.test(text)) return 'sauce pot / stew pot';
  if (/볼|섞|버무|양념/.test(text)) return 'mixing bowl';
  if (/도마|썰|채썰|다진/.test(text)) return 'cutting board and knife';
  if (/오븐|구이|굽/.test(text)) return 'oven or grill setup';
  if (/전자레인지/.test(text)) return 'microwave-safe cookware';
  return 'typical Korean home kitchen cookware';
}

export function buildStepPromptText(entry: {
  recipeName: string;
  stepOrder: number;
  stepTitle: string;
  stepInstruction: string;
  imageKey: string;
  visibleIngredients: string[];
  notYetIngredients: string[];
}): string {
  const visible =
    entry.visibleIngredients.length > 0
      ? entry.visibleIngredients.join(', ')
      : 'only ingredients implied by this step';
  const notYet =
    entry.notYetIngredients.length > 0
      ? entry.notYetIngredients.join(', ')
      : 'none (final stages may include all)';
  const tool = inferTool(entry.stepInstruction, entry.stepTitle);

  return [
    `Korean home cooking photo for "${entry.recipeName}", step ${entry.stepOrder}: ${entry.stepTitle}.`,
    `What is happening now: ${entry.stepInstruction}`,
    `Ingredients that should be visible now: ${visible}.`,
    `Ingredients that must not appear yet: ${notYet}.`,
    `Cooking tool used: ${tool}.`,
    `Camera composition: ${STEP_IMAGE_SPEC.aspect} landscape, mid-shot of the cookware and food stage, appetizing depth of field, subject centered.`,
    `Shot requirements: ${STYLE}.`,
    `Output key: ${entry.imageKey}.jpg (${STEP_IMAGE_SPEC.width}x${STEP_IMAGE_SPEC.height}).`,
  ].join(' ');
}

export function writeStepPromptFile(entry: StepManifestEntry): string {
  fs.mkdirSync(PATHS.promptsDir, { recursive: true });
  const abs = path.join(PATHS.promptsDir, `${entry.imageKey}.md`);
  const prompt = buildStepPromptText(entry);
  const md = [
    `# Step Image Prompt — ${entry.recipeName} · step ${entry.stepOrder}`,
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| recipeId | \`${entry.recipeId}\` |`,
    `| imageKey | \`${entry.imageKey}\` |`,
    `| title | ${entry.stepTitle} |`,
    `| visible | ${entry.visibleIngredients.join(', ') || '—'} |`,
    `| not yet | ${entry.notYetIngredients.join(', ') || '—'} |`,
    '',
    '## Instruction',
    '',
    entry.stepInstruction,
    '',
    '## Prompt',
    '',
    '```',
    prompt,
    '```',
    '',
  ].join('\n');
  fs.writeFileSync(abs, md, 'utf8');
  return abs;
}

export function writeAllStepPrompts(entries: StepManifestEntry[]): number {
  for (const entry of entries) writeStepPromptFile(entry);
  return entries.length;
}

export function extractPromptBody(promptMdPath: string): string | undefined {
  if (!fs.existsSync(promptMdPath)) return undefined;
  const text = fs.readFileSync(promptMdPath, 'utf8');
  const fenced = text.match(/## Prompt\s*```(?:[^\n]*)\r?\n([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  return undefined;
}
