/**
 * Sprint 50-B — visual audit for side-dish hero v2 (recipe_0141–0160).
 */
import fs from 'node:fs';
import path from 'node:path';
import Jimp from 'jimp-compact';
import sizeOf from 'image-size';
import { PATHS } from './config';
import { flatReviewImagePath } from './reviewStore';
import { SIDE_DISH_RECIPE_IDS } from './sideDishScope';
import { loadImageQueue } from './buildImageQueue';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';

export type SideDishAuditGrade = 'PASS_CANDIDATE' | 'MANUAL_REVIEW' | 'REGENERATE';

export type SideDishAuditRow = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  reviewPath: string | null;
  grade: SideDishAuditGrade;
  reasons: string[];
  centroidX: number;
  centroidY: number;
  fillRatio: number;
  topMargin: number;
  bottomMargin: number;
  leftCluster: number;
  rightCluster: number;
  manualChecks: string[];
};

const TARGET_CENTROID_X = 0.5;
const TARGET_CENTROID_Y_MIN = 0.44;
const TARGET_CENTROID_Y_MAX = 0.47;
const TARGET_FILL_MIN = 0.28;
const TARGET_FILL_MAX = 0.72;
const TARGET_TOP_MARGIN = 0.08;
const TARGET_BOTTOM_MARGIN = 0.12;

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
  leftCluster: number;
  rightCluster: number;
}> {
  const image = await Jimp.read(filePath);
  const sample = image.clone().resize(160, 100);
  const { width, height, data } = sample.bitmap;

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  let minContentY = height;
  let maxContentY = 0;
  let leftCount = 0;
  let rightCount = 0;
  const midX = width / 2;

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
      if (x < midX * 0.85) leftCount += 1;
      if (x > midX * 1.15) rightCount += 1;
    }
  }

  if (count === 0) {
    return {
      centroidX: 0.5,
      centroidY: 0.55,
      fillRatio: 0,
      topMargin: 0.2,
      bottomMargin: 0.2,
      leftCluster: 0,
      rightCluster: 0,
    };
  }

  return {
    centroidX: sumX / count / width,
    centroidY: sumY / count / height,
    fillRatio: count / (width * height),
    topMargin: minContentY / height,
    bottomMargin: (height - 1 - maxContentY) / height,
    leftCluster: leftCount / count,
    rightCluster: rightCount / count,
  };
}

function gradeRow(
  metrics: Omit<SideDishAuditRow, 'recipeId' | 'recipeName' | 'heroImageKey' | 'reviewPath'>,
): Pick<SideDishAuditRow, 'grade' | 'reasons' | 'manualChecks'> {
  const reasons: string[] = [];
  const manualChecks: string[] = [
    'single plate only (no extra dishes)',
    'no rice bowl / soup bowl / utensils',
    'no other banchan or meal spread',
    'no unrelated garnish or props',
  ];

  if (metrics.fillRatio < 0.1) {
    reasons.push('food occupies <10% of frame');
    return { grade: 'REGENERATE', reasons, manualChecks };
  }

  if (metrics.fillRatio < TARGET_FILL_MIN) {
    reasons.push(
      `low fill ratio (${(metrics.fillRatio * 100).toFixed(0)}%) - food may be too small or distant`,
    );
  }
  if (metrics.fillRatio > TARGET_FILL_MAX) {
    reasons.push(
      `very high fill ratio (${(metrics.fillRatio * 100).toFixed(0)}%) - possible edge crop`,
    );
  }

  const centroidXOff = Math.abs(metrics.centroidX - TARGET_CENTROID_X);
  if (centroidXOff > 0.12) {
    reasons.push(`centroid X off (${(metrics.centroidX * 100).toFixed(0)}%)`);
  }

  if (metrics.centroidY < TARGET_CENTROID_Y_MIN - 0.06) {
    reasons.push(`centroid too high (${(metrics.centroidY * 100).toFixed(0)}%)`);
  }
  if (metrics.centroidY > TARGET_CENTROID_Y_MAX + 0.1) {
    reasons.push(`centroid too low (${(metrics.centroidY * 100).toFixed(0)}%)`);
  }

  if (metrics.topMargin > 0.22) {
    reasons.push(`excessive top margin (${(metrics.topMargin * 100).toFixed(0)}%)`);
  }
  if (metrics.bottomMargin < 0.04 && metrics.centroidY > 0.5) {
    reasons.push('bottom safe margin may be insufficient');
  }

  // Heuristic: significant content on both far left and far right → possible multi-plate spread.
  if (metrics.leftCluster > 0.22 && metrics.rightCluster > 0.22) {
    reasons.push('dual-side content clusters — possible multiple plates');
    manualChecks.push('verify no second plate at frame edge');
  }

  if (reasons.some((r) => r.includes('<10%'))) {
    return { grade: 'REGENERATE', reasons, manualChecks };
  }

  const hardFail =
    metrics.fillRatio < 0.12 ||
    centroidXOff > 0.18 ||
    metrics.centroidY > 0.58 ||
    metrics.topMargin > 0.3;

  if (hardFail) {
    return { grade: 'REGENERATE', reasons, manualChecks };
  }

  if (reasons.length > 0) {
    return { grade: 'MANUAL_REVIEW', reasons, manualChecks };
  }

  return {
    grade: 'PASS_CANDIDATE',
    reasons: ['composition within v2 heuristics — still requires human eye'],
    manualChecks,
  };
}

