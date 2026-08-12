/**
 * Sprint CONTENT-2 — scale progress (heroes + ingredient icons toward 100).
 * Review + production both count as "done" for the /100 scale metric.
 * Never auto-approves.
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP_ROOT, PATHS as HERO_PATHS } from '../image-factory/config';
import { PATHS as INGREDIENT_PATHS } from '../ingredient-factory/config';
import { loadImageQueue, buildImageQueue } from '../image-factory/buildImageQueue';
import { loadIngredientQueue } from '../ingredient-factory/buildQueue';
import { listHankkiRecipes } from '../../data/recipes/hankkiRecipes';
import { archiveCurrentCandidateIfNeeded } from '../image-factory/review-dashboard/historyStore';

export const SCALE_TARGET = 100;

export type ScaleLaneProgress = {
  label: string;
  done: number;
  target: number;
  remaining: number;
  percent: number;
  /** Rough seconds remaining based on recent avg duration */
  etaSeconds: number | null;
  etaLabel: string;
};

export type ScaleProgress = {
  heroes: ScaleLaneProgress;
  ingredients: ScaleLaneProgress;
  heroReviewCount: number;
  ingredientReviewCount: number;
  updatedAt: string;
};

const PROGRESS_DIR = path.join(APP_ROOT, 'generated/content-scale');
const TIMING_PATH = path.join(PROGRESS_DIR, 'timing.json');

type TimingFile = {
  heroSecondsPerImage: number[];
  ingredientSecondsPerImage: number[];
  updatedAt: string;
};

function loadTiming(): TimingFile {
  if (!fs.existsSync(TIMING_PATH)) {
    return {
      heroSecondsPerImage: [],
      ingredientSecondsPerImage: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    return JSON.parse(fs.readFileSync(TIMING_PATH, 'utf8')) as TimingFile;
  } catch {
    return {
      heroSecondsPerImage: [],
      ingredientSecondsPerImage: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

export function recordBatchTiming(input: {
  lane: 'hero' | 'ingredient';
  count: number;
  elapsedSeconds: number;
}): void {
  if (input.count <= 0 || input.elapsedSeconds <= 0) return;
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  const timing = loadTiming();
  const per = input.elapsedSeconds / input.count;
  const arr =
    input.lane === 'hero'
      ? timing.heroSecondsPerImage
      : timing.ingredientSecondsPerImage;
  arr.push(per);
  // Keep last 20 samples
  while (arr.length > 20) arr.shift();
  timing.updatedAt = new Date().toISOString();
  fs.writeFileSync(TIMING_PATH, JSON.stringify(timing, null, 2), 'utf8');
}

function avg(nums: number[], fallback: number): number {
  if (!nums.length) return fallback;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function formatEta(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const m = Math.ceil(seconds / 60);
  if (m < 60) return `~${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `~${h}h ${rm}m`;
}

function countHeroDone(): {
  done: number;
  reviewCount: number;
} {
  const recipes = listHankkiRecipes().slice(0, SCALE_TARGET);
  const reviewDir = HERO_PATHS.reviewDir;
  let reviewCount = 0;
  let done = 0;
  for (const r of recipes) {
    const flat = path.join(reviewDir, `${r.id}-${r.heroImageKey}.jpg`);
    const prod = path.join(HERO_PATHS.mealAssetsDir, `${r.heroImageKey}.jpg`);
    const hasReview = fs.existsSync(flat);
    const isCategoryPlaceholder = r.heroImageKey.startsWith('category_');
    const hasDishProduction =
      !isCategoryPlaceholder && fs.existsSync(prod) && fs.statSync(prod).isFile();
    if (hasReview) reviewCount += 1;
    // Scale goal: real dish hero in review or production — not shared category placeholders
    if (hasReview || hasDishProduction) done += 1;
  }
  done = Math.min(done, SCALE_TARGET);
  return { done, reviewCount };
}

function countIngredientDone(): {
  done: number;
  reviewCount: number;
  target: number;
} {
  const queue = loadIngredientQueue();
  const reviewDir = INGREDIENT_PATHS.reviewDir;
  const prodDir = INGREDIENT_PATHS.ingredientsDir;

  const reviewKeys = fs.existsSync(reviewDir)
    ? new Set(
        fs
          .readdirSync(reviewDir)
          .filter((f) => f.endsWith('.png'))
          .map((f) => path.basename(f, '.png')),
      )
    : new Set<string>();

  const prodKeys = fs.existsSync(prodDir)
    ? new Set(
        fs
          .readdirSync(prodDir)
          .filter((f) => f.endsWith('.png'))
          .map((f) => path.basename(f, '.png')),
      )
    : new Set<string>();

  // Denominator = unique keys required by recipes (not a hardcoded 100).
  const recipeKeys = new Set<string>();
  for (const r of listHankkiRecipes()) {
    for (const ing of r.ingredients) {
      const k = (ing.iconKey || '').trim();
      if (k && !k.startsWith('fallback_')) recipeKeys.add(k);
    }
  }

  const fromQueue = new Set((queue?.items ?? []).map((i) => i.iconKey));
  // Track only recipe-required keys for the progress lane.
  const allKeys = recipeKeys.size > 0 ? recipeKeys : new Set([...fromQueue, ...reviewKeys, ...prodKeys]);

  let reviewCount = 0;
  let done = 0;
  for (const key of allKeys) {
    const inReview = reviewKeys.has(key);
    const inProd = prodKeys.has(key);
    if (inReview) reviewCount += 1;
    if (inReview || inProd) done += 1;
  }

  return { done, reviewCount, target: allKeys.size };
}

function lane(
  label: string,
  done: number,
  target: number,
  secondsPer: number,
): ScaleLaneProgress {
  const remaining = Math.max(0, target - done);
  const etaSeconds = remaining * secondsPer;
  return {
    label,
    done,
    target,
    remaining,
    percent: target === 0 ? 0 : Math.round((done / target) * 1000) / 10,
    etaSeconds,
    etaLabel: formatEta(etaSeconds),
  };
}

export function getScaleProgress(): ScaleProgress {
  const timing = loadTiming();
  // Observed defaults from CONTENT-1 / ING-ICON-TEST batches
  const heroAvg = avg(timing.heroSecondsPerImage, 5.5);
  const ingAvg = avg(timing.ingredientSecondsPerImage, 8);

  const heroes = countHeroDone();
  const ings = countIngredientDone();

  return {
    heroes: lane('Hero Images', heroes.done, SCALE_TARGET, heroAvg),
    ingredients: lane(
      'Ingredient Icons',
      ings.done,
      ings.target,
      ingAvg,
    ),
    heroReviewCount: heroes.reviewCount,
    ingredientReviewCount: ings.reviewCount,
    updatedAt: new Date().toISOString(),
  };
}

/** Ensure history versions exist for review candidates in a recipe id range. */
export function archiveHeroReviewsInRange(fromId: string, toId: string): number {
  const queue = loadImageQueue() ?? buildImageQueue();
  const from = Number(fromId);
  const to = Number(toId);
  let n = 0;
  for (const item of queue.items) {
    const id = Number(item.recipeId);
    if (id < from || id > to) continue;
    const v = archiveCurrentCandidateIfNeeded(item.recipeId, item.heroImageKey);
    if (v) n += 1;
  }
  return n;
}
