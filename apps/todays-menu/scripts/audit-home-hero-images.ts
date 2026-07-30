/**
 * Audit 100 HANKKI hero images for home card safe-area fit.
 * Run: npx tsx scripts/audit-home-hero-images.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sizeOf from 'image-size';
import Jimp from 'jimp-compact';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { HOME_HERO_DISPLAY } from '../constants/homeHeroDisplay';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const OUT_DIR = path.join(APP_ROOT, 'generated', 'home-hero-audit');
const OUT_JSON = path.join(OUT_DIR, 'audit-report.json');
const OUT_MD = path.join(OUT_DIR, 'audit-report.md');

export type HeroAuditGrade = 'PASS' | 'UI_ADJUST' | 'REGENERATE';

export type HeroAuditRow = {
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
  grade: HeroAuditGrade;
  reasons: string[];
  suggestedFocal?: { x: number; y: number };
};

type Rgb = { r: number; g: number; b: number };

function readImageSize(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  const dims = sizeOf(buf);
  if (!dims.width || !dims.height) {
    throw new Error(`Could not read image size: ${filePath}`);
  }
  return { width: dims.width, height: dims.height };
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

  const fillRatio = count / (width * height);
  return {
    centroidX: sumX / count / width,
    centroidY: sumY / count / height,
    fillRatio,
    topMargin: minContentY / height,
    bottomMargin: (height - 1 - maxContentY) / height,
  };
}

function gradeRow(input: {
  aspectRatio: number;
  centroidY: number;
  fillRatio: number;
  topMargin: number;
  bottomMargin: number;
}): { grade: HeroAuditGrade; reasons: string[]; suggestedFocal?: { x: number; y: number } } {
  const reasons: string[] = [];
  const targetY = HOME_HERO_DISPLAY.defaultFocalPoint.y;
  const bottomSafe = HOME_HERO_DISPLAY.bottomOverlaySafeRatio;

  if (input.fillRatio < 0.12) {
    reasons.push('food occupies <12% of frame');
    return { grade: 'REGENERATE', reasons };
  }

  if (input.aspectRatio < 1.2 || input.aspectRatio > 2.2) {
    reasons.push(`aspect ${input.aspectRatio.toFixed(2)} outside 1.2–2.2`);
  }

  if (input.topMargin > 0.35) {
    reasons.push('excessive top margin');
  }

  if (input.centroidY > 0.58) {
    reasons.push(`food centroid low (${(input.centroidY * 100).toFixed(0)}%)`);
  }

  if (input.bottomMargin < 0.02 && input.centroidY > 0.56) {
    reasons.push('plate/food may clip at bottom');
  }

  const overlapRisk = input.centroidY > 0.56;

  if (reasons.some((r) => r.includes('occupies') || r.includes('aspect'))) {
    return { grade: 'REGENERATE', reasons };
  }

  if (overlapRisk || input.centroidY > 0.55 || input.topMargin > 0.32) {
    const suggestedY = Math.min(0.42, Math.max(0.36, input.centroidY - 0.16));
    reasons.push('focal override recommended');
    return {
      grade: 'UI_ADJUST',
      reasons,
      suggestedFocal: { x: 0.5, y: Number(suggestedY.toFixed(2)) },
    };
  }

  if (input.centroidY > 0.52 || reasons.length > 0) {
    return { grade: 'PASS', reasons: ['default focal handles'] };
  }

  return { grade: 'PASS', reasons };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows: HeroAuditRow[] = [];

  for (const recipe of HANKKI_RECIPES) {
    const key = recipe.heroImageKey;
    const file = path.join(MEALS_DIR, `${key}.jpg`);
    if (!fs.existsSync(file)) {
      rows.push({
        recipeId: recipe.id,
        name: recipe.name,
        heroImageKey: key,
        file: `${key}.jpg`,
        width: 0,
        height: 0,
        aspectRatio: 0,
        contentCentroidY: 0,
        contentCentroidX: 0,
        contentFillRatio: 0,
        topMarginRatio: 0,
        bottomMarginRatio: 0,
        overlapRisk: true,
        grade: 'REGENERATE',
        reasons: ['missing hero file'],
      });
      continue;
    }

    const { width, height } = readImageSize(file);
    const aspectRatio = width / height;
    const content = await analyzeContent(file);
    const { grade, reasons, suggestedFocal } = gradeRow({
      aspectRatio,
      centroidY: content.centroidY,
      fillRatio: content.fillRatio,
      topMargin: content.topMargin,
      bottomMargin: content.bottomMargin,
    });

    rows.push({
      recipeId: recipe.id,
      name: recipe.name,
      heroImageKey: key,
      file: `${key}.jpg`,
      width,
      height,
      aspectRatio: Number(aspectRatio.toFixed(3)),
      contentCentroidY: Number(content.centroidY.toFixed(3)),
      contentCentroidX: Number(content.centroidX.toFixed(3)),
      contentFillRatio: Number(content.fillRatio.toFixed(3)),
      topMarginRatio: Number(content.topMargin.toFixed(3)),
      bottomMarginRatio: Number(content.bottomMargin.toFixed(3)),
      overlapRisk: content.centroidY > 0.54,
      grade,
      reasons,
      suggestedFocal,
    });
  }

  const summary = {
    total: rows.length,
    pass: rows.filter((r) => r.grade === 'PASS').length,
    uiAdjust: rows.filter((r) => r.grade === 'UI_ADJUST').length,
    regenerate: rows.filter((r) => r.grade === 'REGENERATE').length,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, rows }, null, 2), 'utf8');

  const lines = [
    '# Home Hero Image Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Grade | Count |`,
    `| --- | ---: |`,
    `| PASS | ${summary.pass} |`,
    `| UI_ADJUST | ${summary.uiAdjust} |`,
    `| REGENERATE | ${summary.regenerate} |`,
    '',
    '## UI_ADJUST',
    '',
    ...rows
      .filter((r) => r.grade === 'UI_ADJUST')
      .map(
        (r) =>
          `- [${r.recipeId}] ${r.name} (\`${r.heroImageKey}\`) — ${r.reasons.join('; ')}` +
          (r.suggestedFocal ? ` → focal y=${r.suggestedFocal.y}` : ''),
      ),
    '',
    '## REGENERATE',
    '',
    ...rows
      .filter((r) => r.grade === 'REGENERATE')
      .map((r) => `- [${r.recipeId}] ${r.name} (\`${r.heroImageKey}\`) — ${r.reasons.join('; ')}`),
  ];

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');

  console.log('========== Home Hero Audit ==========');
  console.log(`PASS: ${summary.pass} | UI_ADJUST: ${summary.uiAdjust} | REGENERATE: ${summary.regenerate}`);
  console.log(`Report: ${OUT_JSON}`);
  console.log('=====================================');
}

void main();
