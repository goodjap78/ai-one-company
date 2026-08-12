/**
 * Sprint 56-F — automated review grading (no auto-approval).
 */
import { analyzeIngredientPng, type IngredientPngMetrics } from './analyzeIngredientPng';
import type { ConvenienceIconRenderProfile } from './convenienceIconRenderProfile';

export type ConvenienceIconAuditGrade = 'PASS_CANDIDATE' | 'MANUAL_REVIEW' | 'REGENERATE';

export type ConvenienceIconAuditResult = {
  grade: ConvenienceIconAuditGrade;
  metrics: IngredientPngMetrics;
  reasons: string[];
  masterFamilyDistance: number;
  linearScale: number;
  bboxPct: number;
};

function rgbDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function computeMasterFamilyDistance(
  metrics: IngredientPngMetrics,
  profile: ConvenienceIconRenderProfile,
): number {
  const bboxPct = metrics.bboxAreaRatio * 100;
  const refBbox = profile.layout.bboxAreaRatioMean * 100;
  const bboxDelta = Math.abs(bboxPct - refBbox) / 10;
  const bgDelta = rgbDistance(metrics.backgroundRgb, profile.background.rgb) / 15;
  return Number((bboxDelta + bgDelta).toFixed(2));
}

export function auditConvenienceIconReview(input: {
  abs: string;
  iconKey: string;
  profile: ConvenienceIconRenderProfile;
  linearScale?: number;
  targetBboxMinPct?: number;
  targetBboxMaxPct?: number;
}): ConvenienceIconAuditResult {
  const {
    abs,
    iconKey,
    profile,
    linearScale = 1,
    targetBboxMinPct = 33,
    targetBboxMaxPct = 38,
  } = input;

  const metrics = analyzeIngredientPng(abs, iconKey);
  const bboxPct = Number((metrics.bboxAreaRatio * 100).toFixed(1));
  const reasons: string[] = [];
  const masterFamilyDistance = computeMasterFamilyDistance(metrics, profile);

  if (metrics.width !== 1024 || metrics.height !== 1024) {
    reasons.push('not 1024×1024');
    return {
      grade: 'REGENERATE',
      metrics,
      reasons,
      masterFamilyDistance,
      linearScale,
      bboxPct,
    };
  }

  if (metrics.backgroundPolicy !== 'opaque_uniform') {
    reasons.push(`background policy ${metrics.backgroundPolicy}`);
    return {
      grade: 'REGENERATE',
      metrics,
      reasons,
      masterFamilyDistance,
      linearScale,
      bboxPct,
    };
  }

  if (bboxPct < 20 || bboxPct > 50) {
    reasons.push(`bbox ${bboxPct}% extreme`);
    return {
      grade: 'REGENERATE',
      metrics,
      reasons,
      masterFamilyDistance,
      linearScale,
      bboxPct,
    };
  }

  if (metrics.fileBytes < 50_000) {
    reasons.push('suspiciously small file');
    return {
      grade: 'REGENERATE',
      metrics,
      reasons,
      masterFamilyDistance,
      linearScale,
      bboxPct,
    };
  }

  let grade: ConvenienceIconAuditGrade = 'PASS_CANDIDATE';

  if (linearScale > 1.45) {
    reasons.push(`scale ${linearScale}x may degrade quality`);
    grade = 'MANUAL_REVIEW';
  }

  if (bboxPct < targetBboxMinPct - 5 || bboxPct > targetBboxMaxPct + 5) {
    reasons.push(`bbox ${bboxPct}% outside soft window`);
    grade = 'MANUAL_REVIEW';
  } else if (bboxPct < targetBboxMinPct || bboxPct > targetBboxMaxPct) {
    reasons.push(`bbox ${bboxPct}% outside target ${targetBboxMinPct}-${targetBboxMaxPct}%`);
    if (grade === 'PASS_CANDIDATE') grade = 'MANUAL_REVIEW';
  }

  const bgDist = rgbDistance(metrics.backgroundRgb, profile.background.rgb);
  if (bgDist > 28) {
    reasons.push(`background rgb drift ${bgDist.toFixed(0)}`);
    grade = 'MANUAL_REVIEW';
  }

  if (masterFamilyDistance > 2.5) {
    reasons.push(`master family distance ${masterFamilyDistance}`);
    grade = 'MANUAL_REVIEW';
  }

  if (reasons.length === 0) {
    reasons.push('metrics within automated pass window — human review still required');
  }

  return {
    grade,
    metrics,
    reasons,
    masterFamilyDistance,
    linearScale,
    bboxPct,
  };
}