export async function auditSideDishHeroes(): Promise<SideDishAuditRow[]> {
  const queue = loadImageQueue();
  const rows: SideDishAuditRow[] = [];

  for (const recipeId of SIDE_DISH_RECIPE_IDS) {
    const recipe = HANKKI_RECIPES.find((r) => r.id === recipeId);
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const heroImageKey = item?.heroImageKey ?? recipe?.heroImageKey ?? '';
    const recipeName = item?.recipeName ?? recipe?.name ?? recipeId;

    const reviewAbs = heroImageKey
      ? flatReviewImagePath(recipeId, heroImageKey)
      : '';
    const reviewPath = reviewAbs && fs.existsSync(reviewAbs)
      ? path.relative(PATHS.appRoot, reviewAbs).replace(/\\/g, '/')
      : null;

    if (!reviewPath) {
      rows.push({
        recipeId,
        recipeName,
        heroImageKey,
        reviewPath: null,
        grade: 'REGENERATE',
        reasons: ['missing review image'],
        centroidX: 0,
        centroidY: 0,
        fillRatio: 0,
        topMargin: 0,
        bottomMargin: 0,
        leftCluster: 0,
        rightCluster: 0,
        manualChecks: [],
      });
      continue;
    }

    const dims = sizeOf(fs.readFileSync(reviewAbs));
    if (!dims.width || !dims.height) {
      rows.push({
        recipeId,
        recipeName,
        heroImageKey,
        reviewPath,
        grade: 'REGENERATE',
        reasons: ['could not read image dimensions'],
        centroidX: 0,
        centroidY: 0,
        fillRatio: 0,
        topMargin: 0,
        bottomMargin: 0,
        leftCluster: 0,
        rightCluster: 0,
        manualChecks: [],
      });
      continue;
    }

    const metrics = await analyzeContent(reviewAbs);
    const graded = gradeRow({
      grade: 'PASS_CANDIDATE',
      reasons: [],
      centroidX: metrics.centroidX,
      centroidY: metrics.centroidY,
      fillRatio: metrics.fillRatio,
      topMargin: metrics.topMargin,
      bottomMargin: metrics.bottomMargin,
      leftCluster: metrics.leftCluster,
      rightCluster: metrics.rightCluster,
      manualChecks: [],
    });

    rows.push({
      recipeId,
      recipeName,
      heroImageKey,
      reviewPath,
      ...metrics,
      ...graded,
    });
  }

  return rows;
}

export function writeSideDishAuditJson(rows: SideDishAuditRow[]): string {
  const out = path.join(PATHS.generatedRoot, 'side-dish-audit-v2.json');
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
  return path.relative(PATHS.appRoot, out);
}

export function v1HistoryRelative(recipeId: string, heroImageKey: string): string | null {
  const rel = path.join(
    'generated/image-factory/history/sprint50-side-dish-originals/review-v1',
    `${recipeId}-${heroImageKey}.jpg`,
  );
  const abs = path.join(PATHS.appRoot, rel);
  return fs.existsSync(abs) ? rel.replace(/\\/g, '/') : null;
}

export function v1ProductionHistoryRelative(
  recipeId: string,
  heroImageKey: string,
): string | null {
  const rel = path.join(
    'generated/image-factory/history/sprint50-side-dish-originals/production',
    `${recipeId}-${heroImageKey}.jpg`,
  );
  const abs = path.join(PATHS.appRoot, rel);
  return fs.existsSync(abs) ? rel.replace(/\\/g, '/') : null;
}
