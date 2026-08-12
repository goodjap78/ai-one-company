/**
 * Sprint 60.1 — Gemini-only guard + mock review archive for hero expansion.
 * Never logs API key values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import { getProviderEnv } from './engine/loadEnv';
import { loadImageQueue } from './buildImageQueue';
import type { MealHeroExpansionBatch } from './mealHeroExpansionConfig';
import { MEAL_HERO_EXPANSION_PATHS } from './mealHeroExpansionConfig';
import {
  flatReviewImagePath,
  metaPathFor,
  reviewDirFor,
} from './reviewStore';

function readDotEnvValue(key: string): string | undefined {
  const envPath = path.join(PATHS.appRoot, '.env');
  if (!fs.existsSync(envPath)) return undefined;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    if (k !== key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return undefined;
}

export type GeminiExpansionGuard =
  | { ok: true; provider: 'gemini'; geminiKeySet: true }
  | { ok: false; reason: string };

/**
 * Abort expansion generate when .env is not gemini-ready or runtime provider is mock.
 */
export function assertGeminiProviderReadyForExpansion(): GeminiExpansionGuard {
  const dotProvider = readDotEnvValue('IMAGE_PROVIDER')?.trim().toLowerCase();
  const dotGeminiKey = readDotEnvValue('GEMINI_API_KEY')?.trim();

  if (!dotProvider || dotProvider !== 'gemini') {
    return {
      ok: false,
      reason: `.env IMAGE_PROVIDER must be gemini (got ${dotProvider ?? '(unset)'})`,
    };
  }
  if (!dotGeminiKey) {
    return {
      ok: false,
      reason: '.env GEMINI_API_KEY is missing — set key before real generation',
    };
  }

  const runtimeEnv = getProviderEnv(PATHS.appRoot);
  const runtimeProvider = runtimeEnv.provider?.trim().toLowerCase();

  if (runtimeProvider === 'mock') {
    return {
      ok: false,
      reason:
        'runtime IMAGE_PROVIDER=mock (shell override?) — unset and use .env gemini',
    };
  }
  if (runtimeProvider !== 'gemini') {
    return {
      ok: false,
      reason: `runtime IMAGE_PROVIDER must be gemini (got ${runtimeProvider ?? '(unset)'})`,
    };
  }
  if (!runtimeEnv.geminiApiKey?.trim()) {
    return {
      ok: false,
      reason: 'runtime GEMINI_API_KEY missing after .env load',
    };
  }

  console.log('GEMINI_PROVIDER_READY');
  console.log('IMAGE_PROVIDER=gemini');
  console.log('GEMINI_API_KEY=(set)');

  return { ok: true, provider: 'gemini', geminiKeySet: true };
}

function movePath(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.renameSync(src, dest);
}

export type ArchiveBatchMockResult = {
  destDir: string;
  flatImages: number;
  nestedDirs: number;
  manifestPath: string;
};

/**
 * Move batch review candidates to history (do not delete).
 */
export function archiveBatchMockReview(
  batch: MealHeroExpansionBatch,
  historyLabel = `${batch.id}-mock`,
): ArchiveBatchMockResult {
  const destDir = path.join(MEAL_HERO_EXPANSION_PATHS.root, 'history', historyLabel);
  fs.mkdirSync(destDir, { recursive: true });

  const queue = loadImageQueue();
  let flatImages = 0;
  let nestedDirs = 0;
  const moved: Array<{ recipeId: string; heroImageKey: string; flat?: string; nested?: string }> =
    [];

  for (const recipeId of batch.recipeIds) {
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const heroImageKey = item?.heroImageKey ?? '';
    if (!heroImageKey) continue;

    const entry: { recipeId: string; heroImageKey: string; flat?: string; nested?: string } = {
      recipeId,
      heroImageKey,
    };

    const flatAbs = flatReviewImagePath(recipeId, heroImageKey);
    if (fs.existsSync(flatAbs)) {
      const flatDest = path.join(destDir, path.basename(flatAbs));
      movePath(flatAbs, flatDest);
      flatImages += 1;
      entry.flat = path.basename(flatAbs);
    }

    const nestedAbs = reviewDirFor(heroImageKey);
    if (fs.existsSync(nestedAbs)) {
      const nestedDest = path.join(destDir, heroImageKey);
      movePath(nestedAbs, nestedDest);
      nestedDirs += 1;
      entry.nested = heroImageKey;
    }

    if (entry.flat || entry.nested) moved.push(entry);
  }

  const manifestPath = path.join(destDir, 'archive-manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        batchId: batch.id,
        label: batch.label,
        archivedAt: new Date().toISOString(),
        reason: 'mock pipeline validation — Sprint 60',
        flatImages,
        nestedDirs,
        moved,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(
    `Archived mock review → ${path.relative(PATHS.appRoot, destDir)} (${flatImages} flat, ${nestedDirs} nested)`,
  );

  return { destDir, flatImages, nestedDirs, manifestPath };
}

export function readReviewProvider(heroImageKey: string): string | undefined {
  const metaFile = metaPathFor(heroImageKey);
  if (!fs.existsSync(metaFile)) return undefined;
  try {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')) as { provider?: string };
    return meta.provider;
  } catch {
    return undefined;
  }
}
