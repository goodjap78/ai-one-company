/**
 * Sprint 51-B — visual audit for convenience combo hero v2 review images.
 */
import fs from 'node:fs';
import path from 'node:path';
import Jimp from 'jimp-compact';
import sizeOf from 'image-size';
import { loadComboQueue } from './buildQueue';
import { PATHS } from './config';
import { reviewImagePath } from './reviewStore';
import type { ComboQueueItem } from './types';

export type ComboAuditGrade = 'PASS_CANDIDATE' | 'MANUAL_REVIEW' | 'REGENERATE';

export type ComboAuditRow = {
  comboId: string;
  title: string;
  transformationName: string;
  imageKey: string;
  reviewPath: string | null;
  grade: ComboAuditGrade;
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
const TARGET_CENTROID_Y_MAX = 0.52;
const TARGET_FILL_MIN = 0.32;
const TARGET_FILL_MAX = 0.78;

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
  metrics: Omit<
    ComboAuditRow,
    'comboId' | 'title' | 'transformationName' | 'imageKey' | 'reviewPath'
  >,
): Pick<ComboAuditRow, 'grade' | 'reasons' | 'manualChecks'> {
  const reasons: string[] = [];
  const manualChecks: string[] = [
    'finished combo matches title and transformationName',
    'no unrelated drinks, utensils, packaging, or side dishes',
    'not a wide table spread or distant camera',
    'no brand logos or readable text',
    'key foods not cropped at frame edge',
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

  if (metrics.leftCluster > 0.22 && metrics.rightCluster > 0.22) {
    reasons.push('dual-side content clusters — possible product lineup or spread');
    manualChecks.push('verify not side-by-side product display');
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

export async function auditComboHeroes(
  comboIds: string[],
  metaByComboId: Map<
    string,
    { title: string; transformationName: string; imageKey: string }
  >,
): Promise<ComboAuditRow[]> {
  const rows: ComboAuditRow[] = [];

  for (const comboId of comboIds) {
    const meta = metaByComboId.get(comboId);
    const imageKey = meta?.imageKey ?? '';
    const title = meta?.title ?? comboId;
    const transformationName = meta?.transformationName ?? '';

    const reviewAbs = imageKey ? reviewImagePath(imageKey) : '';
    const reviewPath =
      reviewAbs && fs.existsSync(reviewAbs)
        ? path.relative(PATHS.appRoot, reviewAbs).replace(/\\/g, '/')
        : null;

    if (!reviewPath) {
      rows.push({
        comboId,
        title,
        transformationName,
        imageKey,
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
        comboId,
        title,
        transformationName,
        imageKey,
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

    if (dims.width !== 1344 || dims.height !== 768) {
      rows.push({
        comboId,
        title,
        transformationName,
        imageKey,
        reviewPath,
        grade: 'MANUAL_REVIEW',
        reasons: [`dimensions ${dims.width}x${dims.height} (expected 1344x768)`],
        centroidX: 0.5,
        centroidY: 0.5,
        fillRatio: 0,
        topMargin: 0,
        bottomMargin: 0,
        leftCluster: 0,
        rightCluster: 0,
        manualChecks: ['verify aspect ratio 16:9'],
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
      comboId,
      title,
      transformationName,
      imageKey,
      reviewPath,
      ...metrics,
      ...graded,
    });
  }

  return rows;
}

export function writeComboAuditJson(
  batch: number,
  rows: ComboAuditRow[],
): string {
  const out = path.join(PATHS.generatedRoot, `hack-batch-${batch}-audit.json`);
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify({ generatedAt: new Date().toISOString(), batch, rows }, null, 2),
    'utf8',
  );
  return path.relative(PATHS.appRoot, out);
}

export function loadComboAuditJson(batch: number): ComboAuditRow[] | null {
  const abs = path.join(PATHS.generatedRoot, `hack-batch-${batch}-audit.json`);
  if (!fs.existsSync(abs)) return null;
  const parsed = JSON.parse(fs.readFileSync(abs, 'utf8')) as { rows: ComboAuditRow[] };
  return parsed.rows;
}

export function writeEasySetComboAuditJson(
  batch: number,
  rows: ComboAuditRow[],
): string {
  const out = path.join(PATHS.generatedRoot, `easy-set-batch-${batch}-audit.json`);
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), batch, scope: 'easy-set', rows },
      null,
      2,
    ),
    'utf8',
  );
  return path.relative(PATHS.appRoot, out);
}

export function loadEasySetComboAuditJson(batch: number): ComboAuditRow[] | null {
  const abs = path.join(PATHS.generatedRoot, `easy-set-batch-${batch}-audit.json`);
  if (!fs.existsSync(abs)) return null;
  const parsed = JSON.parse(fs.readFileSync(abs, 'utf8')) as { rows: ComboAuditRow[] };
  return parsed.rows;
}

export function metaMapFromQueue(
  items: ComboQueueItem[],
  comboIds: string[],
): Map<string, { title: string; transformationName: string; imageKey: string }> {
  const map = new Map<
    string,
    { title: string; transformationName: string; imageKey: string }
  >();
  for (const comboId of comboIds) {
    const item = items.find((i) => i.comboId === comboId);
    if (item) {
      map.set(comboId, {
        title: item.title,
        transformationName: '',
        imageKey: item.imageKey,
      });
    }
  }
  return map;
}

export function metaMapFromManifest(
  manifestItems: Array<{
    comboId: string;
    title: string;
    transformationName?: string;
    imageKey: string;
  }>,
): Map<string, { title: string; transformationName: string; imageKey: string }> {
  const map = new Map<
    string,
    { title: string; transformationName: string; imageKey: string }
  >();
  for (const item of manifestItems) {
    map.set(item.comboId, {
      title: item.title,
      transformationName: item.transformationName ?? '',
      imageKey: item.imageKey,
    });
  }
  return map;
}
