/**
 * Sprint 60 — Auto audit for meal hero expansion review candidates.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadImageQueue } from './buildImageQueue';
import { PATHS, HERO_SIZE_EXPECT } from './config';
import { inspectImageFile } from './engine/inspectImage';
import { flatReviewImagePath, readReviewMeta } from './reviewStore';
import { readReviewProvider } from './heroExpansionGenerateGuard';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { MealHeroExpansionBatch } from './mealHeroExpansionConfig';
import { MEAL_HERO_EXPANSION_PATHS } from './mealHeroExpansionConfig';

export type HeroExpansionAuditGrade = 'PASS_CANDIDATE' | 'MANUAL_REVIEW' | 'REGENERATE';

export type HeroExpansionAuditRow = {
  recipeId: string;
  recipeName: string;
  imageKey: string;
  reviewPath: string | null;
  provider: string | null;
  grade: HeroExpansionAuditGrade;
  reasons: string[];
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  byteLength: number;
  sha256: string | null;
};

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function gradeFromInspect(
  check: ReturnType<typeof inspectImageFile>,
  byteLength: number,
): { grade: HeroExpansionAuditGrade; reasons: string[] } {
  const reasons: string[] = [...check.issues];

  if (!check.exists || check.broken) {
    return { grade: 'REGENERATE', reasons: [...reasons, 'missing or broken image'] };
  }

  if (check.width && check.height) {
    const ratio = check.width / check.height;
    const target = 16 / 9;
    if (Math.abs(ratio - target) > 0.08) {
      reasons.push(`aspect ratio ${ratio.toFixed(2)} (expected ~1.78)`);
    }
    if (check.width < HERO_SIZE_EXPECT.minWidth || check.height < HERO_SIZE_EXPECT.minHeight) {
      reasons.push(`dimensions ${check.width}×${check.height} below ${HERO_SIZE_EXPECT.minWidth}×${HERO_SIZE_EXPECT.minHeight}`);
    }
  }

  if (byteLength < 8_000) {
    reasons.push('file suspiciously small — possible placeholder');
  }
  if (byteLength > 2_500_000) {
    reasons.push('file very large — check compression');
  }

  if (reasons.some((r) => r.includes('missing') || r.includes('broken') || r.includes('below'))) {
    return { grade: 'REGENERATE', reasons };
  }
  if (reasons.length > 0) {
    return { grade: 'MANUAL_REVIEW', reasons };
  }
  return {
    grade: 'PASS_CANDIDATE',
    reasons: ['technical checks passed — human review required'],
  };
}

export async function auditMealHeroExpansionBatch(
  batch: MealHeroExpansionBatch,
): Promise<HeroExpansionAuditRow[]> {
  const queue = loadImageQueue();
  const rows: HeroExpansionAuditRow[] = [];
  const seenKeys = new Map<string, string>();
  const seenSha = new Map<string, string>();

  for (const recipeId of batch.recipeIds) {
    const recipe = getHankkiRecipeById(recipeId);
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const heroImageKey = item?.heroImageKey ?? recipe?.heroImageKey ?? '';
    const recipeName = item?.recipeName ?? recipe?.name ?? recipeId;

    const reviewAbs = heroImageKey ? flatReviewImagePath(recipeId, heroImageKey) : '';
    const exists = reviewAbs && fs.existsSync(reviewAbs);

    const provider =
      readReviewProvider(heroImageKey) ??
      readReviewMeta(heroImageKey)?.provider ??
      null;

    if (heroImageKey && seenKeys.has(heroImageKey)) {
      rows.push({
        recipeId,
        recipeName,
        imageKey: heroImageKey,
        reviewPath: exists ? reviewAbs : null,
        provider,
        grade: 'REGENERATE',
        reasons: [`duplicate imageKey with ${seenKeys.get(heroImageKey)}`],
        width: null,
        height: null,
        aspectRatio: null,
        byteLength: 0,
        sha256: null,
      });
      continue;
    }
    if (heroImageKey) seenKeys.set(heroImageKey, recipeId);

    if (!exists) {
      rows.push({
        recipeId,
        recipeName,
        imageKey: heroImageKey,
        reviewPath: null,
        provider,
        grade: 'REGENERATE',
        reasons: ['no review candidate — run hero:expansion generate'],
        width: null,
        height: null,
        aspectRatio: null,
        byteLength: 0,
        sha256: null,
      });
      continue;
    }

    const check = inspectImageFile(reviewAbs, {
      minWidth: HERO_SIZE_EXPECT.minWidth,
      minHeight: HERO_SIZE_EXPECT.minHeight,
      aspectHint: '16:9',
    });
    const byteLength = fs.statSync(reviewAbs).size;
    const graded = gradeFromInspect(check, byteLength);
    const sha256 = sha256File(reviewAbs);
    const reasons = [...graded.reasons];

    if (provider === 'mock') {
      reasons.push('mock provider placeholder — regenerate with gemini');
    }
    if (byteLength <= 30_000 && provider !== 'gemini') {
      reasons.push('suspiciously small file — possible mock placeholder');
    }
    if (seenSha.has(sha256)) {
      reasons.push(`duplicate image bytes with ${seenSha.get(sha256)}`);
    } else {
      seenSha.set(sha256, recipeId);
    }

    let grade = graded.grade;
    if (
      provider === 'mock' ||
      reasons.some((r) => r.includes('duplicate image bytes'))
    ) {
      grade = 'REGENERATE';
    } else if (reasons.length > 1 && grade === 'PASS_CANDIDATE') {
      grade = 'MANUAL_REVIEW';
    }

    rows.push({
      recipeId,
      recipeName,
      imageKey: heroImageKey,
      reviewPath: reviewAbs,
      provider,
      grade,
      reasons,
      width: check.width,
      height: check.height,
      aspectRatio:
        check.width && check.height ? check.width / check.height : null,
      byteLength,
      sha256,
    });
  }

  return rows;
}

export function writeMealHeroExpansionAudit(
  batch: MealHeroExpansionBatch,
  rows: HeroExpansionAuditRow[],
): string {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.auditDir, { recursive: true });
  const outPath = path.join(MEAL_HERO_EXPANSION_PATHS.auditDir, `${batch.id}-audit.json`);
  const summary = {
    passCandidate: rows.filter((r) => r.grade === 'PASS_CANDIDATE').length,
    manualReview: rows.filter((r) => r.grade === 'MANUAL_REVIEW').length,
    regenerate: rows.filter((r) => r.grade === 'REGENERATE').length,
    missing: rows.filter((r) => !r.reviewPath).length,
  };
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        batchId: batch.id,
        label: batch.label,
        generatedAt: new Date().toISOString(),
        summary,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );
  return outPath;
}
