import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Recipe } from '../../data/recipes/types';
import type { HeroAuditRow, ImageChangePlan, StepAuditRow } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(__dirname, '../..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const STEPS_DIR = path.join(APP_ROOT, 'assets', 'recipe-steps');
const MEAL_REGISTRY = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');
const STEP_REGISTRY = path.join(APP_ROOT, 'services/images/recipeStepImageAssets.ts');

const HERO_W = 1344;
const HERO_H = 768;
const STEP_W = 1024;
const STEP_H = 1024;

export function parseRequireKeys(src: string): Set<string> {
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]!);
  return keys;
}

function magicKind(filePath: string): 'jpeg' | 'png' | 'other' | 'none' {
  if (!fs.existsSync(filePath)) return 'none';
  const head = fs.readFileSync(filePath).subarray(0, 16);
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return 'png';
  }
  return 'other';
}

type ProbeRow = {
  kind: 'hero' | 'step';
  key: string;
  exists: boolean;
  magic?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

function probeImageMeta(items: Array<{ kind: 'hero' | 'step'; key: string }>): Map<string, ProbeRow> {
  const script = path.join(APP_ROOT, 'scripts/image-opt/probe_image_meta.py');
  const proc = spawnSync('python', [script], {
    input: JSON.stringify(items),
    encoding: 'utf8',
    cwd: APP_ROOT,
  });
  if (proc.status !== 0) {
    throw new Error(`probe_image_meta failed: ${proc.stderr || proc.stdout}`);
  }
  const rows = JSON.parse(proc.stdout) as ProbeRow[];
  const map = new Map<string, ProbeRow>();
  for (const row of rows) {
    map.set(`${row.kind}:${row.key}`, row);
  }
  return map;
}

function collectStepKeys(recipes: Recipe[]): string[] {
  const keys = new Set<string>();
  for (const recipe of recipes) {
    for (const step of recipe.recipe.steps) {
      if (step.imageKey?.trim()) keys.add(step.imageKey.trim());
    }
  }
  return [...keys].sort();
}

function heroNeedsOptimize(row: ProbeRow | undefined, magic: HeroAuditRow['magic']): boolean {
  if (!row?.exists) return false;
  if (magic === 'png' || magic === 'other') return true;
  if (row.width !== HERO_W || row.height !== HERO_H) return true;
  return false;
}

function stepNeedsOptimize(row: ProbeRow | undefined, magic: StepAuditRow['magic']): boolean {
  if (!row?.exists) return false;
  if (magic === 'png' || magic === 'other') return true;
  if (row.width !== STEP_W || row.height !== STEP_H) return true;
  return false;
}

export function auditHeroAndStepImages(recipes: Recipe[]): {
  heroes: HeroAuditRow[];
  steps: StepAuditRow[];
  heroKeysToNormalize: string[];
  stepKeysToNormalize: string[];
  blockers: string[];
  warnings: string[];
} {
  const mealRegistry = parseRequireKeys(fs.readFileSync(MEAL_REGISTRY, 'utf8'));
  const stepRegistry = parseRequireKeys(fs.readFileSync(STEP_REGISTRY, 'utf8'));

  const heroItems = recipes.map((r) => ({ kind: 'hero' as const, key: r.heroImageKey }));
  const stepKeys = collectStepKeys(recipes);
  const stepItems = stepKeys.map((key) => ({ kind: 'step' as const, key }));

  const probeMap = probeImageMeta([...heroItems, ...stepItems]);

  const heroes: HeroAuditRow[] = [];
  const steps: StepAuditRow[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const heroKeysToNormalize: string[] = [];
  const stepKeysToNormalize: string[] = [];

  for (const recipe of recipes) {
    const key = recipe.heroImageKey;
    const filePath = path.join(MEALS_DIR, `${key}.jpg`);
    const fileExists = fs.existsSync(filePath);
    const magic = magicKind(filePath);
    const probe = probeMap.get(`hero:${key}`);
    const missing = !fileExists;
    const inRegistry = mealRegistry.has(key);
    const needsOptimize = heroNeedsOptimize(probe, magic);

    heroes.push({
      recipeId: recipe.id,
      heroImageKey: key,
      fileExists,
      inRegistry,
      magic: magic === 'none' ? 'other' : magic,
      width: probe?.width ?? null,
      height: probe?.height ?? null,
      bytes: probe?.bytes ?? 0,
      needsOptimize,
      missing,
    });

    if (missing) {
      // Hero assets may be deferred to a later image sprint — warning only.
      warnings.push(`HERO_IMAGE_MISSING: ${key} (${recipe.id})`);
    } else if (!inRegistry) {
      // File on disk; prepare pipeline syncs require() registries before/during run.
      warnings.push(`HERO_NOT_IN_REGISTRY: ${key} (${recipe.id})`);
      if (needsOptimize) heroKeysToNormalize.push(key);
    } else if (needsOptimize) {
      heroKeysToNormalize.push(key);
    }
  }

  for (const key of stepKeys) {
    const filePath = path.join(STEPS_DIR, `${key}.jpg`);
    const fileExists = fs.existsSync(filePath);
    const inRegistry = stepRegistry.has(key);
    const registryRequiresFile = inRegistry;
    const magic = magicKind(filePath);
    const probe = probeMap.get(`step:${key}`);
    const missing = !fileExists;
    const needsOptimize = stepNeedsOptimize(probe, magic);

    const recipeIds = recipes
      .filter((r) => r.recipe.steps.some((s) => s.imageKey === key))
      .map((r) => r.id);

    steps.push({
      recipeId: recipeIds[0] ?? 'unknown',
      imageKey: key,
      fileExists,
      inRegistry,
      registryRequiresFile,
      magic,
      width: probe?.width ?? null,
      height: probe?.height ?? null,
      bytes: probe?.bytes ?? 0,
      needsOptimize,
      missing,
    });

    if (registryRequiresFile && missing) {
      blockers.push(`[step:${key}] registry requires file but ${key}.jpg missing`);
    } else if (missing) {
      warnings.push(`STEP_IMAGE_MISSING: ${key} (${recipeIds.join(', ')})`);
    } else if (needsOptimize) {
      stepKeysToNormalize.push(key);
    }
  }

  return {
    heroes,
    steps,
    heroKeysToNormalize: [...new Set(heroKeysToNormalize)],
    stepKeysToNormalize: [...new Set(stepKeysToNormalize)],
    blockers,
    warnings,
  };
}

export function runScopedImageNormalize(options: {
  heroKeys: string[];
  stepKeys: string[];
  dryRun: boolean;
}): { plans: ImageChangePlan[]; normalizeLog: unknown; error?: string } {
  const reportsDir = path.join(APP_ROOT, 'scripts/reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const heroFile = path.join(reportsDir, 'new-recipe-prep-hero-keys.json');
  const stepFile = path.join(reportsDir, 'new-recipe-prep-step-keys.json');
  fs.writeFileSync(heroFile, JSON.stringify(options.heroKeys), 'utf8');
  fs.writeFileSync(stepFile, JSON.stringify(options.stepKeys), 'utf8');

  const args = [
    path.join(APP_ROOT, 'scripts/image-opt/normalize_assets.py'),
    '--hero-keys-file',
    heroFile,
    '--step-keys-file',
    stepFile,
    '--hero-quality',
    '85',
    '--step-quality',
    '80',
  ];
  if (options.dryRun) args.push('--dry-run');

  const proc = spawnSync('python', args, { encoding: 'utf8', cwd: APP_ROOT });
  if (proc.status !== 0) {
    return {
      plans: [],
      normalizeLog: null,
      error: proc.stderr || proc.stdout || 'normalize_assets failed',
    };
  }

  let normalizeLog: { log?: Array<Record<string, unknown>> } = {};
  try {
    normalizeLog = JSON.parse(
      fs.readFileSync(path.join(reportsDir, 'image-opt-normalize-log.json'), 'utf8'),
    );
  } catch {
    normalizeLog = { log: [] };
  }

  const plans: ImageChangePlan[] = (normalizeLog.log ?? []).map((row) => {
    const p = String(row.path ?? '');
    const action = String(row.action ?? '');
    const kind: 'hero' | 'step' = p.includes('recipe-steps') ? 'step' : 'hero';
    let planAction: ImageChangePlan['action'] = 'skip_ok';
    if (action === 'normalized' || action.startsWith('would_')) planAction = 'normalize';
    if (action.includes('missing')) planAction = 'missing';
    return {
      path: p,
      kind,
      action: planAction,
      beforeBytes: Number(row.before ?? 0),
      afterBytes: row.after != null ? Number(row.after) : undefined,
    };
  });

  return { plans, normalizeLog };
}

export function sumBytes(rows: Array<{ bytes: number }>): number {
  return rows.reduce((sum, row) => sum + row.bytes, 0);
}

export function avgBytes(rows: Array<{ bytes: number; fileExists?: boolean; missing?: boolean }>): number | null {
  const present = rows.filter((r) => !('missing' in r) || !r.missing);
  if (!present.length) return null;
  return Math.round(sumBytes(present) / present.length);
}
