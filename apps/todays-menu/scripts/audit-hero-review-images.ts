/**
 * Audit hero review candidates (pilot / batch QA).
 * Run: npx tsx scripts/audit-hero-review-images.ts --recipe=recipe_0106,recipe_0110
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sizeOf from 'image-size';
import Jimp from 'jimp-compact';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { HOME_HERO_DISPLAY } from '../constants/homeHeroDisplay';
import { HERO_SIZE_EXPECT } from './image-factory/config';
import { flatReviewImagePath } from './image-factory/reviewStore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(APP_ROOT, 'generated', 'hero-review-audit');
const OUT_JSON = path.join(OUT_DIR, 'audit-report.json');
const OUT_MD = path.join(OUT_DIR, 'audit-report.md');

export type ReviewAuditGrade = 'PASS' | 'UI_ADJUST' | 'REGENERATE';

export type ReviewAuditRow = {
  recipeId: string;
  name: string;
  heroImageKey: string;
  file: string;
  width: number;
  height: number;
  aspectRatio: number;
  contentCentroidY: number;
  contentCentroidX: number;
  contentFillRatio: number;
  topMarginRatio: number;
  bottomMarginRatio: number;
  overlapRisk: boolean;
  sizeOk: boolean;
  grade: ReviewAuditGrade;
  reasons: string[];
  suggestedFocal?: { x: number; y: number };
};

function parseArgs(argv: string[]): string[] | undefined {
  const arg = argv.find((a) => a.startsWith('--recipe='));
  if (!arg) return undefined;
  return arg.slice(9).split(',').filter(Boolean);
}

function isBackground(r: number, g: number, b: number): boolean {
  const warmth = r - b;
  const brightness = (r + g + b) / 3;
  return brightness > 210 && warmth > -5 && g > 175;
}

async function analyzeContent(filePath: string): Promise<{
  centroidX: number;
  centroidY: number;
  fillRatio: number;
  topMargin: number;
  bottomMargin: number;
}> {
  const image = await Jimp.read(filePath);
  const sample = image.clone().resize(160, 100);
  const { width, height, data } = sample.bitmap;

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  let minContentY = height;
  let maxContentY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      if (isBackground(r, g, b)) continue;
      sumX += x;
      sumY += y;
      count += 1;
      minContentY = Math.min(minContentY, y);
      maxContentY = Math.max(maxContentY, y);
    }
  }

  if (count === 0) {
    return {
      centroidX: 0.5,
      centroidY: 0.55,
      fillRatio: 0,
      topMargin: 0.2,
      bottomMargin: 0.2,
    };
  }

  return {
    centroidX: sumX / count / width,
    centroidY: sumY / count / height,
    fillRatio: count / (width * height),
    topMargin: minContentY / height,
    bottomMargin: (height - 1 - maxContentY) / height,
  };
}

function gradeRow(input: {
  width: number;
  height: number;
  aspectRatio: number;
  centroidY: number;
  fillRatio: number;
  topMargin: number;
  bottomMargin: number;
}): { grade: ReviewAuditGrade; reasons: string[]; suggestedFocal?: { x: number; y: number } } {
  const reasons: string[] = [];
  const targetY = HOME_HERO_DISPLAY.defaultFocalPoint.y;

  if (input.width !== HERO_SIZE_EXPECT.width || input.height !== HERO_SIZE_EXPECT.height) {
    reasons.push(
      `size ${input.width}×${input.height} (expected ${HERO_SIZE_EXPECT.width}×${HERO_SIZE_EXPECT.height})`,
    );
  }

  if (input.fillRatio < 0.35) {
    reasons.push(`food fill ${(input.fillRatio * 100).toFixed(0)}% (<35%)`);
  } else if (input.fillRatio < 0.5) {
    reasons.push(`food fill ${(input.fillRatio * 100).toFixed(0)}% (target 88–92% visual)`);
  }

  if (input.aspectRatio < 1.7 || input.aspectRatio > 1.8) {
    reasons.push(`aspect ${input.aspectRatio.toFixed(2)} (expected ~1.75)`);
  }

  if (input.centroidY < 0.38 || input.centroidY > 0.52) {
    reasons.push(`food center Y ${(input.centroidY * 100).toFixed(0)}% (target 42–48%)`);
  }

  if (input.topMargin > 0.14) {
    reasons.push(`top margin ${(input.topMargin * 100).toFixed(0)}% (>8% target)`);
  }

  if (input.bottomMargin < 0.08) {
    reasons.push(`bottom margin ${(input.bottomMargin * 100).toFixed(0)}% (<12% target)`);
  }

  const overlapRisk = input.centroidY > 0.52 || input.bottomMargin < 0.08;

  if (
    reasons.some((r) => r.includes('size') || r.includes('<35%') || r.includes('aspect'))
  ) {
    return { grade: 'REGENERATE', reasons };
  }

  if (overlapRisk || input.centroidY > 0.5) {
    const suggestedY = Math.min(0.46, Math.max(0.38, targetY - 0.04));
    reasons.push('mascot/speech-bubble overlap risk');
    return {
      grade: 'UI_ADJUST',
      reasons,
      suggestedFocal: { x: 0.5, y: Number(suggestedY.toFixed(2)) },
    };
  }

  if (reasons.length > 0) {
    return { grade: 'UI_ADJUST', reasons };
  }

  return { grade: 'PASS', reasons: ['meets pilot hero spec'] };
}

async function main(): Promise<void> {
  const filterIds = parseArgs(process.argv.slice(2));
  const recipes = filterIds
    ? HANKKI_RECIPES.filter((r) => filterIds.includes(r.id))
    : HANKKI_RECIPES.filter((r) => {
        const abs = flatReviewImagePath(r.id, r.heroImageKey);
        return fs.existsSync(abs);
      });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows: ReviewAuditRow[] = [];

  for (const recipe of recipes) {
    const abs = flatReviewImagePath(recipe.id, recipe.heroImageKey);
    const rel = path.relative(APP_ROOT, abs);
    if (!fs.existsSync(abs)) {
      rows.push({
        recipeId: recipe.id,
        name: recipe.name,
        heroImageKey: recipe.heroImageKey,
        file: rel,
        width: 0,
        height: 0,
        aspectRatio: 0,
        contentCentroidY: 0,
        contentCentroidX: 0,
        contentFillRatio: 0,
        topMarginRatio: 0,
        bottomMarginRatio: 0,
        overlapRisk: true,
        sizeOk: false,
        grade: 'REGENERATE',
        reasons: ['missing review file'],
      });
      continue;
    }

    const buf = fs.readFileSync(abs);
    const dims = sizeOf(buf);
    const width = dims.width ?? 0;
    const height = dims.height ?? 0;
    const aspectRatio = height > 0 ? width / height : 0;
    const content = await analyzeContent(abs);
    const { grade, reasons, suggestedFocal } = gradeRow({
      width,
      height,
      aspectRatio,
      centroidY: content.centroidY,
      fillRatio: content.fillRatio,
      topMargin: content.topMargin,
      bottomMargin: content.bottomMargin,
    });

    rows.push({
      recipeId: recipe.id,
      name: recipe.name,
      heroImageKey: recipe.heroImageKey,
      file: rel,
      width,
      height,
      aspectRatio,
      contentCentroidY: content.centroidY,
      contentCentroidX: content.centroidX,
      contentFillRatio: content.fillRatio,
      topMarginRatio: content.topMargin,
      bottomMarginRatio: content.bottomMargin,
      overlapRisk: content.centroidY > 0.52 || content.bottomMargin < 0.08,
      sizeOk:
        width === HERO_SIZE_EXPECT.width && height === HERO_SIZE_EXPECT.height,
      grade,
      reasons,
      suggestedFocal,
    });
  }

  const summary = {
    auditedAt: new Date().toISOString(),
    total: rows.length,
    pass: rows.filter((r) => r.grade === 'PASS').length,
    uiAdjust: rows.filter((r) => r.grade === 'UI_ADJUST').length,
    regenerate: rows.filter((r) => r.grade === 'REGENERATE').length,
    rows,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf8');

  const md = [
    '# Hero Review Audit',
    '',
    `Audited: ${summary.total} · PASS ${summary.pass} · UI_ADJUST ${summary.uiAdjust} · REGENERATE ${summary.regenerate}`,
    '',
    '| Recipe | Grade | Size | Centroid Y | Fill | Overlap | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.recipeId} ${r.name} | ${r.grade} | ${r.width}×${r.height} | ${(r.contentCentroidY * 100).toFixed(0)}% | ${(r.contentFillRatio * 100).toFixed(0)}% | ${r.overlapRisk ? 'yes' : 'no'} | ${r.reasons.join('; ') || 'ok'} |`,
    ),
    '',
  ].join('\n');
  fs.writeFileSync(OUT_MD, md, 'utf8');

  console.log(`\nHero review audit → ${path.relative(APP_ROOT, OUT_MD)}`);
  console.log(`PASS ${summary.pass} · UI_ADJUST ${summary.uiAdjust} · REGENERATE ${summary.regenerate}\n`);
  for (const r of rows) {
    console.log(
      `  ${r.grade.padEnd(11)} ${r.recipeId} ${r.name} — ${r.reasons.join('; ') || 'ok'}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
