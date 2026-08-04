/**
 * HANKKI Convenience Combo Hero Style v2.0 — prompt bodies per pilot menu.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COMBO_HERO_BASE,
  COMBO_HERO_HINTS,
  COMBO_HERO_V2_VERSION,
} from './comboHeroHints';
import { COMBO_IMAGE_SPEC, PATHS } from './config';
import type { ComboManifestEntry } from './types';

export const HANKKI_COMBO_HERO_STYLE_VERSION = COMBO_HERO_V2_VERSION;

export function buildComboPromptText(entry: ComboManifestEntry): string {
  const menuHint =
    COMBO_HERO_HINTS[entry.imageKey] ??
    `Finished convenience-store combo "${entry.transformationName ?? entry.title}" as the sole hero subject; show the completed hack result not a side-by-side product display.`;
  const itemsHint =
    entry.items.length > 0 ? `Combo uses: ${entry.items.join(', ')}.` : '';
  const assemblyHint =
    entry.assemblyGuide && entry.assemblyGuide.length > 0
      ? `Assembly result: ${entry.assemblyGuide.join(' ')}`
      : '';
  return [
    `HANKKI Convenience Combo Hero Style ${HANKKI_COMBO_HERO_STYLE_VERSION}.`,
    `Create a single hero food photo for the Korean convenience-store combo "${entry.title}" (comboId: ${entry.comboId}, imageKey: ${entry.imageKey}).`,
    entry.transformationName
      ? `Transformation: ${entry.transformationName}.`
      : '',
    itemsHint,
    assemblyHint,
    COMBO_HERO_BASE,
    `Dish identity: ${menuHint}`,
    `Output: ${COMBO_IMAGE_SPEC.width}x${COMBO_IMAGE_SPEC.height} JPG, 16:9 landscape.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function writeComboPromptFile(entry: ComboManifestEntry): string {
  fs.mkdirSync(PATHS.promptsDir, { recursive: true });
  const abs = path.join(PATHS.promptsDir, `${entry.imageKey}.md`);
  const prompt = buildComboPromptText(entry);
  const md = [
    `# Combo Hero Prompt — ${entry.title}`,
    '',
    `> Official style: **HANKKI Convenience Combo Hero Style ${HANKKI_COMBO_HERO_STYLE_VERSION}**`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| comboId | \`${entry.comboId}\` |`,
    `| imageKey | \`${entry.imageKey}\` |`,
    `| comboKind | ${entry.comboKind} |`,
    `| items | ${entry.items.join(', ')} |`,
    `| output | \`${entry.outputFilename}\` |`,
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

export function writeAllComboPrompts(entries: ComboManifestEntry[]): number {
  for (const entry of entries) writeComboPromptFile(entry);
  return entries.length;
}

export function extractPromptBody(promptMdPath: string): string | undefined {
  if (!fs.existsSync(promptMdPath)) return undefined;
  const text = fs.readFileSync(promptMdPath, 'utf8');
  const fenced = text.match(/## Prompt\s*```(?:[^\n]*)\r?\n([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  return undefined;
}
