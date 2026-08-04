/**
 * Official HANKKI ingredient icon style (ING-ICON-TEST).
 * Clean premium 3D illustration — NOT photo-style.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, INGREDIENT_IMAGE_SPEC } from './config';
import type { IngredientManifestEntry } from './types';

/** Locked style id for Content Center / reports. */
export const HANKKI_INGREDIENT_ICON_STYLE_VERSION = 'v1.0' as const;

const STYLE_LINES = [
  'clean premium 3D illustration icon',
  'soft rounded shape',
  'realistic enough to recognize immediately',
  'cute but not childish',
  'bright natural colors',
  'warm cream or transparent background',
  'centered composition',
  'same slightly elevated three-quarter camera angle',
  'same soft studio lighting',
  'same generous padding around the subject',
  'no text',
  'no logo',
  'no watermark',
  'square 1:1',
  'optimized for small mobile ingredient cards',
  'single ingredient only',
  'no plate',
  'no hands',
  'no photo realism',
  'no glossy stock-photo look',
].join('; ');

export function buildIngredientPromptText(entry: {
  iconKey: string;
  koreanName: string;
  aliases: string[];
}): string {
  const aliasHint =
    entry.aliases.length > 0
      ? ` Also known as: ${entry.aliases.slice(0, 8).join(', ')}.`
      : '';
  return [
    `HANKKI Official Ingredient Icon Style ${HANKKI_INGREDIENT_ICON_STYLE_VERSION}.`,
    `Create a single premium 3D illustration icon of the Korean cooking ingredient "${entry.koreanName}" (iconKey: ${entry.iconKey}).`,
    aliasHint,
    `Style requirements: ${STYLE_LINES}.`,
    `Output: ${INGREDIENT_IMAGE_SPEC.width}x${INGREDIENT_IMAGE_SPEC.height} PNG, square 1:1.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function writeIngredientPromptFile(
  entry: IngredientManifestEntry,
): string {
  fs.mkdirSync(PATHS.promptsDir, { recursive: true });
  const abs = path.join(PATHS.promptsDir, `${entry.iconKey}.md`);
  const prompt = buildIngredientPromptText(entry);
  const md = [
    `# Ingredient Icon Prompt — ${entry.koreanName}`,
    '',
    `> Official style: **HANKKI Ingredient Icon Style ${HANKKI_INGREDIENT_ICON_STYLE_VERSION}**`,
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| iconKey | \`${entry.iconKey}\` |`,
    `| Korean name | ${entry.koreanName} |`,
    `| aliases | ${entry.aliases.join(', ') || '—'} |`,
    `| usedBy | ${entry.usedByRecipeIds.join(', ')} |`,
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

export function writeAllIngredientPrompts(
  entries: IngredientManifestEntry[],
): number {
  for (const entry of entries) writeIngredientPromptFile(entry);
  return entries.length;
}

export function extractPromptBody(promptMdPath: string): string | undefined {
  if (!fs.existsSync(promptMdPath)) return undefined;
  const text = fs.readFileSync(promptMdPath, 'utf8');
  const fenced = text.match(/## Prompt\s*```(?:[^\n]*)\r?\n([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  return undefined;
}
